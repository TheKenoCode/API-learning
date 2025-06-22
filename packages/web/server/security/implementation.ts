import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../api/trpc";
import { createRateLimitMiddleware, ContentRateLimiter } from "./rateLimiter";
import { CommonValidators, SecurityValidator, validateAndSanitize, ContentValidationSchemas } from "./validation";
import { requireClubPermission, getUserWithPermissions } from "../auth/permissions";
import { auditLogger } from "../audit/auditLogger";
import { z } from "zod";

// ==================== SECURE ROUTER EXAMPLE ====================

export const secureExampleRouter = createTRPCRouter({
  
  // ==================== CLUB OPERATIONS ====================
  
  // Create club with comprehensive security
  createClub: protectedProcedure
    .input(ContentValidationSchemas.club)
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for club creation (3 clubs per day)
      await createRateLimitMiddleware("CLUB_CREATE")(ctx);
      
      // Additional security checks
      if (!SecurityValidator.validateNoSQLInjection(input.name)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid characters detected in club name",
        });
      }
      
      if (!SecurityValidator.validateNoXSS(input.description || "")) {
        throw new TRPCError({
          code: "BAD_REQUEST", 
          message: "Invalid content detected in description",
        });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      // Validate input (already done by schema, but double-check)
      const validatedInput = CommonValidators.createClub(input);
      
      // Check user permissions (site-level permission to create clubs)
      const user = await getUserWithPermissions(ctx, ctx.userId);
      const canCreate = user.siteRole === "SUPER_ADMIN" || 
                       user.siteRole === "ADMIN" || 
                       user.clubMemberships.length < 3; // Regular users limited to 3 clubs
      
      if (!canCreate) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You have reached the maximum number of clubs",
        });
      }
      
      // Create the club
      const club = await ctx.db.club.create({
        data: {
          ...validatedInput,
          creatorId: ctx.userId,
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
      
      // Audit log
      await auditLogger.logUserAction("club.created", ctx.userId, {
        resourceType: "club",
        resourceId: club.id,
        metadata: {
          clubName: club.name,
          isPrivate: club.isPrivate,
          city: club.city,
        },
        ipAddress: ctx.req?.ip,
        userAgent: ctx.req?.get?.('user-agent'),
      });
      
      return club;
    }),

  // ==================== CONTENT OPERATIONS ====================
  
  // Create post with security validation
  createPost: protectedProcedure
    .input(ContentValidationSchemas.post)
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for content creation
      await ContentRateLimiter.checkContentCreation(ctx, "post");
      
      // Club permission check
      await requireClubPermission(
        (input) => input.clubId,
        "posts:create"
      )(ctx, input);
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      // Validate and sanitize content
      const validatedInput = CommonValidators.createPost(input);
      
      // Additional content security checks
      if (!SecurityValidator.validateNoXSS(validatedInput.content)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid content detected",
        });
      }
      
      // Create the post
      const post = await ctx.db.clubPost.create({
        data: {
          content: validatedInput.content,
          clubId: validatedInput.clubId,
          authorId: ctx.userId,
          images: validatedInput.images || [],
        },
        include: {
          author: {
            select: { name: true, imageUrl: true },
          },
          club: {
            select: { name: true },
          },
        },
      });
      
      // Audit log
      await auditLogger.logUserAction("post.created", ctx.userId, {
        resourceType: "post",
        resourceId: post.id,
        metadata: {
          clubId: post.clubId,
          contentLength: post.content.length,
          hasImages: post.images.length > 0,
        },
        ipAddress: ctx.req?.ip,
        userAgent: ctx.req?.get?.('user-agent'),
      });
      
      return post;
    }),

  // ==================== SEARCH WITH SECURITY ====================
  
  // Secure search implementation
  search: publicProcedure
    .input(ContentValidationSchemas.search)
    .use(async ({ ctx, next }) => {
      // Rate limit searches
      await createRateLimitMiddleware("SEARCH")(ctx);
      return next();
    })
    .query(async ({ ctx, input }) => {
      // Validate and sanitize search input
      const validatedInput = CommonValidators.search(input);
      
      // Additional security checks
      if (!SecurityValidator.validateNoSQLInjection(validatedInput.query)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid search query",
        });
      }
      
      // Log search for analytics and security monitoring
      await auditLogger.logUserAction("system.search", ctx.userId || "anonymous", {
        metadata: {
          query: validatedInput.query,
          type: validatedInput.type,
          location: validatedInput.location,
        },
        ipAddress: ctx.req?.ip,
        userAgent: ctx.req?.get?.('user-agent'),
      });
      
      // Perform the search (simplified example)
      const results = await performSecureSearch(ctx, validatedInput);
      
      return results;
    }),

  // ==================== FILE UPLOAD WITH SECURITY ====================
  
  // Secure file upload
  uploadFile: protectedProcedure
    .input(z.object({
      file: z.object({
        filename: z.string(),
        mimetype: z.string(),
        size: z.number(),
        buffer: z.instanceof(Buffer),
      }),
      targetType: z.enum(["profile", "club", "post", "car"]),
      targetId: z.string().optional(),
    }))
    .use(async ({ ctx, next, input }) => {
      // Rate limit file uploads
      await createRateLimitMiddleware("CONTENT_UPLOAD")(ctx);
      
      // Validate file security
      SecurityValidator.validateFileUpload({
        filename: input.file.filename,
        mimetype: input.file.mimetype,
        size: input.file.size,
      });
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      // Additional file content validation could go here
      // (virus scanning, image validation, etc.)
      
      // Process and upload file (simplified)
      const uploadedFile = await processSecureFileUpload(input.file);
      
      // Audit log
      await auditLogger.logUserAction("content.file_uploaded", ctx.userId, {
        metadata: {
          filename: input.file.filename,
          mimetype: input.file.mimetype,
          size: input.file.size,
          targetType: input.targetType,
          targetId: input.targetId,
        },
        ipAddress: ctx.req?.ip,
        userAgent: ctx.req?.get?.('user-agent'),
      });
      
      return uploadedFile;
    }),

  // ==================== ADMIN OPERATIONS ====================
  
  // Secure admin operation example
  banUser: protectedProcedure
    .input(z.object({
      userId: z.string().uuid(),
      reason: z.string().min(10).max(500),
      duration: z.number().optional(), // Duration in hours, undefined = permanent
    }))
    .use(async ({ ctx, next, input }) => {
      // Rate limit admin operations
      await createRateLimitMiddleware("ADMIN_OPERATIONS")(ctx);
      
      // Check admin permissions
      const user = await getUserWithPermissions(ctx, ctx.userId);
      if (user.siteRole !== "SUPER_ADMIN" && user.siteRole !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Insufficient permissions for this operation",
        });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      // Validate input
      const validatedInput = validateAndSanitize(
        z.object({
          userId: z.string().uuid(),
          reason: z.string().min(10).max(500),
          duration: z.number().optional(),
        }),
        input
      );
      
      // Additional security: prevent self-ban
      if (validatedInput.userId === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot ban yourself",
        });
      }
      
      // Check target user exists and is not super admin
      const targetUser = await ctx.db.user.findUnique({
        where: { id: validatedInput.userId },
      });
      
      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      
      // Prevent banning super admins (if implemented)
      if ((targetUser as any).siteRole === "SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot ban super administrators",
        });
      }
      
      // Perform the ban (simplified - you'd implement user suspension logic)
      // await ctx.db.userSuspension.create({ ... });
      
      // Audit log with high severity
      await auditLogger.logAdminAction("user.banned", ctx.userId, {
        targetUserId: validatedInput.userId,
        resourceType: "user",
        resourceId: validatedInput.userId,
        metadata: {
          reason: validatedInput.reason,
          duration: validatedInput.duration,
          targetUserEmail: targetUser.email,
        },
        ipAddress: ctx.req?.ip,
        userAgent: ctx.req?.get?.('user-agent'),
      });
      
      return { success: true, message: "User banned successfully" };
    }),
});

