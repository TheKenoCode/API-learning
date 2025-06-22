import { z } from "zod";

// ==================== SITE-LEVEL PERMISSIONS ====================

export const SitePermissionSchema = z.enum([
  // User Management
  "users:create",
  "users:read", 
  "users:update",
  "users:delete",
  "users:ban",
  "users:promote",
  
  // Club Management
  "clubs:create",
  "clubs:read_all",
  "clubs:update_any",
  "clubs:delete_any",
  "clubs:moderate_any",
  
  // System Administration
  "system:analytics",
  "system:settings",
  "system:logs",
  "system:maintenance",
  
  // Content Moderation
  "content:moderate_all",
  "content:delete_any",
  "content:report_review",
  
  // Financial
  "billing:read",
  "billing:update",
  "billing:refund",
]);

// ==================== CLUB-LEVEL PERMISSIONS ====================

export const ClubPermissionSchema = z.enum([
  // Club Settings
  "club:read",
  "club:update",
  "club:delete",
  "club:manage_settings",
  
  // Member Management
  "members:invite",
  "members:remove", 
  "members:promote",
  "members:ban",
  "members:view_list",
  
  // Content Management
  "posts:create",
  "posts:update_own",
  "posts:update_any",
  "posts:delete_own", 
  "posts:delete_any",
  "posts:moderate",
  
  // Events
  "events:create",
  "events:update_own",
  "events:update_any",
  "events:delete_own",
  "events:delete_any",
  "events:manage_attendance",
  
  // Challenges
  "challenges:create",
  "challenges:update_own",
  "challenges:update_any", 
  "challenges:delete_own",
  "challenges:delete_any",
  "challenges:validate_submissions",
  
  // Analytics
  "analytics:view",
  "analytics:export",
]);

// ==================== ROLE DEFINITIONS ====================

export const SiteRolePermissionsMap: Record<"SUPER_ADMIN" | "ADMIN" | "USER", SitePermission[]> = {
  SUPER_ADMIN: [
    // All site permissions
    "users:create", "users:read", "users:update", "users:delete", "users:ban", "users:promote",
    "clubs:create", "clubs:read_all", "clubs:update_any", "clubs:delete_any", "clubs:moderate_any", 
    "system:analytics", "system:settings", "system:logs", "system:maintenance",
    "content:moderate_all", "content:delete_any", "content:report_review",
    "billing:read", "billing:update", "billing:refund",
  ],
  ADMIN: [
    // Most site permissions except critical system functions
    "users:read", "users:update", "users:ban",
    "clubs:read_all", "clubs:moderate_any",
    "content:moderate_all", "content:delete_any", "content:report_review",
    "billing:read",
  ],
  USER: [
    // Basic user permissions
    "clubs:create",
  ],
};

export const ClubRolePermissionsMap: Record<"ADMIN" | "MODERATOR" | "MEMBER", ClubPermission[]> = {
  ADMIN: [
    // All club permissions
    "club:read", "club:update", "club:delete", "club:manage_settings",
    "members:invite", "members:remove", "members:promote", "members:ban", "members:view_list",
    "posts:create", "posts:update_own", "posts:update_any", "posts:delete_own", "posts:delete_any", "posts:moderate",
    "events:create", "events:update_own", "events:update_any", "events:delete_own", "events:delete_any", "events:manage_attendance",
    "challenges:create", "challenges:update_own", "challenges:update_any", "challenges:delete_own", "challenges:delete_any", "challenges:validate_submissions",
    "analytics:view", "analytics:export",
  ],
  MODERATOR: [
    // Moderation and content management
    "club:read",
    "members:view_list",
    "posts:create", "posts:update_own", "posts:delete_own", "posts:moderate",
    "events:create", "events:update_own", "events:delete_own",
    "challenges:create", "challenges:update_own", "challenges:delete_own",
    "analytics:view",
  ],
  MEMBER: [
    // Basic member permissions
    "club:read",
    "posts:create", "posts:update_own", "posts:delete_own",
    "events:create", "events:update_own", "events:delete_own",
    "challenges:create", "challenges:update_own", "challenges:delete_own",
  ],
};

// ==================== TYPES ====================

export type SitePermission = z.infer<typeof SitePermissionSchema>;
export type ClubPermission = z.infer<typeof ClubPermissionSchema>;

export type UserWithPermissions = {
  id: string;
  siteRole: "SUPER_ADMIN" | "ADMIN" | "USER";
  clubMemberships: Array<{
    clubId: string;
    role: "ADMIN" | "MODERATOR" | "MEMBER";
  }>;
};

// ==================== PERMISSION CHECKER FUNCTIONS ====================

export function hasSitePermission(
  user: UserWithPermissions,
  permission: SitePermission
): boolean {
  const userPermissions = SiteRolePermissionsMap[user.siteRole] || [];
  return userPermissions.includes(permission);
}

export function hasClubPermission(
  user: UserWithPermissions,
  clubId: string,
  permission: ClubPermission
): boolean {
  // Site admins have all club permissions
  if (user.siteRole === "SUPER_ADMIN" || user.siteRole === "ADMIN") {
    return true;
  }
  
  // Check club-specific permissions
  const membership = user.clubMemberships.find(m => m.clubId === clubId);
  if (!membership) return false;
  
  const rolePermissions = ClubRolePermissionsMap[membership.role] || [];
  return rolePermissions.includes(permission);
}

export function canAccessClub(
  user: UserWithPermissions,
  club: { id: string; isPrivate: boolean }
): boolean {
  // Site admins can access all clubs
  if (user.siteRole === "SUPER_ADMIN" || user.siteRole === "ADMIN") {
    return true;
  }
  
  // Public clubs are accessible to all
  if (!club.isPrivate) {
    return true;
  }
  
  // Private clubs require membership
  return user.clubMemberships.some(m => m.clubId === club.id);
}

// ==================== VALIDATION SCHEMAS ====================

export const PermissionCheckSchema = z.object({
  userId: z.string(),
  permission: z.union([SitePermissionSchema, ClubPermissionSchema]),
  resourceId: z.string().optional(), // clubId for club permissions
});

export const ResourceAccessSchema = z.object({
  userId: z.string(),
  resourceType: z.enum(["club", "post", "event", "challenge", "user"]),
  resourceId: z.string(),
  action: z.enum(["read", "create", "update", "delete", "moderate"]),
}); 