import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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

interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  apiVersion: string;
  requestTimeoutMs: number;
}

const STRIPE_API_VERSION = '2024-12-18.acacia';
const REQUEST_TIMEOUT_MS = 30_000;

@Injectable()
export class StripeProvider implements PaymentProvider {
  private readonly logger = new Logger(StripeProvider.name);
  readonly name = 'stripe';
  readonly supportedMethods = [PaymentMethod.STRIPE_CARD, PaymentMethod.STRIPE_CHECKOUT];
  readonly supportedCurrencies = ['USD', 'KES', 'ZAR', 'NGN', 'GHS', 'GBP', 'EUR'];

  private readonly config: StripeConfig;

  constructor() {
    this.config = {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      apiVersion: process.env.STRIPE_API_VERSION || STRIPE_API_VERSION,
      requestTimeoutMs: Number(process.env.STRIPE_REQUEST_TIMEOUT_MS) || REQUEST_TIMEOUT_MS,
    };
  }

  private get apiBase(): string {
    return 'https://api.stripe.com/v1';
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': this.config.apiVersion,
    };
  }

  private encodeParams(params: Record<string, unknown>, prefix = ''): string {
    const parts: string[] = [];

    for (const [key, value] of Object.entries(params)) {
      const fullKey = prefix ? `${prefix}[${key}]` : key;

      if (value === null || value === undefined) continue;

      if (typeof value === 'object' && !Array.isArray(value)) {
        parts.push(this.encodeParams(value as Record<string, unknown>, fullKey));
      } else if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] === 'object') {
            parts.push(this.encodeParams(value[i], `${fullKey}[${i}]`));
          } else {
            parts.push(
              `${encodeURIComponent(`${fullKey}[${i}]`)}=${encodeURIComponent(String(value[i]))}`,
            );
          }
        }
      } else {
        parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(String(value))}`);
      }
    }

    return parts.filter(Boolean).join('&');
  }

  private async request<T>(method: string, path: string, params?: Record<string, unknown>): Promise<T> {
    const url = `${this.apiBase}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.requestTimeoutMs,
    );

    const options: RequestInit = {
      method,
      headers: this.headers,
      signal: controller.signal,
    };

    if (params && (method === 'POST' || method === 'PATCH')) {
      options.body = this.encodeParams(params);
    }

    this.logger.debug(`Stripe API ${method} ${path}`);

    try {
      const response = await fetch(url, options);
      clearTimeout(timeout);

      const text = await response.text();
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(text) as Record<string, unknown>;
      } catch {
        this.logger.error(
          `Stripe API returned non-JSON: status=${response.status} body=${text.substring(0, 200)}`,
        );
        throw new BadRequestException('Invalid response from payment provider');
      }

      if (!response.ok) {
        const stripeError = data.error as Record<string, unknown> | undefined;
        const message =
          (stripeError?.message as string) || `Stripe API error ${response.status}`;
        this.logger.error(
          `Stripe API error: ${message} type=${stripeError?.type} code=${stripeError?.code} path=${path}`,
        );
        throw new BadRequestException(message);
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeout);
      const err = error as Error;
      if (err.name === 'AbortError') {
        this.logger.error(`Stripe API timeout: ${method} ${path}`);
        throw new BadRequestException('Payment provider request timed out');
      }
      throw error;
    }
  }

  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    this.logger.log(
      `Initiating Stripe payment: method=${request.method} ref=${request.reference} ` +
        `amount=${request.amount} ${request.currency} university=${request.universityId} ` +
        `user=${request.userId}`,
    );

    if (request.amount <= 0) {
      return {
        success: false,
        providerReference: '',
        status: PaymentRequestStatus.FAILED,
        message: 'Amount must be greater than zero',
      };
    }

    if (request.method === PaymentMethod.STRIPE_CHECKOUT) {
      return this.createCheckoutSession(request);
    }

    return this.createPaymentIntent(request);
  }

  private async createPaymentIntent(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const amountInCents = Math.round(request.amount * 100);

      const params: Record<string, unknown> = {
        amount: amountInCents,
        currency: request.currency.toLowerCase(),
        metadata: {
          university_id: request.universityId,
          user_id: request.userId,
          reference: request.reference,
          idempotency_key: request.idempotencyKey,
          ...request.metadata,
        },
        description: (request.description || `Payment for ${request.reference}`).substring(0, 500),
      };

      if (request.email) {
        params.receipt_email = request.email;
      }

      const result = await this.request<{
        id: string;
        status: string;
        client_secret?: string;
        amount: number;
        currency: string;
        metadata: Record<string, string>;
      }>('POST', '/payment_intents', params);

      this.logger.log(
        `Stripe PaymentIntent created: id=${result.id} status=${result.status} ref=${request.reference}`,
      );

      return {
        success: true,
        providerReference: result.id,
        status: this.mapStripeStatus(result.status),
        clientSecret: result.client_secret,
        raw: result as unknown as Record<string, unknown>,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `PaymentIntent error: ${err.message} ref=${request.reference}`,
      );
      return {
        success: false,
        providerReference: '',
        status: PaymentRequestStatus.FAILED,
        message: err.message,
      };
    }
  }

  private async createCheckoutSession(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const amountInCents = Math.round(request.amount * 100);
      const frontendUrl = process.env.FRONTEND_URL || 'https://campusos.co';

      const params: Record<string, unknown> = {
        'payment_method_types[]': 'card',
        'line_items[0][price_data][currency]': request.currency.toLowerCase(),
        'line_items[0][price_data][unit_amount]': amountInCents,
        'line_items[0][price_data][product_data][name]': (
          request.description || `Payment for ${request.reference}`
        ).substring(0, 256),
        'line_items[0][quantity]': 1,
        mode: 'payment',
        success_url: request.callbackUrl
          ? `${request.callbackUrl}?session_id={CHECKOUT_SESSION_ID}&status=success`
          : `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: request.callbackUrl
          ? `${request.callbackUrl}?session_id={CHECKOUT_SESSION_ID}&status=cancelled`
          : `${frontendUrl}/payment/cancelled`,
        metadata: {
          university_id: request.universityId,
          user_id: request.userId,
          reference: request.reference,
          idempotency_key: request.idempotencyKey,
          ...request.metadata,
        },
      };

      if (request.email) {
        params.customer_email = request.email;
      }

      const result = await this.request<{
        id: string;
        url: string;
        status: string;
        payment_status: string;
        expires_at: number;
      }>('POST', '/checkout/sessions', params);

      this.logger.log(
        `Stripe Checkout Session created: id=${result.id} ref=${request.reference}`,
      );

      return {
        success: true,
        providerReference: result.id,
        status: PaymentRequestStatus.PENDING,
        redirectUrl: result.url,
        expiresAt: new Date(result.expires_at * 1000),
        raw: result as unknown as Record<string, unknown>,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Checkout Session error: ${err.message} ref=${request.reference}`,
      );
      return {
        success: false,
        providerReference: '',
        status: PaymentRequestStatus.FAILED,
        message: err.message,
      };
    }
  }

  async checkPaymentStatus(providerTransactionId: string): Promise<PaymentStatusResponse> {
    this.logger.log(`Checking Stripe status: id=${providerTransactionId}`);

    try {
      if (providerTransactionId.startsWith('cs_')) {
        const session = await this.request<{
          id: string;
          payment_status: string;
          payment_intent: string | { id: string; status: string } | null;
          amount_total: number;
          currency: string;
        }>('GET', `/checkout/sessions/${providerTransactionId}`);

        const paymentIntentId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id;

        if (!paymentIntentId) {
          return {
            providerReference: providerTransactionId,
            status: PaymentRequestStatus.PENDING,
            raw: session as unknown as Record<string, unknown>,
          };
        }

        return this.checkPaymentIntentStatus(paymentIntentId);
      }

      return this.checkPaymentIntentStatus(providerTransactionId);
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Stripe status check error: ${err.message} id=${providerTransactionId}`,
      );
      return {
        providerReference: providerTransactionId,
        status: PaymentRequestStatus.FAILED,
      };
    }
  }

  private async checkPaymentIntentStatus(
    paymentIntentId: string,
  ): Promise<PaymentStatusResponse> {
    const pi = await this.request<{
      id: string;
      status: string;
      amount: number;
      currency: string;
      created: number;
    }>('GET', `/payment_intents/${paymentIntentId}`);

    return {
      providerReference: pi.id,
      status: this.mapStripeStatus(pi.status),
      amount: pi.amount / 100,
      currency: pi.currency.toUpperCase(),
      completedAt: pi.status === 'succeeded' ? new Date(pi.created * 1000) : undefined,
      raw: pi as unknown as Record<string, unknown>,
    };
  }

  async processRefund(request: RefundRequest): Promise<RefundResponse> {
    this.logger.log(
      `Stripe refund: origTxn=${request.originalTransactionId} ` +
        `providerTxn=${request.providerTransactionId} amount=${request.amount} ` +
        `reason=${request.reason || 'N/A'}`,
    );

    try {
      const params: Record<string, unknown> = {
        payment_intent: request.providerTransactionId,
        reason: 'requested_by_customer',
        metadata: {
          original_transaction_id: request.originalTransactionId,
          reason: request.reason || '',
          idempotency_key: request.idempotencyKey,
        },
      };

      if (request.amount !== undefined) {
        params.amount = Math.round(request.amount * 100);
      }

      const result = await this.request<{
        id: string;
        status: string;
        amount: number;
        currency: string;
      }>('POST', '/refunds', params);

      this.logger.log(
        `Stripe refund created: id=${result.id} status=${result.status} origTxn=${request.originalTransactionId}`,
      );

      return {
        success: true,
        refundReference: result.id,
        status: this.mapStripeRefundStatus(result.status),
        raw: result as unknown as Record<string, unknown>,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Stripe refund error: ${err.message} origTxn=${request.originalTransactionId}`,
      );
      return {
        success: false,
        refundReference: '',
        status: RefundStatus.FAILED,
        message: err.message,
      };
    }
  }

  async validateWebhook(
    headers: Record<string, string | undefined>,
    body: string,
  ): Promise<WebhookEvent> {
    this.logger.log('Validating Stripe webhook');

    const signatureHeader = headers['stripe-signature'];
    if (!signatureHeader) {
      this.logger.warn('Stripe webhook missing signature header');
      return {
        provider: this.name,
        eventType: WebhookEventType.UNKNOWN,
        providerTransactionId: '',
        status: PaymentRequestStatus.FAILED,
        rawPayload: { error: 'Missing signature' },
      };
    }

    try {
      const event = await this.verifyStripeSignature(signatureHeader, body);

      const eventType = this.mapStripeWebhookType(event.type);
      const dataObject = event.data?.object as Record<string, unknown> | undefined;

      const providerTransactionId =
        (dataObject?.payment_intent as string) ||
        (dataObject?.id as string) ||
        '';

      let status: PaymentRequestStatus | RefundStatus;
      if (event.type.startsWith('refund.')) {
        status = this.mapStripeRefundStatus(dataObject?.status as string);
      } else {
        status = this.mapStripeStatus(dataObject?.status as string);
      }

      this.logger.log(
        `Stripe webhook validated: type=${event.type} mappedType=${eventType} ` +
          `txnId=${providerTransactionId} livemode=${event.livemode}`,
      );

      return {
        provider: this.name,
        eventType,
        providerTransactionId,
        amount: dataObject?.amount ? (dataObject.amount as number) / 100 : undefined,
        currency: (dataObject?.currency as string)?.toUpperCase(),
        status,
        metadata: {
          stripeEventId: event.id,
          stripeEventType: event.type,
          livemode: event.livemode,
        },
        rawPayload: event as unknown as Record<string, unknown>,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Stripe webhook verification failed: ${err.message}`);
      return {
        provider: this.name,
        eventType: WebhookEventType.UNKNOWN,
        providerTransactionId: '',
        status: PaymentRequestStatus.FAILED,
        rawPayload: { error: err.message },
      };
    }
  }

  private async verifyStripeSignature(
    signatureHeader: string,
    payload: string,
  ): Promise<{ id: string; type: string; data: { object: Record<string, unknown> }; livemode: boolean }> {
    const crypto = await import('crypto');

    const parts: Record<string, string> = {};
    for (const part of signatureHeader.split(',')) {
      const eqIdx = part.indexOf('=');
      if (eqIdx === -1) continue;
      parts[part.substring(0, eqIdx)] = part.substring(eqIdx + 1);
    }

    const timestamp = parseInt(parts.t || '0', 10);
    const signature = parts.v1;

    if (!signature) {
      throw new BadRequestException('Invalid Stripe signature format');
    }

    const toleranceSeconds = 300;
    const nowSec = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSec - timestamp) > toleranceSeconds) {
      this.logger.warn(
        `Stripe webhook timestamp outside tolerance: ts=${timestamp} now=${nowSec} diff=${Math.abs(nowSec - timestamp)}s`,
      );
      throw new BadRequestException('Stripe webhook timestamp expired');
    }

    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(signedPayload)
      .digest('hex');

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expectedBuf.length ||
        !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      this.logger.error('Stripe webhook signature mismatch');
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    return JSON.parse(payload) as {
      id: string;
      type: string;
      data: { object: Record<string, unknown> };
      livemode: boolean;
    };
  }

  private mapStripeStatus(status: string | undefined): PaymentRequestStatus {
    switch (status) {
      case 'succeeded':
        return PaymentRequestStatus.COMPLETED;
      case 'processing':
        return PaymentRequestStatus.PENDING;
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        return PaymentRequestStatus.INITIATED;
      case 'canceled':
        return PaymentRequestStatus.CANCELLED;
      case 'requires_capture':
        return PaymentRequestStatus.PENDING;
      default:
        return PaymentRequestStatus.PENDING;
    }
  }

  private mapStripeRefundStatus(status: string | undefined): RefundStatus {
    switch (status) {
      case 'succeeded':
        return RefundStatus.COMPLETED;
      case 'pending':
        return RefundStatus.PROCESSING;
      case 'failed':
      case 'canceled':
        return RefundStatus.FAILED;
      default:
        return RefundStatus.PROCESSING;
    }
  }

  private mapStripeWebhookType(stripeType: string): WebhookEventType {
    switch (stripeType) {
      case 'payment_intent.succeeded':
      case 'checkout.session.completed':
        return WebhookEventType.PAYMENT_SUCCESS;
      case 'payment_intent.payment_failed':
        return WebhookEventType.PAYMENT_FAILED;
      case 'payment_intent.created':
      case 'checkout.session.expired':
        return WebhookEventType.PAYMENT_PENDING;
      case 'refund.created':
      case 'refund.updated':
        return WebhookEventType.REFUND_SUCCESS;
      case 'charge.dispute.created':
        return WebhookEventType.CHARGEBACK;
      default:
        return WebhookEventType.UNKNOWN;
    }
  }
}
