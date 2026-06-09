import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/Toast';

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasClerk = !!clerkKey && clerkKey.startsWith('pk_');

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <ToastProvider>{children}</ToastProvider>
    </ClerkProvider>
  );
}
