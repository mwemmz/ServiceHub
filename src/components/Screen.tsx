import type { ReactNode } from 'react';
import { AppShell } from '@/components/AppShell';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  keyboard?: boolean;
}

/** App screen wrapper — uses shared Create Account visual shell. */
export function Screen({ children, scroll = true, padded = true, keyboard }: Props) {
  return (
    <AppShell
      scroll={scroll}
      padded={padded}
      keyboard={keyboard}
      edges={['top', 'left', 'right', 'bottom']}>
      {children}
    </AppShell>
  );
}
