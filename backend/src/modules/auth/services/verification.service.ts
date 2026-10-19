import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { EmailVerification, VerificationPurpose } from '../entities/email-verification.entity';
import { EmailService } from '../../email/email.service';

export interface IssueResult {
  ok: boolean;
  error?: string;
  expiresInSeconds?: number;
}

export interface CheckResult {
  ok: boolean;
  error?: string;
}

/**
 * Verification-code issuance and validation. The hashing, TTL, attempt budget,
 * single-use semantics and honest send-failure handling are ported from Pula
 * Maliboho `backend/app/services/email_service.py`
 * (`issue_verification_code` / `check_verification_code`).
 */
@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly recentSends = new Map<string, number[]>();

  constructor(
    @InjectRepository(EmailVerification)
    private readonly repo: Repository<EmailVerification>,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  private secret(): string {
    return (
      this.config.get<string>('EMAIL_CODE_SECRET') ||
      this.config.get<string>('JWT_SECRET') ||
      'campusos-email-code-dev-secret'
    );
  }

  private ttlSeconds(): number {
    return parseInt(this.config.get<string>('EMAIL_VERIFY_CODE_TTL_SECONDS', '900'), 10) || 900;
  }

  private maxAttempts(): number {
    return parseInt(this.config.get<string>('EMAIL_VERIFY_MAX_ATTEMPTS', '5'), 10) || 5;
  }

  /** Six-digit code from a CSPRNG (never Math.random). */
  private generateCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private hashCode(code: string): string {
    return createHmac('sha256', this.secret()).update(code.trim()).digest('hex');
  }

  /**
   * In-memory rate limit for resends: at most 1/minute and 5/15 min per user.
   * Mirrors Pula's `@limiter.limit("1/minute")` + `@rate_limit(5, 900)`.
   */
  resendAllowed(userId: string): { allowed: boolean; retryAfterSeconds: number } {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const history = (this.recentSends.get(userId) || []).filter((t) => now - t < windowMs);
    const last = history[history.length - 1];
    if (last !== undefined && now - last < 60 * 1000) {
      return { allowed: false, retryAfterSeconds: Math.ceil((60 * 1000 - (now - last)) / 1000) };
    }
    if (history.length >= 5) {
      return { allowed: false, retryAfterSeconds: Math.ceil((windowMs - (now - history[0])) / 1000) };
    }
    history.push(now);
    this.recentSends.set(userId, history);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  async issueCode(
    userId: string,
    universityId: string,
    email: string,
    purpose: VerificationPurpose = VerificationPurpose.EMAIL_VERIFICATION,
  ): Promise<IssueResult> {
    const code = this.generateCode();
    const ttl = this.ttlSeconds();

    let record = await this.repo.findOne({ where: { userId, purpose } });
    if (record) {
      record.codeHash = this.hashCode(code);
      record.attempts = 0;
      record.expiresAt = new Date(Date.now() + ttl * 1000);
      record.lastSentAt = new Date();
      record.email = email;
      record.universityId = universityId;
    } else {
      record = this.repo.create({
        userId,
        universityId,
        email,
        purpose,
        codeHash: this.hashCode(code),
        attempts: 0,
        expiresAt: new Date(Date.now() + ttl * 1000),
        lastSentAt: new Date(),
      });
    }
    await this.repo.save(record);

    const minutes = Math.max(1, Math.floor(ttl / 60));
    const html = this.renderCodeEmail(code, minutes);
    const result = await this.email.send(email, 'Your CampusOS verification code', html);

    if (!result.ok) {
      // Never leave a code resident that the user never received.
      await this.repo.delete({ userId, purpose });
      this.logger.warn(`Verification email not sent (${result.error}); code discarded.`);
      return { ok: false, error: result.error || 'Could not send the verification email' };
    }

    return { ok: true, expiresInSeconds: ttl };
  }

  async checkCode(
    userId: string,
    code: string,
    purpose: VerificationPurpose = VerificationPurpose.EMAIL_VERIFICATION,
  ): Promise<CheckResult> {
    const record = await this.repo.findOne({ where: { userId, purpose } });
    if (!record) return { ok: false, error: 'No verification code found. Request a new one.' };

    if (record.attempts >= this.maxAttempts()) {
      await this.repo.delete({ userId, purpose });
      return { ok: false, error: 'Too many attempts. Request a new code.' };
    }

    if (new Date() > record.expiresAt) {
      await this.repo.delete({ userId, purpose });
      return { ok: false, error: 'This code has expired. Request a new one.' };
    }

    const expected = Buffer.from(record.codeHash, 'hex');
    const actual = Buffer.from(this.hashCode(code), 'hex');
    const matches = expected.length === actual.length && timingSafeEqual(expected, actual);

    if (!matches) {
      record.attempts += 1;
      await this.repo.save(record);
      return { ok: false, error: 'Invalid code. Please try again.' };
    }

    // Single use: remove immediately.
    await this.repo.delete({ userId, purpose });
    return { ok: true };
  }

  private renderCodeEmail(code: string, minutes: number): string {
    return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
<h2 style="color:#0ea5e9">CampusOS</h2>
<p>Hello,</p>
<p>Your verification code is:</p>
<p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#0ea5e9;margin:16px 0">${code}</p>
<p>Enter this code to activate your account. It expires in <strong>${minutes} minutes</strong>.</p>
<p style="color:#64748b;font-size:12px">If you did not create a CampusOS account, you can safely ignore this email.</p>
</div>`;
  }
}
