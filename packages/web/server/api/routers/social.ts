import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import {
  SendFriendRequestSchema,
  RespondToFriendRequestSchema,
  SearchUsersSchema,
} from "@redline/shared";

export const socialRouter = createTRPCRouter({
  // Send a friend request
  sendFriendRequest: protectedProcedure
    .input(SendFriendRequestSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user exists
      const addressee = await ctx.db.user.findUnique({
        where: { id: input.addresseeId },
      });

      if (!addressee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Can't send friend request to yourself
      if (input.addresseeId === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot send friend request to yourself",
        });
      }

      // Check if friendship already exists
      const existingFriendship = await ctx.db.friendship.findFirst({
        where: {
          OR: [
            {
              requesterId: ctx.userId,
              addresseeId: input.addresseeId,
            },
            {
              requesterId: input.addresseeId,
              addresseeId: ctx.userId,
            },
          ],
        },
      });

      if (existingFriendship) {
        if (existingFriendship.status === "ACCEPTED") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Already friends with this user",
          });
        } else if (existingFriendship.status === "PENDING") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Friend request already sent",
          });
        } else if (existingFriendship.status === "BLOCKED") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Cannot send friend request to this user",
          });
        }
      }

      const friendship = await ctx.db.friendship.create({
        data: {
          requesterId: ctx.userId,
          addresseeId: input.addresseeId,
          status: "PENDING",
        },
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
          addressee: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
        },
      });

      return friendship;
    }),

  // Respond to a friend request
  respondToFriendRequest: protectedProcedure
    .input(RespondToFriendRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const friendship = await ctx.db.friendship.findUnique({
        where: { id: input.friendshipId },
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
          addressee: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
        },
      });

      if (!friendship) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Friend request not found",
        });
      }

      // Only the addressee can respond to the request
      if (friendship.addresseeId !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Can only respond to friend requests sent to you",
        });
      }

      if (friendship.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Friend request has already been responded to",
        });
      }

      if (input.accept) {
        // Accept the friend request
        const updatedFriendship = await ctx.db.friendship.update({
          where: { id: input.friendshipId },
          data: { status: "ACCEPTED" },
          include: {
            requester: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
            addressee: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        });

        return updatedFriendship;
      } else {
        // Decline the friend request (delete it)
        await ctx.db.friendship.delete({
          where: { id: input.friendshipId },
        });

        return { success: true, declined: true };
      }
    }),

  // Get user's friends
  getFriends: protectedProcedure.query(async ({ ctx }) => {
    const friendships = await ctx.db.friendship.findMany({
      where: {
        OR: [
          { requesterId: ctx.userId },
          { addresseeId: ctx.userId },
        ],
        status: "ACCEPTED",
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        addressee: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    });

    // Return the friend (not the current user) from each friendship
    return friendships.map((friendship) => {
      const friend = friendship.requesterId === ctx.userId 
        ? friendship.addressee 
        : friendship.requester;
      
      return {
        friendshipId: friendship.id,
        friend,
        since: friendship.createdAt,
      };
    });
  }),

  // Get pending friend requests (received)
  getPendingRequests: protectedProcedure.query(async ({ ctx }) => {
    const pendingRequests = await ctx.db.friendship.findMany({
      where: {
        addresseeId: ctx.userId,
        status: "PENDING",
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return pendingRequests;
  }),

  // Get sent friend requests
  getSentRequests: protectedProcedure.query(async ({ ctx }) => {
    const sentRequests = await ctx.db.friendship.findMany({
      where: {
        requesterId: ctx.userId,
        status: "PENDING",
      },
      include: {
        addressee: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return sentRequests;
  }),

  // Remove friend
  removeFriend: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const friendship = await ctx.db.friendship.findFirst({
        where: {
          OR: [
            {
              requesterId: ctx.userId,
              addresseeId: input.userId,
            },
            {
              requesterId: input.userId,
              addresseeId: ctx.userId,
            },
          ],
          status: "ACCEPTED",
        },
      });

      if (!friendship) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Friendship not found",
        });
      }

      await ctx.db.friendship.delete({
        where: { id: friendship.id },
      });

      return { success: true };
    }),

  // Block user
  blockUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Can't block yourself
      if (input.userId === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot block yourself",
        });
      }

      // Check if friendship exists
      const existingFriendship = await ctx.db.friendship.findFirst({
        where: {
          OR: [
            {
              requesterId: ctx.userId,
              addresseeId: input.userId,
            },
            {
              requesterId: input.userId,
              addresseeId: ctx.userId,
            },
          ],
        },
      });

      if (existingFriendship) {
        // Update existing friendship to blocked
        const updatedFriendship = await ctx.db.friendship.update({
          where: { id: existingFriendship.id },
          data: { status: "BLOCKED" },
        });

        return updatedFriendship;
      } else {
        // Create new blocked relationship
        const blockedRelationship = await ctx.db.friendship.create({
          data: {
            requesterId: ctx.userId,
            addresseeId: input.userId,
            status: "BLOCKED",
          },
        });

        return blockedRelationship;
      }
    }),

  // Unblock user
  unblockUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const friendship = await ctx.db.friendship.findFirst({
        where: {
          requesterId: ctx.userId,
          addresseeId: input.userId,
          status: "BLOCKED",
        },
      });

      if (!friendship) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Blocked relationship not found",
        });
      }

      await ctx.db.friendship.delete({
        where: { id: friendship.id },
      });

      return { success: true };
    }),

  // Search users
  searchUsers: protectedProcedure
    .input(SearchUsersSchema)
    .query(async ({ ctx, input }) => {
      const users = await ctx.db.user.findMany({
        where: {
          AND: [
            { id: { not: ctx.userId } }, // Exclude current user
            {
              OR: [
                { name: { contains: input.query, mode: "insensitive" } },
                { email: { contains: input.query, mode: "insensitive" } },
              ],
            },
          ],
        },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          email: true,
        },
        take: input.limit,
      });

      // Get friendship status for each user
      const userIds = users.map((user) => user.id);
      const friendships = await ctx.db.friendship.findMany({
        where: {
          OR: [
            {
              requesterId: ctx.userId,
              addresseeId: { in: userIds },
            },
            {
              requesterId: { in: userIds },
              addresseeId: ctx.userId,
            },
          ],
        },
      });

      // Map friendship status to each user
      const usersWithFriendshipStatus = users.map((user) => {
        const friendship = friendships.find(
          (f) =>
            (f.requesterId === ctx.userId && f.addresseeId === user.id) ||
            (f.requesterId === user.id && f.addresseeId === ctx.userId)
        );

        let friendshipStatus = null;
        if (friendship) {
          if (friendship.status === "ACCEPTED") {
            friendshipStatus = "FRIENDS";
          } else if (friendship.status === "PENDING") {
            if (friendship.requesterId === ctx.userId) {
              friendshipStatus = "REQUEST_SENT";
            } else {
              friendshipStatus = "REQUEST_RECEIVED";
            }
          } else if (friendship.status === "BLOCKED") {
            friendshipStatus = "BLOCKED";
          }
        }

        return {
          ...user,
          friendshipStatus,
          friendshipId: friendship?.id,
        };
      });

      return usersWithFriendshipStatus;
    }),
}); 