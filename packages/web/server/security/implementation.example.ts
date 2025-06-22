// Security Implementation Example
import { TRPCError } from "@trpc/server";
import { createRateLimitMiddleware } from "./rateLimiter";
import { CommonValidators, SecurityValidator } from "./validation";
import { auditLogger } from "../audit/auditLogger";

// Example of a secure tRPC endpoint
export async function secureCreatePost(ctx: any, input: any) {
  // 1. Rate limiting
  await createRateLimitMiddleware("CONTENT_CREATE")(ctx);
  
  // 2. Input validation and sanitization
  const validatedInput = CommonValidators.createPost(input);
  
  // 3. Additional security checks
  if (!SecurityValidator.validateNoXSS(validatedInput.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid content detected",
    });
  }
  
  // 4. Create the resource
  const post = await ctx.db.clubPost.create({
    data: {
      content: validatedInput.content,
      clubId: validatedInput.clubId,
      authorId: ctx.userId,
    },
  });
  
  // 5. Audit logging
  await auditLogger.logUserAction("post.created", ctx.userId, {
    resourceType: "post",
    resourceId: post.id,
    metadata: { clubId: post.clubId },
  });
  
  return post;
}

// This demonstrates the security layers:
// 1. Rate limiting prevents abuse
// 2. Input validation prevents injection attacks
// 3. XSS checking prevents script injection
// 4. Audit logging tracks all actions
// 5. Permission checking (would be added via middleware) 