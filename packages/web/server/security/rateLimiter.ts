import { TRPCError } from "@trpc/server";
import { auditLogger } from "../audit/auditLogger";

// ==================== RATE LIMIT CONFIGURATION ====================

export interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Max requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (context: any) => string;
  onLimitReached?: (context: any) => Promise<void>;
}

export const RATE_LIMIT_CONFIGS = {
  // General API limits
  GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,         // 1000 requests per 15 minutes
  },
  
  // Authentication limits
  AUTH_LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,            // 5 login attempts per 15 minutes
    skipSuccessfulRequests: true,
  },
  
  AUTH_SIGNUP: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,            // 3 signup attempts per hour
  },
  
  AUTH_PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,            // 3 password reset attempts per hour
  },
  
  // Content creation limits
  CONTENT_CREATE: {
    windowMs: 5 * 60 * 1000,  // 5 minutes
    maxRequests: 10,           // 10 posts/events/challenges per 5 minutes
  },
  
  CONTENT_UPLOAD: {
    windowMs: 5 * 60 * 1000,  // 5 minutes
    maxRequests: 20,           // 20 file uploads per 5 minutes
  },
  
  // Social interaction limits
  SOCIAL_LIKE: {
    windowMs: 1 * 60 * 1000,  // 1 minute
    maxRequests: 60,           // 60 likes per minute
  },
  
  SOCIAL_COMMENT: {
    windowMs: 5 * 60 * 1000,  // 5 minutes
    maxRequests: 30,           // 30 comments per 5 minutes
  },
  
  SOCIAL_FOLLOW: {
    windowMs: 5 * 60 * 1000,  // 5 minutes
    maxRequests: 50,           // 50 follow/unfollow actions per 5 minutes
  },
  
  // Club operations
  CLUB_CREATE: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 3,                 // 3 clubs per day
  },
  
  CLUB_JOIN: {
    windowMs: 5 * 60 * 1000,  // 5 minutes
    maxRequests: 20,           // 20 club joins per 5 minutes
  },
  
  // Admin operations (more lenient for verified admins)
  ADMIN_OPERATIONS: {
    windowMs: 5 * 60 * 1000,  // 5 minutes
    maxRequests: 200,          // 200 admin operations per 5 minutes
  },
  
  // Search and read operations
  SEARCH: {
    windowMs: 1 * 60 * 1000,  // 1 minute
    maxRequests: 100,          // 100 searches per minute
  },
  
  READ_OPERATIONS: {
    windowMs: 1 * 60 * 1000,  // 1 minute
    maxRequests: 300,          // 300 read operations per minute
  },
} as const;

// ==================== IN-MEMORY RATE LIMITER ====================

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;
  
  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }
  
  async checkLimit(key: string, config: RateLimitConfig): Promise<{
    allowed: boolean;
    remainingRequests: number;
    resetTime: number;
  }> {
    const now = Date.now();
    const entry = this.store.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + config.windowMs,
        firstRequest: now,
      };
      this.store.set(key, newEntry);
      
      return {
        allowed: true,
        remainingRequests: config.maxRequests - 1,
        resetTime: newEntry.resetTime,
      };
    }
    
    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: entry.resetTime,
      };
    }
    
    // Increment counter
    entry.count++;
    this.store.set(key, entry);
    
    return {
      allowed: true,
      remainingRequests: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }
  
  async resetLimit(key: string): Promise<void> {
    this.store.delete(key);
  }
  
  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.store.entries());
    for (const [key, entry] of entries) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
  
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Singleton instance
const rateLimiter = new InMemoryRateLimiter();

// ==================== RATE LIMIT MIDDLEWARE ====================

