import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function makeAdmin(email: string) {
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    console.log("✅ User promoted to admin:");
    console.log(user);
  } catch (error) {
    console.error("❌ Error promoting user to admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error("❌ Please provide an email address:");
  console.error("Usage: npx tsx make-admin.ts user@example.com");
  process.exit(1);
}

makeAdmin(email);