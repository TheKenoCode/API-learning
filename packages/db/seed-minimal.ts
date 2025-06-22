/**
 * Minimal Database Seed Script for new Event System
 * 
 * Creates basic test data that works with the new schema
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with minimal test data...");

  // Create test users
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

  // Create a premium club
  const club1 = await prisma.club.create({
    data: {
      name: "Street Enthusiasts LA",
      description: "Los Angeles based club for automotive enthusiasts",
      isPrivate: false,
      premium: true, // Premium to allow events with challenges
      city: "Los Angeles",
      territory: "North America",
      latitude: 34.0522,
      longitude: -118.2437,
      creatorId: user1.id,
    },
  });

  // Create club membership
  await prisma.clubMember.create({
    data: {
      userId: user1.id,
      clubId: club1.id,
      role: "ADMIN",
    },
  });

  await prisma.clubMember.create({
    data: {
      userId: user2.id,
      clubId: club1.id,
      role: "MEMBER",
    },
  });

  // Create a sample event with the new schema
  const event1 = await prisma.event.create({
    data: {
      title: "Summer Performance Challenge 2024",
      description: "Annual summer event with skill challenges",
      location: "Downtown Convention Center",
      startDateTime: new Date("2024-07-15T10:00:00Z"),
      endDateTime: new Date("2024-07-15T18:00:00Z"),
      isPublic: true,
      entryFeeUSD: 50,
      maxAttendees: 200,
      premiumFeaturesEnabled: true,
      status: "PUBLISHED",
      clubId: club1.id,
      organizerId: user1.id,
    },
  });

  // Create a challenge for the event
  const challenge1 = await prisma.challenge.create({
    data: {
      title: "0-60 Time Attack",
      description: "Fastest acceleration wins",
      entryFeeUSD: 20,
      bonusPoolPercentOfEventFees: 25, // 25% of event fees go to bonus pool
      status: "ACTIVE",
      eventId: event1.id,
      type: "TIME_TRIAL",
      difficulty: "MEDIUM",
      creatorId: user1.id,
    },
  });

  // Create some test cars
  const car1 = await prisma.car.create({
    data: {
      make: "Tesla",
      model: "Model S",
      year: 2023,
      vin: "5YJ3E1EA1NF000001",
      color: "Pearl White",
      mileage: 5000,
      description: "Premium electric sedan",
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
      description: "Classic sports car",
    },
  });

  // Create listings
  await prisma.listing.create({
    data: {
      title: "2023 Tesla Model S - Like New",
      description: "Barely driven Tesla Model S",
      price: 85000,
      sellerId: user1.id,
      carId: car1.id,
    },
  });

  await prisma.listing.create({
    data: {
      title: "2024 Porsche 911 Carrera",
      description: "Brand new Porsche 911",
      price: 125000,
      sellerId: user2.id,
      carId: car2.id,
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log({
    users: 2,
    clubs: 1,
    events: 1,
    challenges: 1,
    cars: 2,
    listings: 2,
  });
  console.log("\n📝 Test Data Created:");
  console.log(`- Club: ${club1.name} (ID: ${club1.id})`);
  console.log(`- Event: ${event1.title} (ID: ${event1.id})`);
  console.log(`- Challenge: ${challenge1.title} (ID: ${challenge1.id})`);
  console.log(`- Users: ${user1.email}, ${user2.email}`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 