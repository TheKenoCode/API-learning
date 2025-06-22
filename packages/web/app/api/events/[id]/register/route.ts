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

    const eventId = params.id;

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

    // Get event details
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        entries: true,
        club: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    if (event.status !== "PUBLISHED" && event.status !== "ONGOING") {
      return NextResponse.json(
        { error: "Event is not open for registration" },
        { status: 400 }
      );
    }

    // Check if user is already registered
    const existingEntry = await db.eventEntry.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: dbUser.id,
        },
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: "You are already registered for this event" },
        { status: 400 }
      );
    }

    // Check if event is full
    if (event.maxAttendees && event.entries.length >= event.maxAttendees) {
      return NextResponse.json(
        { error: "Event is full" },
        { status: 400 }
      );
    }

    // Check if event is public or user is a club member
    if (!event.isPublic) {
      const clubMember = await db.clubMember.findUnique({
        where: {
          userId_clubId: {
            userId: dbUser.id,
            clubId: event.clubId,
          },
        },
      });

      if (!clubMember) {
        return NextResponse.json(
          { error: "This event is only open to club members" },
          { status: 403 }
        );
      }
    }

    // Create event entry
    const eventEntry = await db.$transaction(async (tx) => {
      let stripePaymentIntentId = null;

      // Handle payment if there's an entry fee
      if (event.entryFeeUSD && event.entryFeeUSD.toNumber() > 0) {
        // TODO: Create Stripe payment intent
        // const paymentIntent = await stripe.paymentIntents.create({
        //   amount: Math.round(event.entryFeeUSD.toNumber() * 100), // Convert to cents
        //   currency: 'usd',
        //   metadata: {
        //     eventId: event.id,
        //     userId: dbUser.id,
        //     type: 'event_entry',
        //   },
        // });
        // stripePaymentIntentId = paymentIntent.id;
        
        // For now, just set a placeholder
        stripePaymentIntentId = `pi_event_${Date.now()}_placeholder`;
      }

      // Create the entry
      const entry = await tx.eventEntry.create({
        data: {
          eventId,
          userId: dbUser.id,
          stripePaymentIntentId,
        },
      });

      // TODO: Send confirmation notification via Pusher
      // TODO: Send confirmation email

      return entry;
    });

    return NextResponse.json({
      entry: eventEntry,
      paymentRequired: !!event.entryFeeUSD && event.entryFeeUSD.toNumber() > 0,
      // TODO: Include Stripe client secret for payment
      // clientSecret: paymentIntent?.client_secret,
    }, { status: 201 });
  } catch (error) {
    console.error("Error registering for event:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 