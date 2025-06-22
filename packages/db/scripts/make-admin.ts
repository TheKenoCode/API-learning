/**
 * Make Admin Script
 * 
 * Grants admin privileges to a specified user for all clubs or creates test clubs.
 * Useful for development and testing admin features.
 * 
 * Usage:
 * ```bash
 * CLERK_USER_ID=user_xxx pnpm tsx scripts/make-admin.ts
 * ```
 * 
 * Features:
 * - Makes specified user admin of all existing clubs
 * - Creates a test club if none exist
 * - Updates user's site role to ADMIN
 * 
 * WARNING: This script modifies user permissions - use with caution!
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function makeUserAdmin() {
  console.log("🔧 Making current user admin...");
  
  // Get your Clerk ID from environment or prompt
  const clerkId = process.env.CLERK_USER_ID;
  
  if (!clerkId) {
    console.log("❌ Please set CLERK_USER_ID environment variable with your Clerk user ID");
    console.log("You can find your Clerk ID in your browser's developer tools:");
    console.log("1. Open your app");
    console.log("2. Open Developer Tools (F12)");
    console.log("3. Go to Console tab");
    console.log("4. Type: await window.Clerk.user.id");
    console.log("5. Copy the returned ID and run:");
    console.log("   CLERK_USER_ID=your_clerk_id pnpm db:admin");
    process.exit(1);
  }

  try {
    // First, find or create the user
    let user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      // If user doesn't exist, create with provided info or defaults
      console.log("❌ User not found in database. Creating user entry...");
      
      const email = process.env.USER_EMAIL || `admin-${clerkId}@example.com`;
      const name = process.env.USER_NAME || "Admin User";
      const imageUrl = process.env.USER_IMAGE || "https://images.clerk.dev/default-avatar.png";
      
      user = await prisma.user.create({
        data: {
          clerkId,
          email,
          name,
          imageUrl,
        },
      });
      console.log("✅ Created user:", user.email);
    }

    // Get existing clubs
    const clubs = await prisma.club.findMany({
      include: {
        members: {
          where: { userId: user.id },
        },
      },
    });

    console.log(`Found ${clubs.length} existing clubs...`);

    // Make user admin of all existing clubs or create membership
    for (const club of clubs) {
      const existingMembership = club.members[0];
      
      if (existingMembership) {
        // Update existing membership to ADMIN
        await prisma.clubMember.update({
          where: { id: existingMembership.id },
          data: { role: "ADMIN" },
        });
        console.log(`✅ Made user ADMIN of "${club.name}"`);
      } else {
        // Create new ADMIN membership
        await prisma.clubMember.create({
          data: {
            userId: user.id,
            clubId: club.id,
            role: "ADMIN",
          },
        });
        console.log(`✅ Added user as ADMIN to "${club.name}"`);
      }
    }

    // If no clubs exist, create a test club with user as admin
    if (clubs.length === 0) {
      const newClub = await prisma.club.create({
        data: {
          name: "Test Admin Club",
          description: "Admin test club for full access",
          isPrivate: false,
          city: "Los Angeles",
          territory: "North America",
          creatorId: user.id,
        },
      });

      await prisma.clubMember.create({
        data: {
          userId: user.id,
          clubId: newClub.id,
          role: "ADMIN",
        },
      });

      console.log(`✅ Created new club "${newClub.name}" with user as ADMIN`);
    }

    console.log("🎉 Success! You now have admin access to all clubs.");
    console.log("🔄 Refresh your app to see the changes.");

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

makeUserAdmin()
  .catch((e) => {
    console.error("❌ Error making user admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 