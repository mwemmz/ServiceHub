import { api, clearTokens, saveTokens } from '@/services/apiClient';
import { mapApiUser, type ApiUser } from '@/services/apiMappers';
import { deleteSecure, getJson, getSecure, setJson, setSecure, StorageKeys } from '@/services/storage';
import type { Session, User, UserRole } from '@/types';

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
    const user = mapApiUser(apiUser);
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
  const user = mapApiUser(data.user);
  await cacheUser(user);
  return user;
}

export async function register(input: RegisterInput): Promise<{ user: User; verifyCode?: string }> {
  const data = await api.post<AuthResponse>(
    '/auth/register',
    {
      name: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      password: input.password,
      role: input.role,
    },
    false,
  );

  await saveTokens(data.accessToken, data.refreshToken);
  const user = mapApiUser(data.user);

  if (input.role === 'provider') {
    try {
      await api.post('/providers', {
        business_name: input.fullName.trim(),
        description: 'New ServiceHub provider',
        category: 'General',
      });
    } catch {
      // Provider profile can be completed later in setup.
    }
  }

  await cacheUser(user);
  // Live API has no OTP step — return user ready to use.
  return { user };
}

/** Live backend does not require email OTP; keep UI path working. */
export async function verifyAccount(email: string, _code: string): Promise<User> {
  const cached = await getCachedUser();
  if (cached && cached.email.toLowerCase() === email.trim().toLowerCase()) {
    return cached;
  }
  const user = await getCurrentUser();
  if (!user) throw new Error('Please sign in again after registering.');
  return user;
}

export async function requestPasswordReset(_email: string): Promise<string> {
  throw new Error(
    'Password reset is not available on the live API yet. Ask the backend owner to enable it, or contact support.',
  );
}

export async function resetPassword(_email: string, _code: string, _newPassword: string): Promise<void> {
  throw new Error('Password reset is not available on the live API yet.');
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
  const data = await api.put<{ user?: ApiUser } | ApiUser>('/auth/update-profile', {
    name: patch.fullName,
    phone: patch.phone,
    profile_image: patch.avatarUri,
  });
  const apiUser =
    data && typeof data === 'object' && 'user' in data && (data as { user?: ApiUser }).user
      ? (data as { user: ApiUser }).user
      : (data as ApiUser);
  const user = apiUser?.id ? mapApiUser(apiUser) : { ...(await getCachedUser())!, ...patch };
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
