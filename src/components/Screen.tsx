import type { ReactNode } from 'react';
import { AppShell } from '@/components/AppShell';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
}

/** App screen wrapper — uses shared Create Account visual shell. */
export function Screen({ children, scroll, padded = true }: Props) {
  return (
    <AppShell scroll={!!scroll} padded={padded} edges={['top', 'left', 'right', 'bottom']}>
      {children}
    </AppShell>
  );
}
