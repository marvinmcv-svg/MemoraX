import type { Metadata } from 'next';
import './globals.css';

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  );
}
