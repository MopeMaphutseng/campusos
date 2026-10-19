import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerifiableCredentialsController } from './verifiable-credentials.controller';
import { VerifiableCredentialsService } from './verifiable-credentials.service';
import { VerifiableCredential } from './entities/credential.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VerifiableCredential])],
  controllers: [VerifiableCredentialsController],
  providers: [VerifiableCredentialsService],
  exports: [VerifiableCredentialsService],
})
export class VerifiableCredentialsModule {}
