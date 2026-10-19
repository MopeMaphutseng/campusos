export enum PaymentMethod {
  MPESA_STK = 'mpesa_stk',
  MPESA_C2B = 'mpesa_c2b',
  MPESA_B2C = 'mpesa_b2c',
  ECOCASH_MERCHANT = 'ecocash_merchant',
  STRIPE_CARD = 'stripe_card',
  STRIPE_CHECKOUT = 'stripe_checkout',
}

export enum PaymentRequestStatus {
  INITIATED = 'initiated',
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum RefundStatus {
  INITIATED = 'initiated',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum WebhookEventType {
  PAYMENT_SUCCESS = 'payment.success',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_PENDING = 'payment.pending',
  REFUND_SUCCESS = 'refund.success',
  REFUND_FAILED = 'refund.failed',
  CHARGEBACK = 'chargeback',
  UNKNOWN = 'unknown',
}

export interface PaymentRequest {
  universityId: string;
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  description?: string;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
  phoneNumber?: string;
  email?: string;
  idempotencyKey: string;
}

export interface PaymentResponse {
  success: boolean;
  providerReference: string;
  status: PaymentRequestStatus;
  message?: string;
  customerPrompt?: string;
  clientSecret?: string;
  redirectUrl?: string;
  expiresAt?: Date;
  raw?: Record<string, unknown>;
}

export interface RefundRequest {
  universityId: string;
  originalTransactionId: string;
  providerTransactionId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  reason?: string;
  idempotencyKey: string;
}

export interface RefundResponse {
  success: boolean;
  refundReference: string;
  status: RefundStatus;
  message?: string;
  raw?: Record<string, unknown>;
}

export interface WebhookEvent {
  provider: string;
  eventType: WebhookEventType;
  providerTransactionId: string;
  amount?: number;
  currency?: string;
  status: PaymentRequestStatus | RefundStatus;
  metadata?: Record<string, unknown>;
  rawPayload: Record<string, unknown>;
}

export interface PaymentStatusResponse {
  providerReference: string;
  status: PaymentRequestStatus;
  amount?: number;
  currency?: string;
  completedAt?: Date;
  raw?: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly name: string;
  readonly supportedMethods: PaymentMethod[];
  readonly supportedCurrencies: string[];

  initiatePayment(request: PaymentRequest): Promise<PaymentResponse>;
  checkPaymentStatus(providerTransactionId: string): Promise<PaymentStatusResponse>;
  processRefund(request: RefundRequest): Promise<RefundResponse>;
  validateWebhook(
    headers: Record<string, string | undefined>,
    body: string,
  ): Promise<WebhookEvent>;
}
