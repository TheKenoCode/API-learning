/**
 * Checkout Order Server Action
 * 
 * Handles order creation for marketplace listings with payment processing.
 * Creates orders with escrow status and integrates with payment providers.
 * 
 * Features:
 * - Creates order records with escrow status
 * - Supports both Stripe and Coinbase Commerce payments
 * - Validates user authentication and listing availability
 * - Returns payment URLs for checkout completion
 */
"use server";

import { getCurrentDatabaseUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { stripe, coinbase } from "@/lib/payments";

export type CheckoutResult = {
  success: boolean;
  paymentUrl?: string;
  error?: string;
};

/**
 * Create an order and initiate checkout
 * 
 * @param listingId - The ID of the listing to purchase
 * @param paymentMethod - Either 'stripe' or 'crypto'
 * @returns Checkout result with payment URL or error
 */
export async function checkoutOrder(
  listingId: string,
  paymentMethod: "stripe" | "crypto"
): Promise<CheckoutResult> {
  try {
    // Get current user
    const user = await getCurrentDatabaseUser();
    if (!user) {
      return { success: false, error: "You must be signed in to place an order" };
    }

    // Get listing details
    const listing = await db.listing.findUnique({
      where: { id: listingId },
      include: {
        seller: true,
        car: true,
      },
    });

    if (!listing) {
      return { success: false, error: "Listing not found" };
    }

    if (!listing.isActive) {
      return { success: false, error: "Listing is no longer available" };
    }

    if (listing.sellerId === user.id) {
      return { success: false, error: "You cannot buy your own listing" };
    }

    // Create order record
    const order = await db.order.create({
      data: {
        amount: listing.price,
        buyerId: user.id,
        listingId: listing.id,
        escrowStatus: "PENDING",
      },
    });

    // Process payment based on method
    if (paymentMethod === "stripe") {
      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: listing.title,
                description: `${listing.car.year} ${listing.car.make} ${listing.car.model}`,
              },
              unit_amount: Math.round(listing.price.toNumber() * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success&order=${order.id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace/${listingId}?payment=cancelled`,
        metadata: {
          orderId: order.id,
          buyerId: user.id,
          listingId: listing.id,
        },
      });

      // Update order with payment intent ID
      await db.order.update({
        where: { id: order.id },
        data: { stripePaymentIntentId: session.payment_intent as string },
      });

      return { success: true, paymentUrl: session.url || undefined };
    } else {
      // Create Coinbase Commerce charge
      const charge = await coinbase.createCharge(
        listing.title,
        `Purchase of ${listing.car.year} ${listing.car.make} ${listing.car.model}`,
        listing.price.toString(),
        "USD"
      );

      // Update order with charge ID
      await db.order.update({
        where: { id: order.id },
        data: { coinbaseChargeId: charge.id },
      });

      return { success: true, paymentUrl: charge.hosted_url };
    }
  } catch (error) {
    console.error("Checkout error:", error);
    return { 
      success: false, 
      error: "Failed to process checkout. Please try again." 
    };
  }
}
