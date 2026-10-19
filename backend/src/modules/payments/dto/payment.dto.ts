import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUUID,
  IsEmail,
  Min,
  Max,
  IsObject,
  Matches,
  Length,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentProvider, TransactionType } from '../entities/transaction.entity';
import { PaymentMethod } from '../gateways/payment-provider.interface';

export class InitiatePaymentDto {
  @ApiProperty({
    description: 'Payment amount (must be positive, max 100M)',
    example: 1500.0,
  })
  @IsNumber()
  @Min(0.01, { message: 'Amount must be at least 0.01' })
  @Max(100_000_000, { message: 'Amount exceeds maximum allowed' })
  amount: number;

  @ApiPropertyOptional({
    description: 'ISO 4217 currency code',
    default: 'USD',
    example: 'KES',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be a valid 3-letter ISO code' })
  currency?: string;

  @ApiProperty({ enum: PaymentProvider, description: 'Payment provider' })
  @IsEnum(PaymentProvider, { message: 'Invalid payment provider' })
  provider: PaymentProvider;

  @ApiProperty({ enum: PaymentMethod, description: 'Specific payment method' })
  @IsEnum(PaymentMethod, { message: 'Invalid payment method' })
  method: PaymentMethod;

  @ApiProperty({ enum: TransactionType, description: 'Transaction purpose' })
  @IsEnum(TransactionType, { message: 'Invalid transaction type' })
  type: TransactionType;

  @ApiPropertyOptional({ description: 'Payment description', maxLength: 500 })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @ApiPropertyOptional({ description: 'Recipient user ID (required for marketplace)' })
  @IsOptional()
  @IsUUID('4', { message: 'Recipient ID must be a valid UUID' })
  recipientId?: string;

  @ApiPropertyOptional({
    description: 'Phone number (required for M-Pesa / EcoCash)',
    example: '+254712345678',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, {
    message: 'Phone must be 7-15 digits with optional + prefix',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Email for receipt (card payments)' })
  @IsOptional()
  @IsEmail({}, { message: 'Must be a valid email address' })
  email?: string;

  @ApiPropertyOptional({ description: 'Callback URL for payment webhooks' })
  @IsOptional()
  @IsString()
  @Matches(/^https?:\/\/.+/, { message: 'Callback URL must be a valid HTTP(S) URL' })
  callbackUrl?: string;

  @ApiPropertyOptional({ description: 'Additional key-value metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class PaymentResponseDto {
  @ApiProperty()
  transactionId: string;

  @ApiProperty()
  providerReference: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  provider: PaymentProvider;

  @ApiProperty({ required: false })
  clientSecret?: string;

  @ApiProperty({ required: false })
  redirectUrl?: string;

  @ApiProperty({ required: false })
  customerPrompt?: string;

  @ApiProperty({ required: false })
  expiresAt?: string;

  @ApiProperty()
  createdAt: string;
}

export class RefundDto {
  @ApiProperty({
    description: 'Amount to refund (omit for full refund)',
    example: 500.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01, { message: 'Refund amount must be at least 0.01' })
  @Max(100_000_000, { message: 'Refund amount exceeds maximum allowed' })
  amount?: number;

  @ApiPropertyOptional({ description: 'Refund reason', maxLength: 500 })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  reason?: string;
}

export class RefundResponseDto {
  @ApiProperty()
  transactionId: string;

  @ApiProperty()
  refundId: string;

  @ApiProperty()
  refundReference: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;
}

export class WebhookDto {
  @ApiProperty({ description: 'Provider webhook payload' })
  @IsObject()
  payload: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Webhook signature' })
  @IsOptional()
  @IsString()
  signature?: string;
}

export class TransactionQueryDto {
  @ApiPropertyOptional({ description: 'Transaction status filter' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Payment provider filter' })
  @IsOptional()
  @IsEnum(PaymentProvider)
  provider?: PaymentProvider;

  @ApiPropertyOptional({ description: 'Transaction type filter' })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class EscrowReleaseDto {
  @ApiPropertyOptional({ description: 'Notes for the release' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  notes?: string;
}

export class EscrowDisputeDto {
  @ApiProperty({ description: 'Reason for the dispute' })
  @IsString()
  @Length(10, 1000, { message: 'Dispute reason must be 10-1000 characters' })
  reason: string;
}

export class BulkRefundDto {
  @ApiProperty({
    description: 'List of transaction IDs to refund',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(50, { message: 'Cannot refund more than 50 transactions at once' })
  transactionIds: string[];

  @ApiPropertyOptional({ description: 'Reason for bulk refund' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  reason?: string;
}