// ==================== HELPER FUNCTIONS ====================

async function performSecureSearch(ctx: any, input: any) {
  // Implement secure search logic here
  // This would include proper SQL escaping, result filtering based on permissions, etc.
  
  const searchResults = {
    clubs: [],
    users: [],
    posts: [],
    events: [],
    challenges: [],
    cars: [],
  };
  
  // Example: Only return public content or content user has access to
  if (!input.type || input.type === "clubs") {
    searchResults.clubs = await ctx.db.club.findMany({
      where: {
        AND: [
          { isPrivate: false }, // Only public clubs in search
          {
            OR: [
              { name: { contains: input.query, mode: "insensitive" } },
              { description: { contains: input.query, mode: "insensitive" } },
            ],
          },
        ],
      },
      take: Math.min(input.limit || 20, 20), // Cap results
      include: {
        _count: {
          select: { members: true },
        },
      },
    });
  }
  
  return searchResults;
}

async function processSecureFileUpload(file: any) {
  // Implement secure file processing here
  // This would include:
  // - Virus scanning
  // - Image optimization/resizing
  // - File storage (S3, etc.)
  // - CDN distribution
  
  return {
    url: `https://cdn.example.com/uploads/${Date.now()}-${file.filename}`,
    filename: file.filename,
    size: file.size,
    mimetype: file.mimetype,
  };
}

