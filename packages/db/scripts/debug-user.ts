/**
 * Debug User Script
 * 
 * Utility script to debug user and membership data in the database.
 * Useful for troubleshooting authentication and membership issues.
 * 
 * Usage:
 * ```bash
 * cd packages/db
 * CLERK_USER_ID=user_xxx pnpm tsx scripts/debug-user.ts
 * ```
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugUser() {
  console.log("🔍 Debugging user and membership data...");
  
  // Get Clerk ID from environment or use default for testing
  const clerkId = process.env.CLERK_USER_ID || "user_2yXUBQh8tbNaGThyavDFgzgCO0S";
  
  console.log(`Looking for Clerk ID: ${clerkId}`);
  
  // Find the user with all their memberships
  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: {
      clubMemberships: {
        include: {
          club: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
  
  if (!user) {
    console.log("❌ User not found with this Clerk ID");
    
    // Show all users to help identify the correct one
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
      },
    });
    
    console.log("\n📋 All users in database:");
    allUsers.forEach(u => {
      console.log(`  - ${u.name} (${u.email}) - Clerk ID: ${u.clerkId}`);
    });
    
    return;
  }
  
  // Display user information
  console.log("✅ User found:");
  console.log(`  - ID: ${user.id}`);
  console.log(`  - Name: ${user.name}`);
  console.log(`  - Email: ${user.email}`);
  console.log(`  - Clerk ID: ${user.clerkId}`);
  console.log(`  - Site Role: ${user.siteRole}`);
  
  // Display club memberships
  console.log(`\n🏛️ Club memberships (${user.clubMemberships.length}):`);
  user.clubMemberships.forEach(membership => {
    console.log(`  - ${membership.club.name} (${membership.club.id}) - Role: ${membership.role}`);
  });
  
  // Double-check with direct membership query
  const directMemberships = await prisma.clubMember.findMany({
    where: { userId: user.id },
    include: {
      club: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  
  console.log(`\n🔍 Direct membership query (${directMemberships.length}):`);
  directMemberships.forEach(membership => {
    console.log(`  - ${membership.club.name} (${membership.club.id}) - Role: ${membership.role}`);
  });
}

// Execute the debug function
debugUser()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 