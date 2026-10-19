import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { VerificationService } from './services/verification.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '../tenants/entities/user.entity';
import { University } from '../tenants/entities/university.entity';
import { EmailVerification } from './entities/email-verification.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, University, EmailVerification]),
    EmailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'jwt-secret-dev'),
        signOptions: { expiresIn: config.get('JWT_ACCESS_EXPIRY', '15m') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, VerificationService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
