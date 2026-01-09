'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { Web3Provider } from './Web3Provider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Web3Provider>
      <AuthProvider>{children}</AuthProvider>
    </Web3Provider>
  );
}
