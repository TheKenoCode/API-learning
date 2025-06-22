/**
 * Authentication Utilities
 * 
 * Helper functions for managing user authentication state between Clerk and our database.
 * Handles user creation, role checking, and membership verification.
 */
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { User } from "@prisma/client";

// Cache to prevent multiple concurrent user creation attempts
const userCreationCache = new Map<string, Promise<User | null>>();

/**
 * Get the current user from the database, creating them if they exist in Clerk but not in DB
 * 
 * @returns The database user record or null if not authenticated
 */
export async function getCurrentDatabaseUser(): Promise<User | null> {
  try {
    // Try to get current user from Clerk
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return null;
    }
    
    // Check if we're already creating this user
    const existingCreation = userCreationCache.get(clerkId);
    if (existingCreation) {
      return existingCreation;
    }
    
    // Find user in database
    const user = await db.user.findUnique({
      where: { clerkId },
    });
    
    // If user exists, return them
    if (user) {
      return user;
    }
    
    // If user doesn't exist, create them with caching
    const creationPromise = createUserFromClerk(clerkId);
    userCreationCache.set(clerkId, creationPromise);
    
    try {
      const createdUser = await creationPromise;
      return createdUser;
    } finally {
      // Clean up cache after creation attempt
      userCreationCache.delete(clerkId);
    }
    
  } catch (error) {
    console.error("Error in getCurrentDatabaseUser:", error);
    return null;
  }
}

/**
 * Create a database user from Clerk user data
 * Handles race conditions and existing email conflicts
 */
async function createUserFromClerk(clerkId: string): Promise<User | null> {
  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { clerkId },
    });
    
    if (existingUser) {
      return existingUser;
    }
    
    // Get user details from Clerk
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return null;
    }
    
    const primaryEmail = clerkUser.emailAddresses.find(
      email => email.id === clerkUser.primaryEmailAddressId
    );
    
    if (!primaryEmail) {
      return null;
    }
    
    const fullName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null;
    
    // Create new user
    const newUser = await db.user.create({
      data: {
        clerkId,
        email: primaryEmail.emailAddress,
        name: fullName,
        imageUrl: clerkUser.imageUrl || null,
      },
    });
    
    return newUser;
    
  } catch (error: any) {
    // Handle unique constraint violations (race conditions)
    if (error.code === 'P2002') {
      // Try to find the user that was created by another request
      const existingUser = await db.user.findUnique({
        where: { clerkId },
      });
      
      if (existingUser) {
        return existingUser;
      }
      
      // If user exists by email but not clerkId, update it
      if (error.meta?.target?.includes('email')) {
        try {
          const clerkUser = await currentUser();
          if (clerkUser) {
            const primaryEmail = clerkUser.emailAddresses.find(
              email => email.id === clerkUser.primaryEmailAddressId
            );
            
            if (primaryEmail) {
              const updatedUser = await db.user.update({
                where: { email: primaryEmail.emailAddress },
                data: { clerkId },
              });
              
              return updatedUser;
            }
          }
        } catch (updateError) {
          console.error("Failed to update existing user:", updateError);
        }
      }
    }
    
    console.error("Failed to create user:", error);
    return null;
  }
}

/**
 * Ensure a user exists in the database
 * 
 * @param clerkId - The Clerk user ID
 * @returns The database user or null if creation failed
 */
export async function ensureUserExists(clerkId: string): Promise<User | null> {
  try {
    // First try to find existing user
    const user = await db.user.findUnique({
      where: { clerkId },
    });
    
    if (user) {
      return user;
    }
    
    // If not found, create user
    return await createUserFromClerk(clerkId);
    
  } catch (error) {
    console.error("Error in ensureUserExists:", error);
    return null;
  }
}

/**
 * Sync user data from Clerk to database
 * Updates existing user or creates new one
 * 
 * @param clerkId - The Clerk user ID to sync
 * @returns The synced database user or null if sync failed
 */
export async function syncUserFromClerk(clerkId: string): Promise<User | null> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser || clerkUser.id !== clerkId) {
      return null;
    }
    
    const primaryEmail = clerkUser.emailAddresses.find(
      email => email.id === clerkUser.primaryEmailAddressId
    );
    
    if (!primaryEmail) {
      return null;
    }
    
    const fullName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null;
    
    // Upsert user (create or update)
    const user = await db.user.upsert({
      where: { clerkId },
      create: {
        clerkId,
        email: primaryEmail.emailAddress,
        name: fullName,
        imageUrl: clerkUser.imageUrl || null,
      },
      update: {
        email: primaryEmail.emailAddress,
        name: fullName,
        imageUrl: clerkUser.imageUrl || null,
      },
    });
    
    return user;
    
  } catch (error) {
    console.error("Error syncing user from Clerk:", error);
    return null;
  }
} 