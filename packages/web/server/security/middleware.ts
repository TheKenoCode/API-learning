import { NextRequest, NextResponse } from "next/server";
import helmet from "helmet";
import cors from "cors";
import { auditLogger } from "../audit/auditLogger";

// ==================== SECURITY HEADERS CONFIGURATION ====================

export const securityHeaders = {
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Next.js in development
        "'unsafe-eval'", // Required for Next.js in development
        "https://clerk.redline.app",
        "https://js.stripe.com",
        "https://maps.googleapis.com",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for CSS-in-JS
        "https://fonts.googleapis.com",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://*.redline.app",
        "https://images.clerk.dev",
        "https://img.clerk.com",
        "https://*.stripe.com",
        "https://maps.googleapis.com",
        "https://*.amazonaws.com", // For S3 images
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
      ],
      connectSrc: [
        "'self'",
        "https://api.redline.app",
        "https://clerk.redline.app",
        "https://api.stripe.com",
        "https://maps.googleapis.com",
      ],
      frameSrc: [
        "https://js.stripe.com",
        "https://hooks.stripe.com",
      ],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  
  // X-Frame-Options
  frameguard: {
    action: "deny",
  },
  
  // X-Content-Type-Options
  noSniff: true,
  
  // Referrer Policy
  referrerPolicy: {
    policy: ["no-referrer", "strict-origin-when-cross-origin"],
  },
  
  // Permissions Policy
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: ["self"],
    payment: ["self"],
  },
};

// ==================== CORS CONFIGURATION ====================

export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001", 
      "https://redline.app",
      "https://www.redline.app",
      "https://app.redline.app",
      // Add staging URLs
      "https://staging.redline.app",
      "https://dev.redline.app",
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log unauthorized origin attempts
      auditLogger.logSecurityEvent("security.unauthorized_origin", {
        metadata: { origin },
        severity: "medium",
      }).catch(console.error);
      
      callback(new Error("Not allowed by CORS"), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With", 
    "Content-Type",
    "Accept",
    "Authorization",
    "X-API-Key",
    "X-Client-Version",
  ],
  exposedHeaders: [
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining", 
    "X-RateLimit-Reset",
  ],
  maxAge: 86400, // 24 hours
};

// ==================== SECURITY MIDDLEWARE ====================

export class SecurityMiddleware {
  private static instance: SecurityMiddleware;
  
  private constructor() {}
  
