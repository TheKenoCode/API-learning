import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
import {
  CreateClubPostSchema,
  LikePostSchema,
  CommentOnPostSchema,
  LikeCommentSchema,
} from "@redline/shared";
import { createRateLimitMiddleware } from "@/server/security/rateLimiter";
import { requireClubPermission } from "@/server/auth/permissions";
import { SecurityValidator } from "@/server/security/validation";
import { auditLogger } from "@/server/audit/auditLogger";
import { enrichUsersWithClerkData, transformEnrichedUser } from "@/lib/user-enrichment";

export const clubPostRouter = createTRPCRouter({
  // Create a new club post
  create: protectedProcedure
    .input(CreateClubPostSchema)
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for content creation
      await createRateLimitMiddleware("CONTENT_CREATE")(ctx);
      
      // Input validation
      if (!SecurityValidator.validateNoXSS(input.content)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid post content" });
      }
      if (!SecurityValidator.validateId(input.clubId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid club ID" });
      }
      if (input.images) {
        for (const imageUrl of input.images) {
          if (!SecurityValidator.validateImageUrl(imageUrl)) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid image URL" });
          }
        }
      }
      
      // Permission checking
      await requireClubPermission((input) => input.clubId, "posts:create")(ctx, input);
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.clubPost.create({
        data: {
          ...input,
          authorId: ctx.userId,
        },
        include: {
          author: {
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
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      // Audit logging
      await auditLogger.logUserAction("post.created", ctx.userId, {
        severity: "low",
        category: "user_action",
        resourceType: "post",
        resourceId: post.id,
        metadata: {
          clubId: input.clubId,
          clubName: post.club.name,
          contentLength: input.content.length,
          imageCount: input.images?.length || 0,
        },
      });

      return post;
    }),

  // Get posts for a club
  getClubPosts: publicProcedure
    .input(z.object({
      clubId: z.string(),
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
    }))
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for read operations
      await createRateLimitMiddleware("READ_OPERATIONS")(ctx);
      
      // Input validation
      if (!SecurityValidator.validateId(input.clubId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid club ID" });
      }
      if (input.cursor && !SecurityValidator.validateId(input.cursor)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid cursor" });
      }
      
      return next();
    })
    .query(async ({ ctx, input }) => {
      // First, check if the club exists and its privacy settings
      const club = await ctx.db.club.findUnique({
        where: { id: input.clubId },
        select: { 
          id: true,
          isPrivate: true,
          name: true
        },
      });

      if (!club) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Club not found",
        });
      }

      // Check user's membership and site role
      let userMembership = null;
      let isSiteAdmin = false;

      if (ctx.userId) {
        // Get user's site role
        const user = await ctx.db.user.findUnique({
          where: { id: ctx.userId },
          select: { siteRole: true },
        });
        
        isSiteAdmin = user?.siteRole === "SUPER_ADMIN" || user?.siteRole === "ADMIN";

        // Get club membership
        userMembership = await ctx.db.clubMember.findUnique({
          where: {
            userId_clubId: {
              userId: ctx.userId,
              clubId: input.clubId,
            },
          },
        });
      }

      // Determine access: site admins, club members, or public club visitors
      const hasAccess = isSiteAdmin || userMembership || !club.isPrivate;

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This is a private club. Join to view posts.",
        });
      }

      const posts = await ctx.db.clubPost.findMany({
        where: {
          clubId: input.clubId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
          likes: {
            where: ctx.userId ? {
              userId: ctx.userId,
            } : {
              // For unauthenticated users, don't fetch any likes
              userId: "non-existent-id"
            },
            select: {
              id: true,
            },
          },
          // Fetch ALL comments for the post, not just top-level
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
              likes: {
                where: ctx.userId ? {
                  userId: ctx.userId,
                } : {
                  // For unauthenticated users, don't fetch any likes
                  userId: "non-existent-id"
                },
                select: {
                  id: true,
                },
              },
              _count: {
                select: {
                  likes: true,
                  replies: true, // This count is still useful
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
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

      // Collect all unique user IDs for enrichment
      const allUserIds = new Set<string>();
      
      // Add post authors
      posts.forEach(post => {
        if (post.author?.id) {
          allUserIds.add(post.author.id);
        }
      });
      
      // Add comment authors (including nested comments)
      posts.forEach(post => {
        post.comments?.forEach(comment => {
          if (comment.author?.id) {
            allUserIds.add(comment.author.id);
          }
        });
      });

      // Enrich user data with fresh Clerk information
      const enrichedUsers = await enrichUsersWithClerkData(Array.from(allUserIds));

      // Helper function to recursively enrich comment authors
      const enrichCommentsRecursively = (comments: any[]): any[] => {
        return comments.map(comment => {
          const enrichedAuthor = enrichedUsers.get(comment.author.id);
          const enrichedComment = {
            ...comment,
            author: enrichedAuthor ? transformEnrichedUser(enrichedAuthor) : comment.author,
            isLikedByUser: comment.likes?.length > 0,
            likes: undefined, // Remove the likes array
          };

          // Recursively enrich replies if they exist
          if (comment.replies && comment.replies.length > 0) {
            enrichedComment.replies = enrichCommentsRecursively(comment.replies);
          }

          return enrichedComment;
        });
      };

      // Manually build the threaded comment structure with enriched data
      const postsWithThreadedComments = posts.map(post => {
        const comments = post.comments || [];
        const commentMap = new Map(comments.map(c => [c.id, { ...c, replies: [] as any[] }]));
        const rootComments: any[] = [];

        for (const comment of comments) {
          if (comment.parentId && commentMap.has(comment.parentId)) {
            const parent = commentMap.get(comment.parentId)!;
            parent.replies.push(commentMap.get(comment.id)!);
          } else {
            rootComments.push(commentMap.get(comment.id)!);
          }
        }

        // Enrich post author
        const enrichedPostAuthor = enrichedUsers.get(post.author.id);
        
        return {
          ...post,
          author: enrichedPostAuthor ? transformEnrichedUser(enrichedPostAuthor) : post.author,
          comments: enrichCommentsRecursively(rootComments),
          isLikedByUser: post.likes.length > 0,
          likes: undefined,
        };
      });

      const nextCursor = posts.length === input.limit ? posts[posts.length - 1]?.id : null;

      return {
        posts: postsWithThreadedComments,
        nextCursor,
      };
    }),

  // Get post by ID with comments
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for read operations
      await createRateLimitMiddleware("READ_OPERATIONS")(ctx);
      
      // Input validation
      if (!SecurityValidator.validateId(input.id)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid post ID" });
      }
      
      return next();
    })
    .query(async ({ ctx, input }) => {
      const post = await ctx.db.clubPost.findUnique({
        where: { id: input.id },
        include: {
          author: {
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
              isPrivate: true,
            },
          },
          likes: {
            where: {
              userId: ctx.userId,
            },
            select: {
              id: true,
            },
          },
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      // Check if user is a member of the club
      const membership = await ctx.db.clubMember.findUnique({
        where: {
          userId_clubId: {
            userId: ctx.userId,
            clubId: post.club.id,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Must be a club member to view this post",
        });
      }

      // Collect all unique user IDs for enrichment
      const allUserIds = new Set<string>();
      
      // Add post author
      if (post.author?.id) {
        allUserIds.add(post.author.id);
      }
      
      // Add comment authors
      post.comments?.forEach(comment => {
        if (comment.author?.id) {
          allUserIds.add(comment.author.id);
        }
      });

      // Enrich user data with fresh Clerk information
      const enrichedUsers = await enrichUsersWithClerkData(Array.from(allUserIds));

      // Enrich post author
      const enrichedPostAuthor = enrichedUsers.get(post.author.id);
      
      // Enrich comment authors
      const enrichedComments = post.comments?.map(comment => {
        const enrichedAuthor = enrichedUsers.get(comment.author.id);
        return {
          ...comment,
          author: enrichedAuthor ? transformEnrichedUser(enrichedAuthor) : comment.author,
        };
      });

      return {
        ...post,
        author: enrichedPostAuthor ? transformEnrichedUser(enrichedPostAuthor) : post.author,
        comments: enrichedComments,
        isLikedByUser: post.likes.length > 0,
        likes: undefined, // Remove the likes array
      };
    }),

  // Like/unlike a post
  toggleLike: protectedProcedure
    .input(LikePostSchema)
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for social interactions
      await createRateLimitMiddleware("SOCIAL_LIKE")(ctx);
      
      // Input validation
      if (!SecurityValidator.validateId(input.postId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid post ID" });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.clubPost.findUnique({
        where: { id: input.postId },
        include: {
          club: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      // Check if user is a member of the club
      const membership = await ctx.db.clubMember.findUnique({
        where: {
          userId_clubId: {
            userId: ctx.userId,
            clubId: post.club.id,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Must be a club member to like posts",
        });
      }

      // Check if user already liked the post
      const existingLike = await ctx.db.postLike.findUnique({
        where: {
          userId_postId: {
            userId: ctx.userId,
            postId: input.postId,
          },
        },
      });

      let liked: boolean;
      let action: string;

      if (existingLike) {
        // Unlike the post
        await ctx.db.postLike.delete({
          where: {
            userId_postId: {
              userId: ctx.userId,
              postId: input.postId,
            },
          },
        });
        liked = false;
        action = "post.unliked";
      } else {
        // Like the post
        await ctx.db.postLike.create({
          data: {
            userId: ctx.userId,
            postId: input.postId,
          },
        });
        liked = true;
        action = "post.liked";
      }

      // Audit logging
      await auditLogger.logUserAction(action as "post.liked" | "post.unliked", ctx.userId, {
        severity: "low",
        category: "user_action",
        resourceType: "post",
        resourceId: input.postId,
        metadata: {
          clubId: post.club.id,
          clubName: post.club.name,
          liked,
        },
      });

      return { liked };
    }),

  // Comment on a post
  addComment: protectedProcedure
    .input(CommentOnPostSchema)
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for social interactions
      await createRateLimitMiddleware("SOCIAL_COMMENT")(ctx);
      
      // Input validation
      if (!SecurityValidator.validateNoXSS(input.content)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid comment content" });
      }
      if (!SecurityValidator.validateId(input.postId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid post ID" });
      }
      if (input.parentId && !SecurityValidator.validateId(input.parentId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid parent comment ID" });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.clubPost.findUnique({
        where: { id: input.postId },
        include: {
          club: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      // Check if user is a member of the club
      const membership = await ctx.db.clubMember.findUnique({
        where: {
          userId_clubId: {
            userId: ctx.userId,
            clubId: post.club.id,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Must be a club member to comment on posts",
        });
      }

      // Validate parent comment if provided
      if (input.parentId) {
        const parentComment = await ctx.db.postComment.findUnique({
          where: { id: input.parentId },
        });
        
        if (!parentComment || parentComment.postId !== input.postId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid parent comment",
          });
        }
      }

      const comment = await ctx.db.postComment.create({
        data: {
          content: input.content,
          authorId: ctx.userId,
          postId: input.postId,
          parentId: input.parentId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
        },
      });

      // Enrich comment author data with fresh Clerk information
      const enrichedUsers = await enrichUsersWithClerkData([comment.author.id]);
      const enrichedAuthor = enrichedUsers.get(comment.author.id);

      // Audit logging
      await auditLogger.logUserAction("post.commented", ctx.userId, {
        severity: "low",
        category: "user_action",
        resourceType: "post",
        resourceId: input.postId,
        metadata: {
          clubId: post.club.id,
          clubName: post.club.name,
          commentId: comment.id,
          contentLength: input.content.length,
        },
      });

      return {
        ...comment,
        author: enrichedAuthor ? transformEnrichedUser(enrichedAuthor) : comment.author,
      };
    }),

  // Update post (author only)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().min(1).max(2000).optional(),
        images: z.array(z.string()).max(10).optional(),
      })
    )
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for content updates
      await createRateLimitMiddleware("CONTENT_CREATE")(ctx);
      
      // Input validation
      if (!SecurityValidator.validateId(input.id)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid post ID" });
      }
      if (input.content && !SecurityValidator.validateNoXSS(input.content)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid post content" });
      }
      if (input.images) {
        for (const imageUrl of input.images) {
          if (!SecurityValidator.validateImageUrl(imageUrl)) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid image URL" });
          }
        }
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Check if user owns the post
      const existingPost = await ctx.db.clubPost.findUnique({
        where: { id },
        include: {
          club: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!existingPost) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      if (existingPost.authorId !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Can only edit your own posts",
        });
      }

      const updatedPost = await ctx.db.clubPost.update({
        where: { id },
        data: updateData,
        include: {
          author: {
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
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      // Audit logging
      await auditLogger.logUserAction("post.updated", ctx.userId, {
        severity: "low",
        category: "user_action",
        resourceType: "post",
        resourceId: id,
        metadata: {
          clubId: existingPost.club.id,
          clubName: existingPost.club.name,
          changes: updateData,
        },
      });

      return updatedPost;
    }),

  // Delete post (author or admin only)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for admin operations
      await createRateLimitMiddleware("ADMIN_OPERATIONS")(ctx);
      
      // Input validation
      if (!SecurityValidator.validateId(input.id)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid post ID" });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.clubPost.findUnique({
        where: { id: input.id },
        include: {
          club: {
            select: {
              id: true,
              name: true,
            },
          },
          author: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      // Check if user can delete (author or club admin/moderator)
      const membership = await ctx.db.clubMember.findUnique({
        where: {
          userId_clubId: {
            userId: ctx.userId,
            clubId: post.club.id,
          },
        },
      });

      const canDelete = 
        post.authorId === ctx.userId || 
        (membership && ["ADMIN", "MODERATOR"].includes(membership.role));

      if (!canDelete) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Can only delete your own posts or if you're a club admin/moderator",
        });
      }

      await ctx.db.clubPost.delete({
        where: { id: input.id },
      });

      // Audit logging
      await auditLogger.logUserAction("post.deleted", ctx.userId, {
        severity: "medium",
        category: "moderation",
        resourceType: "post",
        resourceId: input.id,
        metadata: {
          clubId: post.club.id,
          clubName: post.club.name,
          authorName: post.author.name,
          deletedByAuthor: post.authorId === ctx.userId,
        },
      });

      return { success: true };
    }),

  // Delete comment (author or admin only)
  deleteComment: protectedProcedure
    .input(z.object({ id: z.string() }))
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for admin operations
      await createRateLimitMiddleware("ADMIN_OPERATIONS")(ctx);
      
      // Input validation
      if (!SecurityValidator.validateId(input.id)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid comment ID" });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.postComment.findUnique({
        where: { id: input.id },
        include: {
          author: {
            select: {
              name: true,
            },
          },
          post: {
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

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      // Check if user can delete (author or club admin/moderator)
      const membership = await ctx.db.clubMember.findUnique({
        where: {
          userId_clubId: {
            userId: ctx.userId,
            clubId: comment.post.club.id,
          },
        },
      });

      const canDelete = 
        comment.authorId === ctx.userId || 
        (membership && ["ADMIN", "MODERATOR"].includes(membership.role));

      if (!canDelete) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Can only delete your own comments or if you're a club admin/moderator",
        });
      }

      await ctx.db.postComment.delete({
        where: { id: input.id },
      });

      // Audit logging
      await auditLogger.logUserAction("post.comment_deleted", ctx.userId, {
        severity: "medium",
        category: "moderation",
        resourceType: "post",
        resourceId: comment.post.id,
        metadata: {
          clubId: comment.post.club.id,
          clubName: comment.post.club.name,
          commentId: input.id,
          authorName: comment.author.name,
          deletedByAuthor: comment.authorId === ctx.userId,
        },
      });

      return { success: true };
    }),

  // Like/unlike a comment
  toggleCommentLike: protectedProcedure
    .input(LikeCommentSchema)
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for social interactions
      await createRateLimitMiddleware("SOCIAL_LIKE")(ctx);
      
      // Input validation
      if (!SecurityValidator.validateId(input.commentId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid comment ID" });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.postComment.findUnique({
        where: { id: input.commentId },
        include: {
          post: {
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

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      // Check if user is a member of the club
      const membership = await ctx.db.clubMember.findUnique({
        where: {
          userId_clubId: {
            userId: ctx.userId,
            clubId: comment.post.club.id,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Must be a club member to like comments",
        });
      }

      // Check if user already liked the comment
      const existingLike = await ctx.db.commentLike.findUnique({
        where: {
          userId_commentId: {
            userId: ctx.userId,
            commentId: input.commentId,
          },
        },
      });

      let liked: boolean;
      let action: string;

      if (existingLike) {
        // Unlike the comment
        await ctx.db.commentLike.delete({
          where: {
            userId_commentId: {
              userId: ctx.userId,
              commentId: input.commentId,
            },
          },
        });
        liked = false;
        action = "comment.unliked";
      } else {
        // Like the comment
        await ctx.db.commentLike.create({
          data: {
            userId: ctx.userId,
            commentId: input.commentId,
          },
        });
        liked = true;
        action = "comment.liked";
      }

      // Audit logging
      await auditLogger.logUserAction(action as "comment.liked" | "comment.unliked", ctx.userId, {
        severity: "low",
        category: "user_action",
        resourceType: "post",
        resourceId: input.commentId,
        metadata: {
          clubId: comment.post.club.id,
          clubName: comment.post.club.name,
          postId: comment.post.id,
          liked,
        },
      });

      return { liked };
    }),

}); 