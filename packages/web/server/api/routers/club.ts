import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as crypto from "crypto";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
import {
  CreateClubSchema,
  UpdateClubSchema,
  JoinClubSchema,
  JoinByInviteSchema,
  SearchClubsSchema,
  UpdateMemberRoleSchema,
  DeleteClubSchema,
} from "@redline/shared";
import { createRateLimitMiddleware } from "@/server/security/rateLimiter";
import { requireClubPermission } from "@/server/auth/permissions";
import { SecurityValidator } from "@/server/security/validation";
import { auditLogger } from "@/server/audit/auditLogger";
import { clerkClient } from "@clerk/nextjs/server";
import { generatePresignedUploadUrl, generateFileKey, BUCKETS } from "@/lib/s3";

// Helper function to generate invite codes
const generateInviteCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

export const clubRouter = createTRPCRouter({
  // Create a new club
  create: protectedProcedure
    .input(CreateClubSchema)
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for club creation
      await createRateLimitMiddleware("CLUB_CREATE")(ctx);
      
      // Input validation
      if (!SecurityValidator.validateNoXSS(input.name)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid club name" });
      }
      if (input.description && !SecurityValidator.validateNoXSS(input.description)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid club description" });
      }
      if (input.imageUrl && !SecurityValidator.validateImageUrl(input.imageUrl)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid image URL" });
      }
      if (input.city && !SecurityValidator.validateLocation(input.city)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid city" });
      }
      if (input.territory && !SecurityValidator.validateLocation(input.territory)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid territory" });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.create({
        data: {
          ...input,
          creatorId: ctx.userId,
          inviteCode: input.isPrivate ? generateInviteCode() : null,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

      // Add creator as admin member
      await ctx.db.clubMember.create({
        data: {
          userId: ctx.userId,
          clubId: club.id,
          role: "ADMIN",
        },
      });

      // Audit logging
      await auditLogger.logUserAction("club.created", ctx.userId, {
        severity: "medium",
        category: "user_action",
        resourceType: "club",
        resourceId: club.id,
        metadata: {
          clubName: club.name,
          isPrivate: club.isPrivate,
          city: club.city,
          territory: club.territory,
        },
      });

      return club;
    }),

  // Get user's clubs
  getMyClubs: protectedProcedure
    .use(async ({ ctx, next }) => {
      // Rate limiting for read operations
      await createRateLimitMiddleware("READ_OPERATIONS")(ctx);
      return next();
    })
    .query(async ({ ctx }) => {
      const memberships = await ctx.db.clubMember.findMany({
        where: {
          userId: ctx.userId,
        },
        include: {
          club: {
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
              _count: {
                select: {
                  members: true,
                  challenges: true,
                  events: true,
                },
              },
            },
          },
        },
        orderBy: {
          joinedAt: "desc",
        },
      });

      return memberships.map((membership) => ({
        ...membership.club,
        memberRole: membership.role,
        joinedAt: membership.joinedAt,
      }));
    }),

  // Get user's club memberships (for auth debugger and other components)
  getUserMemberships: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.clubMember.findMany({
      where: { userId: ctx.userId },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            isPrivate: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return memberships;
  }),

  // Get club details by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for read operations
      await createRateLimitMiddleware("READ_OPERATIONS")(ctx);
      
      // Skip ID validation for special route words
      const specialRouteWords = ['create', 'edit', 'new', 'add', 'settings', 'admin'];
      if (!specialRouteWords.includes(input.id.toLowerCase())) {
        // Input validation only for actual IDs
        if (!SecurityValidator.validateId(input.id)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid club ID" });
        }
      }
      
      return next();
    })
    .query(async ({ ctx, input }) => {
      // Handle special route words that are not actual club IDs
      const specialRouteWords = ['create', 'edit', 'new', 'add', 'settings', 'admin'];
      if (specialRouteWords.includes(input.id.toLowerCase())) {
        // Return a special response indicating this is a route word, not a club ID
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "ROUTE_WORD", // Special error message the frontend can catch
        });
      }
      
      const club = await ctx.db.club.findUnique({
        where: { id: input.id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  clerkId: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
            orderBy: [
              { role: "asc" },
              { joinedAt: "asc" },
            ],
          },
          _count: {
            select: {
              challenges: true,
              events: true,
              posts: true,
            },
          },
        },
      });

      if (!club) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Club not found",
        });
      }

      // Check user's site role and club membership
      let userSiteRole = null;
      let userMembership = null;
      let userJoinRequest = null;
      let isSiteAdmin = false;

      if (ctx.userId) {
        // Get user's site role
        const user = await ctx.db.user.findUnique({
          where: { id: ctx.userId },
          select: { siteRole: true },
        });
        
        userSiteRole = user?.siteRole || "USER";
        isSiteAdmin = userSiteRole === "SUPER_ADMIN" || userSiteRole === "ADMIN";

        // Get club membership (always check, even for site admins)
        userMembership = await ctx.db.clubMember.findUnique({
          where: {
            userId_clubId: {
              userId: ctx.userId,
              clubId: club.id,
            },
          },
        });

        // Get user's join request status if not a member (only PENDING requests)
        if (!userMembership) {
          userJoinRequest = await ctx.db.clubJoinRequest.findFirst({
            where: {
              userId: ctx.userId,
              clubId: club.id,
              status: "PENDING",
            },
            select: {
              id: true,
              status: true,
              createdAt: true,
            },
          });
        }
      }

      // Note: We allow everyone to view club pages (both public and private)
      // Access to content and functionality is controlled by membership status in the UI

      return {
        ...club,
        userMembership,
        userJoinRequest,
        userSiteRole,
        isSiteAdmin,
        // Computed properties for UI logic
        isUserMember: !!userMembership || isSiteAdmin,
        canModerate: isSiteAdmin || userMembership?.role === "ADMIN" || userMembership?.role === "MODERATOR",
        canAdminister: isSiteAdmin || userMembership?.role === "ADMIN",
        canLeave: userMembership && !isSiteAdmin && club.creatorId !== ctx.userId,
        showSiteAdminControls: isSiteAdmin && !userMembership,
      };
    }),

  // Get club members with enriched Clerk profile data
  getClubMembers: publicProcedure
    .input(z.object({ clubId: z.string() }))
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for read operations
      await createRateLimitMiddleware("READ_OPERATIONS")(ctx);
      
      // Input validation
      if (!SecurityValidator.validateId(input.clubId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid club ID" });
      }
      
      return next();
    })
    .query(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { id: input.clubId },
        select: { id: true, isPrivate: true },
      });

      if (!club) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Club not found",
        });
      }

      // Check if user has permission to view members
      let canViewMembers = !club.isPrivate; // Public clubs allow anyone to view members
      
      if (ctx.userId) {
        // Check if user is a member or site admin
        const userMembership = await ctx.db.clubMember.findUnique({
          where: {
            userId_clubId: {
              userId: ctx.userId,
              clubId: input.clubId,
            },
          },
        });

        // Get user's site role
        const user = await ctx.db.user.findUnique({
          where: { id: ctx.userId },
          select: { siteRole: true },
        });
        
        const isSiteAdmin = user?.siteRole === "SUPER_ADMIN" || user?.siteRole === "ADMIN";
        
        canViewMembers = canViewMembers || !!userMembership || isSiteAdmin;
      }

      if (!canViewMembers) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be a member to view the member list",
        });
      }

      // Fetch members from database
      const members = await ctx.db.clubMember.findMany({
        where: { clubId: input.clubId },
        include: {
          user: {
            select: {
              id: true,
              clerkId: true,
              name: true,
              imageUrl: true,
            },
          },
        },
        orderBy: [
          { role: "asc" }, // ADMIN, MODERATOR, MEMBER
          { joinedAt: "asc" },
        ],
      });

      // Enrich with fresh Clerk data
      try {
        const clerk = await clerkClient();
        const enrichedMembers = await Promise.all(
          members.map(async (member) => {
            let freshClerkData = null;
            
            try {
              if (member.user.clerkId) {
                const clerkUser = await clerk.users.getUser(member.user.clerkId);
                freshClerkData = {
                  imageUrl: clerkUser.imageUrl,
                  firstName: clerkUser.firstName,
                  lastName: clerkUser.lastName,
                  username: clerkUser.username,
                };
              }
            } catch (clerkError) {
              // If we can't fetch from Clerk, we'll use database data
              console.warn(`Failed to fetch fresh Clerk data for user ${member.user.id}:`, clerkError);
            }

            return {
              id: member.id,
              role: member.role,
              joinedAt: member.joinedAt,
              user: {
                id: member.user.id,
                name: member.user.name,
                imageUrl: freshClerkData?.imageUrl || member.user.imageUrl,
                // Include fresh Clerk data if available
                clerkData: freshClerkData,
              },
            };
          })
        );

        return { members: enrichedMembers };
      } catch (error) {
        // If Clerk client fails entirely, return database data
        console.warn("Failed to initialize Clerk client, using database data:", error);
        
        return {
          members: members.map((member) => ({
            id: member.id,
            role: member.role,
            joinedAt: member.joinedAt,
            user: {
              id: member.user.id,
              name: member.user.name,
              imageUrl: member.user.imageUrl,
            },
          })),
        };
      }
    }),

  // Join a club
  join: protectedProcedure
    .input(JoinClubSchema)
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for club joining
      await createRateLimitMiddleware("CLUB_JOIN")(ctx);
      
      // Input validation
      if (!SecurityValidator.validateId(input.clubId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid club ID" });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { id: input.clubId },
      });

      if (!club) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Club not found",
        });
      }

      if (club.isPrivate) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot join private club without invite",
        });
      }

      // Check if already a member
      const existingMembership = await ctx.db.clubMember.findUnique({
        where: {
          userId_clubId: {
            userId: ctx.userId,
            clubId: input.clubId,
          },
        },
      });

      if (existingMembership) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already a member of this club",
        });
      }

      const membership = await ctx.db.clubMember.create({
        data: {
          userId: ctx.userId,
          clubId: input.clubId,
          role: "MEMBER",
        },
        include: {
          club: {
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      });

      // Audit logging
      await auditLogger.logUserAction("club.joined", ctx.userId, {
        severity: "low",
        category: "user_action",
        resourceType: "club",
        resourceId: input.clubId,
        metadata: {
          clubName: club.name,
          joinMethod: "public",
        },
      });

      return membership;
    }),

  // Join club by invite code
  joinByInvite: protectedProcedure
    .input(JoinByInviteSchema)
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for club joining
      await createRateLimitMiddleware("CLUB_JOIN")(ctx);
      
      // Input validation
      if (!SecurityValidator.validateInviteCode(input.inviteCode)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid invite code format" });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { inviteCode: input.inviteCode },
      });

      if (!club) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid invite code",
        });
      }

      // Check if already a member
      const existingMembership = await ctx.db.clubMember.findUnique({
        where: {
          userId_clubId: {
            userId: ctx.userId,
            clubId: club.id,
          },
        },
      });

      if (existingMembership) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already a member of this club",
        });
      }

      const membership = await ctx.db.clubMember.create({
        data: {
          userId: ctx.userId,
          clubId: club.id,
          role: "MEMBER",
        },
        include: {
          club: {
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      });

      // Audit logging
      await auditLogger.logUserAction("club.joined", ctx.userId, {
        severity: "low",
        category: "user_action",
        resourceType: "club",
        resourceId: club.id,
        metadata: {
          clubName: club.name,
          joinMethod: "invite",
          inviteCode: input.inviteCode,
        },
      });

      return membership;
    }),

  // Leave a club
  leave: protectedProcedure
    .input(z.object({ clubId: z.string() }))
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for general operations
      await createRateLimitMiddleware("GENERAL")(ctx);
      
      // Input validation
      if (!SecurityValidator.validateId(input.clubId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid club ID" });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.db.clubMember.findUnique({
        where: {
          userId_clubId: {
            userId: ctx.userId,
            clubId: input.clubId,
          },
        },
        include: {
          club: true,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Not a member of this club",
        });
      }

      // Cannot leave if you're the creator
      if (membership.club.creatorId === ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Club creator cannot leave the club",
        });
      }

      await ctx.db.clubMember.delete({
        where: {
          userId_clubId: {
            userId: ctx.userId,
            clubId: input.clubId,
          },
        },
      });

      // Also clean up any existing join requests for this user and club
      await ctx.db.clubJoinRequest.deleteMany({
        where: {
          userId: ctx.userId,
          clubId: input.clubId,
        },
      });

      // Audit logging
      await auditLogger.logUserAction("club.left", ctx.userId, {
        severity: "LOW",
        category: "CLUB_MANAGEMENT",
        resourceType: "club",
        resourceId: input.clubId,
        metadata: {
          clubName: membership.club.name,
          previousRole: membership.role,
        },
      });

      return { success: true };
    }),

  // Delete club (creator or site admin only)
  delete: protectedProcedure
    .input(DeleteClubSchema)
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for admin operations
      await createRateLimitMiddleware("ADMIN_OPERATIONS")(ctx);
      
      // Input validation
      if (!SecurityValidator.validateId(input.clubId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid club ID" });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      // Get club with creator info
      const club = await ctx.db.club.findUnique({
        where: { id: input.clubId },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              members: true,
              posts: true,
              events: true,
              challenges: true,
            },
          },
        },
      });

      if (!club) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Club not found",
        });
      }

      // Check permissions: only club creator or site admin can delete
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.userId },
        select: { siteRole: true },
      });
      
      const isSiteAdmin = user?.siteRole === "SUPER_ADMIN" || user?.siteRole === "ADMIN";
      const isCreator = club.creatorId === ctx.userId;

      if (!isCreator && !isSiteAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the club creator or site administrators can delete this club",
        });
      }

      // Audit logging before deletion
      await auditLogger.logUserAction("club.deleted", ctx.userId, {
        severity: "critical",
        category: "administration",
        resourceType: "club",
        resourceId: input.clubId,
        metadata: {
          clubName: club.name,
          clubCreatorId: club.creatorId,
          clubCreatorName: club.creator.name,
          memberCount: club._count.members,
          postsCount: club._count.posts,
          eventsCount: club._count.events,
          challengesCount: club._count.challenges,
          deletedBy: isCreator ? "creator" : "site_admin",
          confirmedWith: input.confirmation,
        },
      });

      // Delete the club - Prisma will handle cascading deletes based on schema
      await ctx.db.club.delete({
        where: { id: input.clubId },
      });

      return { 
        success: true, 
        message: `Club "${club.name}" has been permanently deleted.` 
      };
    }),

  // Update club settings (admin only)
  updateSettings: protectedProcedure
    .input(UpdateClubSchema)
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for admin operations
      await createRateLimitMiddleware("ADMIN_OPERATIONS")(ctx);
      
      // Permission checking
      await requireClubPermission((input) => input.id, "ADMIN")(ctx, input);
      
      // Input validation
      if (!SecurityValidator.validateNoXSS(input.name)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid club name" });
      }
      if (input.description && !SecurityValidator.validateNoXSS(input.description)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid club description" });
      }
      if (input.imageUrl && !SecurityValidator.validateImageUrl(input.imageUrl)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid image URL" });
      }
      if (input.city && !SecurityValidator.validateLocation(input.city)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid city" });
      }
      if (input.territory && !SecurityValidator.validateLocation(input.territory)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid territory" });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      const updatedClub = await ctx.db.club.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          imageUrl: input.imageUrl,
          isPrivate: input.isPrivate,
          city: input.city,
          territory: input.territory,
          latitude: input.latitude,
          longitude: input.longitude,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

      // Audit logging
      await auditLogger.logUserAction("club.settings.updated", ctx.userId, {
        severity: "MEDIUM",
        category: "CLUB_MANAGEMENT",
        resourceType: "club",
        resourceId: input.id,
        metadata: {
          clubName: updatedClub.name,
          changes: {
            name: input.name,
            isPrivate: input.isPrivate,
            city: input.city,
            territory: input.territory,
          },
        },
      });

      return updatedClub;
    }),

  // Generate new invite code (admin only)
  generateInviteCode: protectedProcedure
    .input(z.object({ clubId: z.string() }))
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for admin operations
      await createRateLimitMiddleware("ADMIN_OPERATIONS")(ctx);
      
      // Permission checking
      await requireClubPermission((input) => input.clubId, "ADMIN")(ctx, input);
      
      // Input validation
      if (!SecurityValidator.validateId(input.clubId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid club ID" });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      const newInviteCode = generateInviteCode();

      const updatedClub = await ctx.db.club.update({
        where: { id: input.clubId },
        data: { inviteCode: newInviteCode },
      });

      // Audit logging
      await auditLogger.logUserAction("club.invite_code.generated", ctx.userId, {
        severity: "MEDIUM",
        category: "CLUB_MANAGEMENT",
        resourceType: "club",
        resourceId: input.clubId,
        metadata: {
          newInviteCode,
        },
      });

      return { inviteCode: updatedClub.inviteCode };
    }),

  // Update member role (admin only)
  updateMemberRole: protectedProcedure
    .input(UpdateMemberRoleSchema)
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for admin operations
      await createRateLimitMiddleware("ADMIN_OPERATIONS")(ctx);
      
      // Permission checking
      await requireClubPermission((input) => input.clubId, "ADMIN")(ctx, input);
      
      // Input validation
      if (!SecurityValidator.validateId(input.clubId) || !SecurityValidator.validateId(input.userId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid IDs" });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      // Check if target user is a member
      const targetMembership = await ctx.db.clubMember.findUnique({
        where: {
          userId_clubId: {
            userId: input.userId,
            clubId: input.clubId,
          },
        },
      });

      if (!targetMembership) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User is not a member of this club",
        });
      }

      // Cannot change role of club creator
      const club = await ctx.db.club.findUnique({
        where: { id: input.clubId },
      });

      if (club?.creatorId === input.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot change role of club creator",
        });
      }

      const updatedMembership = await ctx.db.clubMember.update({
        where: {
          userId_clubId: {
            userId: input.userId,
            clubId: input.clubId,
          },
        },
        data: { role: input.role },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
        },
      });

      // Audit logging
      await auditLogger.logUserAction("club.member.role_updated", ctx.userId, {
        severity: "MEDIUM",
        category: "CLUB_MANAGEMENT",
        resourceType: "club",
        resourceId: input.clubId,
        metadata: {
          targetUserId: input.userId,
          targetUserName: updatedMembership.user.name,
          oldRole: targetMembership.role,
          newRole: input.role,
        },
      });

      return updatedMembership;
    }),

  // Remove member (admin only)
  removeMember: protectedProcedure
    .input(z.object({ clubId: z.string(), userId: z.string() }))
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for admin operations
      await createRateLimitMiddleware("ADMIN_OPERATIONS")(ctx);
      
      // Permission checking
      await requireClubPermission((input) => input.clubId, "ADMIN")(ctx, input);
      
      // Input validation
      if (!SecurityValidator.validateId(input.clubId) || !SecurityValidator.validateId(input.userId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid IDs" });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      // Get member info for audit logging
      const targetMembership = await ctx.db.clubMember.findUnique({
        where: {
          userId_clubId: {
            userId: input.userId,
            clubId: input.clubId,
          },
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      // Cannot remove club creator
      const club = await ctx.db.club.findUnique({
        where: { id: input.clubId },
      });

      if (club?.creatorId === input.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot remove club creator",
        });
      }

      await ctx.db.clubMember.delete({
        where: {
          userId_clubId: {
            userId: input.userId,
            clubId: input.clubId,
          },
        },
      });

      // Audit logging
      await auditLogger.logUserAction("club.member.removed", ctx.userId, {
        severity: "HIGH",
        category: "CLUB_MANAGEMENT",
        resourceType: "club",
        resourceId: input.clubId,
        metadata: {
          removedUserId: input.userId,
          removedUserName: targetMembership?.user.name,
          removedUserRole: targetMembership?.role,
        },
      });

      return { success: true };
    }),

  // Request to join private club
  requestToJoin: protectedProcedure
    .input(z.object({ clubId: z.string() }))
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for club joining
      await createRateLimitMiddleware("CLUB_JOIN")(ctx);
      
      // Input validation
      if (!SecurityValidator.validateId(input.clubId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid club ID" });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { id: input.clubId },
      });

      if (!club) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Club not found",
        });
      }

      if (!club.isPrivate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This club is public, you can join directly",
        });
      }

      // Check if already a member
      const existingMembership = await ctx.db.clubMember.findUnique({
        where: {
          userId_clubId: {
            userId: ctx.userId,
            clubId: input.clubId,
          },
        },
      });

      if (existingMembership) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already a member of this club",
        });
      }

      // Check if there's already a pending request
      const existingPendingRequest = await ctx.db.clubJoinRequest.findFirst({
        where: {
          userId: ctx.userId,
          clubId: input.clubId,
          status: "PENDING",
        },
      });

      if (existingPendingRequest) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Join request already pending",
        });
      }

      // Clean up ANY existing join requests to avoid unique constraint issues
      // This ensures a clean slate for new requests
      await ctx.db.clubJoinRequest.deleteMany({
        where: {
          userId: ctx.userId,
          clubId: input.clubId,
        },
      });

      const joinRequest = await ctx.db.clubJoinRequest.create({
        data: {
          userId: ctx.userId,
          clubId: input.clubId,
          status: "PENDING",
        },
      });

      // Audit logging
      await auditLogger.logUserAction("club.join_request.created", ctx.userId, {
        severity: "low",
        category: "user_action",
        resourceType: "club",
        resourceId: input.clubId,
        metadata: {
          clubName: club.name,
        },
      });

      return joinRequest;
    }),

  // Cancel join request to private club
  cancelJoinRequest: protectedProcedure
    .input(z.object({ clubId: z.string() }))
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for general operations
      await createRateLimitMiddleware("GENERAL")(ctx);
      
      // Input validation
      if (!SecurityValidator.validateId(input.clubId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid club ID" });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      // Find the pending join request
      const joinRequest = await ctx.db.clubJoinRequest.findUnique({
        where: {
          userId_clubId: {
            userId: ctx.userId,
            clubId: input.clubId,
          },
        },
        include: {
          club: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!joinRequest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No pending join request found",
        });
      }

      if (joinRequest.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only cancel pending requests",
        });
      }

      // Delete the join request
      await ctx.db.clubJoinRequest.delete({
        where: {
          userId_clubId: {
            userId: ctx.userId,
            clubId: input.clubId,
          },
        },
      });

      // Audit logging
      await auditLogger.logUserAction("club.join_request.cancelled", ctx.userId, {
        severity: "low",
        category: "user_action",
        resourceType: "club",
        resourceId: input.clubId,
        metadata: {
          clubName: joinRequest.club.name,
        },
      });

      return { success: true };
    }),

  // Search clubs
  searchClubs: publicProcedure
    .input(SearchClubsSchema)
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for search operations
      await createRateLimitMiddleware("SEARCH")(ctx);
      
      // Input validation
      if (input.query && !SecurityValidator.validateNoXSS(input.query)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid search query" });
      }
      if (input.city && !SecurityValidator.validateLocation(input.city)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid city" });
      }
      if (input.territory && !SecurityValidator.validateLocation(input.territory)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid territory" });
      }
      if (input.cursor && !SecurityValidator.validateId(input.cursor)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid cursor" });
      }
      
      return next();
    })
    .query(async ({ ctx, input }) => {
      // Get current user's site role if authenticated
      let currentUser = null;
      if (ctx.userId) {
        currentUser = await ctx.db.user.findUnique({
          where: { id: ctx.userId },
          select: { siteRole: true },
        });
      }

      const where = {
        // Show all clubs (both public and private)
        ...(input.isPrivate !== undefined && { isPrivate: input.isPrivate }),
        ...(input.query && {
          OR: [
            { name: { contains: input.query, mode: "insensitive" as const } },
            { description: { contains: input.query, mode: "insensitive" as const } },
          ],
        }),
        ...(input.city && { city: input.city }),
        ...(input.territory && { territory: input.territory }),
      };

      const clubs = await ctx.db.club.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
          _count: {
            select: {
              members: true,
              challenges: true,
              events: true,
            },
          },
          // Include membership info for the current user if authenticated
          ...(ctx.userId && {
            members: {
              where: { userId: ctx.userId },
              select: { role: true },
            },
            joinRequests: {
              where: { 
                userId: ctx.userId,
                status: "PENDING"
              },
              select: { status: true },
            },
          }),
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input.limit,
        ...(input.cursor && {
          skip: 1,
          cursor: { id: input.cursor },
        }),
      });

      // Check if user is site admin
      const isSiteAdmin = currentUser?.siteRole === "SUPER_ADMIN" || currentUser?.siteRole === "ADMIN";

      // Add user access info to each club
      const clubsWithAccess = clubs.map(club => ({
        ...club,
        // Check if current user has access based on permissions
        userAccess: ctx.userId ? {
          isMember: club.members && club.members.length > 0,
          memberRole: club.members?.[0]?.role || null,
          isSiteAdmin,
          hasJoinRequest: club.joinRequests && club.joinRequests.length > 0,
          joinRequestStatus: club.joinRequests?.[0]?.status || null,
          canAccess: !club.isPrivate || 
                     (club.members && club.members.length > 0) ||
                     isSiteAdmin,
          canJoin: !club.isPrivate && !(club.members && club.members.length > 0),
          canRequestToJoin: club.isPrivate && 
                           !(club.members && club.members.length > 0) && 
                           !(club.joinRequests && club.joinRequests.length > 0) &&
                           !isSiteAdmin,
        } : {
          isMember: false,
          memberRole: null,
          isSiteAdmin: false,
          hasJoinRequest: false,
          joinRequestStatus: null,
          canAccess: !club.isPrivate,
          canJoin: !club.isPrivate,
          canRequestToJoin: false,
        },
        // Don't expose members and joinRequests arrays in response
        members: undefined,
        joinRequests: undefined,
      }));

      const nextCursor = clubs.length === input.limit ? clubs[clubs.length - 1]?.id : null;

      return {
        clubs: clubsWithAccess,
        nextCursor,
      };
    }),

  // Get pending join requests for a club (admin/moderator only)
  getJoinRequests: protectedProcedure
    .input(z.object({ clubId: z.string() }))
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for admin operations
      await createRateLimitMiddleware("ADMIN_OPERATIONS")(ctx);
      
      // Permission checking - only admins and moderators can view join requests
      await requireClubPermission((input) => input.clubId, "MODERATOR")(ctx, input);
      
      // Input validation
      if (!SecurityValidator.validateId(input.clubId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid club ID" });
      }
      
      return next();
    })
    .query(async ({ ctx, input }) => {
      const joinRequests = await ctx.db.clubJoinRequest.findMany({
        where: {
          clubId: input.clubId,
          status: "PENDING",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              imageUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return joinRequests;
    }),

  // Handle join request (approve/reject) - admin/moderator only
  handleJoinRequest: protectedProcedure
    .input(z.object({ 
      requestId: z.string(),
      action: z.enum(["approve", "reject"]),
    }))
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for admin operations
      await createRateLimitMiddleware("ADMIN_OPERATIONS")(ctx);
      
      // Input validation
      if (!SecurityValidator.validateId(input.requestId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid request ID" });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      // Get the join request with club info
      const joinRequest = await ctx.db.clubJoinRequest.findUnique({
        where: { id: input.requestId },
        include: {
          club: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!joinRequest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Join request not found",
        });
      }

      if (joinRequest.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Request has already been processed",
        });
      }

      // Check if user has permission to handle requests for this club
      const membership = await ctx.db.clubMember.findUnique({
        where: {
          userId_clubId: {
            userId: ctx.userId,
            clubId: joinRequest.clubId,
          },
        },
      });

      // Check user permissions (club admin/moderator or site admin)
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.userId },
        select: { siteRole: true },
      });

      const isSiteAdmin = currentUser?.siteRole === "SUPER_ADMIN" || currentUser?.siteRole === "ADMIN";
      const isClubAdmin = membership?.role === "ADMIN" || membership?.role === "MODERATOR";

      if (!isSiteAdmin && !isClubAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Insufficient permissions",
        });
      }

      if (input.action === "approve") {
        // Create club membership
        await ctx.db.clubMember.create({
          data: {
            userId: joinRequest.userId,
            clubId: joinRequest.clubId,
            role: "MEMBER",
          },
        });

        // Update request status
        await ctx.db.clubJoinRequest.update({
          where: { id: input.requestId },
          data: {
            status: "APPROVED",
            reviewedById: ctx.userId,
            reviewedAt: new Date(),
          },
        });

        // Audit logging
        await auditLogger.logUserAction("club.join_request.approved", ctx.userId, {
          severity: "MEDIUM",
          category: "CLUB_MANAGEMENT",
          resourceType: "club",
          resourceId: joinRequest.clubId,
          metadata: {
            clubName: joinRequest.club.name,
            newMemberName: joinRequest.user.name,
            newMemberId: joinRequest.userId,
          },
        });
      } else {
        // Update request status to rejected
        await ctx.db.clubJoinRequest.update({
          where: { id: input.requestId },
          data: {
            status: "REJECTED",
            reviewedById: ctx.userId,
            reviewedAt: new Date(),
          },
        });

        // Audit logging
        await auditLogger.logUserAction("club.join_request.rejected", ctx.userId, {
          severity: "LOW",
          category: "CLUB_MANAGEMENT",
          resourceType: "club",
          resourceId: joinRequest.clubId,
          metadata: {
            clubName: joinRequest.club.name,
            rejectedUserName: joinRequest.user.name,
            rejectedUserId: joinRequest.userId,
          },
        });
      }

      return { success: true, action: input.action };
    }),

  // Ban member from club (admin only)
  banMember: protectedProcedure
    .input(z.object({ 
      clubId: z.string(), 
      userId: z.string(),
      reason: z.string().optional(),
      permanent: z.boolean().default(false),
      durationDays: z.number().optional(),
    }))
    .use(async ({ ctx, next, input }) => {
      await createRateLimitMiddleware("ADMIN_OPERATIONS")(ctx);
      await requireClubPermission((input) => input.clubId, "ADMIN")(ctx, input);
      
      if (!SecurityValidator.validateId(input.clubId) || !SecurityValidator.validateId(input.userId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid IDs" });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      // Cannot ban club creator
      const club = await ctx.db.club.findUnique({
        where: { id: input.clubId },
      });

      if (club?.creatorId === input.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot ban club creator",
        });
      }

      // Get member info for audit logging
      const targetMembership = await ctx.db.clubMember.findUnique({
        where: {
          userId_clubId: {
            userId: input.userId,
            clubId: input.clubId,
          },
        },
        include: {
          user: { select: { name: true } },
        },
      });

      // Remove from club first
      await ctx.db.clubMember.delete({
        where: {
          userId_clubId: {
            userId: input.userId,
            clubId: input.clubId,
          },
        },
      });

      // Create ban record
      const banExpiry = input.permanent 
        ? null 
        : input.durationDays 
          ? new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

      await ctx.db.clubBan.create({
        data: {
          userId: input.userId,
          clubId: input.clubId,
          bannedById: ctx.userId,
          reason: input.reason,
          isPermanent: input.permanent,
          expiresAt: banExpiry,
        },
      });

      // Audit logging
      await auditLogger.logUserAction("club.member.banned", ctx.userId, {
        severity: "HIGH",
        category: "MODERATION",
        resourceType: "club",
        resourceId: input.clubId,
        metadata: {
          bannedUserId: input.userId,
          bannedUserName: targetMembership?.user.name,
          reason: input.reason,
          permanent: input.permanent,
          durationDays: input.durationDays,
        },
      });

      return { success: true };
    }),

  // Unban member from club (admin only)
  unbanMember: protectedProcedure
    .input(z.object({ clubId: z.string(), userId: z.string() }))
    .use(async ({ ctx, next, input }) => {
      await createRateLimitMiddleware("ADMIN_OPERATIONS")(ctx);
      await requireClubPermission((input) => input.clubId, "ADMIN")(ctx, input);
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      await ctx.db.clubBan.deleteMany({
        where: {
          userId: input.userId,
          clubId: input.clubId,
        },
      });

      await auditLogger.logUserAction("club.member.unbanned", ctx.userId, {
        severity: "MEDIUM",
        category: "MODERATION",
        resourceType: "club",
        resourceId: input.clubId,
        metadata: {
          unbannedUserId: input.userId,
        },
      });

      return { success: true };
    }),

  // Get banned members (admin only)
  getBannedMembers: protectedProcedure
    .input(z.object({ clubId: z.string() }))
    .use(async ({ ctx, next, input }) => {
      await createRateLimitMiddleware("READ_OPERATIONS")(ctx);
      await requireClubPermission((input) => input.clubId, "ADMIN")(ctx, input);
      return next();
    })
    .query(async ({ ctx, input }) => {
      const bans = await ctx.db.clubBan.findMany({
        where: { clubId: input.clubId },
        include: {
          user: {
            select: { id: true, name: true, email: true, imageUrl: true },
          },
          bannedBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return bans;
    }),

  // Bulk operations for member management
  bulkMemberActions: protectedProcedure
    .input(z.object({
      clubId: z.string(),
      userIds: z.array(z.string()),
      action: z.enum(["remove", "promote_moderator", "demote_member", "ban"]),
      banReason: z.string().optional(),
    }))
    .use(async ({ ctx, next, input }) => {
      await createRateLimitMiddleware("ADMIN_OPERATIONS")(ctx);
      await requireClubPermission((input) => input.clubId, "ADMIN")(ctx, input);
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      const results = [];

      for (const userId of input.userIds) {
        try {
          switch (input.action) {
            case "remove":
              await ctx.db.clubMember.delete({
                where: { userId_clubId: { userId, clubId: input.clubId } },
              });
              break;
            case "promote_moderator":
              await ctx.db.clubMember.update({
                where: { userId_clubId: { userId, clubId: input.clubId } },
                data: { role: "MODERATOR" },
              });
              break;
            case "demote_member":
              await ctx.db.clubMember.update({
                where: { userId_clubId: { userId, clubId: input.clubId } },
                data: { role: "MEMBER" },
              });
              break;
            case "ban":
              await ctx.db.clubMember.delete({
                where: { userId_clubId: { userId, clubId: input.clubId } },
              });
              await ctx.db.clubBan.create({
                data: {
                  userId,
                  clubId: input.clubId,
                  bannedById: ctx.userId,
                  reason: input.banReason,
                  isPermanent: false,
                  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
              });
              break;
          }
          results.push({ userId, success: true });
        } catch (error) {
          results.push({ userId, success: false, error: error.message });
        }
      }

      await auditLogger.logUserAction("club.bulk_member_action", ctx.userId, {
        severity: "HIGH",
        category: "CLUB_MANAGEMENT",
        resourceType: "club",
        resourceId: input.clubId,
        metadata: {
          action: input.action,
          affectedUsers: input.userIds,
          results,
        },
      });

      return { results };
    }),

  // Enhanced invite management
  getInviteSettings: protectedProcedure
    .input(z.object({ clubId: z.string() }))
    .use(async ({ ctx, next, input }) => {
      await createRateLimitMiddleware("READ_OPERATIONS")(ctx);
      await requireClubPermission((input) => input.clubId, "ADMIN")(ctx, input);
      return next();
    })
    .query(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { id: input.clubId },
        select: {
          inviteCode: true,
          isPrivate: true,
          maxMembers: true,
          inviteExpiry: true,
          allowMemberInvites: true,
        },
      });

      // Get invite usage stats
      const inviteStats = await ctx.db.auditLog.aggregate({
        where: {
          action: "club.joined",
          resourceId: input.clubId,
          metadata: {
            path: ["joinMethod"],
            equals: "invite",
          },
        },
        _count: true,
      });

      return {
        ...club,
        inviteUsageCount: inviteStats._count,
      };
    }),

  // Update invite settings
  updateInviteSettings: protectedProcedure
    .input(z.object({
      clubId: z.string(),
      generateNew: z.boolean().optional(),
      maxMembers: z.number().optional(),
      inviteExpiry: z.date().optional(),
      allowMemberInvites: z.boolean().optional(),
    }))
    .use(async ({ ctx, next, input }) => {
      await createRateLimitMiddleware("ADMIN_OPERATIONS")(ctx);
      await requireClubPermission((input) => input.clubId, "ADMIN")(ctx, input);
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      const updateData: any = {};

      if (input.generateNew) {
        updateData.inviteCode = generateInviteCode();
      }
      if (input.maxMembers !== undefined) {
        updateData.maxMembers = input.maxMembers;
      }
      if (input.inviteExpiry !== undefined) {
        updateData.inviteExpiry = input.inviteExpiry;
      }
      if (input.allowMemberInvites !== undefined) {
        updateData.allowMemberInvites = input.allowMemberInvites;
      }

      const updatedClub = await ctx.db.club.update({
        where: { id: input.clubId },
        data: updateData,
      });

      await auditLogger.logUserAction("club.invite_settings.updated", ctx.userId, {
        severity: "MEDIUM",
        category: "CLUB_MANAGEMENT",
        resourceType: "club",
        resourceId: input.clubId,
        metadata: {
          changes: updateData,
          newInviteCode: input.generateNew ? updateData.inviteCode : undefined,
        },
      });

      return { 
        success: true, 
        inviteCode: updatedClub.inviteCode,
        settings: {
          maxMembers: updatedClub.maxMembers,
          inviteExpiry: updatedClub.inviteExpiry,
          allowMemberInvites: updatedClub.allowMemberInvites,
        },
      };
    }),

  // Admin chat/messaging system
  sendAdminMessage: protectedProcedure
    .input(z.object({
      clubId: z.string(),
      message: z.string().min(1).max(500),
      type: z.enum(["announcement", "warning", "info"]).default("info"),
      targetUserIds: z.array(z.string()).optional(), // If empty, sends to all admins/mods
    }))
    .use(async ({ ctx, next, input }) => {
      await createRateLimitMiddleware("ADMIN_OPERATIONS")(ctx);
      await requireClubPermission((input) => input.clubId, "MODERATOR")(ctx, input);
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      // Get target users (all admins/mods if not specified)
      let targetUserIds = input.targetUserIds;
      if (!targetUserIds || targetUserIds.length === 0) {
        const adminMods = await ctx.db.clubMember.findMany({
          where: {
            clubId: input.clubId,
            role: { in: ["ADMIN", "MODERATOR"] },
          },
          select: { userId: true },
        });
        targetUserIds = adminMods.map(m => m.userId);
      }

      // Create admin message
      const message = await ctx.db.adminMessage.create({
        data: {
          clubId: input.clubId,
          senderId: ctx.userId,
          message: input.message,
          type: input.type,
          targetUserIds,
        },
        include: {
          sender: {
            select: { id: true, name: true, imageUrl: true },
          },
        },
      });

      await auditLogger.logUserAction("club.admin_message.sent", ctx.userId, {
        severity: "MEDIUM",
        category: "ADMINISTRATION",
        resourceType: "club",
        resourceId: input.clubId,
        metadata: {
          messageType: input.type,
          targetCount: targetUserIds.length,
        },
      });

      return message;
    }),

  // Get admin messages
  getAdminMessages: protectedProcedure
    .input(z.object({
      clubId: z.string(),
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
    }))
    .use(async ({ ctx, next, input }) => {
      await createRateLimitMiddleware("READ_OPERATIONS")(ctx);
      await requireClubPermission((input) => input.clubId, "MODERATOR")(ctx, input);
      return next();
    })
    .query(async ({ ctx, input }) => {
      const messages = await ctx.db.adminMessage.findMany({
        where: {
          clubId: input.clubId,
          targetUserIds: { has: ctx.userId },
        },
        include: {
          sender: {
            select: { id: true, name: true, imageUrl: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        ...(input.cursor && {
          skip: 1,
          cursor: { id: input.cursor },
        }),
      });

      return {
        messages,
        nextCursor: messages.length === input.limit ? messages[messages.length - 1]?.id : null,
      };
    }),

  // Get comprehensive club analytics for admins
  getClubAnalytics: protectedProcedure
    .input(z.object({
      clubId: z.string(),
      timeRange: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
    }))
    .use(async ({ ctx, next, input }) => {
      await createRateLimitMiddleware("READ_OPERATIONS")(ctx);
      await requireClubPermission((input) => input.clubId, "ADMIN")(ctx, input);
      return next();
    })
    .query(async ({ ctx, input }) => {
      const daysAgo = {
        "7d": 7,
        "30d": 30,
        "90d": 90,
        "1y": 365,
      }[input.timeRange];

      const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      // Member growth
      const memberGrowth = await ctx.db.clubMember.groupBy({
        by: ["joinedAt"],
        where: {
          clubId: input.clubId,
          joinedAt: { gte: startDate },
        },
        _count: true,
      });

      // Activity metrics
      const activityMetrics = await ctx.db.auditLog.groupBy({
        by: ["timestamp"],
        where: {
          resourceId: input.clubId,
          timestamp: { gte: startDate },
        },
        _count: true,
      });

      // Current statistics
      const stats = await ctx.db.club.findUnique({
        where: { id: input.clubId },
        include: {
          _count: {
            select: {
              members: true,
              challenges: true,
              events: true,
              posts: true,
              joinRequests: true,
            },
          },
        },
      });

      return {
        memberGrowth,
        activityMetrics,
        currentStats: stats?._count,
        topMembers: [], // Can be enhanced with engagement metrics
      };
    }),

  // Generate presigned URL for club image upload
  generateImageUploadUrl: protectedProcedure
    .input(z.object({
      clubId: z.string(),
      fileName: z.string(),
      fileType: z.string(),
    }))
    .use(async ({ ctx, next, input }) => {
      await createRateLimitMiddleware("ADMIN_OPERATIONS")(ctx);
      await requireClubPermission((input) => input.clubId, "ADMIN")(ctx, input);
      
      // Validate file type
      if (!input.fileType.startsWith('image/')) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only image files are allowed" });
      }
      
      // Validate file name
      if (!SecurityValidator.validateNoXSS(input.fileName)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid file name" });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      try {
        // Generate unique file key
        const fileKey = generateFileKey(ctx.userId, input.fileName, `clubs/${input.clubId}`);
        
        // Generate presigned URL
        const uploadUrl = await generatePresignedUploadUrl(
          BUCKETS.IMAGES,
          fileKey,
          input.fileType,
          3600 // 1 hour expiry
        );
        
        // Construct the final image URL (this would be the publicly accessible URL)
        const imageUrl = `${process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT}/${BUCKETS.IMAGES}/${fileKey}`;
        
        // Audit logging
        await auditLogger.logUserAction("club.image.upload_url_generated", ctx.userId, {
          severity: "low",
          category: "user_action",
          resourceType: "club",
          resourceId: input.clubId,
          metadata: {
            fileName: input.fileName,
            fileType: input.fileType,
            fileKey,
          },
        });
        
        return {
          uploadUrl,
          imageUrl,
          fileKey,
        };
      } catch (error) {
        console.error("Failed to generate presigned URL:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate upload URL",
        });
      }
    }),
}); 