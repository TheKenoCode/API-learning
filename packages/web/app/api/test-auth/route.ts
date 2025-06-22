/**
 * Test Authentication Endpoint
 * 
 * DEBUG ENDPOINT - Not for production use
 * Provides authentication debugging information for development
 * 
 * Access: GET /api/test-auth
 */
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCurrentDatabaseUser } from "@/lib/auth-utils";

export async function GET() {
  try {
    // Get auth details from Clerk
    const authResult = await auth();
    const user = await currentUser();
    
    let dbUser = null;
    if (authResult.userId) {
      dbUser = await getCurrentDatabaseUser();
    }

    // Return structured debug information
    return NextResponse.json({
      auth: {
        userId: authResult.userId,
        sessionId: authResult.sessionId,
        orgId: authResult.orgId,
      },
      clerkUser: user ? {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
      } : null,
      databaseUser: dbUser,
    });
  } catch (error) {
    return NextResponse.json({ 
      error: "Authentication test failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 