'use client';

import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import { isClerkConfigured } from '@/lib/clerk-config';
import { Button } from '@/components/ui/Button';
import { Brain } from 'lucide-react';

export default function SignInPage() {
  if (!isClerkConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Dev mode</h1>
          <p className="text-text-secondary mb-6">
            Clerk is not configured. Continue as <span className="text-text-primary font-mono">demo-user</span>.
          </p>
          <Link href="/dashboard">
            <Button fullWidth>Continue to dashboard</Button>
          </Link>
          <p className="text-text-muted text-xs mt-6">
            Add <code className="font-mono">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> to{' '}
            <code className="font-mono">apps/web/.env.local</code> for real auth.
          </p>
        </div>
      </div>
    );
  }

  const { SignIn } = require('@clerk/nextjs');
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">M</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
          <p className="text-text-secondary mt-2">Sign in to your MemoraX account</p>
        </div>

        <div className="p-8 rounded-2xl border border-border bg-surface">
          <SignIn routing="path" path="/sign-in" />
        </div>
      </div>
    </div>
  );
}
