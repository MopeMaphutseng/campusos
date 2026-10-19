import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { UserId, UniversityId } from '../../common/decorators/auth.decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PaymentProvider, TransactionType } from './entities/transaction.entity';
import {
  InitiatePaymentDto,
  RefundDto,
  TransactionQueryDto,
} from './dto/payment.dto';
import { Request } from 'express';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate a payment' })
  async initiatePayment(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() dto: InitiatePaymentDto,
  ) {
    return this.paymentsService.initiatePayment(universityId, userId, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Check/update transaction status from provider' })
  @ApiParam({ name: 'id', type: String })
  async checkStatus(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.paymentsService.checkTransactionStatus(universityId, id);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund a transaction' })
  @ApiParam({ name: 'id', type: String })
  async refundTransaction(
    @UniversityId() universityId: string,
    @Param('id') id: string,
    @Body() dto: RefundDto,
  ) {
    return this.paymentsService.processRefund(universityId, id, dto);
  }

  @Post('webhook/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payment provider webhook (raw body access)' })
  @ApiParam({ name: 'provider', type: String })
  async handleWebhook(
    @Param('provider') provider: PaymentProvider,
    @Req() req: Request,
  ) {
    const headers: Record<string, string | undefined> = {};
    for (const key of Object.keys(req.headers)) {
      headers[key] = req.headers[key] as string | undefined;
    }

    const rawBody = (req as unknown as { rawBody?: string }).rawBody || JSON.stringify(req.body);

    return this.paymentsService.handleWebhook(provider, headers, rawBody);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get user transactions' })
  async findUserTransactions(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Query() query: TransactionQueryDto,
  ) {
    return this.paymentsService.findUserTransactions(universityId, userId, query);
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiParam({ name: 'id', type: String })
  async findTransactionById(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.paymentsService.findTransactionById(universityId, id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get payment statistics' })
  async getTransactionStats(
    @UniversityId() universityId: string,
    @UserId() userId: string,
  ) {
    return this.paymentsService.getTransactionStats(universityId, userId);
  }

  @Get('providers')
  @ApiOperation({ summary: 'List available payment providers' })
  async getPaymentProviders() {
    return this.paymentsService.getPaymentProviders();
  }

  @Get('fees')
  @ApiOperation({ summary: 'Calculate platform fees for an amount' })
  async getFeeCalculation(
    @Query('amount') amount: string,
    @Query('type') type: TransactionType,
  ) {
    return this.paymentsService.getFeeCalculation(Number(amount), type);
  }

  @Get('escrow')
  @ApiOperation({ summary: 'Get escrow holdings for user' })
  async getEscrowHoldings(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Query('role') role: 'buyer' | 'seller' | 'all',
  ) {
    return this.paymentsService.getEscrowHoldings(universityId, userId, role);
  }

  @Post('escrow/:id/release')
  @ApiOperation({ summary: 'Release escrow to seller' })
  @ApiParam({ name: 'id', type: String })
  async releaseEscrow(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
  ) {
    return this.paymentsService.initiateEscrowRelease(universityId, id, userId);
  }

  @Post('escrow/:id/dispute')
  @ApiOperation({ summary: 'Dispute escrow holding' })
  @ApiParam({ name: 'id', type: String })
  async disputeEscrow(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.paymentsService.initiateEscrowDispute(universityId, id, reason, userId);
  }
}
