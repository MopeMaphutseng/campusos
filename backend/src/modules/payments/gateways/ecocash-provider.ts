import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import {
  PaymentProvider,
  PaymentRequest,
  PaymentResponse,
  PaymentStatusResponse,
  PaymentRequestStatus,
  RefundRequest,
  RefundResponse,
  RefundStatus,
  WebhookEvent,
  WebhookEventType,
  PaymentMethod,
} from './payment-provider.interface';

interface EcoCashConfig {
  apiKey: string;
  merchantCode: string;
  apiSecret: string;
  callbackUrl: string;
  environment: 'sandbox' | 'production';
  requestTimeoutMs: number;
}

interface EcoCashToken {
  accessToken: string;
  tokenType: string;
  expiresAt: number;
}

const ECOCASH_ENV_URLS: Record<string, string> = {
  sandbox: 'https://developers.ecocash.co.zw/api/sandbox/v1',
  production: 'https://developers.ecocash.co.zw/api/v1',
};

const REQUEST_TIMEOUT_MS = 30_000;
const TOKEN_REFRESH_BUFFER_MS = 60_000;

@Injectable()
export class EcoCashProvider implements PaymentProvider {
  private readonly logger = new Logger(EcoCashProvider.name);
  readonly name = 'ecocash';
  readonly supportedMethods = [PaymentMethod.ECOCASH_MERCHANT];
  readonly supportedCurrencies = ['USD', 'ZAR'];

  private readonly config: EcoCashConfig;
  private authToken: EcoCashToken | null = null;
  private tokenRefreshInProgress: Promise<string> | null = null;

