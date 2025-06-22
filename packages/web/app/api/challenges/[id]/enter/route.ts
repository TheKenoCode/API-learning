import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

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

    const challengeId = params.id;

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

    // Get challenge details
    const challenge = await db.challenge.findUnique({
      where: { id: challengeId },
      include: {
        event: {
          include: {
            club: true,
          },
        },
        entries: true,
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    if (challenge.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Challenge is not active" },
        { status: 400 }
      );
    }

    // Check if user is already entered
    const existingEntry = await db.challengeEntry.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId: dbUser.id,
        },
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: "You are already entered in this challenge" },
        { status: 400 }
      );
    }

    // Check if user is registered for the event
    const eventEntry = await db.eventEntry.findUnique({
      where: {
        eventId_userId: {
          eventId: challenge.eventId,
          userId: dbUser.id,
        },
      },
    });

    if (!eventEntry) {
      return NextResponse.json(
        { error: "You must be registered for the event to enter challenges" },
        { status: 403 }
      );
    }

    // Create challenge entry
    const challengeEntry = await db.$transaction(async (tx) => {
      let stripePaymentIntentId = null;

      // Handle payment if there's an entry fee
      if (challenge.entryFeeUSD && challenge.entryFeeUSD.toNumber() > 0) {
        // TODO: Create Stripe payment intent
        // const paymentIntent = await stripe.paymentIntents.create({
        //   amount: Math.round(challenge.entryFeeUSD.toNumber() * 100), // Convert to cents
        //   currency: 'usd',
        //   metadata: {
        //     challengeId: challenge.id,
        //     userId: dbUser.id,
        //     type: 'challenge_entry',
        //   },
        // });
        // stripePaymentIntentId = paymentIntent.id;
        
        // For now, just set a placeholder
        stripePaymentIntentId = `pi_challenge_${Date.now()}_placeholder`;
      }

      // Create the entry
      const entry = await tx.challengeEntry.create({
        data: {
          challengeId,
          userId: dbUser.id,
          stripePaymentIntentId,
        },
      });

      // TODO: Send confirmation notification via Pusher

      return entry;
    });

    return NextResponse.json({
      entry: challengeEntry,
      paymentRequired: !!challenge.entryFeeUSD && challenge.entryFeeUSD.toNumber() > 0,
      // TODO: Include Stripe client secret for payment
      // clientSecret: paymentIntent?.client_secret,
    }, { status: 201 });
  } catch (error) {
    console.error("Error entering challenge:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 