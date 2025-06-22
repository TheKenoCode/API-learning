import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure, authenticatedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  // Get current user with full data including memberships
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.userId },
      include: {
        clubMemberships: {
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
        },
        subscription: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  }),

  // Get user profile by ID (public info only)
  getProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          createdAt: true,
          // Only include public club memberships
          clubMemberships: {
            where: {
              club: { isPrivate: false },
            },
            select: {
              role: true,
              joinedAt: true,
              club: {
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

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return user;
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100).optional(),
      imageUrl: z.string().url().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const updatedUser = await ctx.db.user.update({
        where: { id: ctx.userId },
        data: {
          name: input.name,
          imageUrl: input.imageUrl,
        },
      });

      return updatedUser;
    }),

  // Search users
  searchUsers: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const users = await ctx.db.user.findMany({
        where: {
          OR: [
            { name: { contains: input.query, mode: "insensitive" } },
            { email: { contains: input.query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          email: true, // Only for search results
        },
        take: input.limit,
      });

      return users;
    }),

  // Get user statistics
  getUserStats: protectedProcedure.query(async ({ ctx }) => {
    const [
      clubCount,
      challengeParticipations,
      eventAttendances,
      postsCount,
      friendsCount,
    ] = await Promise.all([
      ctx.db.clubMember.count({
        where: { userId: ctx.userId },
      }),
      ctx.db.challengeParticipant.count({
        where: { userId: ctx.userId },
      }),
      ctx.db.eventAttendee.count({
        where: { 
          userId: ctx.userId,
          status: "ATTENDING"
        },
      }),
      ctx.db.clubPost.count({
        where: { authorId: ctx.userId },
      }),
      ctx.db.friendship.count({
        where: {
          OR: [
            { requesterId: ctx.userId, status: "ACCEPTED" },
            { addresseeId: ctx.userId, status: "ACCEPTED" },
          ],
        },
      }),
    ]);

    return {
      clubsJoined: clubCount,
      challengesParticipated: challengeParticipations,
      eventsAttended: eventAttendances,
      postsCreated: postsCount,
      friendsCount,
    };
  }),

  // Check if user exists by Clerk ID (useful for debugging)
  checkUserExists: publicProcedure
    .input(z.object({ clerkId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { clerkId: input.clerkId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          siteRole: true,
        },
      });

      return {
        exists: !!user,
        user,
      };
    }),

  // Admin function to promote user to admin
  promoteToAdmin: authenticatedProcedure
    .input(z.object({
      userId: z.string(),
      role: z.enum(["ADMIN", "SUPER_ADMIN"]),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if current user is a super admin
      const currentUser = ctx.user;
      if (currentUser.siteRole !== "SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only super admins can promote users",
        });
      }

      const updatedUser = await ctx.db.user.update({
        where: { id: input.userId },
        data: { siteRole: input.role },
      });

      return updatedUser;
    }),

  // Get user's activity feed
  getActivityFeed: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      // Get recent activities across different areas
      const [recentPosts, recentChallenges, recentEvents] = await Promise.all([
        // Recent posts
        ctx.db.clubPost.findMany({
          where: { authorId: ctx.userId },
          include: {
            club: {
              select: { id: true, name: true },
            },
            _count: {
              select: { likes: true, comments: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: Math.floor(input.limit / 3),
        }),

        // Recent challenge participations
        ctx.db.challengeParticipant.findMany({
          where: { userId: ctx.userId },
          include: {
            challenge: {
              select: {
                id: true,
                title: true,
                type: true,
                club: {
                  select: { id: true, name: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: Math.floor(input.limit / 3),
        }),

        // Recent event attendances
        ctx.db.eventAttendee.findMany({
          where: { userId: ctx.userId },
          include: {
            event: {
              select: {
                id: true,
                title: true,
                date: true,
                club: {
                  select: { id: true, name: true },
                },
              },
            },
          },
          orderBy: { event: { date: "desc" } },
          take: Math.floor(input.limit / 3),
        }),
      ]);

      // Combine and format activities
      const activities: any[] = [
        ...recentPosts.map(post => ({
          type: "post",
          id: post.id,
          title: "Created post",
          description: post.content.substring(0, 100) + (post.content.length > 100 ? "..." : ""),
          club: post.club,
          createdAt: post.createdAt,
          metadata: {
            likes: post._count.likes,
            comments: post._count.comments,
          },
        })),
        ...recentChallenges.map(challenge => ({
          type: "challenge",
          id: challenge.challenge.id,
          title: "Joined challenge",
          description: challenge.challenge.title,
          club: challenge.challenge.club,
          createdAt: challenge.createdAt,
          metadata: {
            score: challenge.score,
            completed: !!challenge.completedAt,
          },
        })),
        ...recentEvents.map(attendance => ({
          type: "event",
          id: attendance.event.id,
          title: "Attending event",
          description: attendance.event.title,
          club: attendance.event.club,
          createdAt: attendance.event.date,
          metadata: {
            status: attendance.status,
          },
        })),
      ];

      // Sort by date and return limited results
      return activities
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, input.limit);
    }),
}); 