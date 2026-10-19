import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface UssdMenuOption {
  label: string;
  value: string;
}

export interface UssdResponse {
  message: string;
  continueSession: boolean;
}

export interface UssdSession {
  sessionId: string;
  phoneNumber: string;
  universityId: string;
  userId?: string;
  currentMenu: string;
  history: string[];
  data: Record<string, unknown>;
  language: 'en' | 'st';
  createdAt: Date;
  lastActivityAt: Date;
}

const SMS_LANGUAGE_LABELS: Record<string, Record<string, string>> = {
  en: {
    'main.title': 'Welcome to CampusOS',
    'main.1': 'Timetable',
    'main.2': 'Exam Results',
    'main.3': 'Fee Balance',
    'main.4': 'Messages',
    'main.5': 'Language / Puo',
    'main.0': 'Exit',
    'main.prompt': 'Select an option',
    'timetable.title': 'Timetable',
    'timetable.1': 'Next 3 Classes',
    'timetable.2': 'Today\'s Full Schedule',
    'timetable.0': 'Back',
    'results.title': 'Exam Results',
    'results.1': 'Latest Semester',
    'results.2': 'GPA Summary',
    'results.0': 'Back',
    'fees.title': 'Fee Balance',
    'fees.1': 'Outstanding Balance',
    'fees.2': 'Last Payment',
    'fees.0': 'Back',
    'messages.title': 'Messages',
    'messages.1': 'Last 3 Unread',
    'messages.2': 'Unread Count',
    'messages.0': 'Back',
    'language.title': 'Select Language',
    'language.1': 'English',
    'language.2': 'Sesotho',
    'language.0': 'Back',
    'error': 'Invalid option. Please try again.',
    'timeout': 'Session expired. Please dial again.',
    'rate_limited': 'Too many requests. Please wait a moment.',
  },
  st: {
    'main.title': 'Re amohela CampusOS',
    'main.1': 'Tjalelo',
    'main.2': 'Lintlha tsa Kganthelelo',
    'main.3': 'Lekgetho',
    'main.4': 'Molaetsa',
    'main.5': 'Puo / Language',
    'main.0': 'Tswa',
    'main.prompt': 'Tlhophi kgetho',
    'timetable.title': 'Tjalelo',
    'timetable.1': 'Ditjalelo tse 3 tse tlang',
    'timetable.2': 'Tjalelo e felletseng',
    'timetable.0': 'Khutela',
    'results.title': 'Lintlha tsa Kganthelelo',
    'results.1': 'Nako e sebelitsweng',
    'results.2': 'Kakaretso ya GPA',
    'results.0': 'Khutela',
    'fees.title': 'Lekgetho',
    'fees.1': 'Lekgetho le leng',
    'fees.2': 'Tefo ya bophirima',
    'fees.0': 'Khutela',
    'messages.title': 'Molaetsa',
    'messages.1': 'Ditaba tse 3 tse sa balweng',
    'messages.2': 'Nomoro ya tse sa balweng',
    'messages.0': 'Khutela',
    'language.title': 'Tlhophi Puo',
    'language.1': 'Senyesemane',
    'language.2': 'Sesotho',
    'language.0': 'Khutela',
    'error': 'Kgetho e sa siang. Lekala gape.',
    'timeout': 'Nako e fedile. Lekala gape.',
    'rate_limited': 'Dikopano tse ngata. Lekotsa sebaka.',
  },
};

@Injectable()
export class UssdProvider {
  private readonly logger = new Logger(UssdProvider.name);
  private readonly sessions = new Map<string, UssdSession>();
  private readonly rateLimitMap = new Map<
    string,
    { count: number; windowStart: number }
  >();

  private readonly SESSION_TIMEOUT_MS = 120_000;
  private readonly RATE_LIMIT_WINDOW_MS = 60_000;
  private readonly RATE_LIMIT_MAX = 30;
  private readonly SESSION_CLEANUP_INTERVAL_MS = 300_000;
  private readonly MAX_SESSIONS_PER_PHONE = 1;

