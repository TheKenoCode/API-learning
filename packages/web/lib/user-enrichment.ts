/**
 * User Enrichment Utilities
 * 
 * Provides functions to enrich user data with fresh information from Clerk,
 * including profile pictures, names, and other profile data.
 * Uses batching and caching to optimize performance.
 */

import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export interface EnrichedUser {
  id: string;
  name: string | null;
  imageUrl: string | null;
  clerkId: string;
}

export interface UserWithClerk {
  id: string;
  name: string | null;
  imageUrl: string | null;
  clerkId: string;
  // Fresh data from Clerk
  clerkImageUrl?: string | null;
  clerkName?: string | null;
  isDataFresh?: boolean;
}

/**
 * Enrich user data with fresh Clerk information
 * Batches API calls for efficiency and updates local cache
 */
export async function enrichUsersWithClerkData(userIds: string[]): Promise<Map<string, UserWithClerk>> {
  if (userIds.length === 0) {
    return new Map();
  }

  // Get users from database
  const dbUsers = await db.user.findMany({
    where: {
      id: { in: userIds }
    },
    select: {
      id: true,
      clerkId: true,
      name: true,
      imageUrl: true,
      updatedAt: true,
    }
  });

  const userMap = new Map<string, UserWithClerk>();
  const clerkIdsToFetch: string[] = [];
  const clerkIdToUserId = new Map<string, string>();

  // Determine which users need fresh data
  for (const user of dbUsers) {
    const needsFreshData = shouldFetchFreshData(user.updatedAt, user.imageUrl);
    
    userMap.set(user.id, {
      id: user.id,
      name: user.name,
      imageUrl: user.imageUrl,
      clerkId: user.clerkId,
      isDataFresh: !needsFreshData,
    });

    if (needsFreshData) {
      clerkIdsToFetch.push(user.clerkId);
      clerkIdToUserId.set(user.clerkId, user.id);
    }
  }

  // Batch fetch from Clerk if needed
  if (clerkIdsToFetch.length > 0) {
    try {
      const clerk = await clerkClient();
      const clerkUsers = await Promise.allSettled(
        clerkIdsToFetch.map(clerkId => clerk.users.getUser(clerkId))
      );

      const usersToUpdate: Array<{
        userId: string;
        name: string | null;
        imageUrl: string | null;
      }> = [];

      clerkUsers.forEach((result, index) => {
        const clerkId = clerkIdsToFetch[index]!;
        const userId = clerkIdToUserId.get(clerkId)!;
        const existingUser = userMap.get(userId)!;

        if (result.status === 'fulfilled') {
          const clerkUser = result.value;
          const clerkName = buildFullName(clerkUser.firstName, clerkUser.lastName);
          const clerkImageUrl = clerkUser.imageUrl || null;

          // Update the map with fresh data
          userMap.set(userId, {
            ...existingUser,
            clerkImageUrl,
            clerkName,
            isDataFresh: true,
          });

          // Queue database update if data changed
          if (existingUser.name !== clerkName || existingUser.imageUrl !== clerkImageUrl) {
            usersToUpdate.push({
              userId,
              name: clerkName,
              imageUrl: clerkImageUrl,
            });
          }
        } else {
          // If Clerk fetch failed, mark as fresh to avoid repeated attempts
          userMap.set(userId, {
            ...existingUser,
            isDataFresh: true,
          });
        }
      });

      // Batch update database
      if (usersToUpdate.length > 0) {
        await Promise.allSettled(
          usersToUpdate.map(({ userId, name, imageUrl }) =>
            db.user.update({
              where: { id: userId },
              data: { name, imageUrl },
            })
          )
        );
      }

    } catch (error) {
      console.error('Error enriching users with Clerk data:', error);
      // Continue with cached data if Clerk is unavailable
    }
  }

  return userMap;
}

/**
 * Get the best available avatar URL for a user
 * Prefers fresh Clerk data, falls back to cached data
 */
export function getBestAvatarUrl(user: UserWithClerk): string | null {
  return user.clerkImageUrl ?? user.imageUrl ?? null;
}

/**
 * Get the best available name for a user
 * Prefers fresh Clerk data, falls back to cached data
 */
export function getBestName(user: UserWithClerk): string | null {
  return user.clerkName ?? user.name ?? null;
}

/**
 * Determine if we should fetch fresh data from Clerk
 * Factors: age of cached data, missing avatar, etc.
 */
function shouldFetchFreshData(lastUpdated: Date, imageUrl: string | null): boolean {
  const now = new Date();
  const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
  
  // Fetch fresh data if:
  // 1. No cached avatar and updated more than 1 hour ago
  // 2. Has cached avatar but updated more than 24 hours ago
  // 3. Avatar is null/empty and updated more than 15 minutes ago (more aggressive refresh)
  
  if (!imageUrl && hoursSinceUpdate > 0.25) { // 15 minutes
    return true;
  }
  
  if (!imageUrl && hoursSinceUpdate > 1) { // 1 hour
    return true;
  }
  
  if (hoursSinceUpdate > 24) { // 24 hours
    return true;
  }
  
  return false;
}

/**
 * Build full name from first and last name
 */
function buildFullName(firstName: string | null, lastName: string | null): string | null {
  const first = firstName?.trim() || '';
  const last = lastName?.trim() || '';
  const fullName = `${first} ${last}`.trim();
  return fullName || null;
}

/**
 * Get user initials for avatar fallback
 */
export function getUserInitials(name: string | null): string {
  if (!name) return 'U';
  
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0]![0]?.toUpperCase() || 'U';
  }
  
  const first = words[0]![0]?.toUpperCase() || '';
  const last = words[words.length - 1]![0]?.toUpperCase() || '';
  return first + last || 'U';
}

/**
 * Transform enriched user data for client consumption
 */
export function transformEnrichedUser(user: UserWithClerk) {
  return {
    id: user.id,
    name: getBestName(user),
    imageUrl: getBestAvatarUrl(user),
  };
} 