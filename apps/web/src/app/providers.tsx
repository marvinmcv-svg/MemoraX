import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/Toast';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ClerkProvider>
  );
}
