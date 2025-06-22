/**
 * Database Seed Script
 * 
 * Populates the database with sample data for development and testing.
 * Creates demo users, clubs, posts, events, and challenges.
 * 
 * Usage:
 * ```bash
 * pnpm db:seed
 * ```
 * 
 * WARNING: This will delete existing data! Only run on development databases.
 */
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
  const car1 = await prisma.car.upsert({
    where: { vin: "5YJ3E1EA1NF000001" },
    update: {},
    create: {
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

  const car2 = await prisma.car.upsert({
    where: { vin: "WP0AA2A95LS000001" },
    update: {},
    create: {
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
  const listing1 = await prisma.listing.upsert({
    where: { id: "listing_tesla_1" },
    update: {},
    create: {
      id: "listing_tesla_1",
      title: "2023 Tesla Model S - Like New",
      description: "Barely driven Tesla Model S with all premium features",
      price: 85000,
      sellerId: user1.id,
      carId: car1.id,
    },
  });

  const listing2 = await prisma.listing.upsert({
    where: { id: "listing_porsche_1" },
    update: {},
    create: {
      id: "listing_porsche_1",
      title: "2024 Porsche 911 Carrera",
      description: "Brand new Porsche 911 with manual transmission",
      price: 125000,
      sellerId: user2.id,
      carId: car2.id,
    },
  });

  // Skip old event model creation - replaced by new event system

  // Create additional users for club system
  const user3 = await prisma.user.upsert({
    where: { email: "mike@example.com" },
    update: {},
    create: {
      clerkId: "user_3",
      email: "mike@example.com",
      name: "Mike Johnson",
      imageUrl: "https://images.clerk.dev/default-avatar.png",
    },
  });

  const user4 = await prisma.user.upsert({
    where: { email: "sarah@example.com" },
    update: {},
    create: {
      clerkId: "user_4",
      email: "sarah@example.com",
      name: "Sarah Wilson",
      imageUrl: "https://images.clerk.dev/default-avatar.png",
    },
  });

  // Create sample clubs
  const club1 = await prisma.club.upsert({
    where: { id: "club_street_enthusiasts_la" },
    update: {},
    create: {
      id: "club_street_enthusiasts_la",
      name: "Street Enthusiasts LA",
      description: "Los Angeles based club for automotive enthusiasts who love legal street challenges and meets",
      imageUrl: "https://via.placeholder.com/400x200?text=Street+Enthusiasts+LA",
      isPrivate: false,
      city: "Los Angeles",
      territory: "North America",
      latitude: 34.0522,
      longitude: -118.2437,
      creatorId: user1.id,
      inviteCode: null,
      premium: true, // Premium club for testing events with challenges
    },
  });

  const club2 = await prisma.club.upsert({
    where: { id: "club_nyc_speed_society" },
    update: {},
    create: {
      id: "club_nyc_speed_society",
      name: "NYC Speed Society",
      description: "Exclusive New York club for serious drivers",
      imageUrl: "https://via.placeholder.com/400x200?text=NYC+Speed+Society",
      isPrivate: true,
      city: "New York",
      territory: "North America",
      latitude: 40.7128,
      longitude: -74.0060,
      creatorId: user2.id,
      inviteCode: "NYC2024X",
    },
  });

  // Create club memberships
  await prisma.clubMember.createMany({
    data: [
      // Club 1 members
      { userId: user1.id, clubId: club1.id, role: "ADMIN" },
      { userId: user3.id, clubId: club1.id, role: "MEMBER" },
      { userId: user4.id, clubId: club1.id, role: "MODERATOR" },
      
      // Club 2 members
      { userId: user2.id, clubId: club2.id, role: "ADMIN" },
      { userId: user1.id, clubId: club2.id, role: "MEMBER" },
    ],
  });

  // Create sample challenges
  const challenge1 = await prisma.challenge.create({
    data: {
      title: "Fuel Efficiency Championship",
      description: "See who can achieve the best fuel efficiency over a 100-mile route through the city",
      type: "FUEL_EFFICIENCY",
      isPreMade: true,
      difficulty: "MEDIUM",
      city: "Los Angeles",
      territory: "North America",
      isGlobal: false,
      parameters: {
        distance: 100,
        routeType: "city",
        weightClass: "any",
      },
      clubId: club1.id,
      creatorId: user1.id,
      isActive: true,
      startDate: new Date("2024-02-01T00:00:00Z"),
      endDate: new Date("2024-02-29T23:59:59Z"),
    },
  });

  const challenge2 = await prisma.challenge.create({
    data: {
      title: "Global Time Trial: Quarter Mile",
      description: "Professional quarter-mile time trial open to all clubs worldwide",
      type: "TIME_TRIAL",
      isPreMade: true,
      difficulty: "HARD",
      isGlobal: true,
      parameters: {
        distance: 0.25,
        surface: "asphalt",
        conditions: "dry",
      },
      creatorId: user2.id,
      isActive: true,
    },
  });

  // Create challenge participants
  await prisma.challengeParticipant.createMany({
    data: [
      {
        userId: user1.id,
        challengeId: challenge1.id,
        score: 45.2,
        completedAt: new Date("2024-02-15T14:30:00Z"),
        evidence: {
          photos: ["fuel_gauge_start.jpg", "fuel_gauge_end.jpg"],
          gpsTrack: "track_data.gpx",
        },
      },
      {
        userId: user3.id,
        challengeId: challenge1.id,
        score: 42.8,
        completedAt: new Date("2024-02-16T16:45:00Z"),
        evidence: {
          photos: ["efficiency_run.jpg"],
        },
      },
      {
        userId: user2.id,
        challengeId: challenge2.id,
        score: 11.5,
        completedAt: new Date("2024-02-10T12:00:00Z"),
        evidence: {
          video: "quarter_mile_run.mp4",
          timingSlip: "official_time.jpg",
        },
      },
    ],
  });

  // Create leaderboard entries
  await prisma.leaderboardEntry.createMany({
    data: [
      // Fuel efficiency challenge - city scope
      { userId: user1.id, challengeId: challenge1.id, rank: 1, score: 45.2, scope: "CITY", scopeValue: "Los Angeles" },
      { userId: user3.id, challengeId: challenge1.id, rank: 2, score: 42.8, scope: "CITY", scopeValue: "Los Angeles" },
      
      // Fuel efficiency challenge - club scope
      { userId: user1.id, challengeId: challenge1.id, rank: 1, score: 45.2, scope: "CLUB", scopeValue: club1.id },
      { userId: user3.id, challengeId: challenge1.id, rank: 2, score: 42.8, scope: "CLUB", scopeValue: club1.id },
      
      // Time trial - global scope
      { userId: user2.id, challengeId: challenge2.id, rank: 1, score: 11.5, scope: "GLOBAL", scopeValue: null },
    ],
  });

  // Create club events
  const clubEvent1 = await prisma.clubEvent.create({
    data: {
      title: "Monthly Meet & Greet",
      description: "Monthly gathering for all club members to share stories and show off rides",
      date: new Date("2024-03-15T18:00:00Z"),
      location: "Griffith Observatory Parking",
      latitude: 34.1184,
      longitude: -118.3004,
      maxAttendees: 50,
      clubId: club1.id,
      organizerId: user1.id,
    },
  });

  // Create event attendees
  await prisma.eventAttendee.createMany({
    data: [
      { userId: user1.id, eventId: clubEvent1.id, status: "ATTENDING" },
      { userId: user3.id, eventId: clubEvent1.id, status: "ATTENDING" },
      { userId: user4.id, eventId: clubEvent1.id, status: "PENDING" },
    ],
  });

  // Create marketplace posts
  const marketPost1 = await prisma.marketplacePost.create({
    data: {
      title: "Performance Cold Air Intake - BMW",
      description: "High-flow cold air intake system for BMW 3 Series. Barely used, excellent condition.",
      price: 299.99,
      images: ["intake_1.jpg", "intake_2.jpg", "intake_installed.jpg"],
      category: "Performance Parts",
      condition: "LIKE_NEW",
      sellerId: user3.id,
      clubId: club1.id,
      city: "Los Angeles",
      location: "West Hollywood",
    },
  });

  const marketPost2 = await prisma.marketplacePost.create({
    data: {
      title: "OEM Wheels Set - Tesla Model S",
      description: "Original Tesla wheels, 19 inch, minor curb rash on one wheel",
      price: 800.00,
      images: ["wheels_set.jpg", "wheel_detail.jpg"],
      category: "Wheels & Tires",
      condition: "GOOD",
      sellerId: user1.id,
      city: "Los Angeles",
    },
  });

  // Create friendships
  await prisma.friendship.createMany({
    data: [
      { requesterId: user1.id, addresseeId: user2.id, status: "ACCEPTED" },
      { requesterId: user3.id, addresseeId: user1.id, status: "ACCEPTED" },
      { requesterId: user4.id, addresseeId: user2.id, status: "PENDING" },
    ],
  });

  // Create club posts
  const clubPost1 = await prisma.clubPost.create({
    data: {
      content: "Just completed the fuel efficiency challenge! Got 45.2 MPG on that route. The key is smooth acceleration and early braking. Who's next? 🚗💨",
      images: ["fuel_gauge.jpg", "route_map.jpg"],
      authorId: user1.id,
      clubId: club1.id,
    },
  });

  // Create post likes and comments
  await prisma.postLike.create({
    data: {
      userId: user3.id,
      postId: clubPost1.id,
    },
  });

  await prisma.postComment.create({
    data: {
      content: "Amazing result! Any tips for highway driving?",
      authorId: user3.id,
      postId: clubPost1.id,
    },
  });

  // Create sample subscriptions
  await prisma.subscription.createMany({
    data: [
      {
        userId: user2.id,
        tier: "PREMIUM",
        status: "ACTIVE",
        stripePriceId: "price_premium_monthly",
        stripeCustomerId: "cus_premium_user2",
        currentPeriodStart: new Date("2024-02-01T00:00:00Z"),
        currentPeriodEnd: new Date("2024-03-01T00:00:00Z"),
      },
      {
        userId: user4.id,
        tier: "PRO",
        status: "ACTIVE",
        stripePriceId: "price_pro_monthly",
        stripeCustomerId: "cus_pro_user4",
        currentPeriodStart: new Date("2024-01-15T00:00:00Z"),
        currentPeriodEnd: new Date("2024-02-15T00:00:00Z"),
      },
    ],
  });

  console.log("✅ Database seeded successfully!");
  console.log({
    users: 4,
    cars: 2,
    listings: 2,
    events: 1,
    contests: 1,
    clubs: 2,
    challenges: 2,
    clubEvents: 1,
    marketplacePosts: 2,
    friendships: 3,
    clubPosts: 1,
    subscriptions: 2,
    samples: {
      listing1: listing1.id,
      listing2: listing2.id,
      // contest1: contest1.id, // Removed old contest model
      club1: club1.id,
      club2: club2.id,
      challenge1: challenge1.id,
      challenge2: challenge2.id,
      clubEvent1: clubEvent1.id,
      marketPost1: marketPost1.id,
      marketPost2: marketPost2.id,
      clubPost1: clubPost1.id,
    },
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
