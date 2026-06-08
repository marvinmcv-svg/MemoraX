import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isClerkConfigured } from './lib/clerk-config';

const PUBLIC_PATHS = ['/', '/landing', '/features', '/pricing', '/sign-in', '/sign-up'];

const clerk = isClerkConfigured()
  ? clerkMiddleware((auth, request) => {
      const path = request.nextUrl.pathname;
      if (PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'))) {
        return NextResponse.next();
      }
      // For all other routes, enforce auth — redirects to sign-in if unauthenticated
      auth().protect();
    })
  : null;

export default clerk ?? ((_req: Request) => NextResponse.next());

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};