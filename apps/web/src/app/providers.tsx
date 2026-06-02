import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/Toast';

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasClerk = !!clerkKey && clerkKey.startsWith('pk_');

export function Providers({ children }: { children: ReactNode }) {
  const tree = <ToastProvider>{children}</ToastProvider>;

  if (!hasClerk) {
    if (typeof window !== 'undefined') {
      console.warn(
        '[MemoraX] No Clerk publishable key set. Running in dev mode with a single "demo-user" identity. Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to apps/web/.env.local for full auth.',
      );
    }
    return tree;
  }

  return <ClerkProvider>{tree}</ClerkProvider>;
}
