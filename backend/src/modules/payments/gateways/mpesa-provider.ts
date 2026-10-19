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

interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  shortCode: string;
  initiatorName: string;
  securityCredential: string;
  callbackUrl: string;
  environment: 'sandbox' | 'production';
  requestTimeoutMs: number;
}

interface OAuthToken {
  accessToken: string;
  expiresAt: number;
}

const MPESA_ENV_URLS: Record<string, string> = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke',
};

const REQUEST_TIMEOUT_MS = 30_000;
const TOKEN_REFRESH_BUFFER_MS = 60_000;

@Injectable()
export class MpesaProvider implements PaymentProvider {
  private readonly logger = new Logger(MpesaProvider.name);
  readonly name = 'mpesa';
  readonly supportedMethods = [
    PaymentMethod.MPESA_STK,
    PaymentMethod.MPESA_C2B,
    PaymentMethod.MPESA_B2C,
  ];
  readonly supportedCurrencies = ['KES'];

  private readonly config: MpesaConfig;
  private oauthToken: OAuthToken | null = null;
  private tokenRefreshInProgress: Promise<string> | null = null;

  constructor() {
    this.config = {
      consumerKey: process.env.MPESA_CONSUMER_KEY || '',
      consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
      passkey: process.env.MPESA_PASSKEY || '',
      shortCode: process.env.MPESA_SHORT_CODE || '',
      initiatorName: process.env.MPESA_INITIATOR_NAME || 'campusos',
      securityCredential: process.env.MPESA_SECURITY_CREDENTIAL || '',
      callbackUrl: process.env.MPESA_CALLBACK_URL || '',
      environment: (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      requestTimeoutMs: Number(process.env.MPESA_REQUEST_TIMEOUT_MS) || REQUEST_TIMEOUT_MS,
    };
  }

  private get baseUrl(): string {
    return MPESA_ENV_URLS[this.config.environment];
  }

  private get isConfigured(): boolean {
    return !!(this.config.consumerKey && this.config.consumerSecret && this.config.shortCode);
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

  private async getOAuthToken(): Promise<string> {
    if (this.oauthToken && Date.now() < this.oauthToken.expiresAt - TOKEN_REFRESH_BUFFER_MS) {
      return this.oauthToken.accessToken;
    }

    if (this.tokenRefreshInProgress) {
      return this.tokenRefreshInProgress;
    }

    this.tokenRefreshInProgress = this.refreshOAuthToken();
    try {
      return await this.tokenRefreshInProgress;
    } finally {
      this.tokenRefreshInProgress = null;
    }
  }

  private async refreshOAuthToken(): Promise<string> {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException('M-Pesa provider not configured');
    }

    const credentials = Buffer.from(
      `${this.config.consumerKey}:${this.config.consumerSecret}`,
    ).toString('base64');

    this.logger.log(`Refreshing M-Pesa OAuth token [env=${this.config.environment}]`);

    const response = await this.fetchWithTimeout(`${this.baseUrl}/oauth/v1/generate`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    const bodyText = await response.text();

    if (!response.ok) {
      this.logger.error(
        `M-Pesa OAuth token request failed: status=${response.status} body=${bodyText.substring(0, 500)}`,
      );
      throw new ServiceUnavailableException('M-Pesa OAuth token unavailable');
    }

    const data = JSON.parse(bodyText) as { access_token: string; expires_in: string };

    if (!data.access_token || !data.expires_in) {
      this.logger.error('M-Pesa OAuth response missing required fields');
      throw new ServiceUnavailableException('M-Pesa OAuth token response invalid');
    }

    this.oauthToken = {
      accessToken: data.access_token,
      expiresAt: Date.now() + Number(data.expires_in) * 1000,
    };

    this.logger.log('M-Pesa OAuth token refreshed successfully');
    return this.oauthToken.accessToken;
  }

  private generatePassword(timestamp: string): string {
    const data = `${this.config.shortCode}${this.config.passkey}${timestamp}`;
    return Buffer.from(data).toString('base64');
  }

  private getTimestamp(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  }

  private formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('254')) return cleaned;
    if (cleaned.startsWith('0')) return `254${cleaned.slice(1)}`;
    if (cleaned.startsWith('+254')) return cleaned.slice(1);
    return cleaned;
  }

