import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { CreateEventSchema } from "@redline/shared";
import { db } from "@/lib/db";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    // Convert datetime strings to Date objects
    const processedBody = {
      ...body,
      startDateTime: new Date(body.startDateTime),
      endDateTime: new Date(body.endDateTime),
    };
    
    const validatedData = CreateEventSchema.parse(processedBody);

    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is admin of the club
    const clubMember = await db.clubMember.findUnique({
      where: {
        userId_clubId: {
          userId: dbUser.id,
          clubId: validatedData.clubId,
        },
      },
    });

    if (!clubMember || clubMember.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only club admins can create events" },
        { status: 403 }
      );
    }

    // Check if club is premium (required for challenges)
    const club = await db.club.findUnique({
      where: { id: validatedData.clubId },
      select: { premium: true },
    });

    if (!club) {
      return NextResponse.json(
        { error: "Club not found" },
        { status: 404 }
      );
    }

    if (validatedData.challenges && validatedData.challenges.length > 0 && !club.premium) {
      return NextResponse.json(
        { error: "Only premium clubs can create events with challenges" },
        { status: 403 }
      );
    }

    // Create event and challenges in a transaction
    const event = await db.$transaction(async (tx) => {
      // Create the event
      const newEvent = await tx.event.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          location: validatedData.location,
          startDateTime: validatedData.startDateTime,
          endDateTime: validatedData.endDateTime,
          isPublic: validatedData.isPublic,
          entryFeeUSD: validatedData.entryFeeUSD,
          maxAttendees: validatedData.maxAttendees,
          sponsorAssets: validatedData.sponsorAssets,
          premiumFeaturesEnabled: club.premium,
          clubId: validatedData.clubId,
          organizerId: dbUser.id,
          status: "DRAFT",
        },
      });

      // Create challenges if any
      if (validatedData.challenges && club.premium) {
        await Promise.all(
          validatedData.challenges.map((challenge) =>
            tx.challenge.create({
              data: {
                title: challenge.title,
                description: challenge.description,
                entryFeeUSD: challenge.entryFeeUSD,
                bonusPoolPercentOfEventFees: challenge.bonusPoolPercentOfEventFees,
                eventId: newEvent.id,
                status: "PENDING",
                type: "CUSTOM", // Default type
                difficulty: "MEDIUM", // Default difficulty
                creatorId: dbUser.id,
              },
            })
          )
        );
      }

      // TODO: Send notification to club members about new event via Pusher

      return newEvent;
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 