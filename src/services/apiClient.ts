import { AppConfig } from '@/constants/config';
import { deleteSecure, getSecure, setSecure, StorageKeys } from '@/services/storage';

export class ApiError extends Error {
  status: number;
  fieldErrors?: { field: string; message: string }[];

  constructor(message: string, status: number, fieldErrors?: { field: string; message: string }[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Render free-tier cold starts can be slow; never leave the UI spinning forever. */
const REQUEST_TIMEOUT_MS = 45000;

let refreshPromise: Promise<string | null> | null = null;

export async function getAccessToken(): Promise<string | null> {
  return getSecure(StorageKeys.accessToken);
}

export async function getRefreshToken(): Promise<string | null> {
  return getSecure(StorageKeys.refreshToken);
}

export async function saveTokens(accessToken: string, refreshToken?: string): Promise<void> {
  await setSecure(StorageKeys.accessToken, accessToken);
  if (refreshToken) await setSecure(StorageKeys.refreshToken, refreshToken);
}

export async function clearTokens(): Promise<void> {
  await deleteSecure(StorageKeys.accessToken);
  await deleteSecure(StorageKeys.refreshToken);
  await deleteSecure(StorageKeys.cachedUser);
  await deleteSecure(StorageKeys.session);
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return null;
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        let res: Response;
        try {
          res = await fetch(`${AppConfig.apiBaseUrl}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ refreshToken }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timer);
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          await clearTokens();
          return null;
        }
        const accessToken = data.accessToken as string | undefined;
        if (!accessToken) {
          await clearTokens();
          return null;
        }
        await saveTokens(accessToken, data.refreshToken ?? refreshToken);
        return accessToken;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

function buildUrl(path: string, query?: Record<string, string | number | boolean | undefined | null>) {
  const clean = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${AppConfig.apiBaseUrl}${clean}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function parseError(res: Response): Promise<ApiError> {
  let message = `Request failed (${res.status})`;
  let fieldErrors: { field: string; message: string }[] | undefined;
  try {
    const data = await res.json();
    if (typeof data?.message === 'string') message = data.message;
    if (Array.isArray(data?.errors)) fieldErrors = data.errors;
  } catch {
    // ignore
  }
  return new ApiError(message, res.status, fieldErrors);
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined | null>;
    auth?: boolean;
    retry?: boolean;
  } = {},
): Promise<T> {
  const { method = 'GET', body, query, auth = true, retry = true } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (auth) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    const aborted =
      (err instanceof Error && err.name === 'AbortError') ||
      (typeof err === 'object' && err !== null && 'name' in err && (err as { name: string }).name === 'AbortError');
    throw new ApiError(
      aborted
        ? 'The server is taking too long to respond. Please try again.'
        : 'Network error. Check your connection and try again.',
      aborted ? 408 : 0,
    );
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401 && auth && retry) {
    const next = await refreshAccessToken();
    if (next) {
      return apiRequest<T>(path, { ...options, retry: false });
    }
    await clearTokens();
    throw new ApiError('Session expired. Please sign in again.', 401);
  }

  if (!res.ok) throw await parseError(res);

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError('The server returned an unexpected response. Please try again.', res.status);
  }
}

export const api = {
  get: <T>(path: string, query?: Record<string, string | number | boolean | undefined | null>, auth = true) =>
    apiRequest<T>(path, { method: 'GET', query, auth }),
  post: <T>(path: string, body?: unknown, auth = true) => apiRequest<T>(path, { method: 'POST', body, auth }),
  put: <T>(path: string, body?: unknown, auth = true) => apiRequest<T>(path, { method: 'PUT', body, auth }),
  del: <T>(path: string, auth = true) => apiRequest<T>(path, { method: 'DELETE', auth }),
};