  constructor(private config: ConfigService) {
    setInterval(() => this.cleanupStaleSessions(), this.SESSION_CLEANUP_INTERVAL_MS);
  }

  private localize(session: UssdSession, key: string): string {
    const lang = session.language || 'en';
    return SMS_LANGUAGE_LABELS[lang]?.[key] || SMS_LANGUAGE_LABELS['en']?.[key] || key;
  }

  private buildMenu(session: UssdSession, ...items: Array<{ key: string; option: string }>): string {
    const lines: string[] = [
      `*${this.localize(session, `${session.currentMenu}.title`)}*`,
      '',
    ];

    for (const item of items) {
      lines.push(`${item.option}. ${this.localize(session, item.key)}`);
    }

    lines.push('');
    lines.push(this.localize(session, `${session.currentMenu}.prompt`));
    return lines.join('\n');
  }

  private checkRateLimit(phoneNumber: string): boolean {
    const now = Date.now();
    const state = this.rateLimitMap.get(phoneNumber);

    if (!state || now - state.windowStart > this.RATE_LIMIT_WINDOW_MS) {
      this.rateLimitMap.set(phoneNumber, { count: 1, windowStart: now });
      return true;
    }

    if (state.count >= this.RATE_LIMIT_MAX) {
      return false;
    }

    state.count += 1;
    return true;
  }

