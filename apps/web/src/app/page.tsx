import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';

export default async function HomePage() {
  if (!isClerkConfigured()) {
    redirect('/dashboard');
  }

  const { auth } = await import('@clerk/nextjs/server');
  const { userId } = await auth();

  if (userId) {
    redirect('/dashboard');
  }

  redirect('/landing');
}
