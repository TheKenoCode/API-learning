/**
 * tRPC Server Configuration
 * 
 * This file sets up the tRPC context and procedures used throughout the application.
 * It handles authentication, database user resolution, and error formatting.
 */
import { TRPCError, initTRPC } from "@trpc/server";
import { type NextRequest } from "next/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

/**
 * Create tRPC context for each request
 * 
 * This context is available to all tRPC procedures and includes:
 * - Clerk authentication state
 * - Database user record (created if needed)
 * - Request object
 */
export const createTRPCContext = async (opts: { req: NextRequest }) => {
  const { userId: clerkId } = await auth();

  // Resolve database user ID from Clerk ID upfront
  let dbUserId = null;
  if (clerkId) {
    let user = await db.user.findUnique({
      where: { clerkId },
    });

    // If user doesn't exist in database but exists in Clerk, create them
    if (!user) {
      try {
        // Fetch user details from Clerk
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(clerkId);
        
        const primaryEmailAddress = clerkUser.emailAddresses.find(
          (email: { id: string; emailAddress: string }) => email.id === clerkUser.primaryEmailAddressId
        );

        if (!primaryEmailAddress) {
          throw new Error("No primary email found for Clerk user");
        }

        const fullName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null;

        // Create user in database
        user = await db.user.create({
          data: {
            clerkId,
            email: primaryEmailAddress.emailAddress,
            name: fullName,
            imageUrl: clerkUser.imageUrl || null,
          },
        });
      } catch (error) {
        // Handle the case where user creation fails but user might already exist
        // (e.g., race condition between multiple requests or email constraint)
        user = await db.user.findUnique({
          where: { clerkId },
        });
        
        // If still not found by clerkId, try to find by email and update with clerkId
        if (!user && (error as any)?.code === 'P2002' && (error as any)?.meta?.target?.includes('email')) {
          try {
            const clerk = await clerkClient();
            const clerkUser = await clerk.users.getUser(clerkId);
            const primaryEmailAddress = clerkUser.emailAddresses.find(
              (email: { id: string; emailAddress: string }) => email.id === clerkUser.primaryEmailAddressId
            );
            
            if (primaryEmailAddress) {
              // Try to update existing user with same email to add clerkId
              user = await db.user.update({
                where: { email: primaryEmailAddress.emailAddress },
                data: { clerkId },
              });
            }
          } catch (updateError) {
            // Silent fail - user sync will be attempted on next request
          }
        }
      }
    }

    dbUserId = user?.id || null;
  }

  return {
    db,
    userId: dbUserId, // Database user ID
    clerkId, // Clerk ID for reference
    req: opts.req,
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * Initialize tRPC with our context and error formatting
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Export reusable router and procedure helpers
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 * 
 * Use for endpoints that don't require authentication
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 * 
 * Throws UNAUTHORIZED error if user is not signed in
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to access this resource",
    });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

/**
 * Enhanced authenticated procedure with user data preloading
 * 
 * Fetches complete user data including club memberships
 * Use when you need user details in the procedure
 */
export const authenticatedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to access this resource",
    });
  }

  // Fetch complete user data with memberships
  const user = await ctx.db.user.findUnique({
    where: { id: ctx.userId },
    include: {
      clubMemberships: {
        include: {
          club: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found in database",
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
      user,
    },
  });
});
