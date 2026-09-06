/** Shared validation for customer & provider registration. */

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Accepts +260 97 XXX XXXX, 097..., 260..., etc. */
export function normalizeZambianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('260') && digits.length >= 12) return `+${digits.slice(0, 12)}`;
  if (digits.startsWith('0') && digits.length >= 10) return `+260${digits.slice(1, 10)}`;
  if (digits.length === 9) return `+260${digits}`;
  if (raw.trim().startsWith('+') && digits.length >= 11) return `+${digits}`;
  return raw.trim();
}

export function isValidZambianPhone(raw: string): boolean {
  const normalized = normalizeZambianPhone(raw);
  return /^\+260[79]\d{8}$/.test(normalized);
}

export type PasswordChecks = {
  minLength: boolean;
  uppercase: boolean;
  number: boolean;
  special: boolean;
};

export function getPasswordChecks(password: string): PasswordChecks {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function isStrongPassword(password: string): boolean {
  const c = getPasswordChecks(password);
  return c.minLength && c.uppercase && c.number && c.special;
}

export function passwordStrengthLabel(password: string): 'Weak' | 'Fair' | 'Good' | 'Strong' {
  const c = getPasswordChecks(password);
  const score = [c.minLength, c.uppercase, c.number, c.special].filter(Boolean).length;
  if (score <= 1) return 'Weak';
  if (score === 2) return 'Fair';
  if (score === 3) return 'Good';
  return 'Strong';
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
  if (lower.includes('401') || lower.includes('unauthorized')) {
    return 'Could not authenticate. Please check your details.';
  }
  if (lower.includes('400') || lower.includes('validation')) {
    return 'Some information looks invalid. Please review and try again.';
  }
  // Strip raw HTTP noise
  if (msg.length > 160) return 'Registration failed. Please try again.';
  return msg || 'Registration failed. Please try again.';
}
