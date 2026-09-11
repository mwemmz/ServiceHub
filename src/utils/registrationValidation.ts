/** Shared validation for customer & provider registration. */

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Current Zambian mobile prefixes (ZICTA / ITU):
 * Airtel 097, 077, 057 · MTN 096, 076, 056 · Zamtel 095, 075, 055
 * National number is 9 digits after +260 (local 0 + 9 digits).
 */
const ZAMBIAN_MOBILE_PREFIX = /^(?:95|96|97|75|76|77|55|56|57)/;

/** Strip country/trunk prefixes down to the 9-digit national mobile number. */
export function zambianNationalNumber(raw: string): string | null {
  let digits = raw.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('00')) digits = digits.slice(2);
  while (digits.startsWith('260260')) digits = digits.slice(3);
  if (digits.startsWith('260')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);

  if (digits.length !== 9) return null;
  return digits;
}

/** Normalize to E.164 (+260XXXXXXXXX). Invalid input is returned trimmed. */
export function normalizeZambianPhone(raw: string): string {
  const national = zambianNationalNumber(raw);
  if (!national) return raw.trim();
  return `+260${national}`;
}

export function isValidZambianPhone(raw: string): boolean {
  const national = zambianNationalNumber(raw);
  return national !== null && ZAMBIAN_MOBILE_PREFIX.test(national);
}

export const ZM_COUNTRY_CODE = '+260';

/** Digits the user types after +260 (max 9). */
export function nationalDigitsFromPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  while (digits.startsWith('260260')) digits = digits.slice(3);
  if (digits.startsWith('260')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 9);
}

/** Store E.164, or empty when only the country code is present. */
export function composeZambianPhone(raw: string): string {
  const national = nationalDigitsFromPhone(raw);
  return national ? `+260${national}` : '';
}

/**
 * Specific password rule feedback for submit-time validation.
 * Returns the first failing rule message, or null when the password is valid.
 * Does not render a permanent requirements checklist — callers show this under the field.
 */
export function getPasswordError(password: string): string | null {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
  if (!/\d/.test(password)) return 'Password must contain at least one number.';
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must contain at least one special character.';
  }
  return null;
}

export function getConfirmPasswordError(password: string, confirm: string): string | null {
  if (!confirm) return 'Please confirm your password.';
  if (password !== confirm) {
    return 'Passwords do not match. Please make sure both passwords are the same.';
  }
  return null;
}

export function isStrongPassword(password: string): boolean {
  return getPasswordError(password) === null;
}

export function getEmailError(email: string, label = 'Email address'): string | null {
  if (!email.trim()) return `${label} is required.`;
  if (!isValidEmail(email)) return 'Please enter a valid email address.';
  return null;
}

export function getPhoneError(phone: string, label = 'Phone number'): string | null {
  if (!phone.trim()) return `${label} is required.`;
  if (!isValidZambianPhone(phone)) return 'Please enter a valid Zambian mobile number.';
  return null;
}

export function getNrcError(nrc: string, requiredMessage = 'NRC number is required.'): string | null {
  if (!nrc.trim()) return requiredMessage;
  if (!isValidZambianNrc(nrc)) return 'Please enter a valid NRC number.';
  return null;
}

/** Zambian NRC patterns like 123456/78/1 or 123456/78/9 */
export function isValidZambianNrc(raw: string): boolean {
  const cleaned = raw.trim().replace(/\s+/g, '');
  return /^\d{6}\/\d{2}\/\d$/.test(cleaned);
}

/** Accepts YYYY-MM-DD or YYYY/MM/DD */
export function isValidDateOfBirth(raw: string): boolean {
  return /^\d{4}[-/]\d{2}[-/]\d{2}$/.test(raw.trim());
}

export function normalizeDateOfBirth(raw: string): string {
  return raw.trim().replace(/\//g, '-');
}

export function friendlyAuthError(err: unknown): string {
  if (!(err instanceof Error)) return 'Something went wrong. Please try again.';
  const msg = err.message || '';
  const lower = msg.toLowerCase();
  if (lower.includes('already') || lower.includes('exists') || lower.includes('409')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('timeout')) {
    return 'Network error. Check your connection and try again.';
  }
  if (
    lower.includes('invalid credentials') ||
    lower.includes('incorrect password') ||
    lower.includes('wrong password')
  ) {
    return 'Incorrect email or password. Please try again.';
  }
  if (lower.includes('401') || lower.includes('unauthorized')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (lower.includes('password') && (lower.includes('weak') || lower.includes('short'))) {
    return 'Password must be at least 8 characters long.';
  }
  if (lower.includes('email') && (lower.includes('invalid') || lower.includes('format'))) {
    return 'Please enter a valid email address.';
  }
  if (lower.includes('phone') && (lower.includes('invalid') || lower.includes('format'))) {
    return 'Please enter a valid Zambian mobile number.';
  }
  if (lower.includes('400') || lower.includes('validation')) {
    // Prefer the server message when it is already specific enough.
    if (msg.length > 0 && msg.length <= 160 && !/^invalid input\.?$/i.test(msg)) {
      return msg;
    }
    return 'Please check the highlighted fields and try again.';
  }
  if (msg.length > 160) return 'Something went wrong. Please try again.';
  return msg || 'Something went wrong. Please try again.';
}
