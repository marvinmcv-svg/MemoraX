import type { Metadata } from 'next';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'MemoraX - AI Memory OS',
  description: 'Your AI-powered memory assistant that never forgets. Capture anything, recall everything.',
  keywords: ['memory', 'AI', 'assistant', 'reminders', 'notes', 'tasks'],
  authors: [{ name: 'MemoraX' }],
  openGraph: {
    title: 'MemoraX - AI Memory OS',
    description: 'Your AI-powered memory assistant that never forgets.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}