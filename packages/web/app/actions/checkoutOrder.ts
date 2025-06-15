"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { CreateOrderSchema } from "@carhub/shared";
import type { PrismaClient } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function checkoutOrder(formData: FormData) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      redirect("/sign-in");
    }

    // Parse and validate input
    const rawData = {
      listingId: formData.get("listingId") as string,
      amount: parseFloat(formData.get("amount") as string),
    };

    const validatedData = CreateOrderSchema.parse(rawData);

    // Verify user exists in database
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify listing exists and is active
    const listing = await db.listing.findUnique({
      where: { id: validatedData.listingId },
      include: {
        seller: true,
        car: true,
      },
    });

    if (!listing || !listing.isActive) {
      throw new Error("Listing not found or inactive");
    }

    // Verify price matches
    if (Number(listing.price) !== validatedData.amount) {
      throw new Error("Price mismatch");
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(validatedData.amount * 100), // Convert to cents
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        listingId: validatedData.listingId,
        buyerId: user.id,
        sellerId: listing.sellerId,
      },
    });

    // Create order in database transaction
    const order = await db.$transaction(
      async (
        tx: Omit<
          PrismaClient,
          | "$connect"
          | "$disconnect"
          | "$on"
          | "$transaction"
          | "$use"
          | "$extends"
        >
      ) => {
        // Create the order
        const newOrder = await tx.order.create({
          data: {
            amount: validatedData.amount,
            buyerId: user.id,
            listingId: validatedData.listingId,
            stripePaymentIntentId: paymentIntent.id,
            escrowStatus: "PENDING",
          },
          include: {
            listing: {
              include: {
                car: true,
                seller: true,
              },
            },
          },
        });

        // TODO: Send notifications to buyer and seller
        // TODO: Create escrow record for fund management

        return newOrder;
      }
    );

    console.log("✅ Order created successfully:", order.id);

    // Return payment intent client secret for frontend
    return {
      success: true,
      orderId: order.id,
      clientSecret: paymentIntent.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    };
  } catch (error) {
    console.error("❌ Checkout error:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
