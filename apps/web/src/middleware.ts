import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isClerkConfigured } from './lib/clerk-config';

const clerk = isClerkConfigured()
  ? clerkMiddleware({
      // Public routes that don't require authentication
      publicRoutes: [
        '/',
        '/landing',
        '/features',
        '/pricing',
        '/sign-in',
        '/sign-up',
        '/api/v1/health',
      ],
    })
  : null;

export default clerk ?? ((_req: Request) => NextResponse.next());

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};