import { api, clearTokens, saveTokens } from '@/services/apiClient';
import { mapApiUser, type ApiUser } from '@/services/apiMappers';
import { deleteSecure, getJson, getSecure, setJson, setSecure, StorageKeys } from '@/services/storage';
import type { Session, User, UserRole } from '@/types';
import { isValidZambianPhone, normalizeZambianPhone } from '@/utils/registrationValidation';

export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

interface AuthResponse {
  message?: string;
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
}

async function cacheUser(user: User): Promise<void> {
  await setSecure(StorageKeys.cachedUser, JSON.stringify(user));
  const session: Session = { userId: user.id, createdAt: new Date().toISOString() };
  await setSecure(StorageKeys.session, JSON.stringify(session));
}

export async function getSession(): Promise<Session | null> {
  const raw = await getSecure(StorageKeys.session);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export async function getCachedUser(): Promise<User | null> {
  const raw = await getSecure(StorageKeys.cachedUser);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const token = await getSecure(StorageKeys.accessToken);
  if (!token) return getCachedUser();

  try {
    const data = await api.get<{ user?: ApiUser } | ApiUser>('/auth/me');
    const apiUser = 'user' in (data as object) && (data as { user?: ApiUser }).user
      ? (data as { user: ApiUser }).user
      : (data as ApiUser);
    if (!apiUser?.id) return getCachedUser();
    const cached = await getCachedUser();
    const user = mapApiUser(apiUser);
    if (cached?.id === user.id && cached.providerKind) {
      user.providerKind = cached.providerKind;
    }
    await cacheUser(user);
    return user;
  } catch {
    return getCachedUser();
  }
}

export async function getUserProfile(userId: string): Promise<User | undefined> {
  const current = await getCurrentUser();
  if (current?.id === userId) return current;
  return undefined;
}

export async function login(emailOrPhone: string, password: string): Promise<User> {
  const email = emailOrPhone.trim().toLowerCase();
  const data = await api.post<AuthResponse>(
    '/auth/login',
    { email, password },
    false,
  );
  await saveTokens(data.accessToken, data.refreshToken);
  const cached = await getCachedUser();
  const user = mapApiUser(data.user);
  if (cached?.id === user.id && cached.providerKind) {
    user.providerKind = cached.providerKind;
  } else if (user.role === 'provider') {
    // Fall back to local provider application subtype when available.
    try {
      const { getProviderApplicationForUser } = await import(
        '@/services/providerApplicationService'
      );
      const app = await getProviderApplicationForUser(user.id);
      if (app?.providerType === 'business') user.providerKind = 'business';
      else if (app?.providerType === 'individual') user.providerKind = 'individual';
    } catch {
      // ignore
    }
  }
  await cacheUser(user);
  return user;
}

export async function register(input: RegisterInput): Promise<{ user: User; verifyCode?: string }> {
  const data = await api.post<AuthResponse>(
    '/auth/register',
    {
      name: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: isValidZambianPhone(input.phone)
        ? normalizeZambianPhone(input.phone)
        : input.phone.trim(),
      password: input.password,
      role: input.role,
    },
    false,
  );

  if (!data?.accessToken || !data?.user?.id) {
    throw new Error('Registration did not complete. Please try again.');
  }

  await saveTokens(data.accessToken, data.refreshToken);
  const user = mapApiUser(data.user);

  if (input.role === 'provider') {
    // Do not block account creation if provider-profile setup is slow or down.
    void api
      .post('/providers', {
        business_name: input.fullName.trim(),
        description: 'New ServiceHub provider',
        category: 'General',
      })
      .catch(() => undefined);
  }

  await cacheUser(user);
  // Live API has no OTP step — return user ready to use.
  return { user };
}

/** Live backend does not require email OTP; keep UI path working. */
export async function verifyAccount(email: string, code: string): Promise<User> {
  await api.post<{ message?: string }>('/auth/verify-email', { code }, false);
  const user = await getCurrentUser();
  if (!user) throw new Error('Email verified. Please sign in to continue.');
  return user;
}

/**
 * Ask the backend for a fresh verification code. The live API emails a
 * 6-digit code; in development it also echoes it so the demo can prefill.
 */
export async function requestVerificationCode(): Promise<{ code?: string; message?: string }> {
  const data = await api.post<{ code?: string; message?: string }>('/auth/resend-verification', {});
  return data ?? {};
}

export async function requestPasswordReset(email: string): Promise<string> {
  const data = await api.post<{ resetToken?: string; message?: string }>(
    '/auth/forgot-password',
    { email },
    false,
  );
  // Development builds echo the reset token so the demo does not depend on SMTP.
  return data?.resetToken ?? '';
}

export async function resetPassword(email: string, code: string, newPassword: string): Promise<void> {
  await api.post('/auth/reset-password', { token: code, newPassword }, false);
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout', {});
  } catch {
    // ignore network errors on logout
  }
  await clearTokens();
}

export async function updateUser(_userId: string, patch: Partial<User>): Promise<User> {
  const cached = await getCachedUser();
  // Local-only fields (e.g. providerKind) can be applied without a remote profile call.
  if (
    patch.providerKind &&
    !patch.fullName &&
    !patch.phone &&
    !patch.avatarUri &&
    cached?.id === _userId
  ) {
    const user = { ...cached, ...patch };
    await cacheUser(user);
    return user;
  }

  const data = await api.put<{ user?: ApiUser } | ApiUser>('/auth/update-profile', {
    name: patch.fullName,
    phone:
      patch.phone && isValidZambianPhone(patch.phone)
        ? normalizeZambianPhone(patch.phone)
        : patch.phone,
    profile_image: patch.avatarUri,
  });
  const apiUser =
    data && typeof data === 'object' && 'user' in data && (data as { user?: ApiUser }).user
      ? (data as { user: ApiUser }).user
      : (data as ApiUser);
  const mapped = apiUser?.id ? mapApiUser(apiUser) : { ...(cached ?? ({} as User)), ...patch };
  const user: User = {
    ...mapped,
    providerKind: patch.providerKind ?? cached?.providerKind ?? mapped.providerKind,
  };
  await cacheUser(user);
  return user;
}

export async function getOnboardingComplete(): Promise<boolean> {
  return (await getJson<boolean>(StorageKeys.onboarded)) === true;
}

export async function setOnboardingComplete(): Promise<void> {
  await setJson(StorageKeys.onboarded, true);
}

export async function clearLocalSession(): Promise<void> {
  await deleteSecure(StorageKeys.session);
  await clearTokens();
}
