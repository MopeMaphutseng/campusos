import { Module, Global } from '@nestjs/common';
import { MonetizationController } from './monetization.controller';
import { MonetizationService } from './monetization.service';

@Global()
@Module({
  controllers: [MonetizationController],
  providers: [MonetizationService],
  exports: [MonetizationService],
})
export class MonetizationModule {}
