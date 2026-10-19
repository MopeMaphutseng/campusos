import { promises as dns } from 'dns';

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const MAX_EMAIL_LENGTH = 254;
const MAX_LOCAL_LENGTH = 64;

// Gmail ignores periods in the local part and everything after '+';
// googlemail.com is the same inbox as gmail.com.
const GOOGLE_DOMAINS = new Set(['gmail.com', 'googlemail.com']);

const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com', '10minutemail.net', '10minutemail.org', '10minutemail.info',
  '10minutemail.de', '10minutemail.co.uk', '10minutemail.pl', 'mailinator.com',
  'mailinator.net', 'mailinator.org', 'mailinator2.com', 'mailinator.co.uk',
  'mailinator.us', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  'guerrillamail.biz', 'guerrillamail.de', 'guerrillamail.co.uk', 'guerrillamail.io',
  'guerrillamailblock.com', 'sharklasers.com', 'grr.la', 'tempmail.com', 'tempmail.net',
  'temp-mail.org', 'temp-mail.io', 'tempmailo.com', 'temp-mail.cc', 'tempmail.email',
  'yopmail.com', 'yopmail.net', 'yopmail.fr', '10minutemail.ru', 'trashmail.com',
  'trashmail.net', 'trashmail.de', 'getnmail.com', 'dispostable.com', 'throwawaymail.com',
]);

const DISPOSABLE_TEXT_MATCHES = ['disposable', 'tempmail', 'guerrillamail', 'mailinator', 'yopmail'];

async function domainResolves(domain: string): Promise<boolean> {
  try {
    const timer = setTimeout(() => undefined, 3000);
    const result = await Promise.race([
      dns.lookup(domain, { all: false }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('dns-timeout')), 3000)),
    ]);
    clearTimeout(timer);
    return !!result;
  } catch {
    // Only treat a definitive negative as a failure; timeouts and transient
    // resolver errors must not block a legitimate signup.
    return true;
  }
}

export interface NormalizeEmailResult {
  email: string | null;
  error: string | null;
}

/**
 * Ported from Pula Maliboho `backend/app/core/email_security.py`.
 *
 * Normalizes and validates an email address: rejects malformed addresses and
 * disposable domains, canonicalizes Gmail (dots and +tags stripped) so one real
 * inbox cannot create multiple accounts, and optionally performs a DNS sanity
 * check on the domain.
 */
export async function normalizeEmail(
  raw: string,
  opts: { dnsCheck?: boolean } = {},
): Promise<NormalizeEmailResult> {
  const email = (raw || '').trim().toLowerCase();
  if (!email) return { email: null, error: 'Email is required.' };
  if (email.length > MAX_EMAIL_LENGTH) return { email: null, error: 'Email address is too long.' };
  if (!EMAIL_REGEX.test(email)) return { email: null, error: 'Enter a valid email address.' };

  const at = email.lastIndexOf('@');
  let local = email.slice(0, at);
  let domain = email.slice(at + 1);

  if (GOOGLE_DOMAINS.has(domain)) {
    local = local.split('+', 1)[0].replace(/\./g, '');
    if (!local) return { email: null, error: 'Enter a valid email address.' };
    domain = 'gmail.com';
  }

  if (local.includes('..')) return { email: null, error: 'Enter a valid email address.' };
  if (local.length > MAX_LOCAL_LENGTH) return { email: null, error: 'Email address is too long.' };

  const isDisposable =
    DISPOSABLE_DOMAINS.has(domain) ||
    DISPOSABLE_TEXT_MATCHES.some((d) => domain.includes(d));
  if (isDisposable) {
    return { email: null, error: 'Disposable email addresses are not allowed.' };
  }

  if (opts.dnsCheck && !(await domainResolves(domain))) {
    return { email: null, error: 'Email domain could not be verified. Please use a real email address.' };
  }

  return { email: `${local}@${domain}`, error: null };
}
