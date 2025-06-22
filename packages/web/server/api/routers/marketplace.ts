import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
import {
  CreateMarketplacePostSchema,
  SearchMarketplaceSchema,
} from "@redline/shared";

export const marketplaceRouter = createTRPCRouter({
  // Create a new marketplace post
  create: protectedProcedure
    .input(CreateMarketplacePostSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if posting to a club and user is a member
      if (input.clubId) {
        const membership = await ctx.db.clubMember.findUnique({
          where: {
            userId_clubId: {
              userId: ctx.userId,
              clubId: input.clubId,
            },
          },
        });

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Must be a club member to post in club marketplace",
          });
        }
      }

      const post = await ctx.db.marketplacePost.create({
        data: {
          ...input,
          sellerId: ctx.userId,
        },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
          club: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return post;
    }),

  // Get all marketplace posts
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db.marketplacePost.findMany({
      where: {
        isActive: true,
        clubId: null, // Only show general marketplace posts, not club-specific ones
      },
      include: {
        seller: {
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

    return posts;
  }),

  // Get marketplace post by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.db.marketplacePost.findUnique({
        where: { id: input.id },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              email: true,
            },
          },
          club: {
            select: {
              id: true,
              name: true,
              isPrivate: true,
            },
          },
        },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Marketplace post not found",
        });
      }

      // Check if post is in a private club and user has access
      if (post.club?.isPrivate) {
        const membership = ctx.userId
          ? await ctx.db.clubMember.findUnique({
              where: {
                userId_clubId: {
                  userId: ctx.userId,
                  clubId: post.club.id,
                },
              },
            })
          : null;

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This post is in a private club",
          });
        }
      }

      return post;
    }),

  // Get user's marketplace posts
  getMyPosts: protectedProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db.marketplacePost.findMany({
      where: {
        sellerId: ctx.userId,
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return posts;
  }),

  // Get marketplace posts for a club
  getClubPosts: protectedProcedure
    .input(z.object({ clubId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if user is a member of the club
      const membership = await ctx.db.clubMember.findUnique({
        where: {
          userId_clubId: {
            userId: ctx.userId,
            clubId: input.clubId,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Must be a club member to view club marketplace",
        });
      }

      const posts = await ctx.db.marketplacePost.findMany({
        where: {
          clubId: input.clubId,
          isActive: true,
        },
        include: {
          seller: {
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

      return posts;
    }),

  // Search marketplace posts
  search: publicProcedure
    .input(SearchMarketplaceSchema)
    .query(async ({ ctx, input }) => {
      const where = {
        isActive: true,
        ...(input.clubId ? { clubId: input.clubId } : { clubId: null }),
        ...(input.query && {
          OR: [
            { title: { contains: input.query, mode: "insensitive" as const } },
            { description: { contains: input.query, mode: "insensitive" as const } },
            { category: { contains: input.query, mode: "insensitive" as const } },
          ],
        }),
        ...(input.category && { category: input.category }),
        ...(input.condition && { condition: input.condition }),
        ...(input.minPrice && { price: { gte: input.minPrice } }),
        ...(input.maxPrice && { price: { lte: input.maxPrice } }),
        ...(input.city && { city: input.city }),
      };

      // If searching in a specific club, check if user has access
      if (input.clubId) {
        const club = await ctx.db.club.findUnique({
          where: { id: input.clubId },
          select: { isPrivate: true },
        });

        if (club?.isPrivate) {
          const membership = ctx.userId
            ? await ctx.db.clubMember.findUnique({
                where: {
                  userId_clubId: {
                    userId: ctx.userId,
                    clubId: input.clubId,
                  },
                },
              })
            : null;

          if (!membership) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Must be a club member to search club marketplace",
            });
          }
        }
      }

      const posts = await ctx.db.marketplacePost.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
          club: {
            select: {
              id: true,
              name: true,
            },
          },
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

      const nextCursor = posts.length === input.limit ? posts[posts.length - 1]?.id : null;

      return {
        posts,
        nextCursor,
      };
    }),

  // Update marketplace post
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        price: z.number().positive().optional(),
        images: z.array(z.string()).optional(),
        category: z.string().optional(),
        condition: z.enum(["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"]).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Check if user owns the post
      const existingPost = await ctx.db.marketplacePost.findUnique({
        where: { id },
      });

      if (!existingPost) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Marketplace post not found",
        });
      }

      if (existingPost.sellerId !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Can only update your own posts",
        });
      }

      const updatedPost = await ctx.db.marketplacePost.update({
        where: { id },
        data: updateData,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
          club: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return updatedPost;
    }),

  // Delete marketplace post
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user owns the post
      const existingPost = await ctx.db.marketplacePost.findUnique({
        where: { id: input.id },
      });

      if (!existingPost) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Marketplace post not found",
        });
      }

      if (existingPost.sellerId !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Can only delete your own posts",
        });
      }

      await ctx.db.marketplacePost.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
}); 