  private cleanupStaleSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastActivityAt.getTime() > this.SESSION_TIMEOUT_MS) {
        this.sessions.delete(sessionId);
      }
    }
  }

  private enforceMaxSessionsPerPhone(phoneNumber: string): void {
    const sessionsToTerminate: string[] = [];
    for (const [sessionId, session] of this.sessions) {
      if (
        session.phoneNumber === phoneNumber &&
        sessionId !== `${phoneNumber}_active`
      ) {
        sessionsToTerminate.push(sessionId);
      }
    }
    for (const sid of sessionsToTerminate) {
      this.sessions.delete(sid);
    }
  }

  getSession(sessionId: string): UssdSession | undefined {
    return this.sessions.get(sessionId);
  }

  destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  async handleUssdRequest(
    sessionId: string,
    phoneNumber: string,
    universityId: string,
    text: string,
  ): Promise<UssdResponse> {
    if (!this.checkRateLimit(phoneNumber)) {
      this.logger.warn(`Rate limit exceeded for ${phoneNumber}`);
      return {
        message: this.getLocalizedError('en', 'rate_limited'),
        continueSession: false,
      };
    }

    let session = this.sessions.get(sessionId);
    const isNewSession = !session;

    if (isNewSession) {
      this.enforceMaxSessionsPerPhone(phoneNumber);
      session = {
        sessionId,
        phoneNumber,
        universityId,
        currentMenu: 'main',
        history: [],
        data: {},
        language: 'en',
        createdAt: new Date(),
        lastActivityAt: new Date(),
      };
      this.sessions.set(sessionId, session);
    } else {
      session.lastActivityAt = new Date();
    }

    if (!session) {
      return {
        message: this.getLocalizedError('en', 'error'),
        continueSession: false,
      };
    }

    const elapsed = Date.now() - session.lastActivityAt.getTime();
    if (!isNewSession && elapsed > this.SESSION_TIMEOUT_MS) {
      this.sessions.delete(sessionId);
      return {
        message: this.getLocalizedError(session.language, 'timeout'),
        continueSession: false,
      };
    }

    const input = text.split('*').pop() || '';

    switch (session.currentMenu) {
      case 'main':
        return this.handleMainMenu(session, input);
      case 'timetable':
        return this.handleTimetableMenu(session, input);
      case 'results':
        return this.handleResultsMenu(session, input);
      case 'fees':
        return this.handleFeesMenu(session, input);
      case 'messages':
        return this.handleMessagesMenu(session, input);
      case 'language':
        return this.handleLanguageMenu(session, input);
      default:
        return {
          message: this.localize(session, 'error'),
          continueSession: false,
        };
    }
  }

  private handleMainMenu(session: UssdSession, input: string): UssdResponse {
    switch (input) {
      case '1':
        session.history.push('main');
        session.currentMenu = 'timetable';
        return {
          message: this.buildMenu(
            session,
            { key: 'timetable.1', option: '1' },
            { key: 'timetable.2', option: '2' },
            { key: 'timetable.0', option: '0' },
          ),
          continueSession: true,
        };
      case '2':
        session.history.push('main');
        session.currentMenu = 'results';
        return {
          message: this.buildMenu(
            session,
            { key: 'results.1', option: '1' },
            { key: 'results.2', option: '2' },
            { key: 'results.0', option: '0' },
          ),
          continueSession: true,
        };
      case '3':
        session.history.push('main');
        session.currentMenu = 'fees';
        return {
          message: this.buildMenu(
            session,
            { key: 'fees.1', option: '1' },
            { key: 'fees.2', option: '2' },
            { key: 'fees.0', option: '0' },
          ),
          continueSession: true,
        };
      case '4':
        session.history.push('main');
        session.currentMenu = 'messages';
        return {
          message: this.buildMenu(
            session,
            { key: 'messages.1', option: '1' },
            { key: 'messages.2', option: '2' },
            { key: 'messages.0', option: '0' },
          ),
          continueSession: true,
        };
      case '5':
        session.history.push('main');
        session.currentMenu = 'language';
        return {
          message: this.buildMenu(
            session,
            { key: 'language.1', option: '1' },
            { key: 'language.2', option: '2' },
            { key: 'language.0', option: '0' },
          ),
          continueSession: true,
        };
      default:
        return {
          message: this.buildMenu(
            session,
            { key: 'main.1', option: '1' },
            { key: 'main.2', option: '2' },
            { key: 'main.3', option: '3' },
            { key: 'main.4', option: '4' },
            { key: 'main.5', option: '5' },
            { key: 'main.0', option: '0' },
          ),
          continueSession: true,
        };
    }
  }

  private handleTimetableMenu(session: UssdSession, input: string): UssdResponse {
    if (input === '0') {
      return this.goBack(session);
    }

    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = dayNames[now.getDay()];

    const classes = [
      { time: '08:00', code: 'CS101', name: 'Intro to Programming', room: 'Room 201' },
      { time: '10:00', code: 'MATH201', name: 'Linear Algebra', room: 'Hall A' },
      { time: '14:00', code: 'PHY101', name: 'Physics Lab', room: 'Lab 3' },
    ];

    const currentHour = now.getHours();
    const upcoming = classes.filter((c) => parseInt(c.time) >= currentHour).slice(0, 3);

    if (upcoming.length === 0) {
      return {
        message: `*${this.localize(session, 'timetable.title')}*\n\nNo more classes today (${today}).`,
        continueSession: false,
      };
    }

    const lines = upcoming.map(
      (c) => `${c.time} - ${c.code} ${c.name} (${c.room})`,
    );

    return {
      message: `*${this.localize(session, 'timetable.title')}*\n${today}\n\n${lines.join('\n')}`,
      continueSession: false,
    };
  }

  private handleResultsMenu(session: UssdSession, input: string): UssdResponse {
    if (input === '0') {
      return this.goBack(session);
    }

    if (input === '1') {
      return {
        message:
          `*${this.localize(session, 'results.title')}*\n\n` +
          `Semester Results:\n` +
          `CS101: A (85%)\n` +
          `MATH201: B+ (78%)\n` +
          `PHY101: B (72%)\n\n` +
          `GPA: 3.42`,
        continueSession: false,
      };
    }

    if (input === '2') {
      return {
        message:
          `*${this.localize(session, 'results.title')}*\n\n` +
          `GPA Summary:\n` +
          `Current: 3.42\n` +
          `Cumulative: 3.38\n` +
          `Credits: 45/120`,
        continueSession: false,
      };
    }

    return {
      message: this.localize(session, 'error'),
      continueSession: true,
    };
  }

  private handleFeesMenu(session: UssdSession, input: string): UssdResponse {
    if (input === '0') {
      return this.goBack(session);
    }

    if (input === '1') {
      return {
        message:
          `*${this.localize(session, 'fees.title')}*\n\n` +
          `Total: $2,500.00\n` +
          `Paid: $2,050.00\n` +
          `Outstanding: $450.00\n` +
          `Due: 31 Dec 2026`,
        continueSession: false,
      };
    }

    if (input === '2') {
      return {
        message:
          `*${this.localize(session, 'fees.title')}*\n\n` +
          `Last Payment:\n` +
          `Date: 15 Jul 2026\n` +
          `Amount: $500.00\n` +
          `Ref: PAY-2026-001234`,
        continueSession: false,
      };
    }

    return {
      message: this.localize(session, 'error'),
      continueSession: true,
    };
  }

  private handleMessagesMenu(session: UssdSession, input: string): UssdResponse {
    if (input === '0') {
      return this.goBack(session);
    }

    if (input === '1') {
      return {
        message:
          `*${this.localize(session, 'messages.title')}*\n\n` +
          `1. CS101: Exam on 20 Jul\n` +
          `2. MATH201: Assignment due\n` +
          `3. Admin: Fee reminder`,
        continueSession: false,
      };
    }

    if (input === '2') {
      return {
        message:
          `*${this.localize(session, 'messages.title')}*\n\n` +
          `Unread: 5 messages`,
        continueSession: false,
      };
    }

    return {
      message: this.localize(session, 'error'),
      continueSession: true,
    };
  }

  private handleLanguageMenu(session: UssdSession, input: string): UssdResponse {
    if (input === '0') {
      return this.goBack(session);
    }

    if (input === '1') {
      session.language = 'en';
      session.currentMenu = 'main';
      session.history = [];
      return {
        message: this.buildMenu(
          session,
          { key: 'main.1', option: '1' },
          { key: 'main.2', option: '2' },
          { key: 'main.3', option: '3' },
          { key: 'main.4', option: '4' },
          { key: 'main.5', option: '5' },
          { key: 'main.0', option: '0' },
        ),
        continueSession: true,
      };
    }

    if (input === '2') {
      session.language = 'st';
      session.currentMenu = 'main';
      session.history = [];
      return {
        message: this.buildMenu(
          session,
          { key: 'main.1', option: '1' },
          { key: 'main.2', option: '2' },
          { key: 'main.3', option: '3' },
          { key: 'main.4', option: '4' },
          { key: 'main.5', option: '5' },
          { key: 'main.0', option: '0' },
        ),
        continueSession: true,
      };
    }

    return {
      message: this.localize(session, 'error'),
      continueSession: true,
    };
  }

  private goBack(session: UssdSession): UssdResponse {
    const prev = session.history.pop();
    session.currentMenu = prev || 'main';

    if (session.currentMenu === 'main') {
      return {
        message: this.buildMenu(
          session,
          { key: 'main.1', option: '1' },
          { key: 'main.2', option: '2' },
          { key: 'main.3', option: '3' },
          { key: 'main.4', option: '4' },
          { key: 'main.5', option: '5' },
          { key: 'main.0', option: '0' },
        ),
        continueSession: true,
      };
    }

    return this.handleMainMenu(session, '');
  }

  private getLocalizedError(lang: 'en' | 'st', key: string): string {
    return SMS_LANGUAGE_LABELS[lang]?.[key] || SMS_LANGUAGE_LABELS['en']?.[key] || 'Error';
  }
}
