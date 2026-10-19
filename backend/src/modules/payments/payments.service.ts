import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Transaction, TransactionStatus, PaymentProvider, TransactionType } from './entities/transaction.entity';
import { EscrowHolding, EscrowStatus } from './entities/escrow.entity';
import {
  PaymentProvider as IPaymentProvider,
  PaymentRequest,
  PaymentResponse,
  PaymentRequestStatus,
  RefundRequest,
  RefundResponse,
  WebhookEvent,
  WebhookEventType,
  PaymentMethod,
  RefundStatus,
} from './gateways/payment-provider.interface';
import { MpesaProvider } from './gateways/mpesa-provider';
import { EcoCashProvider } from './gateways/ecocash-provider';
import { StripeProvider } from './gateways/stripe-provider';
import { InitiatePaymentDto, RefundDto, TransactionQueryDto } from './dto/payment.dto';
import { v4 as uuidv4 } from 'uuid';

const ESCROW_HOLD_DAYS = 14;
const PLATFORM_FEE_PERCENT = 5.0;
const IDEMPOTENCY_WINDOW_MS = 5 * 60_000;
const RATE_LIMIT_INITIATE_MAX = 10;
const RATE_LIMIT_INITIATE_WINDOW_MS = 60_000;
const RATE_LIMIT_REFUND_MAX = 3;
const RATE_LIMIT_REFUND_WINDOW_MS = 300_000;
const WEBHOOK_DEDUP_TTL_MS = 24 * 60 * 60 * 1000;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface AuditLogEntry {
  timestamp: string;
  operation: string;
  universityId: string;
  userId?: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  provider?: string;
  status?: string;
  ip?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly providers = new Map<string, IPaymentProvider>();
  private readonly rateLimits = new Map<string, RateLimitEntry>();
  private readonly processedWebhooks = new Map<string, number>();
  private readonly auditLog: AuditLogEntry[] = [];

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(EscrowHolding)
    private readonly escrowRepo: Repository<EscrowHolding>,
    private readonly dataSource: DataSource,
    private readonly mpesaProvider: MpesaProvider,
    private readonly ecocashProvider: EcoCashProvider,
    private readonly stripeProvider: StripeProvider,
  ) {
    this.providers.set('mpesa', mpesaProvider);
    this.providers.set('ecocash', ecocashProvider);
    this.providers.set('stripe', stripeProvider);
  }

  private getProvider(method: PaymentMethod): IPaymentProvider {
    if (method.startsWith('mpesa')) return this.mpesaProvider;
    if (method.startsWith('ecocash')) return this.ecocashProvider;
    if (method.startsWith('stripe')) return this.stripeProvider;
    throw new BadRequestException(`No provider for method: ${method}`);
  }

  private getProviderForPayment(provider: PaymentProvider): IPaymentProvider {
    const p = this.providers.get(provider);
    if (!p) throw new BadRequestException(`Provider not configured: ${provider}`);
    return p;
  }

  private checkRateLimit(key: string, maxRequests: number, windowMs: number): void {
    const now = Date.now();
    const entry = this.rateLimits.get(key);

    if (!entry || now > entry.resetAt) {
      this.rateLimits.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    entry.count++;
    if (entry.count > maxRequests) {
      this.logger.warn(
        `Rate limit exceeded: key=${key} count=${entry.count} max=${maxRequests}`,
      );
      throw new BadRequestException(
        `Rate limit exceeded. Please wait before retrying.`,
      );
    }
  }

  private audit(operation: string, data: AuditLogEntry): void {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      operation,
      ...data,
    };
    this.auditLog.push(entry);

    if (this.auditLog.length > 10_000) {
      this.auditLog.splice(0, 5_000);
    }

    this.logger.log(
      `[AUDIT] ${operation}: ${JSON.stringify({
        ts: entry.timestamp,
        uni: entry.universityId,
        user: entry.userId,
        txn: entry.transactionId,
        amt: entry.amount,
        cur: entry.currency,
        prov: entry.provider,
        status: entry.status,
      })}`,
    );
  }

  private logPayment(operation: string, data: Record<string, unknown>): void {
    this.logger.log(`[PAYMENT] ${operation}: ${JSON.stringify(data)}`);
  }

  private logPaymentError(operation: string, error: unknown, data: Record<string, unknown>): void {
    const err = error as Error;
    this.logger.error(
      `[PAYMENT] ${operation} FAILED: ${err.message} ${JSON.stringify(data)}`,
      err.stack,
    );
  }

  async initiatePayment(
    universityId: string,
    userId: string,
    dto: InitiatePaymentDto,
    ip?: string,
  ): Promise<Transaction> {
    const idempotencyKey = uuidv4();
    this.checkRateLimit(`initiate:${userId}`, RATE_LIMIT_INITIATE_MAX, RATE_LIMIT_INITIATE_WINDOW_MS);

    this.audit('INITIATE_START', {
      universityId,
      userId,
      amount: dto.amount,
      currency: dto.currency,
      provider: dto.provider,
      metadata: { method: dto.method, type: dto.type },
      ip,
    });

    const currency = dto.currency || 'USD';

    const existingTxn = await this.transactionRepo.findOne({
      where: {
        universityId,
        userId,
        status: TransactionStatus.PENDING,
        provider: dto.provider,
      },
      order: { createdAt: 'DESC' },
    });

    if (existingTxn) {
      const age = Date.now() - existingTxn.createdAt.getTime();
      if (age < IDEMPOTENCY_WINDOW_MS) {
        this.audit('IDEMPOTENCY_BLOCKED', {
          universityId,
          userId,
          transactionId: existingTxn.id,
          metadata: { ageMs: age },
        });
        throw new ConflictException(
          'A payment is already in progress. Please wait before retrying.',
        );
      }
    }

    const reference = `COS-${universityId.substring(0, 8)}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = this.transactionRepo.create({
        universityId,
        userId,
        amount: dto.amount,
        currency,
        provider: dto.provider,
        type: dto.type,
        description: dto.description,
        recipientId: dto.recipientId,
        status: TransactionStatus.PENDING,
        reference,
        metadata: {
          ...dto.metadata,
          idempotencyKey,
          method: dto.method,
          phoneNumber: dto.phoneNumber ? this.maskPhone(dto.phoneNumber) : undefined,
          email: dto.email,
          initiatedIp: ip || 'unknown',
        },
      });

      const saved = await queryRunner.manager.save(transaction);

      const providerRequest: PaymentRequest = {
        universityId,
        userId,
        amount: dto.amount,
        currency,
        method: dto.method,
        description: dto.description,
        reference,
        callbackUrl: dto.callbackUrl,
        metadata: {
          transactionId: saved.id,
          ...dto.metadata,
        },
        phoneNumber: dto.phoneNumber,
        email: dto.email,
        idempotencyKey,
      };

      const provider = this.getProvider(dto.method);
      const providerResponse = await provider.initiatePayment(providerRequest);

      saved.providerTransactionId = providerResponse.providerReference;
      saved.providerMetadata = {
        providerResponse: providerResponse.raw,
        customerPrompt: providerResponse.customerPrompt,
        clientSecret: providerResponse.clientSecret,
        redirectUrl: providerResponse.redirectUrl,
      };

      if (providerResponse.success) {
        saved.status = TransactionStatus.PROCESSING;
      } else {
        saved.status = TransactionStatus.FAILED;
        saved.metadata = {
          ...saved.metadata,
          failureReason: providerResponse.message,
        };
      }

      await queryRunner.manager.save(saved);

      if (
        dto.type === TransactionType.MARKETPLACE &&
        dto.recipientId &&
        providerResponse.success
      ) {
        await this.createEscrowHold(saved, dto.recipientId, queryRunner);
      }

      await queryRunner.commitTransaction();

      this.audit('INITIATE_COMPLETE', {
        universityId,
        userId,
        transactionId: saved.id,
        amount: dto.amount,
        currency,
        provider: dto.provider,
        status: saved.status,
        metadata: {
          providerReference: providerResponse.providerReference,
          success: providerResponse.success,
        },
        ip,
      });

      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logPaymentError('INITIATE', error, {
        universityId,
        userId,
        amount: dto.amount,
        provider: dto.provider,
      });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async checkTransactionStatus(
    universityId: string,
    transactionId: string,
  ): Promise<Transaction> {
    const transaction = await this.transactionRepo.findOne({
      where: { id: transactionId, universityId },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');

    if (
      transaction.status !== TransactionStatus.COMPLETED &&
      transaction.status !== TransactionStatus.FAILED &&
      transaction.status !== TransactionStatus.REFUNDED &&
      transaction.providerTransactionId
    ) {
      const provider = this.getProviderForPayment(transaction.provider);

      try {
        const statusResponse = await provider.checkPaymentStatus(
          transaction.providerTransactionId,
        );

        const newStatus = this.mapProviderStatus(statusResponse.status);

        if (newStatus !== transaction.status) {
          const previousStatus = transaction.status;
          transaction.status = newStatus;
          if (newStatus === TransactionStatus.COMPLETED) {
            transaction.completedAt = new Date();
          }
          await this.transactionRepo.save(transaction);

          this.audit('STATUS_UPDATE', {
            universityId,
            transactionId,
            provider: transaction.provider,
            status: newStatus,
            metadata: { previousStatus },
          });
        }
      } catch (error) {
        this.logPaymentError('STATUS_CHECK', error, { transactionId });
      }
    }

    return transaction;
  }

  async processRefund(
    universityId: string,
    transactionId: string,
    dto: RefundDto,
    ip?: string,
  ): Promise<Transaction> {
    this.checkRateLimit(`refund:${transactionId}`, RATE_LIMIT_REFUND_MAX, RATE_LIMIT_REFUND_WINDOW_MS);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await queryRunner.manager.findOne(Transaction, {
        where: { id: transactionId, universityId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!transaction) throw new NotFoundException('Transaction not found');

      if (transaction.status !== TransactionStatus.COMPLETED) {
        throw new BadRequestException('Only completed transactions can be refunded');
      }

      const refundAmount = dto.amount || Number(transaction.amount);
      if (refundAmount <= 0) {
        throw new BadRequestException('Refund amount must be positive');
      }

      if (refundAmount > Number(transaction.amount)) {
        throw new BadRequestException('Refund amount exceeds original amount');
      }

      if (
        transaction.refundedAmount &&
        refundAmount + Number(transaction.refundedAmount) > Number(transaction.amount)
      ) {
        throw new BadRequestException('Total refunded amount would exceed original amount');
      }

      this.audit('REFUND_START', {
        universityId,
        transactionId,
        amount: refundAmount,
        currency: transaction.currency,
        provider: transaction.provider,
        metadata: { reason: dto.reason },
        ip,
      });

      const provider = this.getProviderForPayment(transaction.provider);
      const refundRequest: RefundRequest = {
        universityId,
        originalTransactionId: transactionId,
        providerTransactionId: transaction.providerTransactionId || '',
        amount: refundAmount,
        currency: transaction.currency,
        method: transaction.metadata?.method as PaymentMethod,
        reason: dto.reason,
        idempotencyKey: uuidv4(),
      };

      const refundResponse = await provider.processRefund(refundRequest);

      if (!refundResponse.success) {
        await queryRunner.rollbackTransaction();
        this.audit('REFUND_FAILED', {
          universityId,
          transactionId,
          amount: refundAmount,
          metadata: { message: refundResponse.message },
        });
        throw new BadRequestException(`Refund failed: ${refundResponse.message}`);
      }

      transaction.status = TransactionStatus.REFUNDED;
      transaction.refundedAt = new Date();
      transaction.refundedAmount = refundAmount;
      transaction.metadata = {
        ...transaction.metadata,
        refundReference: refundResponse.refundReference,
        refundStatus: refundResponse.status,
        refundReason: dto.reason,
        refundInitiatedIp: ip || 'unknown',
      };

      await queryRunner.manager.save(transaction);

      if (transaction.type === TransactionType.MARKETPLACE) {
        await this.refundEscrow(transaction, refundAmount, queryRunner);
      }

      await queryRunner.commitTransaction();

      this.audit('REFUND_COMPLETE', {
        universityId,
        transactionId,
        amount: refundAmount,
        provider: transaction.provider,
        status: TransactionStatus.REFUNDED,
        metadata: { refundReference: refundResponse.refundReference },
        ip,
      });

      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async handleWebhook(
    provider: PaymentProvider,
    headers: Record<string, string | undefined>,
    body: string,
  ): Promise<{
    processed: boolean;
    transactionId?: string;
    status?: string;
  }> {
    const payProvider = this.getProviderForPayment(provider);

    const webhookEvent = await payProvider.validateWebhook(headers, body);

    const webhookFingerprint = `${provider}:${webhookEvent.providerTransactionId}:${webhookEvent.eventType}`;

    const existingTs = this.processedWebhooks.get(webhookFingerprint);
    if (existingTs && Date.now() - existingTs < WEBHOOK_DEDUP_TTL_MS) {
      this.audit('WEBHOOK_DUPLICATE', {
        universityId: (webhookEvent.metadata?.universityId as string) || '',
        provider,
        metadata: { fingerprint: webhookFingerprint },
      });
      return { processed: true, status: 'duplicate_ignored' };
    }

    this.processedWebhooks.set(webhookFingerprint, Date.now());
    this.cleanupWebhookDedup();

    this.audit('WEBHOOK_RECEIVED', {
      universityId: (webhookEvent.metadata?.universityId as string) || '',
      provider,
      metadata: {
        eventType: webhookEvent.eventType,
        providerTransactionId: webhookEvent.providerTransactionId,
      },
    });

    const transaction = await this.transactionRepo.findOne({
      where: {
        universityId: (webhookEvent.metadata?.universityId as string) || '',
        providerTransactionId: webhookEvent.providerTransactionId,
      },
    });

    if (!transaction) {
      const byRef = await this.transactionRepo.findOne({
        where: {
          providerTransactionId: webhookEvent.providerTransactionId,
        },
      });
      if (!byRef) {
        this.audit('WEBHOOK_NO_TRANSACTION', {
          universityId: '',
          provider,
          metadata: { providerTransactionId: webhookEvent.providerTransactionId },
        });
        return { processed: false };
      }
      return this.processWebhookEvent(byRef, webhookEvent);
    }

    return this.processWebhookEvent(transaction, webhookEvent);
  }

  private async processWebhookEvent(
    transaction: Transaction,
    event: WebhookEvent,
  ): Promise<{ processed: boolean; transactionId: string; status: string }> {
    const previousStatus = transaction.status;

    switch (event.eventType) {
      case WebhookEventType.PAYMENT_SUCCESS:
        if (transaction.status !== TransactionStatus.COMPLETED) {
          transaction.status = TransactionStatus.COMPLETED;
          transaction.completedAt = new Date();
          transaction.providerMetadata = {
            ...transaction.providerMetadata,
            webhookCompletedAt: new Date().toISOString(),
            webhookEventType: event.eventType,
          };
        }
        break;

      case WebhookEventType.PAYMENT_FAILED:
        if (transaction.status !== TransactionStatus.COMPLETED) {
          transaction.status = TransactionStatus.FAILED;
          transaction.metadata = {
            ...transaction.metadata,
            failureReason: event.metadata?.resultDescription || 'Payment failed via webhook',
            webhookFailedAt: new Date().toISOString(),
          };
        }
        break;

      case WebhookEventType.REFUND_SUCCESS:
        transaction.status = TransactionStatus.REFUNDED;
        transaction.refundedAt = new Date();
        transaction.metadata = {
          ...transaction.metadata,
          webhookRefundAt: new Date().toISOString(),
        };
        break;

      case WebhookEventType.CHARGEBACK:
        transaction.status = TransactionStatus.REFUNDED;
        transaction.refundedAt = new Date();
        transaction.metadata = {
          ...transaction.metadata,
          chargeback: true,
          chargebackEvent: event.metadata,
          chargebackAt: new Date().toISOString(),
        };
        break;

      default:
        this.audit('WEBHOOK_UNHANDLED', {
          universityId: transaction.universityId,
          transactionId: transaction.id,
          provider: transaction.provider,
          metadata: { eventType: event.eventType },
        });
        return { processed: false, transactionId: transaction.id, status: 'unhandled' };
    }

    await this.transactionRepo.save(transaction);

    if (
      event.eventType === WebhookEventType.PAYMENT_SUCCESS &&
      transaction.type === TransactionType.MARKETPLACE
    ) {
      await this.confirmEscrow(transaction);
    }

    this.audit('WEBHOOK_PROCESSED', {
      universityId: transaction.universityId,
      transactionId: transaction.id,
      provider: transaction.provider,
      status: transaction.status,
      metadata: {
        previousStatus,
        eventType: event.eventType,
      },
    });

    return {
      processed: true,
      transactionId: transaction.id,
      status: transaction.status,
    };
  }

  private async createEscrowHold(
    transaction: Transaction,
    sellerId: string,
    queryRunner?: QueryRunner,
  ): Promise<EscrowHolding> {
    const platformFee = Number(transaction.amount) * (PLATFORM_FEE_PERCENT / 100);
    const sellerPayout = Number(transaction.amount) - platformFee;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ESCROW_HOLD_DAYS);

    const escrow = this.escrowRepo.create({
      universityId: transaction.universityId,
      transactionId: transaction.id,
      buyerId: transaction.userId,
      sellerId,
      amount: transaction.amount,
      currency: transaction.currency,
      status: EscrowStatus.HELD,
      platformFee,
      sellerPayout,
      expiresAt,
      metadata: {
        holdDays: ESCROW_HOLD_DAYS,
        platformFeePercent: PLATFORM_FEE_PERCENT,
        createdAt: new Date().toISOString(),
      },
    });

    const manager = queryRunner ? queryRunner.manager : this.escrowRepo;
    const saved = await manager.save(escrow);

    this.audit('ESCROW_CREATED', {
      universityId: transaction.universityId,
      transactionId: transaction.id,
      amount: Number(transaction.amount),
      metadata: {
        escrowId: saved.id,
        platformFee,
        sellerPayout,
        sellerId,
        expiresAt: expiresAt.toISOString(),
      },
    });

    return saved;
  }

  async confirmEscrow(transaction: Transaction): Promise<void> {
    const escrow = await this.escrowRepo.findOne({
      where: { transactionId: transaction.id, status: EscrowStatus.HELD },
    });

    if (!escrow) return;

    escrow.status = EscrowStatus.RELEASED;
    escrow.releasedAt = new Date();
    await this.escrowRepo.save(escrow);

    this.audit('ESCROW_RELEASED', {
      universityId: transaction.universityId,
      transactionId: transaction.id,
      amount: Number(escrow.sellerPayout),
      metadata: {
        escrowId: escrow.id,
        sellerId: escrow.sellerId,
        platformFee: escrow.platformFee,
      },
    });
  }

  private async refundEscrow(
    transaction: Transaction,
    amount: number,
    queryRunner?: QueryRunner,
  ): Promise<void> {
    const escrow = await this.escrowRepo.findOne({
      where: { transactionId: transaction.id, status: EscrowStatus.HELD },
    });

    if (!escrow) return;

    escrow.status = EscrowStatus.REFUNDED;
    escrow.refundedAt = new Date();

    const manager = queryRunner ? queryRunner.manager : this.escrowRepo;
    await manager.save(escrow);

    this.audit('ESCROW_REFUNDED', {
      universityId: transaction.universityId,
      transactionId: transaction.id,
      amount,
      metadata: { escrowId: escrow.id },
    });
  }

  async initiateEscrowRelease(
    universityId: string,
    escrowId: string,
    releasedBy: string,
  ): Promise<EscrowHolding> {
    const escrow = await this.escrowRepo.findOne({
      where: { id: escrowId, universityId },
    });
    if (!escrow) throw new NotFoundException('Escrow holding not found');
    if (escrow.status !== EscrowStatus.HELD) {
      throw new BadRequestException(`Escrow is in status: ${escrow.status}`);
    }

    this.audit('ESCROW_RELEASE_REQUEST', {
      universityId,
      transactionId: escrow.transactionId,
      amount: Number(escrow.sellerPayout),
      metadata: { escrowId, releasedBy },
    });

    escrow.status = EscrowStatus.RELEASED;
    escrow.releasedAt = new Date();
    escrow.releaseTransactionId = `release-${uuidv4()}`;
    await this.escrowRepo.save(escrow);

    return escrow;
  }

  async initiateEscrowDispute(
    universityId: string,
    escrowId: string,
    disputeReason: string,
    disputedBy: string,
  ): Promise<EscrowHolding> {
    const escrow = await this.escrowRepo.findOne({
      where: { id: escrowId, universityId },
    });
    if (!escrow) throw new NotFoundException('Escrow holding not found');
    if (escrow.status !== EscrowStatus.HELD) {
      throw new BadRequestException(`Escrow is in status: ${escrow.status}`);
    }

    this.audit('ESCROW_DISPUTE', {
      universityId,
      transactionId: escrow.transactionId,
      metadata: { escrowId, disputedBy, reason: disputeReason },
    });

    escrow.status = EscrowStatus.DISPUTED;
    escrow.disputeReason = disputeReason;
    await this.escrowRepo.save(escrow);

    return escrow;
  }

  async processExpiredEscrows(): Promise<number> {
    const expiredEscrows = await this.escrowRepo.find({
      where: {
        status: EscrowStatus.HELD,
      },
    });

    let count = 0;
    for (const escrow of expiredEscrows) {
      if (new Date() > escrow.expiresAt) {
        escrow.status = EscrowStatus.EXPIRED;
        await this.escrowRepo.save(escrow);

        const transaction = await this.transactionRepo.findOne({
          where: { id: escrow.transactionId },
        });
        if (transaction && transaction.status === TransactionStatus.COMPLETED) {
          try {
            await this.processRefund(
              escrow.universityId,
              escrow.transactionId,
              { amount: Number(escrow.amount), reason: 'Escrow hold period expired - auto-refund' },
            );
          } catch (error) {
            this.logPaymentError('ESCROW_EXPIRE_REFUND', error, {
              escrowId: escrow.id,
              transactionId: escrow.transactionId,
            });
          }
        }

        this.audit('ESCROW_EXPIRED', {
          universityId: escrow.universityId,
          transactionId: escrow.transactionId,
          amount: Number(escrow.amount),
          metadata: { escrowId: escrow.id },
        });
        count++;
      }
    }

    if (count > 0) {
      this.logger.log(`Processed ${count} expired escrow holdings`);
    }

    return count;
  }

  async findUserTransactions(
    universityId: string,
    userId: string,
    query?: TransactionQueryDto,
  ): Promise<{ items: Transaction[]; total: number }> {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.transactionRepo
      .createQueryBuilder('t')
      .where('t.university_id = :universityId', { universityId })
      .andWhere('t.user_id = :userId', { userId })
      .orderBy('t.created_at', 'DESC');

    if (query?.status) {
      qb.andWhere('t.status = :status', { status: query.status });
    }
    if (query?.provider) {
      qb.andWhere('t.provider = :provider', { provider: query.provider });
    }
    if (query?.type) {
      qb.andWhere('t.type = :type', { type: query.type });
    }
    if (query?.startDate) {
      qb.andWhere('t.created_at >= :startDate', { startDate: query.startDate });
    }
    if (query?.endDate) {
      qb.andWhere('t.created_at <= :endDate', { endDate: query.endDate });
    }

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();
    return { items, total };
  }

  async findTransactionById(universityId: string, id: string): Promise<Transaction> {
    const transaction = await this.transactionRepo.findOne({ where: { id, universityId } });
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  async getTransactionStats(
    universityId: string,
    userId: string,
  ): Promise<{
    totalSpent: number;
    totalReceived: number;
    transactionCount: number;
    pendingAmount: number;
    refundedAmount: number;
  }> {
    const result = await this.transactionRepo
      .createQueryBuilder('t')
      .select(
        "SUM(CASE WHEN t.user_id = :userId AND t.status = 'completed' THEN t.amount ELSE 0 END)",
        'totalSpent',
      )
      .addSelect(
        "SUM(CASE WHEN t.recipient_id = :userId AND t.status = 'completed' THEN t.amount ELSE 0 END)",
        'totalReceived',
      )
      .addSelect('COUNT(*)', 'transactionCount')
      .addSelect(
        "SUM(CASE WHEN t.status IN ('pending', 'processing') THEN t.amount ELSE 0 END)",
        'pendingAmount',
      )
      .addSelect('COALESCE(SUM(t.refunded_amount), 0)', 'refundedAmount')
      .where('t.university_id = :universityId', { universityId })
      .andWhere('(t.user_id = :userId OR t.recipient_id = :userId)', { userId })
      .getRawOne();

    return {
      totalSpent: Number(result?.totalSpent || 0),
      totalReceived: Number(result?.totalReceived || 0),
      transactionCount: Number(result?.transactionCount || 0),
      pendingAmount: Number(result?.pendingAmount || 0),
      refundedAmount: Number(result?.refundedAmount || 0),
    };
  }

  async getEscrowHoldings(
    universityId: string,
    userId: string,
    role: 'buyer' | 'seller' | 'all' = 'all',
  ): Promise<EscrowHolding[]> {
    const where: Record<string, unknown> = { universityId };

    if (role === 'buyer') where.buyerId = userId;
    else if (role === 'seller') where.sellerId = userId;

    return this.escrowRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  getFeeCalculation(
    amount: number,
    type: TransactionType,
  ): {
    platformFeePercent: number;
    platformFee: number;
    sellerPayout: number;
    total: number;
  } {
    if (type !== TransactionType.MARKETPLACE) {
      return {
        platformFeePercent: 0,
        platformFee: 0,
        sellerPayout: amount,
        total: amount,
      };
    }

    const platformFee = amount * (PLATFORM_FEE_PERCENT / 100);
    return {
      platformFeePercent: PLATFORM_FEE_PERCENT,
      platformFee: Math.round(platformFee * 100) / 100,
      sellerPayout: Math.round((amount - platformFee) * 100) / 100,
      total: amount,
    };
  }

  getPaymentProviders(): Array<{
    id: string;
    name: string;
    currencies: string[];
    methods: string[];
    enabled: boolean;
  }> {
    return [
      {
        id: 'mpesa',
        name: 'M-Pesa',
        currencies: ['KES'],
        methods: ['mpesa_stk', 'mpesa_c2b', 'mpesa_b2c'],
        enabled: true,
      },
      {
        id: 'ecocash',
        name: 'EcoCash',
        currencies: ['USD', 'ZAR'],
        methods: ['ecocash_merchant'],
        enabled: true,
      },
      {
        id: 'stripe',
        name: 'Stripe',
        currencies: ['USD', 'KES', 'ZAR', 'NGN', 'GHS', 'GBP', 'EUR'],
        methods: ['stripe_card', 'stripe_checkout'],
        enabled: true,
      },
    ];
  }

  getAuditLog(
    universityId: string,
    filters?: { limit?: number; operation?: string },
  ): AuditLogEntry[] {
    const limit = filters?.limit || 100;
    let entries = this.auditLog.filter((e) => e.universityId === universityId);

    if (filters?.operation) {
      entries = entries.filter((e) => e.operation === filters.operation);
    }

    return entries.slice(-limit);
  }

  private mapProviderStatus(status: PaymentRequestStatus): TransactionStatus {
    switch (status) {
      case PaymentRequestStatus.COMPLETED:
        return TransactionStatus.COMPLETED;
      case PaymentRequestStatus.FAILED:
        return TransactionStatus.FAILED;
      case PaymentRequestStatus.CANCELLED:
        return TransactionStatus.CANCELLED;
      case PaymentRequestStatus.EXPIRED:
        return TransactionStatus.FAILED;
      default:
        return TransactionStatus.PROCESSING;
    }
  }

  private maskPhone(phone: string): string {
    if (phone.length <= 4) return '****';
    return phone.substring(0, 3) + '****' + phone.substring(phone.length - 3);
  }

  private cleanupWebhookDedup(): void {
    if (this.processedWebhooks.size > 10_000) {
      const now = Date.now();
      for (const [key, ts] of this.processedWebhooks) {
        if (now - ts > WEBHOOK_DEDUP_TTL_MS) {
          this.processedWebhooks.delete(key);
        }
      }
    }
  }
}
