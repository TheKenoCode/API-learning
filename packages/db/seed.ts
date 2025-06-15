import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create sample users (these would normally be created by Clerk)
  const user1 = await prisma.user.upsert({
    where: { email: "john@example.com" },
    update: {},
    create: {
      clerkId: "user_1",
      email: "john@example.com",
      name: "John Doe",
      imageUrl: "https://images.clerk.dev/default-avatar.png",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "jane@example.com" },
    update: {},
    create: {
      clerkId: "user_2",
      email: "jane@example.com",
      name: "Jane Smith",
      imageUrl: "https://images.clerk.dev/default-avatar.png",
    },
  });

  // Create sample cars
  const car1 = await prisma.car.create({
    data: {
      make: "Tesla",
      model: "Model S",
      year: 2023,
      vin: "5YJ3E1EA1NF000001",
      color: "Pearl White",
      mileage: 5000,
      description: "Premium electric sedan in excellent condition",
      glbUrl: "/models/tesla-model-s.glb", // TODO: Add actual 3D model
    },
  });

  const car2 = await prisma.car.create({
    data: {
      make: "Porsche",
      model: "911 Carrera",
      year: 2024,
      vin: "WP0AA2A95LS000001",
      color: "Guards Red",
      mileage: 1200,
      description: "Classic sports car with legendary performance",
      glbUrl: "/models/porsche-911.glb", // TODO: Add actual 3D model
    },
  });

  // Create sample listings
  const listing1 = await prisma.listing.create({
    data: {
      title: "2023 Tesla Model S - Like New",
      description: "Barely driven Tesla Model S with all premium features",
      price: 85000,
      sellerId: user1.id,
      carId: car1.id,
    },
  });

  const listing2 = await prisma.listing.create({
    data: {
      title: "2024 Porsche 911 Carrera",
      description: "Brand new Porsche 911 with manual transmission",
      price: 125000,
      sellerId: user2.id,
      carId: car2.id,
    },
  });

  // Create sample event
  const event1 = await prisma.event.create({
    data: {
      name: "CarHub Summer Show 2024",
      description: "Annual car show featuring the best vehicles from our platform",
      date: new Date("2024-07-15T10:00:00Z"),
      location: "Downtown Convention Center",
      organizerId: user1.id,
    },
  });

  // Create sample contest
  const contest1 = await prisma.contest.create({
    data: {
      name: "Best in Show",
      description: "Vote for the most impressive vehicle at the show",
      eventId: event1.id,
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log({
    users: 2,
    cars: 2,
    listings: 2,
    events: 1,
    contests: 1,
  });
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 