// ==================== SECURITY MIDDLEWARE FACTORY ====================

export function createSecureEndpoint(
  config: {
    rateLimitType?: keyof typeof import("./rateLimiter").RATE_LIMIT_CONFIGS;
    requireAuth?: boolean;
    requirePermission?: {
      type: "site" | "club";
      permission: string;
      resourceIdExtractor?: (input: any) => string;
    };
    additionalValidation?: (input: any, ctx: any) => Promise<void>;
  } = {}
) {
  return (baseRoute: any) => {
    let route = baseRoute;
    
    // Add rate limiting
    if (config.rateLimitType) {
      route = route.use(async ({ ctx, next }: any) => {
        await createRateLimitMiddleware(config.rateLimitType!)(ctx);
        return next();
      });
    }
    
    // Add authentication requirement
    if (config.requireAuth) {
      route = protectedProcedure;
    }
    
    // Add permission checking
    if (config.requirePermission) {
      route = route.use(async ({ ctx, next, input }: any) => {
        if (config.requirePermission!.type === "club") {
          await requireClubPermission(
            config.requirePermission!.resourceIdExtractor || ((input: any) => input.clubId),
            config.requirePermission!.permission as any
          )(ctx, input);
        }
        // Add site permission checking here if needed
        return next();
      });
    }
    
    // Add custom validation
    if (config.additionalValidation) {
      route = route.use(async ({ ctx, next, input }: any) => {
        await config.additionalValidation!(input, ctx);
        return next();
      });
    }
    
    return route;
  };
}

// ==================== USAGE EXAMPLE ====================

// Example of using the secure endpoint factory
export const exampleSecureRoute = createSecureEndpoint({
  rateLimitType: "CONTENT_CREATE",
  requireAuth: true,
  requirePermission: {
    type: "club",
    permission: "posts:create",
    resourceIdExtractor: (input) => input.clubId,
  },
  additionalValidation: async (input, ctx) => {
    // Custom validation logic
    if (input.content && !SecurityValidator.validateNoXSS(input.content)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid content detected",
      });
    }
  },
})(publicProcedure)
  .input(ContentValidationSchemas.post)
  .mutation(async () => {
    // Your secure business logic here
    // Example: Create post with validated input
    return { success: true, message: "Operation completed securely" };
  }); 