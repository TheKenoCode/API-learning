import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { calculateChallengeBonusPool } from "@/lib/events";

// Schema with converted to use camelCase in API
const CompleteChallengeApiSchema = z.object({
  challengeId: z.string(),
  firstPlaceUserId: z.string(),
  secondPlaceUserId: z.string(),
  thirdPlaceUserId: z.string(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = CompleteChallengeApiSchema.parse({
      ...body,
      challengeId: params.id,
    });

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

    // Get challenge with event details
    const challenge = await db.challenge.findUnique({
      where: { id: validatedData.challengeId },
      include: {
        event: {
          include: {
            club: true,
          },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    // Check if user is club admin
    const clubMember = await db.clubMember.findUnique({
      where: {
        userId_clubId: {
          userId: dbUser.id,
          clubId: challenge.event.clubId,
        },
      },
    });

    if (!clubMember || clubMember.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only club admins can complete challenges" },
        { status: 403 }
      );
    }

    if (challenge.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Challenge is not active" },
        { status: 400 }
      );
    }

    // Verify all winners are valid participants
    const winnerIds = [
      validatedData.firstPlaceUserId,
      validatedData.secondPlaceUserId,
      validatedData.thirdPlaceUserId,
    ];

    const participants = await db.challengeEntry.findMany({
      where: {
        challengeId: validatedData.challengeId,
        userId: { in: winnerIds },
      },
    });

    if (participants.length !== 3) {
      return NextResponse.json(
        { error: "All winners must be challenge participants" },
        { status: 400 }
      );
    }

    // Calculate bonus pool
    const bonusPool = await calculateChallengeBonusPool(validatedData.challengeId);

    // Update challenge with winners
    const updatedChallenge = await db.$transaction(async (tx) => {
      const updated = await tx.challenge.update({
        where: { id: validatedData.challengeId },
        data: {
          status: "COMPLETED",
          firstPlaceUserId: validatedData.firstPlaceUserId,
          secondPlaceUserId: validatedData.secondPlaceUserId,
          thirdPlaceUserId: validatedData.thirdPlaceUserId,
          payoutsReleasedAt: new Date(),
        },
      });

      // TODO: Process payouts via Stripe
      // Calculate payouts (50% first, 30% second, 20% third)
      // const payouts = {
      //   first: bonusPool * 0.5,
      //   second: bonusPool * 0.3,
      //   third: bonusPool * 0.2,
      // };
      // await processPayouts([
      //   { userId: validatedData.firstPlaceUserId, amount: payouts.first },
      //   { userId: validatedData.secondPlaceUserId, amount: payouts.second },
      //   { userId: validatedData.thirdPlaceUserId, amount: payouts.third },
      // ]);

      // TODO: Send notifications to winners via Pusher
      // TODO: Send email notifications to winners

      return updated;
    });

    return NextResponse.json({
      challenge: updatedChallenge,
      bonusPool,
      payouts: {
        first: bonusPool * 0.5,
        second: bonusPool * 0.3,
        third: bonusPool * 0.2,
      },
    });
  } catch (error) {
    console.error("Error completing challenge:", error);
    
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