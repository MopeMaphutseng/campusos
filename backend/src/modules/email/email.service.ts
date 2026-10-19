import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendResult {
  ok: boolean;
  error?: string;
  via?: string;
}

/**
 * Email delivery, ported from Pula Maliboho `backend/app/services/email_service.py`.
 *
 * Two transports, chosen at runtime:
 *   1. HTTP API (Brevo-compatible) over HTTPS via global fetch — works on hosts
 *      with no outbound SMTP (Render free tier). Requires EMAIL_API_KEY.
 *   2. SMTP via nodemailer, if it is installed. Requires SMTP_HOST/USER/PASSWORD.
 *
 * Delivery is always reported honestly: a failure returns { ok:false } and the
 * caller must not tell the user an email was sent.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  private hasApi(): boolean {
    return !!this.config.get<string>('EMAIL_API_KEY');
  }

  private hasSmtp(): boolean {
    return !!(
      this.config.get<string>('SMTP_HOST') &&
      this.config.get<string>('SMTP_USER') &&
      this.config.get<string>('SMTP_PASSWORD')
    );
  }

  isConfigured(): boolean {
    return this.hasApi() || this.hasSmtp();
  }

  /**
   * Whether email verification should be enforced. Explicit
   * EMAIL_VERIFICATION_ENABLED wins; otherwise it is enabled only when a working
   * transport is configured (same behaviour as Pula Maliboho).
   */
  verificationEnabled(): boolean {
    const flag = (this.config.get<string>('EMAIL_VERIFICATION_ENABLED') ?? '').trim().toLowerCase();
    if (['1', 'true', 'yes'].includes(flag)) return true;
    if (['0', 'false', 'no'].includes(flag)) return false;
    return this.isConfigured();
  }

  async send(to: string, subject: string, html: string): Promise<SendResult> {
    if (this.hasApi()) return this.sendViaApi(to, subject, html);
    if (this.hasSmtp()) return this.sendViaSmtp(to, subject, html);
    return { ok: false, error: 'Email delivery is not configured' };
  }

  private async sendViaApi(to: string, subject: string, html: string): Promise<SendResult> {
    const key = this.config.get<string>('EMAIL_API_KEY', '');
    const url = this.config.get<string>('EMAIL_API_URL', 'https://api.brevo.com/v3/smtp/email');
    const senderEmail = this.config.get<string>('SMTP_FROM') || this.config.get<string>('SMTP_USER', '');
    const senderName = this.config.get<string>('MAIL_FROM_NAME', 'CampusOS');
    const text = html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'api-key': key },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text,
        }),
      });
      if (res.ok) return { ok: true, via: 'http-api' };
      const body = (await res.text().catch(() => '')).slice(0, 300);
      this.logger.error(`Email API error ${res.status}: ${body}`);
      return { ok: false, error: `Email provider rejected the request (status ${res.status})` };
    } catch (err) {
      this.logger.error(`Email API request failed: ${(err as Error).message}`);
      return { ok: false, error: 'Could not reach the email provider' };
    }
  }

  private async sendViaSmtp(to: string, subject: string, html: string): Promise<SendResult> {
    let nodemailer: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      nodemailer = require('nodemailer');
    } catch {
      return { ok: false, error: 'SMTP transport unavailable: nodemailer is not installed' };
    }

    const host = this.config.get<string>('SMTP_HOST', '');
    const port = parseInt(this.config.get<string>('SMTP_PORT', '587'), 10) || 587;
    const user = this.config.get<string>('SMTP_USER', '');
    const pass = this.config.get<string>('SMTP_PASSWORD', '');
    const from = this.config.get<string>('SMTP_FROM') || user;
    const fromName = this.config.get<string>('MAIL_FROM_NAME', 'CampusOS');

    const strategies = [
      { port, secure: false },
      { port: 465, secure: true },
    ];
    for (const strategy of strategies) {
      try {
        const transporter = nodemailer.createTransport({
          host,
          port: strategy.port,
          secure: strategy.secure,
          auth: { user, pass },
        });
        await transporter.sendMail({
          from: `"${fromName}" <${from || user}>`,
          to,
          subject,
          html,
        });
        return { ok: true, via: 'smtp' };
      } catch (err) {
        this.logger.warn(`SMTP send failed via port ${strategy.port}: ${(err as Error).name}`);
      }
    }
    return { ok: false, error: 'Could not send the email via SMTP' };
  }
}
