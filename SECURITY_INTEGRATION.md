# 🛡️ Security Integration Guide

## Overview

This guide shows how to integrate the comprehensive security system into your automotive club platform. The security system includes:

- **Rate Limiting**: Prevent abuse and DoS attacks
- **Input Validation**: XSS, SQL injection, and data sanitization  
- **Permission System**: Role-based access control
- **Audit Logging**: Track all actions for compliance
- **Security Headers**: Protect against common attacks

## 🚀 Quick Start Integration

### 1. Update Existing Club Router

```typescript
// packages/web/server/api/routers/club.ts
import { createRateLimitMiddleware, ContentRateLimiter } from "../security/rateLimiter";
import { CommonValidators, SecurityValidator } from "../security/validation";
import { requireClubPermission } from "../auth/permissions";
import { auditLogger } from "../audit/auditLogger";

export const clubRouter = createTRPCRouter({
  
  // SECURE: Club creation with all security layers
  create: protectedProcedure
    .input(ContentValidationSchemas.club)
    .use(async ({ ctx, next, input }) => {
      // 1. Rate limiting
      await createRateLimitMiddleware("CLUB_CREATE")(ctx);
      
      // 2. Additional security validation
      if (!SecurityValidator.validateNoXSS(input.description || "")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid content detected",
        });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      // 3. Input validation (automatic via schema)
      const validatedInput = CommonValidators.createClub(input);
      
      // 4. Business logic
      const club = await ctx.db.club.create({
        data: {
          ...validatedInput,
          creatorId: ctx.userId,
        },
      });
      
      // 5. Audit logging
      await auditLogger.logUserAction("club.created", ctx.userId, {
        resourceType: "club",
        resourceId: club.id,
        metadata: { clubName: club.name },
        ipAddress: ctx.req?.ip,
        userAgent: ctx.req?.get?.('user-agent'),
      });
      
      return club;
    }),

  // SECURE: Post creation with club permissions
  createPost: protectedProcedure
    .input(ContentValidationSchemas.post)
    .use(async ({ ctx, next, input }) => {
      // Rate limiting
      await ContentRateLimiter.checkContentCreation(ctx, "post");
      
      // Permission check
      await requireClubPermission(
        (input) => input.clubId,
        "posts:create"
      )(ctx, input);
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      const validatedInput = CommonValidators.createPost(input);
      
      const post = await ctx.db.clubPost.create({
        data: {
          content: validatedInput.content,
          clubId: validatedInput.clubId,
          authorId: ctx.userId,
        },
      });
      
      await auditLogger.logUserAction("post.created", ctx.userId, {
        resourceType: "post",
        resourceId: post.id,
        metadata: { clubId: post.clubId },
      });
      
      return post;
    }),
});
```

### 2. Secure Admin Operations

```typescript
// packages/web/server/api/routers/admin.ts
export const adminRouter = createTRPCRouter({
  
  // SECURE: User management with super admin checks
  banUser: protectedProcedure
    .input(z.object({
      userId: z.string().uuid(),
      reason: z.string().min(10).max(500),
      duration: z.number().optional(),
    }))
    .use(async ({ ctx, next }) => {
      // Rate limit admin operations
      await createRateLimitMiddleware("ADMIN_OPERATIONS")(ctx);
      
      // Check admin permissions
      const user = await getUserWithPermissions(ctx, ctx.userId);
      if (user.siteRole !== "SUPER_ADMIN" && user.siteRole !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Insufficient permissions",
        });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      // Prevent self-ban
      if (input.userId === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot ban yourself",
        });
      }
      
      // Implement ban logic here...
      
      // High-severity audit log
      await auditLogger.logAdminAction("user.banned", ctx.userId, {
        targetUserId: input.userId,
        metadata: { reason: input.reason, duration: input.duration },
        severity: "critical",
      });
      
      return { success: true };
    }),
    
  // SECURE: Get audit logs (admin only)
  getAuditLogs: protectedProcedure
    .input(z.object({
      userId: z.string().optional(),
      action: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .use(async ({ ctx, next }) => {
      const user = await getUserWithPermissions(ctx, ctx.userId);
      if (user.siteRole !== "SUPER_ADMIN" && user.siteRole !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }
      return next();
    })
    .query(async ({ ctx, input }) => {
      const logs = await auditLogger.getLogs({
        userId: input.userId,
        action: input.action,
        startDate: input.startDate,
        endDate: input.endDate,
        limit: input.limit,
        offset: input.offset,
      });
      
      // Log access to audit logs
      await auditLogger.logAdminAction("system.audit_logs_accessed", ctx.userId, {
        metadata: { filters: input },
      });
      
      return logs;
    }),
});
```