  public static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware();
    }
    return SecurityMiddleware.instance;
  }

  /**
   * Main security middleware for Next.js API routes
   */
  async middleware(request: NextRequest): Promise<NextResponse> {
    const response = NextResponse.next();
    
    try {
      // Apply security headers
      this.applySecurityHeaders(response);
      
      // Log request for security monitoring
      await this.logRequest(request);
      
      // Check for suspicious patterns
      await this.checkSuspiciousActivity(request);
      
      // Validate request size
      this.validateRequestSize(request);
      
      return response;
    } catch (error) {
      console.error("Security middleware error:", error);
      
      // Log security error
      await auditLogger.logSecurityEvent("security.middleware_error", {
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          url: request.url,
          method: request.method,
        },
        ipAddress: this.getClientIP(request),
        userAgent: request.headers.get("user-agent") || undefined,
        severity: "high",
      });
      
      return response;
    }
  }

  /**
   * Apply security headers to response
   */
  private applySecurityHeaders(response: NextResponse): void {
    // Content Security Policy
    const cspDirectives = Object.entries(securityHeaders.contentSecurityPolicy.directives)
      .map(([key, values]) => `${this.camelToKebab(key)} ${values.join(" ")}`)
      .join("; ");
    
    response.headers.set("Content-Security-Policy", cspDirectives);
    
    // HTTP Strict Transport Security
    response.headers.set(
      "Strict-Transport-Security", 
      `max-age=${securityHeaders.hsts.maxAge}; includeSubDomains; preload`
    );
    
    // X-Frame-Options
    response.headers.set("X-Frame-Options", "DENY");
    
    // X-Content-Type-Options
    response.headers.set("X-Content-Type-Options", "nosniff");
    
    // Referrer Policy
    response.headers.set("Referrer-Policy", "no-referrer, strict-origin-when-cross-origin");
    
    // X-XSS-Protection (legacy but still useful)
    response.headers.set("X-XSS-Protection", "1; mode=block");
    
    // Permissions Policy
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self), payment=(self)");
    
    // Custom security headers
    response.headers.set("X-DNS-Prefetch-Control", "off");
    response.headers.set("X-Download-Options", "noopen");
    response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
    
    // Remove server information
    response.headers.delete("Server");
    response.headers.delete("X-Powered-By");
  }

  /**
   * Log requests for security monitoring
   */
  private async logRequest(request: NextRequest): Promise<void> {
    const sensitiveRoutes = ["/api/auth", "/api/admin", "/api/user"];
    const isSensitiveRoute = sensitiveRoutes.some(route => request.url.includes(route));
    
    if (isSensitiveRoute) {
      await auditLogger.logSecurityEvent("security.sensitive_route_access", {
        metadata: {
          url: request.url,
          method: request.method,
          referer: request.headers.get("referer"),
        },
        ipAddress: this.getClientIP(request),
        userAgent: request.headers.get("user-agent") || undefined,
        severity: "low",
      });
    }
  }

  /**
   * Check for suspicious activity patterns
   */
  private async checkSuspiciousActivity(request: NextRequest): Promise<void> {
    const suspiciousPatterns = [
      // SQL injection attempts
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bDROP\b)/i,
      // XSS attempts
      /<script[^>]*>/i,
      // Path traversal
      /\.\.\//,
      // Command injection
      /[;&|`$()]/,
    ];
    
    const url = decodeURIComponent(request.url);
    const userAgent = request.headers.get("user-agent") || "";
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url) || pattern.test(userAgent)) {
        await auditLogger.logSecurityEvent("security.suspicious_activity", {
          metadata: {
            pattern: pattern.source,
            url: request.url,
            userAgent,
          },
          ipAddress: this.getClientIP(request),
          severity: "critical",
        });
        
        // Could implement automatic blocking here
        break;
      }
    }
  }

  /**
   * Validate request size to prevent DoS attacks
   */
  private validateRequestSize(request: NextRequest): void {
    const contentLength = request.headers.get("content-length");
    const maxSize = 50 * 1024 * 1024; // 50MB max
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      throw new Error(`Request too large: ${contentLength} bytes`);
    }
  }

  /**
   * Get client IP address with proxy support
   */
  private getClientIP(request: NextRequest): string {
    // Check various headers for the real IP
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
      return forwardedFor.split(",")[0]?.trim() || "unknown";
    }
    
    const realIP = request.headers.get("x-real-ip");
    if (realIP) {
      return realIP;
    }
    
    const cfConnectingIP = request.headers.get("cf-connecting-ip");
    if (cfConnectingIP) {
      return cfConnectingIP;
    }
    
    // Fallback to request IP
    return request.ip || "unknown";
  }

  /**
   * Convert camelCase to kebab-case for CSP directives
   */
  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  }
}

// ==================== RATE LIMITING MIDDLEWARE ====================

export class RequestLogger {
  static async logAPIRequest(
    request: NextRequest,
    response: NextResponse,
    duration: number
  ): Promise<void> {
    const isError = response.status >= 400;
    const isServerError = response.status >= 500;
    
    if (isError || isServerError) {
      await auditLogger.logSecurityEvent(
        isServerError ? "security.server_error" : "security.client_error",
        {
          metadata: {
            url: request.url,
            method: request.method,
            status: response.status,
            duration,
          },
          ipAddress: SecurityMiddleware.getInstance()["getClientIP"](request),
          userAgent: request.headers.get("user-agent") || undefined,
          severity: isServerError ? "high" : "medium",
        }
      );
    }
  }
}

// ==================== SECURITY UTILITIES ====================

export class SecurityUtils {
  /**
   * Generate cryptographically secure random string
   */
  static generateSecureToken(length: number = 32): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    
    // Use crypto.getRandomValues for secure random generation
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      
      for (let i = 0; i < length; i++) {
        result += chars[array[i]! % chars.length];
      }
    } else {
      // Fallback for environments without crypto
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    
    return result;
  }

  /**
   * Hash sensitive data for logging
   */
  static hashForLogging(data: string): string {
    // Simple hash for logging purposes (not cryptographically secure)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Sanitize user input for safe logging
   */
  static sanitizeForLogging(input: any): any {
    if (typeof input === "string") {
      // Remove potentially sensitive patterns
      return input
        .replace(/password=\w+/gi, "password=***")
        .replace(/token=\w+/gi, "token=***")
        .replace(/key=\w+/gi, "key=***")
        .substring(0, 1000); // Limit length
    }
    
    if (typeof input === "object" && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        if (key.toLowerCase().includes("password") || 
            key.toLowerCase().includes("token") ||
            key.toLowerCase().includes("secret")) {
          sanitized[key] = "***";
        } else {
          sanitized[key] = this.sanitizeForLogging(value);
        }
      }
      return sanitized;
    }
    
    return input;
  }
}

// ==================== EXPORTS ====================

export const securityMiddleware = SecurityMiddleware.getInstance();
export { helmet, cors }; 