import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TwilioProvider } from './twilio-provider';
import { UssdProvider, UssdResponse } from './ussd-provider';
import {
  SmsMessage,
  SmsResponse,
  BulkSmsResponse,
  DeliveryStatus,
} from './sms-provider.interface';

export enum SmsTemplate {
  CLASS_REMINDER = 'class_reminder',
  FEE_REMINDER = 'fee_reminder',
  EXAM_SCHEDULE = 'exam_schedule',
  RESULTS_READY = 'results_ready',
  WELCOME = 'welcome',
  OPT_OUT_CONFIRMED = 'opt_out_confirmed',
  OPT_IN_CONFIRMED = 'opt_in_confirmed',
}

export interface SmsTemplateData {
  studentName?: string;
  courseCode?: string;
  courseName?: string;
  className?: string;
  time?: string;
  date?: string;
  room?: string;
  amount?: string;
  dueDate?: string;
  examDate?: string;
  examTime?: string;
  examVenue?: string;
  semester?: string;
  gpa?: string;
}

export interface OptOutRecord {
  phoneNumber: string;
  universityId: string;
  optedOutAt: Date;
}

interface RateLimitState {
  count: number;
  windowStart: number;
}

@Injectable()
export class SmsUssdService {
  private readonly logger = new Logger(SmsUssdService.name);
  private readonly optOuts = new Map<string, OptOutRecord>();
  private readonly rateLimitMap = new Map<string, RateLimitState>();

  private readonly RATE_LIMIT_WINDOW_MS = 60_000;
  private readonly RATE_LIMIT_MAX_SMS = 10;
  private readonly SMS_MAX_LENGTH = 160;

  private readonly templates: Record<
    SmsTemplate,
    Record<string, (data: SmsTemplateData) => string>
  > = {
    [SmsTemplate.CLASS_REMINDER]: {
      en: (d) => {
        const name = d.studentName || 'Student';
        const code = d.courseCode || '';
        const course = d.courseName || 'class';
        const time = d.time || 'N/A';
        const room = d.room || 'N/A';
        return '[CampusOS] Hi ' + name + ', reminder: ' + code + ' ' + course + ' starts at ' + time + ' in ' + room + '. Don\'t be late!';
      },
      st: (d) => {
        const name = d.studentName || 'Motho';
        const code = d.courseCode || '';
        const course = d.courseName || 'class';
        const time = d.time || 'N/A';
        const room = d.room || 'N/A';
        return '[CampusOS] Lumela ' + name + ', lekutsa: ' + code + ' ' + course + ' e simolola ka ' + time + ' ' + room + '.';
      },
    },
    [SmsTemplate.FEE_REMINDER]: {
      en: (d) => {
        const amount = d.amount || 'N/A';
        const due = d.dueDate || 'N/A';
        return '[CampusOS] Fee Reminder: Your outstanding balance is ' + amount + '. Due: ' + due + '. Pay now to avoid penalties.';
      },
      st: (d) => {
        const amount = d.amount || 'N/A';
        const due = d.dueDate || 'N/A';
        return '[CampusOS] Lekgetho: Lekgetho la hao ke ' + amount + '. La bopelletso: ' + due + '.';
      },
    },
    [SmsTemplate.EXAM_SCHEDULE]: {
      en: (d) => {
        const code = d.courseCode || '';
        const date = d.examDate || 'N/A';
        const time = d.examTime || 'N/A';
        const venue = d.examVenue || 'N/A';
        return '[CampusOS] Exam Alert: ' + code + ' exam on ' + date + ' at ' + time + ', ' + venue + '. Prepare well!';
      },
      st: (d) => {
        const code = d.courseCode || '';
        const date = d.examDate || 'N/A';
        const time = d.examTime || 'N/A';
        const venue = d.examVenue || 'N/A';
        return '[CampusOS] Kganthelelo: ' + code + ' keganthelelo ka ' + date + ' ka ' + time + ', ' + venue + '.';
      },
    },
    [SmsTemplate.RESULTS_READY]: {
      en: (d) => {
        const sem = d.semester || 'Semester';
        const gpa = d.gpa || 'N/A';
        return '[CampusOS] Results ready! ' + sem + ' GPA: ' + gpa + '. Login to view full results.';
      },
      st: (d) => {
        const sem = d.semester || 'Semester';
        const gpa = d.gpa || 'NAA';
        return '[CampusOS] Lintlha di ready! GPA ya ' + sem + ': ' + gpa + '.';
      },
    },
    [SmsTemplate.WELCOME]: {
      en: (d) => {
        const name = d.studentName || 'Student';
        return '[CampusOS] Welcome ' + name + '! You\'re registered for SMS alerts. Reply STOP to opt out.';
      },
      st: (d) => {
        const name = d.studentName || 'Motho';
        return '[CampusOS] Re amohela ' + name + '! O ngoditswe bakeng sa dikoloi tsa SMS.';
      },
    },
    [SmsTemplate.OPT_OUT_CONFIRMED]: {
      en: () => '[CampusOS] You\'ve been unsubscribed from SMS alerts. Reply START to re-enable.',
      st: () => '[CampusOS] O ntse o kgethile ho tswa ho dikoloi tsa SMS.',
    },
    [SmsTemplate.OPT_IN_CONFIRMED]: {
      en: () => '[CampusOS] SMS alerts re-enabled. You\'ll receive important updates.',
      st: () => '[CampusOS] Dikoloi tsa SMS di sebetsa hape.',
    },
  };