## 🔧 Applying Security to All Routes

### Security Middleware Factory Pattern

```typescript
// packages/web/server/security/factory.ts
export function createSecureEndpoint(config: {
  rateLimitType?: keyof typeof RATE_LIMIT_CONFIGS;
  requireAuth?: boolean;
  requirePermission?: {
    type: "site" | "club";
    permission: string;
    resourceIdExtractor?: (input: any) => string;
  };
  validation?: z.ZodSchema<any>;
  additionalChecks?: (input: any, ctx: any) => Promise<void>;
}) {
  return (baseRoute: typeof publicProcedure | typeof protectedProcedure) => {
    let route = baseRoute;
    
    // Add input validation
    if (config.validation) {
      route = route.input(config.validation);
    }
    
    // Add security middleware
    route = route.use(async ({ ctx, next, input }) => {
      // Rate limiting
      if (config.rateLimitType) {
        await createRateLimitMiddleware(config.rateLimitType)(ctx);
      }
      
      // Permission checking
      if (config.requirePermission) {
        if (config.requirePermission.type === "club") {
          await requireClubPermission(
            config.requirePermission.resourceIdExtractor || ((i: any) => i.clubId),
            config.requirePermission.permission as any
          )(ctx, input);
        }
      }
      
      // Additional custom checks
      if (config.additionalChecks) {
        await config.additionalChecks(input, ctx);
      }
      
      return next();
    });
    
    return route;
  };
}

// Usage examples:
export const secureClubPost = createSecureEndpoint({
  rateLimitType: "CONTENT_CREATE",
  requireAuth: true,
  requirePermission: {
    type: "club", 
    permission: "posts:create",
  },
  validation: ContentValidationSchemas.post,
  additionalChecks: async (input, ctx) => {
    if (!SecurityValidator.validateNoXSS(input.content)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid content" });
    }
  },
})(protectedProcedure);
```

## 🎯 Frontend Security Integration

### Rate Limit Headers Display

```typescript
// packages/web/lib/api-client.ts
export const apiClient = {
  async makeRequest(endpoint: string, options: RequestInit) {
    const response = await fetch(endpoint, options);
    
    // Display rate limit info to users
    const rateLimitLimit = response.headers.get('X-RateLimit-Limit');
    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
    const rateLimitReset = response.headers.get('X-RateLimit-Reset');
    
    if (rateLimitRemaining && parseInt(rateLimitRemaining) < 10) {
      // Show warning to user about approaching rate limit
      console.warn(`Rate limit warning: ${rateLimitRemaining} requests remaining`);
    }
    
    if (response.status === 429) {
      const resetTime = new Date(rateLimitReset || Date.now() + 60000);
      throw new Error(`Rate limit exceeded. Try again at ${resetTime.toLocaleTimeString()}`);
    }
    
    return response;
  }
};
```

### Input Sanitization on Frontend

```typescript
// packages/web/components/forms/SecureForm.tsx
import { SecurityValidator } from "@/server/security/validation";

export function SecureForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const handleSubmit = (data: any) => {
    // Client-side validation (never trust client-side only!)
    if (!SecurityValidator.validateNoXSS(data.content)) {
      toast.error("Invalid content detected");
      return;
    }
    
    if (!SecurityValidator.validateNoSQLInjection(data.title)) {
      toast.error("Invalid characters in title");
      return;
    }
    
    onSubmit(data);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## 📊 Security Monitoring Dashboard

### Admin Security Dashboard Component

```typescript
// packages/web/app/admin/security/page.tsx
"use client";

