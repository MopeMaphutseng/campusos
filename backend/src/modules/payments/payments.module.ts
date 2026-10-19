import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Transaction } from './entities/transaction.entity';
import { EscrowHolding } from './entities/escrow.entity';
import { MpesaProvider } from './gateways/mpesa-provider';
import { EcoCashProvider } from './gateways/ecocash-provider';
import { StripeProvider } from './gateways/stripe-provider';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, EscrowHolding])],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    MpesaProvider,
    EcoCashProvider,
    StripeProvider,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