  private validateKenyanPhone(phone: string): boolean {
    const formatted = this.formatPhoneNumber(phone);
    return /^254[17]\d{8}$/.test(formatted);
  }

  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    this.logger.log(
      `Initiating M-Pesa payment: method=${request.method} ref=${request.reference} ` +
        `amount=${request.amount} ${request.currency} phone=${request.phoneNumber ? '***' : 'N/A'} ` +
        `university=${request.universityId} user=${request.userId}`,
    );

    if (!request.phoneNumber) {
      return {
        success: false,
        providerReference: '',
        status: PaymentRequestStatus.FAILED,
        message: 'Phone number is required for M-Pesa payments',
      };
    }

    if (!this.validateKenyanPhone(request.phoneNumber)) {
      return {
        success: false,
        providerReference: '',
        status: PaymentRequestStatus.FAILED,
        message: 'Invalid Kenyan phone number format',
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

    switch (request.method) {
      case PaymentMethod.MPESA_STK:
        return this.initiateStkPush(request);
      case PaymentMethod.MPESA_C2B:
        return this.initiateC2B(request);
      case PaymentMethod.MPESA_B2C:
        return this.initiateB2C(request);
      default:
        return {
          success: false,
          providerReference: '',
          status: PaymentRequestStatus.FAILED,
          message: `Unsupported M-Pesa method: ${request.method}`,
        };
    }
  }

  private async initiateStkPush(request: PaymentRequest): Promise<PaymentResponse> {
    const phoneLast4 = request.phoneNumber!.slice(-4);

    this.logger.log(
      `STK Push: ref=${request.reference} amount=${request.amount} phone=****${phoneLast4}`,
    );

    try {
      const token = await this.getOAuthToken();
      const timestamp = this.getTimestamp();
      const password = this.generatePassword(timestamp);
      const formattedPhone = this.formatPhoneNumber(request.phoneNumber!);

      const payload = {
        BusinessShortCode: this.config.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(request.amount),
        PartyA: formattedPhone,
        PartyB: this.config.shortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: request.callbackUrl || this.config.callbackUrl,
        AccountReference: request.reference.substring(0, 12),
        TransactionDesc: (request.description || `Payment ${request.reference}`).substring(0, 13),
      };

      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json()) as {
        MerchantRequestID?: string;
        CheckoutRequestID?: string;
        ResponseCode?: string;
        ResponseDescription?: string;
        CustomerMessage?: string;
      };

      if (!response.ok || data.ResponseCode !== '0') {
        this.logger.error(
          `STK Push failed: code=${data.ResponseCode} desc=${data.ResponseDescription} ref=${request.reference}`,
        );
        return {
          success: false,
          providerReference: data.CheckoutRequestID || '',
          status: PaymentRequestStatus.FAILED,
          message: data.ResponseDescription || 'STK Push initiation failed',
          raw: data as unknown as Record<string, unknown>,
        };
      }

      this.logger.log(
        `STK Push initiated: checkoutId=${data.CheckoutRequestID} merchantId=${data.MerchantRequestID} ref=${request.reference}`,
      );

      return {
        success: true,
        providerReference: data.CheckoutRequestID!,
        status: PaymentRequestStatus.PENDING,
        message: data.CustomerMessage || 'STK Push sent to your phone',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        raw: data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `STK Push error: ${err.message} ref=${request.reference}`,
        err.stack,
      );
      return {
        success: false,
        providerReference: '',
        status: PaymentRequestStatus.FAILED,
        message: err.name === 'AbortError'
          ? 'M-Pesa request timed out'
          : 'Failed to initiate M-Pesa STK Push',
      };
    }
  }