export function createRateLimitMiddleware(
  configName: keyof typeof RATE_LIMIT_CONFIGS,
  customConfig?: Partial<RateLimitConfig>
) {
  return async (ctx: any) => {
    const config = { ...RATE_LIMIT_CONFIGS[configName], ...customConfig };
    
    // Generate rate limit key
    const key = config.keyGenerator ? 
      config.keyGenerator(ctx) : 
      generateDefaultKey(ctx, configName);
    
    // Check rate limit
    const result = await rateLimiter.checkLimit(key, config);
    
    if (!result.allowed) {
      // Log rate limit violation
      await auditLogger.logSecurityEvent("security.rate_limit_exceeded", {
        userId: ctx.userId,
        ipAddress: ctx.req?.ip,
        userAgent: ctx.req?.get?.('user-agent'),
        metadata: {
          endpoint: configName,
          key,
          resetTime: result.resetTime,
        },
        severity: "medium",
      });
      
      // Execute custom handler if provided
      if (config.onLimitReached) {
        await config.onLimitReached(ctx);
      }
      
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`,
      });
    }
    
    // Add rate limit info to context
    ctx.rateLimit = {
      remainingRequests: result.remainingRequests,
      resetTime: result.resetTime,
      config: configName,
    };
    
    return ctx;
  };
}

// ==================== KEY GENERATORS ====================

function generateDefaultKey(ctx: any, endpoint: string): string {
  // For authenticated users, use userId
  if (ctx.userId) {
    return `user:${ctx.userId}:${endpoint}`;
  }
  
  // For anonymous users, use IP address
  const ip = ctx.req?.ip || ctx.req?.connection?.remoteAddress || 'unknown';
  return `ip:${ip}:${endpoint}`;
}

export function generateIPKey(ctx: any): string {
  const ip = ctx.req?.ip || ctx.req?.connection?.remoteAddress || 'unknown';
  return `ip:${ip}`;
}

export function generateUserKey(ctx: any): string {
  return ctx.userId ? `user:${ctx.userId}` : generateIPKey(ctx);
}

export function generateCombinedKey(ctx: any, suffix: string): string {
  const userPart = ctx.userId ? `user:${ctx.userId}` : generateIPKey(ctx);
  return `${userPart}:${suffix}`;
}

// ==================== SPECIALIZED RATE LIMITERS ====================

export class AuthRateLimiter {
  static async checkLoginAttempts(ctx: any, identifier: string) {
    const key = `login:${identifier}`;
    const result = await rateLimiter.checkLimit(key, RATE_LIMIT_CONFIGS.AUTH_LOGIN);
    
    if (!result.allowed) {
      await auditLogger.logSecurityEvent("auth.failed_login", {
        metadata: {
          identifier,
          reason: "rate_limit_exceeded",
          resetTime: result.resetTime,
        },
        ipAddress: ctx.req?.ip,
        userAgent: ctx.req?.get?.('user-agent'),
        severity: "high",
      });
      
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Too many login attempts. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`,
      });
    }
    
    return result;
  }
  
  static async resetLoginAttempts(identifier: string) {
    const key = `login:${identifier}`;
    await rateLimiter.resetLimit(key);
  }
}

export class ContentRateLimiter {
  static async checkContentCreation(ctx: any, contentType: string) {
    const key = generateUserKey(ctx);
    const config = RATE_LIMIT_CONFIGS.CONTENT_CREATE;
    
    const result = await rateLimiter.checkLimit(`${key}:create:${contentType}`, config);
    
    if (!result.allowed) {
      await auditLogger.logSecurityEvent("security.rate_limit_exceeded", {
        userId: ctx.userId,
        metadata: {
          contentType,
          action: "create",
          resetTime: result.resetTime,
        },
        ipAddress: ctx.req?.ip,
        severity: "medium",
      });
      
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS", 
        message: `Too many ${contentType} creations. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`,
      });
    }
    
    return result;
  }
}

// ==================== ADAPTIVE RATE LIMITING ====================

export class AdaptiveRateLimiter {
  private static suspiciousActivityThreshold = 5;
  
  static async checkAdaptiveLimit(ctx: any, baseConfig: RateLimitConfig, endpoint: string) {
    const config = { ...baseConfig };
    
    // Get user's recent activity (TODO: implement proper tracking)
    const activityCount = 0; // For now, assume normal activity
    
    // Adjust limits based on user behavior
    if (activityCount > this.suspiciousActivityThreshold) {
      // Reduce limits for suspicious users
      config.maxRequests = Math.floor(config.maxRequests * 0.5);
      
      await auditLogger.logSecurityEvent("security.suspicious_activity", {
        userId: ctx.userId,
        metadata: {
          activityCount,
          endpoint,
          adjustedLimit: config.maxRequests,
        },
        ipAddress: ctx.req?.ip,
        severity: "high",
      });
    }
    
    // Check the adapted limit
    const userKey = generateUserKey(ctx);
    const result = await rateLimiter.checkLimit(`${userKey}:${endpoint}`, config);
    
    if (!result.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded for ${endpoint}.`,
      });
    }
    
    return result;
  }
}

// ==================== RATE LIMIT UTILITIES ====================

export function getRateLimitHeaders(ctx: any) {
  if (!ctx.rateLimit) return {};
  
  const configName = ctx.rateLimit.config as keyof typeof RATE_LIMIT_CONFIGS;
  const config = RATE_LIMIT_CONFIGS[configName];
  
  return {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': ctx.rateLimit.remainingRequests.toString(),
    'X-RateLimit-Reset': new Date(ctx.rateLimit.resetTime).toISOString(),
  };
}

export function bypassRateLimit(ctx: any): boolean {
  // Site admins bypass most rate limits
  if (ctx.userSiteRole === "SUPER_ADMIN") {
    return true;
  }
  
  // Allow bypass for internal service calls
  if (ctx.req?.headers?.['x-internal-service']) {
    return true;
  }
  
  return false;
}

// ==================== EXPORTS ====================

export { rateLimiter };
export default createRateLimitMiddleware; 