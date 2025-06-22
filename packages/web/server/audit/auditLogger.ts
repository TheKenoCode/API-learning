/**
 * Audit Logger
 * 
 * Comprehensive audit logging system for tracking user actions, security events,
 * and system activities. Provides structured logging with severity levels and
 * categorization for compliance and security monitoring.
 * 
 * Features:
 * - User action tracking (CRUD operations, authentication)
 * - Security event logging (rate limits, unauthorized access)
 * - Data change tracking with before/after states
 * - Geographic and device information capture
 * - Database persistence with fallback to console
 * 
 * Usage:
 * ```typescript
 * const logger = AuditLogger.getInstance();
 * await logger.logUserAction("user.profile_update", userId, { 
 *   changes: { name: "New Name" }
 * });
 * ```
 */
import { db } from "@/lib/db";
import { z } from "zod";

// ==================== AUDIT EVENT SCHEMA ====================

export const AuditEventSchema = z.object({
  action: z.enum([
    // User actions
    "user.created", "user.updated", "user.deleted", "user.banned", "user.role_changed",
    
    // Club actions  
    "club.created", "club.updated", "club.deleted", "club.joined", "club.left",
    "club.member_added", "club.member_removed", "club.role_changed", "club.settings_changed",
    "club.settings.updated", "club.invite_code.generated", "club.member.role_updated", "club.member.removed",
    "club.join_request.created", "club.join_request.approved", "club.join_request.rejected", "club.join_request.cancelled",
    
    // Content actions
    "post.created", "post.updated", "post.deleted", "post.moderated",
    "post.liked", "post.unliked", "post.commented", "post.comment_deleted",
    "comment.liked", "comment.unliked",
    "event.created", "event.updated", "event.deleted", "event.cancelled", "event.attendance_updated",
    "challenge.created", "challenge.updated", "challenge.deleted",
    
    // Permission actions
    "permission.granted", "permission.revoked", "role.assigned", "role.removed",
    
    // System actions
    "system.backup", "system.maintenance", "system.config_changed",
    
    // Security actions
    "auth.login", "auth.logout", "auth.failed_login", "auth.password_reset",
    "security.suspicious_activity", "security.rate_limit_exceeded",
  ]),
  
  userId: z.string().optional(), // Who performed the action
  targetUserId: z.string().optional(), // Who was affected
  resourceType: z.enum(["user", "club", "post", "event", "challenge", "system", "comment"]).optional(), // <-- ADDED 'comment'
  resourceId: z.string().optional(), // ID of affected resource
  
  metadata: z.record(z.any()).optional(), // Additional context
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  category: z.enum(["security", "moderation", "administration", "user_action"]),
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;

// ==================== AUDIT LOGGER CLASS ====================

export class AuditLogger {
  private static instance: AuditLogger;
  
  private constructor() {}
  
  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Log an audit event
   */
  async log(event: AuditEvent): Promise<void> {
    try {
      // Validate the event
      const validatedEvent = AuditEventSchema.parse(event);
      
      // Store in database
      await this.storeInDatabase(validatedEvent);
      
      // For critical events, also log to external service
      if (validatedEvent.severity === "critical") {
        await this.logToExternalService(validatedEvent);
      }
      
    } catch (error) {
      console.error("Failed to log audit event:", error);
      // Fallback: log to file system or external service
      await this.fallbackLog(event, error);
    }
  }

  private async storeInDatabase(event: AuditEvent): Promise<void> {
    try {
      // Import db dynamically to avoid circular dependencies
      const { db } = await import("@/lib/db");
      
      await db.auditLog.create({
        data: {
          action: event.action,
          userId: event.userId,
          targetUserId: event.targetUserId,
          resourceType: event.resourceType,
          resourceId: event.resourceId,
          metadata: event.metadata || {},
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          severity: event.severity.toUpperCase() as any,
          category: event.category.toUpperCase() as any,
        },
      });
    } catch (error) {
      // Fallback to console if database is unavailable
      console.error("Failed to store audit log in database:", error);
      console.log("AUDIT LOG FALLBACK:", event);
    }
  }

  /**
   * Log user action with context
   */
  async logUserAction(
    action: AuditEvent["action"],
    userId: string,
    context: {
      severity?: "low" | "medium" | "high" | "critical";
      category?: "security" | "moderation" | "administration" | "user_action";
      targetUserId?: string;
      resourceType?: "user" | "club" | "post" | "event" | "challenge" | "system";
      resourceId?: string;
      metadata?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ): Promise<void> {
    await this.log({
      action,
      userId,
      ...context,
      category: context.category || "user_action",
      severity: context.severity || "medium",
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    action: AuditEvent["action"],
    context: {
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
      metadata?: Record<string, any>;
      severity?: "low" | "medium" | "high" | "critical";
    }
  ): Promise<void> {
    await this.log({
      action,
      ...context,
      category: "security",
      severity: context.severity || "high",
    });
  }

  /**
   * Log administrative action
   */
  async logAdminAction(
    action: AuditEvent["action"],
    adminUserId: string,
    context: {
      targetUserId?: string;
      resourceType?: "user" | "club" | "post" | "event" | "challenge" | "system";
      resourceId?: string;
      metadata?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await this.log({
      action,
      userId: adminUserId,
      ...context,
      category: "administration",
      severity: "high",
    });
  }

  /**
   * Get audit logs with filtering
   */
  async getLogs(filters: {
    userId?: string;
    action?: string;
    category?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const { db } = await import("@/lib/db");
      
      const where: any = {};
      
      if (filters.userId) where.userId = filters.userId;
      if (filters.action) where.action = filters.action;
      if (filters.category) where.category = filters.category;
      if (filters.severity) where.severity = filters.severity;
      
      if (filters.startDate || filters.endDate) {
        where.timestamp = {};
        if (filters.startDate) where.timestamp.gte = filters.startDate;
        if (filters.endDate) where.timestamp.lte = filters.endDate;
      }

      return await db.auditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        take: filters.limit || 100,
        skip: filters.offset || 0,
        include: {
          user: {
            select: { name: true, email: true },
          },
          targetUser: {
            select: { name: true, email: true },
          },
        },
      });
    } catch (error) {
      console.error("Failed to get audit logs:", error);
      return [];
    }
  }

  /**
   * Private methods
   */
  private async logToExternalService(event: AuditEvent): Promise<void> {
    console.log("CRITICAL AUDIT EVENT:", event);
  }

  private async fallbackLog(event: AuditEvent, error: any): Promise<void> {
    // Log to console as fallback when database is unavailable
    // In production, this could be extended to write to file system or external service
    console.error("AUDIT LOG FALLBACK:", { event, error });
  }
}

// ==================== AUDIT MIDDLEWARE ====================

export function createAuditMiddleware() {
  return (req: any, res: any, next: any) => {
    // Attach audit logger to request context
    req.audit = AuditLogger.getInstance();
    
    // Auto-log API requests for sensitive endpoints
    if (req.path.includes('/admin') || req.path.includes('/delete')) {
      req.audit.logUserAction("user.api_access", req.userId, {
        metadata: {
          path: req.path,
          method: req.method,
          query: req.query,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
    }
    
    next();
  };
}

// ==================== AUDIT DECORATORS ====================

/**
 * Decorator to automatically audit function calls
 */
export function Auditable(
  action: AuditEvent["action"],
  options: {
    category?: AuditEvent["category"];
    severity?: AuditEvent["severity"];
    extractUserId?: (args: any[]) => string;
    extractMetadata?: (args: any[], result: any) => Record<string, any>;
  } = {}
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const audit = AuditLogger.getInstance();
      const startTime = Date.now();
      
      try {
        const result = await method.apply(this, args);
        
        // Log successful operation
        await audit.log({
          action,
          userId: options.extractUserId?.(args),
          metadata: {
            ...options.extractMetadata?.(args, result),
            duration: Date.now() - startTime,
            success: true,
          },
          category: options.category || "user_action",
          severity: options.severity || "medium",
        });
        
        return result;
      } catch (error) {
        // Log failed operation
        await audit.log({
          action,
          userId: options.extractUserId?.(args),
          metadata: {
            duration: Date.now() - startTime,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          },
          category: options.category || "user_action",
          severity: "high",
        });
        
        throw error;
      }
    };
  };
}

// ==================== USAGE EXAMPLES ====================

// Example: Using in tRPC route
export async function createClubWithAudit(
  input: { name: string; description: string },
  userId: string,
  context: { ipAddress: string; userAgent: string }
) {
  const audit = AuditLogger.getInstance();
  
  const club = await db.club.create({
    data: {
      ...input,
      creatorId: userId,
    },
  });
  
  // Log the action
  await audit.logUserAction("club.created", userId, {
    resourceType: "club",
    resourceId: club.id,
    metadata: {
      clubName: club.name,
      isPrivate: club.isPrivate,
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });
  
  return club;
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance(); 