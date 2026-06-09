import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/', '/landing', '/features', '/pricing', '/sign-in', '/sign-up'];

const clerk = clerkMiddleware((auth, request) => {
  const path = request.nextUrl.pathname;
  if (PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'))) {
    return NextResponse.next();
  }
  // For all other routes, enforce auth — redirects to sign-in if unauthenticated
  auth().protect();
});

export default clerk;

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};