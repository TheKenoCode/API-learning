/**
 * Next.js middleware for authentication via Clerk
 * 
 * This middleware runs before every request and handles:
 * - Authentication state management
 * - Protected route enforcement
 * - Public route accessibility
 */
import { clerkMiddleware } from "@clerk/nextjs/server";

// Apply Clerk authentication middleware globally
export default clerkMiddleware();

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