  private async initiateC2B(request: PaymentRequest): Promise<PaymentResponse> {
    this.logger.log(
      `C2B simulate: ref=${request.reference} amount=${request.amount} phone=****${request.phoneNumber!.slice(-4)}`,
    );

    try {
      const token = await this.getOAuthToken();
      const timestamp = this.getTimestamp();

      const payload = {
        ShortCode: this.config.shortCode,
        ResponseType: 'Completed',
        CommandID: 'CustomerPaidBusiness',
        Amount: Math.round(request.amount),
        Msisdn: this.formatPhoneNumber(request.phoneNumber!),
        BillRefNumber: request.reference,
        OrgAccountBalance: 0,
        TransID: `c2b-${timestamp}-${Math.random().toString(36).substring(2, 8)}`,
        TransactionTime: timestamp,
      };

      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/mpesa/c2b/v1/simulate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json()) as {
        ConversationID?: string;
        OriginatorConversationID?: string;
        ResponseCode?: string;
        ResponseDescription?: string;
      };

      if (!response.ok || data.ResponseCode !== '0') {
        this.logger.error(`C2B simulation failed: ${JSON.stringify(data)} ref=${request.reference}`);
        return {
          success: false,
          providerReference: data.ConversationID || '',
          status: PaymentRequestStatus.FAILED,
          message: data.ResponseDescription || 'C2B simulation failed',
          raw: data as unknown as Record<string, unknown>,
        };
      }

      this.logger.log(
        `C2B initiated: conversationId=${data.ConversationID} ref=${request.reference}`,
      );

      return {
        success: true,
        providerReference: data.ConversationID!,
        status: PaymentRequestStatus.PENDING,
        message: data.ResponseDescription || 'C2B request initiated',
        raw: data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`C2B error: ${err.message} ref=${request.reference}`, err.stack);
      return {
        success: false,
        providerReference: '',
        status: PaymentRequestStatus.FAILED,
        message: err.name === 'AbortError'
          ? 'M-Pesa request timed out'
          : 'Failed to initiate M-Pesa C2B',
      };
    }
  }

  private async initiateB2C(request: PaymentRequest): Promise<PaymentResponse> {
    this.logger.log(
      `B2C payment: ref=${request.reference} amount=${request.amount} phone=****${request.phoneNumber!.slice(-4)}`,
    );

    try {
      const token = await this.getOAuthToken();
      const formattedPhone = this.formatPhoneNumber(request.phoneNumber!);

      const payload = {
        InitiatorName: this.config.initiatorName,
        SecurityCredential: this.config.securityCredential,
        CommandID: 'BusinessPayment',
        Amount: Math.round(request.amount),
        PartyA: this.config.shortCode,
        PartyB: formattedPhone,
        Remarks: (request.description || `Disbursement ${request.reference}`).substring(0, 100),
        QueueTimeOutURL: request.callbackUrl || this.config.callbackUrl,
        ResultURL: request.callbackUrl || this.config.callbackUrl,
        Occasion: 'Disbursement',
      };

      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/mpesa/b2c/v1/paymentrequest`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json()) as {
        ConversationID?: string;
        OriginatorConversationID?: string;
        ResponseCode?: string;
        ResponseDescription?: string;
      };

      if (!response.ok || data.ResponseCode !== '0') {
        this.logger.error(`B2C failed: ${JSON.stringify(data)} ref=${request.reference}`);
        return {
          success: false,
          providerReference: data.ConversationID || '',
          status: PaymentRequestStatus.FAILED,
          message: data.ResponseDescription || 'B2C payment failed',
          raw: data as unknown as Record<string, unknown>,
        };
      }

      this.logger.log(
        `B2C initiated: conversationId=${data.ConversationID} ref=${request.reference}`,
      );

      return {
        success: true,
        providerReference: data.ConversationID!,
        status: PaymentRequestStatus.PENDING,
        message: data.ResponseDescription || 'B2C payment initiated',
        raw: data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`B2C error: ${err.message} ref=${request.reference}`, err.stack);
      return {
        success: false,
        providerReference: '',
        status: PaymentRequestStatus.FAILED,
        message: err.name === 'AbortError'
          ? 'M-Pesa request timed out'
          : 'Failed to initiate M-Pesa B2C',
      };
    }
  }

  async checkPaymentStatus(providerTransactionId: string): Promise<PaymentStatusResponse> {
    this.logger.log(`Checking M-Pesa status: txnId=${providerTransactionId}`);

    try {
      const token = await this.getOAuthToken();

      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/mpesa/transactionstatus/v1/query`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            Initiator: this.config.initiatorName,
            SecurityCredential: this.config.securityCredential,
            CommandID: 'TransactionStatusQuery',
            TransactionID: providerTransactionId,
            PartyA: this.config.shortCode,
            IdentifierType: '4',
            ResultURL: this.config.callbackUrl,
            QueueTimeOutURL: this.config.callbackUrl,
            Remarks: 'Status query',
            Occasion: 'StatusQuery',
          }),
        },
      );

      const data = (await response.json()) as {
        ResponseCode?: string;
        ResponseDescription?: string;
        OriginatorConversationID?: string;
      };

      if (!response.ok) {
        this.logger.error(`M-Pesa status check failed: ${JSON.stringify(data)} txnId=${providerTransactionId}`);
        return {
          providerReference: providerTransactionId,
          status: PaymentRequestStatus.FAILED,
          raw: data as unknown as Record<string, unknown>,
        };
      }

      const status = this.mapMpesaResultCode(data.ResponseCode);

      this.logger.log(
        `M-Pesa status result: txnId=${providerTransactionId} code=${data.ResponseCode} status=${status}`,
      );

      return {
        providerReference: providerTransactionId,
        status,
        raw: data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `M-Pesa status check error: ${err.message} txnId=${providerTransactionId}`,
      );
      return {
        providerReference: providerTransactionId,
        status: PaymentRequestStatus.FAILED,
      };
    }
  }

  async processRefund(request: RefundRequest): Promise<RefundResponse> {
    this.logger.log(
      `M-Pesa refund: origTxn=${request.originalTransactionId} ` +
        `providerTxn=${request.providerTransactionId} amount=${request.amount} ` +
        `reason=${request.reason || 'N/A'}`,
    );

    try {
      const token = await this.getOAuthToken();

      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/mpesa/reversal/v1/request`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            Initiator: this.config.initiatorName,
            SecurityCredential: this.config.securityCredential,
            CommandID: 'Reversal',
            TransactionID: request.providerTransactionId,
            Amount: Math.round(request.amount),
            ReceiverParty: this.config.shortCode,
            RecieverIdentifierType: '11',
            Remarks: (request.reason || `Refund ${request.originalTransactionId}`).substring(0, 100),
            Occasion: 'Refund',
          }),
        },
      );

      const data = (await response.json()) as {
        ConversationID?: string;
        OriginatorConversationID?: string;
        ResponseCode?: string;
        ResponseDescription?: string;
      };

      if (!response.ok || data.ResponseCode !== '0') {
        this.logger.error(
          `M-Pesa refund failed: code=${data.ResponseCode} desc=${data.ResponseDescription} ` +
            `origTxn=${request.originalTransactionId}`,
        );
        return {
          success: false,
          refundReference: data.ConversationID || '',
          status: RefundStatus.FAILED,
          message: data.ResponseDescription || 'Refund processing failed',
          raw: data as unknown as Record<string, unknown>,
        };
      }

      this.logger.log(
        `M-Pesa refund initiated: conversationId=${data.ConversationID} origTxn=${request.originalTransactionId}`,
      );

      return {
        success: true,
        refundReference: data.ConversationID!,
        status: RefundStatus.PROCESSING,
        message: data.ResponseDescription || 'Refund initiated',
        raw: data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `M-Pesa refund error: ${err.message} origTxn=${request.originalTransactionId}`,
        err.stack,
      );
      return {
        success: false,
        refundReference: '',
        status: RefundStatus.FAILED,
        message: err.name === 'AbortError'
          ? 'M-Pesa refund request timed out'
          : 'Failed to process M-Pesa refund',
      };
    }
  }

  async validateWebhook(
    headers: Record<string, string | undefined>,
    body: string,
  ): Promise<WebhookEvent> {
    this.logger.log('Validating M-Pesa webhook');

    try {
      const payload = JSON.parse(body) as Record<string, unknown>;
      const bodyData = payload.Body as Record<string, unknown> | undefined;

      if (!bodyData) {
        this.logger.warn('M-Pesa webhook missing Body field');
        return {
          provider: this.name,
          eventType: WebhookEventType.UNKNOWN,
          providerTransactionId: '',
          status: PaymentRequestStatus.FAILED,
          rawPayload: payload,
        };
      }

      const stkCallback = bodyData.stkCallback as Record<string, unknown> | undefined;
      const resultCode = stkCallback?.ResultCode as number | undefined;

      if (resultCode !== undefined) {
        const checkoutRequestId = stkCallback?.CheckoutRequestID as string | undefined;
        const merchantRequestId = stkCallback?.MerchantRequestID as string | undefined;
        const resultDesc = stkCallback?.ResultDesc as string | undefined;

        const eventType =
          resultCode === 0
            ? WebhookEventType.PAYMENT_SUCCESS
            : WebhookEventType.PAYMENT_FAILED;

        const status =
          resultCode === 0
            ? PaymentRequestStatus.COMPLETED
            : PaymentRequestStatus.FAILED;

        this.logger.log(
          `M-Pesa STK callback: code=${resultCode} checkoutId=${checkoutRequestId} ` +
            `desc=${resultDesc}`,
        );

        return {
          provider: this.name,
          eventType,
          providerTransactionId: checkoutRequestId || merchantRequestId || '',
          status,
          metadata: { resultCode, resultDescription: resultDesc },
          rawPayload: payload,
        };
      }

      const c2bData = bodyData as Record<string, unknown>;
      if (c2bData.TransactionType) {
        const transId = c2bData.TransID as string | undefined;
        const transAmount = c2bData.TransAmount as number | undefined;
        const billRef = c2bData.BillRefNumber as string | undefined;

        this.logger.log(
          `M-Pesa C2B callback: transId=${transId} amount=${transAmount} billRef=${billRef}`,
        );

        return {
          provider: this.name,
          eventType: WebhookEventType.PAYMENT_SUCCESS,
          providerTransactionId: transId || '',
          amount: transAmount,
          status: PaymentRequestStatus.COMPLETED,
          metadata: {
            billRefNumber: billRef,
            msisdn: c2bData.Msisdn,
          },
          rawPayload: payload,
        };
      }

      const b2cResult = bodyData.Result as Record<string, unknown> | undefined;
      if (b2cResult) {
        const resultCode = b2cResult.ResultCode as number | undefined;
        const conversationId = b2cResult.ConversationID as string | undefined;

        this.logger.log(
          `M-Pesa B2C result: code=${resultCode} conversationId=${conversationId}`,
        );

        return {
          provider: this.name,
          eventType: resultCode === 0
            ? WebhookEventType.PAYMENT_SUCCESS
            : WebhookEventType.PAYMENT_FAILED,
          providerTransactionId: conversationId || '',
          status: resultCode === 0
            ? PaymentRequestStatus.COMPLETED
            : PaymentRequestStatus.FAILED,
          metadata: {
            resultCode,
            resultDescription: b2cResult.ResultDesc,
          },
          rawPayload: payload,
        };
      }

      this.logger.warn('M-Pesa webhook: unrecognised callback structure');
      return {
        provider: this.name,
        eventType: WebhookEventType.UNKNOWN,
        providerTransactionId: '',
        status: PaymentRequestStatus.PENDING,
        rawPayload: payload,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`M-Pesa webhook validation error: ${err.message}`);
      return {
        provider: this.name,
        eventType: WebhookEventType.UNKNOWN,
        providerTransactionId: '',
        status: PaymentRequestStatus.FAILED,
        rawPayload: { error: err.message },
      };
    }
  }

  private mapMpesaResultCode(code: string | undefined): PaymentRequestStatus {
    switch (code) {
      case '0':
        return PaymentRequestStatus.COMPLETED;
      case '1032':
        return PaymentRequestStatus.CANCELLED;
      case '1037':
      case '2001':
        return PaymentRequestStatus.FAILED;
      case '1034':
        return PaymentRequestStatus.FAILED;
      default:
        return PaymentRequestStatus.PENDING;
    }
  }
}
