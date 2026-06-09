'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Brain } from 'lucide-react';
import { useState } from 'react';

export default function SignUpPage() {
  const handleDevSignUp = () => {
    localStorage.setItem('dev_session', 'true');
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Create your account</h1>
          <p className="text-text-secondary mt-2">Start your free trial today</p>
        </div>

        <div className="p-8 rounded-2xl border border-border bg-surface">
          <div className="text-center">
            <p className="text-text-muted text-sm mb-4">Auth is temporarily disabled — running in dev mode</p>
            <Button fullWidth onClick={handleDevSignUp}>
              Create dev account
            </Button>
          </div>
        </div>

        <p className="text-center text-text-muted text-sm mt-6">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
