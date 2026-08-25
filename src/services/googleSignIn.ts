import { Alert } from 'react-native';

export type GoogleSignInResult =
  | { status: 'unavailable'; message: string }
  | {
      status: 'success';
      email: string;
      fullName: string;
      avatarUri?: string;
    };

/**
 * Shared Google sign-in entry.
 * Backend OAuth is not configured yet — returns a clear unavailable result
 * so registration can continue with manual fields (never fakes success).
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  const message =
    'Google sign-in will be available when a Google OAuth client and backend endpoint are connected. Continue with email and password for now.';

  Alert.alert('Google Sign-In', message);

  return { status: 'unavailable', message };
}
