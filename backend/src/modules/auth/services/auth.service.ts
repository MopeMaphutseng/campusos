import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, VerificationStatus } from '../../tenants/entities/user.entity';
import { University } from '../../tenants/entities/university.entity';
import { RegisterDto, LoginDto, AuthResponseDto, RefreshTokenDto } from '../dto/auth.dto';
import { VerificationService } from './verification.service';
import { EmailService } from '../../email/email.service';
import { VerificationPurpose } from '../entities/email-verification.entity';
import { normalizeEmail } from '../../../common/utils/email-security';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(University) private universityRepo: Repository<University>,
    private jwtService: JwtService,
    private config: ConfigService,
    private verification: VerificationService,
    private email: EmailService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const university = await this.universityRepo.findOne({
      where: { id: dto.universityId, status: 'active' as any },
    });
    if (!university) {
      throw new BadRequestException('University not found or inactive');
    }

    const { email, error } = await normalizeEmail(dto.email, {
      dnsCheck: this.config.get<string>('EMAIL_DNS_CHECK', 'true') !== 'false',
    });
    if (error || !email) {
      throw new BadRequestException(error || 'Enter a valid email address.');
    }

    const existing = await this.userRepo.findOne({
      where: { email, universityId: dto.universityId },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists. Please sign in instead.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const needsVerification = this.email.verificationEnabled();

    const user = this.userRepo.create({
      email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      universityId: dto.universityId,
      studentId: dto.studentId,
      phoneNumber: dto.phoneNumber,
      role: UserRole.STUDENT,
      verificationStatus: needsVerification ? VerificationStatus.UNVERIFIED : VerificationStatus.VERIFIED,
      enabledModules: ['academics', 'library', 'dashboard', 'marketplace'],
      preferences: {
        language: university.defaultLanguage || 'en',
        theme: 'system',
        notifications: { push: true, email: true, sms: false },
      },
    });

    const saved = await this.userRepo.save(user);

    let emailVerificationRequired = false;
    if (needsVerification) {
      const issued = await this.verification.issueCode(
        saved.id,
        saved.universityId,
        saved.email,
        VerificationPurpose.EMAIL_VERIFICATION,
      );
      if (!issued.ok) {
        // Do not leave a half-registered account the user cannot verify.
        await this.userRepo.delete(saved.id);
        throw new BadRequestException(
          issued.error || 'Could not send the verification email. Please try again later.',
        );
      }
      emailVerificationRequired = true;
    }

    return this.generateTokenPair(saved, { emailVerificationRequired });
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const { email } = await normalizeEmail(dto.email, { dnsCheck: false });
    const lookupEmail = email || dto.email.trim().toLowerCase();
    const user = await this.userRepo.findOne({
      where: { email: lookupEmail, universityId: dto.universityId },
      select: ['id', 'email', 'passwordHash', 'firstName', 'lastName', 'role', 'universityId', 'enabledModules', 'verificationStatus', 'preferences', 'isActive', 'failedLoginAttempts', 'lockedUntil'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account is temporarily locked');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const update: any = { failedLoginAttempts: attempts };
      if (attempts >= 5) {
        update.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await this.userRepo.update(user.id, update);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.userRepo.update(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    });

    const emailVerificationRequired =
      this.email.verificationEnabled() && user.verificationStatus !== VerificationStatus.VERIFIED;

    return this.generateTokenPair(user as any, { emailVerificationRequired });
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET', 'refresh-secret-dev'),
      });

      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokenPair(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async verifyEmail(userId: string, universityId: string, code: string): Promise<{ verified: boolean }> {
    if (!/^\d{6}$/.test((code || '').trim())) {
      throw new BadRequestException('Enter the 6-digit verification code');
    }

    const result = await this.verification.checkCode(
      userId,
      code,
      VerificationPurpose.EMAIL_VERIFICATION,
    );
    if (!result.ok) {
      throw new BadRequestException(result.error || 'Invalid verification code');
    }

    await this.userRepo.update({ id: userId, universityId }, {
      verificationStatus: VerificationStatus.VERIFIED,
    });

    return { verified: true };
  }

  async resendVerification(userId: string, universityId: string): Promise<{ message: string }> {
    if (!this.email.verificationEnabled()) {
      throw new BadRequestException('Email verification is not required');
    }

    const user = await this.userRepo.findOne({ where: { id: userId, universityId } });
    if (!user) throw new UnauthorizedException('User not found');
    if (user.verificationStatus === VerificationStatus.VERIFIED) {
      throw new BadRequestException('Email already verified');
    }

    const gate = this.verification.resendAllowed(userId);
    if (!gate.allowed) {
      throw new BadRequestException(
        `Please wait ${gate.retryAfterSeconds}s before requesting another code.`,
      );
    }

    const issued = await this.verification.issueCode(
      user.id,
      user.universityId,
      user.email,
      VerificationPurpose.EMAIL_VERIFICATION,
    );
    if (!issued.ok) {
      throw new BadRequestException(issued.error || 'Could not send the verification email');
    }

    return { message: 'A new verification code has been sent to your email' };
  }

  /**
   * Begin a password reset. Always returns the same message so callers cannot
   * probe which emails are registered. Reuses the same hashed single-use code
   * infrastructure as email verification.
   */
  async forgotPassword(email: string, universityId: string): Promise<{ message: string }> {
    const generic = { message: 'If an account exists, a reset code has been sent.' };

    if (!this.email.verificationEnabled()) {
      throw new BadRequestException('Password reset is unavailable: email delivery is not configured');
    }

    const normalized = await normalizeEmail(email, { dnsCheck: false });
    const user = await this.userRepo.findOne({
      where: { email: normalized.email || email.trim().toLowerCase(), universityId },
    });
    if (!user || !user.isActive) return generic;

    const gate = this.verification.resendAllowed(`reset:${user.id}`);
    if (!gate.allowed) return generic;

    await this.verification.issueCode(
      user.id,
      user.universityId,
      user.email,
      VerificationPurpose.PASSWORD_RESET,
    );
    return generic;
  }

  async resetPassword(
    email: string,
    universityId: string,
    code: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    if (!/^\d{6}$/.test((code || '').trim())) {
      throw new BadRequestException('Enter the 6-digit reset code');
    }
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    const normalized = await normalizeEmail(email, { dnsCheck: false });
    const user = await this.userRepo.findOne({
      where: { email: normalized.email || email.trim().toLowerCase(), universityId },
    });
    if (!user || !user.isActive) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const result = await this.verification.checkCode(
      user.id,
      code,
      VerificationPurpose.PASSWORD_RESET,
    );
    if (!result.ok) {
      throw new BadRequestException(result.error || 'Invalid or expired reset code');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.userRepo.update(user.id, { passwordHash, failedLoginAttempts: 0, lockedUntil: null });

    return { message: 'Password updated successfully. You can now sign in.' };
  }

  async getProfile(userId: string, universityId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId, universityId },
    });
    if (!user) throw new UnauthorizedException('User not found');

    const { passwordHash, ...profile } = user;
    return profile;
  }

  private async generateTokenPair(
    user: User,
    opts: { emailVerificationRequired?: boolean } = {},
  ): Promise<AuthResponseDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      universityId: user.universityId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_SECRET', 'jwt-secret-dev'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRY', '15m'),
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.config.get('JWT_REFRESH_SECRET', 'refresh-secret-dev'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRY', '7d'),
      },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        universityId: user.universityId,
        enabledModules: user.enabledModules,
        verificationStatus: user.verificationStatus,
        preferences: user.preferences,
      },
      expiresIn: 900,
      emailVerificationRequired: opts.emailVerificationRequired ?? false,
    };
  }
}
