import { authMiddleware } from '@clerk/nextjs';

const PUBLIC_PATHS = ['/', '/landing', '/features', '/pricing', '/sign-in', '/sign-up'];

export default authMiddleware({
  publicRoutes: PUBLIC_PATHS,
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};