export default function SecurityDashboard() {
  const { data: auditLogs } = api.admin.getAuditLogs.useQuery({
    limit: 50,
  });
  
  const { data: securityAlerts } = api.admin.getSecurityAlerts.useQuery();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Security Dashboard</h1>
      
      {/* Security Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Critical Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {securityAlerts?.critical || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">Suspicious Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {securityAlerts?.suspicious || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Rate Limit Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {securityAlerts?.rateLimitViolations || 0}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>User</th>
                <th>Severity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs?.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>{log.action}</td>
                  <td>{log.user?.name || log.userId}</td>
                  <td>
                    <Badge 
                      variant={log.severity === "CRITICAL" ? "destructive" : "secondary"}
                    >
                      {log.severity}
                    </Badge>
                  </td>
                  <td>
                    <button 
                      onClick={() => showLogDetails(log)}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
```

## 🔐 Environment Configuration

### Security Environment Variables

```bash
# packages/web/.env.local

# Rate Limiting
REDIS_URL=redis://localhost:6379 # For production rate limiting
RATE_LIMIT_ENABLED=true

# Security Headers
CSP_REPORT_URI=https://your-csp-report-endpoint.com
HSTS_MAX_AGE=31536000

# Audit Logging
AUDIT_LOG_LEVEL=INFO
EXTERNAL_AUDIT_WEBHOOK=https://your-audit-service.com/webhook

# File Upload Security
MAX_FILE_SIZE=10485760 # 10MB
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf
VIRUS_SCAN_ENABLED=false # Enable in production

# API Security
API_RATE_LIMIT_REQUESTS=1000
API_RATE_LIMIT_WINDOW=900000 # 15 minutes
```

## 🚀 Deployment Security Checklist

### Pre-Deployment Security Verification

```typescript
// packages/web/scripts/security-check.ts
import { SecurityValidator } from "@/server/security/validation";
import { RATE_LIMIT_CONFIGS } from "@/server/security/rateLimiter";

async function runSecurityChecks() {
  console.log("🔒 Running security checks...");
  
  // 1. Verify rate limiting configs
  console.log("✓ Rate limiting configs:", Object.keys(RATE_LIMIT_CONFIGS).length);
  
  // 2. Test input validation
  const testInputs = [
    "<script>alert('xss')</script>",
    "'; DROP TABLE users; --",
    "../../../etc/passwd",
  ];
  
  for (const input of testInputs) {
    if (SecurityValidator.validateNoXSS(input)) {
      console.error("❌ XSS validation failed for:", input);
      process.exit(1);
    }
    if (SecurityValidator.validateNoSQLInjection(input)) {
      console.error("❌ SQL injection validation failed for:", input);
      process.exit(1);
    }
  }
  
  console.log("✓ Input validation working");
  
  // 3. Verify environment variables
  const requiredEnvVars = [
    "DATABASE_URL",
    "CLERK_SECRET_KEY",
    "NEXTAUTH_SECRET",
  ];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error("❌ Missing environment variable:", envVar);
      process.exit(1);
    }
  }
  
  console.log("✓ Environment variables configured");
  console.log("🎉 All security checks passed!");
}

runSecurityChecks().catch(console.error);
```

### Package.json Security Script

```json
{
  "scripts": {
    "security:check": "tsx scripts/security-check.ts",
    "security:audit": "pnpm audit --audit-level moderate",
    "security:deps": "pnpm outdated",
    "precommit": "pnpm security:check && pnpm security:audit"
  }
}
```

## 🎯 Next Steps

1. **Apply security to all existing routes** using the patterns above
2. **Set up monitoring** for security events and rate limit violations  
3. **Configure production security headers** in your deployment
4. **Test security features** with the provided examples
5. **Train your team** on secure coding practices

## 🚨 Security Reminders

- **Never trust client-side validation** - always validate on the server
- **Log security events** but be careful not to log sensitive data
- **Regularly update dependencies** to patch security vulnerabilities
- **Use HTTPS everywhere** in production
- **Implement proper session management** with secure cookies
- **Rate limit aggressively** for sensitive endpoints
- **Monitor audit logs** for suspicious patterns

Your automotive platform now has enterprise-grade security! 🛡️🚗 