  constructor() {
    this.config = {
      apiKey: process.env.ECOCASH_API_KEY || '',
      merchantCode: process.env.ECOCASH_MERCHANT_CODE || '',
      apiSecret: process.env.ECOCASH_API_SECRET || '',
      callbackUrl: process.env.ECOCASH_CALLBACK_URL || '',
      environment:
        (process.env.ECOCASH_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      requestTimeoutMs: Number(process.env.ECOCASH_REQUEST_TIMEOUT_MS) || REQUEST_TIMEOUT_MS,
    };
  }

  private get baseUrl(): string {
    return ECOCASH_ENV_URLS[this.config.environment];
  }

  private get isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.apiSecret && this.config.merchantCode);
  }

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.requestTimeoutMs,
    );

    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  private async getAuthToken(): Promise<string> {
    if (this.authToken && Date.now() < this.authToken.expiresAt - TOKEN_REFRESH_BUFFER_MS) {
      return this.authToken.accessToken;
    }

    if (this.tokenRefreshInProgress) {
      return this.tokenRefreshInProgress;
    }

    this.tokenRefreshInProgress = this.refreshAuthToken();
    try {
      return await this.tokenRefreshInProgress;
    } finally {
      this.tokenRefreshInProgress = null;
    }
  }

  private async refreshAuthToken(): Promise<string> {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException('EcoCash provider not configured');
    }

    this.logger.log(`Refreshing EcoCash auth token [env=${this.config.environment}]`);

    const response = await this.fetchWithTimeout(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.apiKey,
        client_secret: this.config.apiSecret,
      }),
    });

    const bodyText = await response.text();

    if (!response.ok) {
      this.logger.error(
        `EcoCash auth failed: status=${response.status} body=${bodyText.substring(0, 500)}`,
      );
      throw new ServiceUnavailableException('EcoCash authentication unavailable');
    }

    const data = JSON.parse(bodyText) as {
      access_token: string;
      token_type: string;
      expires_in: number;
    };

    if (!data.access_token) {
      this.logger.error('EcoCash auth response missing access_token');
      throw new ServiceUnavailableException('EcoCash auth response invalid');
    }

    this.authToken = {
      accessToken: data.access_token,
      tokenType: data.token_type,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    this.logger.log('EcoCash auth token refreshed successfully');
    return this.authToken.accessToken;
  }

  private formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('263')) return cleaned;
    if (cleaned.startsWith('0')) return `263${cleaned.slice(1)}`;
    if (cleaned.startsWith('+263')) return cleaned.slice(1);
    return cleaned;
  }

  private validateZimPhone(phone: string): boolean {
    const formatted = this.formatPhoneNumber(phone);
    return /^263[78]\d{8}$/.test(formatted);
  }

  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    this.logger.log(
      `Initiating EcoCash payment: ref=${request.reference} amount=${request.amount} ` +
        `${request.currency} phone=****${request.phoneNumber?.slice(-4) || 'N/A'} ` +
        `university=${request.universityId} user=${request.userId}`,
    );

    if (!request.phoneNumber) {
      return {
        success: false,
        providerReference: '',
        status: PaymentRequestStatus.FAILED,
        message: 'Phone number is required for EcoCash payments',
      };
    }

    if (!this.validateZimPhone(request.phoneNumber)) {
      return {
        success: false,
        providerReference: '',
        status: PaymentRequestStatus.FAILED,
        message: 'Invalid Zimbabwean phone number format',
      };
    }

    if (request.amount <= 0) {
      return {
        success: false,
        providerReference: '',
        status: PaymentRequestStatus.FAILED,
        message: 'Amount must be greater than zero',
      };
    }

    try {
      const token = await this.getAuthToken();
      const formattedPhone = this.formatPhoneNumber(request.phoneNumber);

      const payload = {
        merchantCode: this.config.merchantCode,
        externalId: request.reference,
        amount: request.amount,
        currency: request.currency,
        phone: formattedPhone,
        callbackUrl: request.callbackUrl || this.config.callbackUrl,
        description: (request.description || `Payment for ${request.reference}`).substring(0, 200),
        metadata: {
          universityId: request.universityId,
          userId: request.userId,
          ...request.metadata,
        },
      };

      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/merchant/payment/request`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': request.idempotencyKey,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json()) as {
        status?: string;
        transactionId?: string;
        reference?: string;
        message?: string;
        customerPrompt?: string;
        expiresAt?: string;
      };

      if (!response.ok || data.status !== 'pending') {
        this.logger.error(
          `EcoCash payment failed: status=${data.status} msg=${data.message} ` +
            `ref=${request.reference}`,
        );
        return {
          success: false,
          providerReference: data.transactionId || '',
          status: PaymentRequestStatus.FAILED,
          message: data.message || 'EcoCash payment initiation failed',
          raw: data as unknown as Record<string, unknown>,
        };
      }

      this.logger.log(
        `EcoCash payment initiated: transactionId=${data.transactionId} ref=${request.reference}`,
      );

      return {
        success: true,
        providerReference: data.transactionId!,
        status: PaymentRequestStatus.PENDING,
        message: data.customerPrompt || 'Payment request sent',
        expiresAt: data.expiresAt
          ? new Date(data.expiresAt)
          : new Date(Date.now() + 5 * 60 * 1000),
        raw: data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `EcoCash payment error: ${err.message} ref=${request.reference}`,
        err.stack,
      );
      return {
        success: false,
        providerReference: '',
        status: PaymentRequestStatus.FAILED,
        message: err.name === 'AbortError'
          ? 'EcoCash request timed out'
          : 'Failed to initiate EcoCash payment',
      };
    }
  }

  async checkPaymentStatus(providerTransactionId: string): Promise<PaymentStatusResponse> {
    this.logger.log(`Checking EcoCash status: txnId=${providerTransactionId}`);

    try {
      const token = await this.getAuthToken();

      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/merchant/payment/status/${providerTransactionId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const data = (await response.json()) as {
        status?: string;
        transactionId?: string;
        amount?: number;
        currency?: string;
        completedAt?: string;
      };

      if (!response.ok) {
        this.logger.error(
          `EcoCash status check failed: status=${response.status} txnId=${providerTransactionId}`,
        );
        return {
          providerReference: providerTransactionId,
          status: PaymentRequestStatus.FAILED,
        };
      }

      const status = this.mapEcoCashStatus(data.status);

      this.logger.log(
        `EcoCash status result: txnId=${providerTransactionId} status=${status}`,
      );

      return {
        providerReference: providerTransactionId,
        status,
        amount: data.amount,
        currency: data.currency,
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
        raw: data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `EcoCash status error: ${err.message} txnId=${providerTransactionId}`,
      );
      return {
        providerReference: providerTransactionId,
        status: PaymentRequestStatus.FAILED,
      };
    }
  }

  async processRefund(request: RefundRequest): Promise<RefundResponse> {
    this.logger.log(
      `EcoCash refund: origTxn=${request.originalTransactionId} ` +
        `providerTxn=${request.providerTransactionId} amount=${request.amount} ` +
        `reason=${request.reason || 'N/A'}`,
    );

    try {
      const token = await this.getAuthToken();

      const payload = {
        merchantCode: this.config.merchantCode,
        originalTransactionId: request.providerTransactionId,
        amount: request.amount,
        currency: request.currency,
        reason: (request.reason || `Refund for ${request.originalTransactionId}`).substring(0, 200),
      };

      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/merchant/payment/refund`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': request.idempotencyKey,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json()) as {
        status?: string;
        refundId?: string;
        message?: string;
      };

      if (!response.ok || data.status === 'failed') {
        this.logger.error(
          `EcoCash refund failed: status=${data.status} msg=${data.message} ` +
            `origTxn=${request.originalTransactionId}`,
        );
        return {
          success: false,
          refundReference: data.refundId || '',
          status: RefundStatus.FAILED,
          message: data.message || 'EcoCash refund failed',
          raw: data as unknown as Record<string, unknown>,
        };
      }

      this.logger.log(
        `EcoCash refund initiated: refundId=${data.refundId} origTxn=${request.originalTransactionId}`,
      );

      return {
        success: true,
        refundReference: data.refundId || '',
        status: data.status === 'completed' ? RefundStatus.COMPLETED : RefundStatus.PROCESSING,
        message: data.message || 'Refund processed',
        raw: data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `EcoCash refund error: ${err.message} origTxn=${request.originalTransactionId}`,
        err.stack,
      );
      return {
        success: false,
        refundReference: '',
        status: RefundStatus.FAILED,
        message: err.name === 'AbortError'
          ? 'EcoCash refund request timed out'
          : 'Failed to process EcoCash refund',
      };
    }
  }

  async validateWebhook(
    headers: Record<string, string | undefined>,
    body: string,
  ): Promise<WebhookEvent> {
    this.logger.log('Validating EcoCash webhook');

    try {
      const signature = headers['x-ecocash-signature'];
      if (!signature) {
        this.logger.warn('EcoCash webhook missing signature header');
      }

      if (this.config.apiSecret && signature) {
        const crypto = await import('crypto');
        const expectedSignature = crypto
          .createHmac('sha256', this.config.apiSecret)
          .update(body)
          .digest('hex');

        const sigBuf = Buffer.from(signature);
        const expectedBuf = Buffer.from(expectedSignature);

        if (sigBuf.length !== expectedBuf.length ||
            !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
          this.logger.error('EcoCash webhook signature mismatch');
          return {
            provider: this.name,
            eventType: WebhookEventType.UNKNOWN,
            providerTransactionId: '',
            status: PaymentRequestStatus.FAILED,
            rawPayload: { error: 'Invalid signature' },
          };
        }
      }

      const payload = JSON.parse(body) as Record<string, unknown>;
      const statusStr = payload.status as string | undefined;
      const eventType = this.mapWebhookEventType(statusStr);
      const status = this.mapWebhookStatus(statusStr);

      this.logger.log(
        `EcoCash webhook: type=${eventType} txnId=${payload.transactionId} status=${statusStr}`,
      );

      return {
        provider: this.name,
        eventType,
        providerTransactionId: (payload.transactionId as string) || '',
        amount: payload.amount as number | undefined,
        currency: payload.currency as string | undefined,
        status,
        metadata: {
          merchantCode: payload.merchantCode,
          externalId: payload.externalId,
        },
        rawPayload: payload,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`EcoCash webhook error: ${err.message}`);
      return {
        provider: this.name,
        eventType: WebhookEventType.UNKNOWN,
        providerTransactionId: '',
        status: PaymentRequestStatus.FAILED,
        rawPayload: { error: err.message },
      };
    }
  }

  private mapEcoCashStatus(status: string | undefined): PaymentRequestStatus {
    switch (status) {
      case 'completed':
        return PaymentRequestStatus.COMPLETED;
      case 'pending':
        return PaymentRequestStatus.PENDING;
      case 'failed':
        return PaymentRequestStatus.FAILED;
      case 'cancelled':
        return PaymentRequestStatus.CANCELLED;
      case 'expired':
        return PaymentRequestStatus.EXPIRED;
      default:
        return PaymentRequestStatus.PENDING;
    }
  }

  private mapWebhookEventType(status: string | undefined): WebhookEventType {
    switch (status) {
      case 'completed':
        return WebhookEventType.PAYMENT_SUCCESS;
      case 'failed':
        return WebhookEventType.PAYMENT_FAILED;
      case 'pending':
        return WebhookEventType.PAYMENT_PENDING;
      case 'refunded':
        return WebhookEventType.REFUND_SUCCESS;
      case 'chargeback':
        return WebhookEventType.CHARGEBACK;
      default:
        return WebhookEventType.UNKNOWN;
    }
  }

  private mapWebhookStatus(status: string | undefined): PaymentRequestStatus | RefundStatus {
    switch (status) {
      case 'completed':
        return PaymentRequestStatus.COMPLETED;
      case 'pending':
        return PaymentRequestStatus.PENDING;
      case 'failed':
        return PaymentRequestStatus.FAILED;
      case 'refunded':
        return RefundStatus.COMPLETED;
      default:
        return PaymentRequestStatus.PENDING;
    }
  }
}