  constructor(
    private config: ConfigService,
    private twilioProvider: TwilioProvider,
    private ussdProvider: UssdProvider,
  ) {}

  private normalizePhone(phone: string): string {
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('0')) {
        cleaned = '+266' + cleaned.substring(1);
      } else {
        cleaned = '+' + cleaned;
      }
    }
    return cleaned;
  }

  private isOptedOut(phoneNumber: string, universityId: string): boolean {
    const normalized = this.normalizePhone(phoneNumber);
    const key = normalized + ':' + universityId;
    return this.optOuts.has(key);
  }

  private checkRateLimit(phoneNumber: string): boolean {
    const normalized = this.normalizePhone(phoneNumber);
    const now = Date.now();
    const state = this.rateLimitMap.get(normalized);

    if (!state || now - state.windowStart > this.RATE_LIMIT_WINDOW_MS) {
      this.rateLimitMap.set(normalized, { count: 1, windowStart: now });
      return true;
    }

    if (state.count >= this.RATE_LIMIT_MAX_SMS) {
      this.logger.warn('SMS rate limit exceeded for ' + normalized);
      return false;
    }

    state.count += 1;
    return true;
  }

  private renderTemplate(
    template: SmsTemplate,
    lang: 'en' | 'st',
    data: SmsTemplateData,
  ): string {
    const renderer = this.templates[template]?.[lang] || this.templates[template]?.['en'];
    if (!renderer) {
      const code = data.courseCode || '';
      const course = data.courseName || '';
      return ('[CampusOS] ' + code + ' ' + course).trim();
    }
    return renderer(data);
  }

  async sendSms(
    to: string,
    body: string,
    universityId: string,
    userId?: string,
  ): Promise<SmsResponse> {
    const normalized = this.normalizePhone(to);

    if (this.isOptedOut(normalized, universityId)) {
      this.logger.warn('SMS blocked: ' + normalized + ' opted out in ' + universityId);
      return {
        success: false,
        messageId: '',
        status: DeliveryStatus.FAILED,
        to: normalized,
        from: '',
        body,
        errorCode: 'OPTED_OUT',
        errorMessage: 'Phone number has opted out of SMS alerts',
      };
    }

    if (!this.checkRateLimit(normalized)) {
      return {
        success: false,
        messageId: '',
        status: DeliveryStatus.FAILED,
        to: normalized,
        from: '',
        body,
        errorCode: 'RATE_LIMITED',
        errorMessage: 'Rate limit exceeded for this phone number',
      };
    }

    return this.twilioProvider.sendSms({
      to: normalized,
      body,
      universityId,
      userId,
    });
  }

  async sendTemplateSms(
    to: string,
    template: SmsTemplate,
    data: SmsTemplateData,
    universityId: string,
    userId?: string,
    language: 'en' | 'st' = 'en',
  ): Promise<SmsResponse> {
    const body = this.renderTemplate(template, language, data);
    this.logger.log('Sending template SMS [' + template + '] to ' + to + ' in ' + universityId + ' (lang: ' + language + ')');
    return this.sendSms(to, body, universityId, userId);
  }

  async sendBulkTemplateSms(
    recipients: Array<{ phone: string; userId?: string }>,
    template: SmsTemplate,
    data: SmsTemplateData,
    universityId: string,
    language: 'en' | 'st' = 'en',
  ): Promise<BulkSmsResponse> {
    const body = this.renderTemplate(template, language, data);
    const validRecipients = recipients
      .map((r) => r.phone)
      .filter((phone) => !this.isOptedOut(phone, universityId));

    this.logger.log('Sending bulk template SMS [' + template + '] to ' + validRecipients.length + '/' + recipients.length + ' recipients in ' + universityId);

    return this.twilioProvider.sendBulkSms({
      recipients: validRecipients,
      body,
      universityId,
    });
  }

  async sendUniversityBroadcast(
    universityId: string,
    body: string,
    userIds?: string[],
  ): Promise<BulkSmsResponse> {
    this.logger.log('University broadcast in ' + universityId + ': ' + (userIds?.length || 'all') + ' recipients');

    const phoneNumbers = userIds?.length
      ? userIds.map((id) => ({ phone: '+266' + id.slice(0, 8), userId: id }))
      : [{ phone: '+26600000000' }];

    return this.twilioProvider.sendBulkSms({
      recipients: phoneNumbers.map((r) => r.phone),
      body,
      universityId,
    });
  }

  async checkDeliveryStatus(messageId: string) {
    return this.twilioProvider.checkDeliveryStatus(messageId);
  }

  async handleOptOut(
    phoneNumber: string,
    universityId: string,
  ): Promise<{ response: string }> {
    const normalized = this.normalizePhone(phoneNumber);
    const key = normalized + ':' + universityId;
    this.optOuts.set(key, {
      phoneNumber: normalized,
      universityId,
      optedOutAt: new Date(),
    });
    this.logger.log('Phone ' + normalized + ' opted out in ' + universityId);
    return { response: this.renderTemplate(SmsTemplate.OPT_OUT_CONFIRMED, 'en', {}) };
  }

  async handleOptIn(
    phoneNumber: string,
    universityId: string,
  ): Promise<{ response: string }> {
    const normalized = this.normalizePhone(phoneNumber);
    const key = normalized + ':' + universityId;
    this.optOuts.delete(key);
    this.logger.log('Phone ' + normalized + ' opted in to ' + universityId);
    return { response: this.renderTemplate(SmsTemplate.OPT_IN_CONFIRMED, 'en', {}) };
  }

  async isPhoneOptedOut(phoneNumber: string, universityId: string): Promise<boolean> {
    return this.isOptedOut(phoneNumber, universityId);
  }

  async handleSmsRequest(
    phoneNumber: string,
    universityId: string,
    message: string,
  ): Promise<{ response: string }> {
    const command = message.trim().toUpperCase();

    if (command === 'STOP') {
      return this.handleOptOut(phoneNumber, universityId);
    }

    if (command === 'START') {
      return this.handleOptIn(phoneNumber, universityId);
    }

    switch (command) {
      case 'TT':
        return {
          response: 'Timetable today:\n08:00 - CS101 Intro to Programming (Room 201)\n10:00 - MATH201 Linear Algebra (Hall A)\n14:00 - PHY101 Physics Lab (Lab 3)',
        };
      case 'EXAM':
        return { response: 'Next exam: CS101 - 20 Jul, 9:00 AM, Main Hall' };
      case 'FEES':
        return { response: 'Fee balance: $450.00 due 31 Dec 2026' };
      case 'HELP':
        return {
          response: 'CampusOS SMS Commands:\nTT - Today timetable\nEXAM - Next exam\nFEES - Fee balance\nBAL - Account balance\nSTOP - Opt out\nSTART - Opt in\nHELP - This message',
        };
      default:
        return { response: 'Unknown command. Send HELP for available commands.' };
    }
  }

  async handleUssdRequest(
    phoneNumber: string,
    universityId: string,
    sessionId: string,
    text: string,
  ): Promise<UssdResponse> {
    return this.ussdProvider.handleUssdRequest(sessionId, phoneNumber, universityId, text);
  }

  async getTimetableSms(universityId: string, userId: string): Promise<string> {
    return 'Timetable today:\n08:00 - CS101 Intro to Programming (Room 201)\n10:00 - MATH201 Linear Algebra (Hall A)\n14:00 - PHY101 Physics Lab (Lab 3)';
  }

  async getExamResultsSms(universityId: string, userId: string): Promise<string> {
    return 'Latest results:\nCS101: A (85%)\nMATH201: B+ (78%)\nPHY101: B (72%)';
  }

  async getFeeBalanceSms(universityId: string, userId: string): Promise<string> {
    return 'Fee Status:\nTotal: $2,500.00\nPaid: $2,050.00\nBalance: $450.00\nDue: 31 Dec 2026';
  }
}
