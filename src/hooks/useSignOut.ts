import { useCallback, useState } from 'react';
import { useRouter, type Href } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { confirmDialog } from '@/utils/confirmDialog';

export function useSignOut(redirectTo: Href = '/(auth)/welcome') {
  const router = useRouter();
  const { logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = useCallback(async () => {
    const confirmed = await confirmDialog({
      title: 'Log out?',
      message: 'You can sign back in at any time.',
      confirmText: 'Log out',
      destructive: true,
    });
    if (!confirmed) return;

    setSigningOut(true);
    try {
      await logout();
    } catch {
      // Tokens are cleared best-effort inside authService.logout.
    } finally {
      setSigningOut(false);
      router.replace(redirectTo);
    }
  }, [logout, redirectTo, router]);

  return { signOut, signingOut };
}
