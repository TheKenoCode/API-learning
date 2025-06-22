import { TRPCError } from "@trpc/server";
import type { createTRPCContext } from "../api/trpc";
import { 
  hasSitePermission, 
  hasClubPermission, 
  canAccessClub,
  type SitePermission,
  type ClubPermission,
  type UserWithPermissions 
} from "@redline/shared/src/permissions";

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// ==================== USER PERMISSION LOADER ====================

export async function getUserWithPermissions(
  ctx: Context,
  userId: string
): Promise<UserWithPermissions> {
  // TODO: Fix TypeScript types after Prisma client fully updates
  const user = await ctx.db.user.findUnique({
    where: { id: userId },
    include: {
      clubMemberships: true,
    },
  }) as any;

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  return {
    id: user.id,
    siteRole: user.siteRole || "USER",
    clubMemberships: user.clubMemberships || [],
  };
}

// ==================== PERMISSION MIDDLEWARE ====================

export function requireSitePermission(permission: SitePermission) {
  return async (ctx: Context) => {
    if (!ctx.userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    const user = await getUserWithPermissions(ctx, ctx.userId);
    
    if (!hasSitePermission(user, permission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Missing permission: ${permission}`,
      });
    }

    return { user };
  };
}

export function requireClubPermission(
  clubIdProvider: (input: any) => string,
  permission: ClubPermission
) {
  return async (ctx: Context, input: any) => {
    if (!ctx.userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED", 
        message: "Authentication required",
      });
    }

    const clubId = clubIdProvider(input);
    const user = await getUserWithPermissions(ctx, ctx.userId);
    
    if (!hasClubPermission(user, clubId, permission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Missing club permission: ${permission}`,
      });
    }

    return { user, clubId };
  };
}

// ==================== RESOURCE OWNERSHIP CHECKS ====================

export async function requireResourceOwnership(
  ctx: Context,
  resourceType: "post" | "event" | "challenge",
  resourceId: string,
  allowClubAdmin = true
) {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required", 
    });
  }

  const user = await getUserWithPermissions(ctx, ctx.userId);

  // Site admins can modify anything
  if (user.siteRole === "SUPER_ADMIN" || user.siteRole === "ADMIN") {
    return { user };
  }

  let resource: any;

  // Get the resource and associated club
  switch (resourceType) {
    case "post":
      resource = await ctx.db.clubPost.findUnique({
        where: { id: resourceId },
        select: { authorId: true, clubId: true },
      });
      break;
    case "event":
      resource = await ctx.db.clubEvent.findUnique({
        where: { id: resourceId },
        select: { organizerId: true, clubId: true },
      });
      break;
    case "challenge":
      resource = await ctx.db.challenge.findUnique({
        where: { id: resourceId },
        select: { creatorId: true, clubId: true },
      });
      break;
  }

  if (!resource) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `${resourceType} not found`,
    });
  }

  const clubId = resource.clubId;
  const ownerId = resource.authorId || resource.creatorId || resource.organizerId;

  // Check if user owns the resource
  if (ownerId === ctx.userId) {
    return { user, resource, clubId };
  }

  // Check if user has club admin permissions (if allowed)
  if (allowClubAdmin && hasClubPermission(user, clubId, "club:update")) {
    return { user, resource, clubId };
  }

  throw new TRPCError({
    code: "FORBIDDEN", 
    message: "You can only modify your own content",
  });
}

// ==================== CLUB ACCESS VALIDATION ====================

export async function validateClubAccess(
  ctx: Context,
  clubId: string,
  requireMembership = false
) {
  const club = await ctx.db.club.findUnique({
    where: { id: clubId },
    select: { id: true, isPrivate: true },
  });

  if (!club) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Club not found",
    });
  }

  if (!ctx.userId) {
    // Anonymous users can only access public clubs
    if (club.isPrivate) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required for private clubs",
      });
    }
    return { club, user: null };
  }

  const user = await getUserWithPermissions(ctx, ctx.userId);

  // Check access permissions
  if (!canAccessClub(user, club)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't have access to this club",
    });
  }

  // If membership is required, verify the user is actually a member
  if (requireMembership && user.siteRole === "USER") {
    const membership = user.clubMemberships.find(m => m.clubId === clubId);
    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Club membership required",
      });
    }
  }

  return { club, user };
}

// ==================== UTILITY FUNCTIONS ====================

export function isClubMember(user: UserWithPermissions, clubId: string): boolean {
  return user.clubMemberships.some(m => m.clubId === clubId) || 
         user.siteRole === "SUPER_ADMIN" || 
         user.siteRole === "ADMIN";
}

export function getClubRole(
  user: UserWithPermissions, 
  clubId: string
): "ADMIN" | "MODERATOR" | "MEMBER" | null {
  // Site admins get ADMIN privileges in all clubs
  if (user.siteRole === "SUPER_ADMIN" || user.siteRole === "ADMIN") {
    return "ADMIN";
  }

  const membership = user.clubMemberships.find(m => m.clubId === clubId);
  return membership?.role || null;
}

export function canModerateClub(user: UserWithPermissions, clubId: string): boolean {
  return hasClubPermission(user, clubId, "posts:moderate");
}

export function canAdministerClub(user: UserWithPermissions, clubId: string): boolean {
  return hasClubPermission(user, clubId, "club:manage_settings");
} 