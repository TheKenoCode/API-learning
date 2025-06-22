/**
 * Cleanup Join Requests Script
 * 
 * Removes duplicate and orphaned club join requests from the database.
 * Handles edge cases where multiple join requests exist for the same user/club combination.
 * 
 * Usage:
 * ```bash
 * pnpm tsx scripts/cleanup-join-requests.ts
 * ```
 * 
 * Features:
 * - Identifies and removes duplicate join requests (keeps most recent)
 * - Cleans up orphaned requests where user or club no longer exists
 * - Provides detailed logging of cleanup operations
 * 
 * Safe to run multiple times - only removes actual duplicates/orphans
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupJoinRequests() {
  console.log("🧹 Cleaning up join request records...");
  
  try {
    // Get all join requests grouped by userId and clubId
    const duplicateRequests = await prisma.clubJoinRequest.findMany({
      orderBy: [
        { userId: 'asc' },
        { clubId: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    
    const seenCombinations = new Set<string>();
    const toDelete: string[] = [];
    
    // Find duplicates (keep only the most recent for each user-club combination)
    for (const request of duplicateRequests) {
      const key = `${request.userId}-${request.clubId}`;
      
      if (seenCombinations.has(key)) {
        // This is a duplicate, mark for deletion
        toDelete.push(request.id);
        console.log(`  📋 Found duplicate: ${request.id} (User: ${request.userId}, Club: ${request.clubId}, Status: ${request.status})`);
      } else {
        seenCombinations.add(key);
        console.log(`  ✅ Keeping most recent: ${request.id} (User: ${request.userId}, Club: ${request.clubId}, Status: ${request.status})`);
      }
    }
    
    if (toDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${toDelete.length} duplicate records...`);
      
      const result = await prisma.clubJoinRequest.deleteMany({
        where: {
          id: {
            in: toDelete
          }
        }
      });
      
      console.log(`✅ Deleted ${result.count} duplicate join request records`);
    } else {
      console.log("✅ No duplicate records found");
    }
    
    // Also clean up any orphaned requests (where user or club no longer exists)
    const orphanedRequests = await prisma.clubJoinRequest.findMany({
      include: {
        user: true,
        club: true
      }
    });
    
    const orphanedIds = orphanedRequests
      .filter(req => !req.user || !req.club)
      .map(req => req.id);
    
    if (orphanedIds.length > 0) {
      console.log(`\n🧹 Cleaning up ${orphanedIds.length} orphaned requests...`);
      await prisma.clubJoinRequest.deleteMany({
        where: {
          id: {
            in: orphanedIds
          }
        }
      });
      console.log("✅ Cleaned up orphaned requests");
    }
    
    console.log("\n🎉 Database cleanup completed successfully!");
    
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  }
}

cleanupJoinRequests()
  .catch((e) => {
    console.error("❌ Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 