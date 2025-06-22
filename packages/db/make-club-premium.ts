import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const clubId = "cmc88q1vu0001v4hivrn6h6r0"; // Santa Clara Carz club ID
  
  try {
    const updatedClub = await prisma.club.update({
      where: { id: clubId },
      data: { premium: true },
    });
    
    console.log("✅ Club updated to premium:", updatedClub.name);
    console.log("🎉 You can now create events with challenges!");
  } catch (error) {
    console.error("❌ Error updating club:", error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 