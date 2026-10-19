export enum SmsProvider {
  TWILIO = 'twilio',
}

export enum DeliveryStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  UNDELIVERED = 'undelivered',
  UNKNOWN = 'unknown',
}

export interface SmsMessage {
  to: string;
  from?: string;
  body: string;
  universityId: string;
  userId?: string;
  mediaUrl?: string[];
  statusCallback?: string;
}

export interface SmsBulkMessage {
  recipients: string[];
  from?: string;
  body: string;
  universityId: string;
  userId?: string;
}

export interface SmsResponse {
  success: boolean;
  messageId: string;
  status: DeliveryStatus;
  to: string;
  from: string;
  body: string;
  errorCode?: string;
  errorMessage?: string;
  dateCreated?: Date;
  dateSent?: Date;
  price?: string;
  priceUnit?: string;
  raw?: Record<string, unknown>;
}

export interface BulkSmsResponse {
  success: boolean;
  totalSent: number;
  totalFailed: number;
  results: SmsResponse[];
}

export interface DeliveryStatusResponse {
  messageId: string;
  status: DeliveryStatus;
  errorCode?: string;
  errorMessage?: string;
  dateUpdated?: Date;
  dateSent?: Date;
  raw?: Record<string, unknown>;
}

export interface ISmsProvider {
  readonly name: SmsProvider;
  readonly isConfigured: boolean;

  sendSms(message: SmsMessage): Promise<SmsResponse>;
  sendBulkSms(message: SmsBulkMessage): Promise<BulkSmsResponse>;
  checkDeliveryStatus(messageId: string): Promise<DeliveryStatusResponse>;
}
