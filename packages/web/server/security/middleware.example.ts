// Security Middleware Example
import { NextRequest, NextResponse } from "next/server";
import { auditLogger } from "../audit/auditLogger";

export class SecurityMiddleware {
  static async middleware(request: NextRequest): Promise<NextResponse> {
    const response = NextResponse.next();
    
    // Apply security headers
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "no-referrer");
    
    // Log suspicious activity
    const url = request.url;
    if (url.includes("../") || url.includes("<script")) {
      await auditLogger.logSecurityEvent("security.suspicious_activity", {
        metadata: { url },
        ipAddress: request.ip || "unknown",
        severity: "high",
      });
    }
    
    return response;
  }
}

// Usage in middleware.ts at root of Next.js app:
// export { default } from '@/server/security/middleware.example'; 