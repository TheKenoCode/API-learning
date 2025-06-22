/**
 * Payment Utilities
 * 
 * Handles payment processing for Stripe and Coinbase Commerce integrations.
 * Provides utilities for subscription management, one-time payments, and 
 * cryptocurrency transactions.
 * 
 * Features:
 * - Stripe subscription management
 * - Stripe one-time payments
 * - Coinbase Commerce cryptocurrency payments (stub implementation)
 * - Price formatting utilities
 * 
 * TODO: Implement actual Coinbase Commerce API integration
 * TODO: Add webhook handling for payment confirmations
 * TODO: Add payment method management utilities
 */
import Stripe from "stripe";

// Initialize Stripe with API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

/**
 * Format price for display
 * @param amount - Amount in cents
 * @param currency - Currency code (default: USD)
 * @returns Formatted price string
 */
export function formatPrice(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount / 100);
}

/**
 * Stripe helper functions
 */
export const stripeHelpers = {
  /**
   * Create a new Stripe customer
   * @param email - Customer email
   * @param metadata - Additional metadata
   * @returns Stripe customer object
   */
  async createCustomer(email: string, metadata?: Record<string, string>) {
    return stripe.customers.create({
      email,
      metadata,
    });
  },

  /**
   * Create a checkout session for subscription
   * @param customerId - Stripe customer ID
   * @param priceId - Stripe price ID
   * @param successUrl - URL to redirect on success
   * @param cancelUrl - URL to redirect on cancel
   * @returns Stripe checkout session
   */
  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ) {
    return stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
  },

  /**
   * Cancel a subscription
   * @param subscriptionId - Stripe subscription ID
   * @returns Canceled subscription
   */
  async cancelSubscription(subscriptionId: string) {
    return stripe.subscriptions.cancel(subscriptionId);
  },

  /**
   * Get subscription details
   * @param subscriptionId - Stripe subscription ID
   * @returns Subscription object
   */
  async getSubscription(subscriptionId: string) {
    return stripe.subscriptions.retrieve(subscriptionId);
  },
};

/**
 * Coinbase Commerce helper functions (STUB IMPLEMENTATION)
 * 
 * NOTE: These are placeholder implementations. Actual Coinbase Commerce
 * integration requires API credentials and proper implementation.
 */
export const coinbase = {
  /**
   * Create a Coinbase Commerce charge (STUB)
   * @param name - Charge name
   * @param description - Charge description
   * @param amount - Amount in currency
   * @param currency - Currency code
   * @returns Mock charge object
   */
  async createCharge(
    name: string,
    description: string,
    amount: string,
    currency: string = "USD"
  ) {
    try {
      // NOTE: This is a stub implementation for development
      // Replace with actual Coinbase Commerce API call
      const charge = {
        id: `charge_${Date.now()}`,
        name,
        description,
        pricing: {
          local: { amount, currency },
        },
        addresses: {
          ethereum: "0x0000000000000000000000000000000000000000", // Placeholder address
        },
        hosted_url: `https://commerce.coinbase.com/charges/example`,
      };

      console.log("Created Coinbase charge (stub):", charge.id);
      return charge;
    } catch (error) {
      console.error("Error creating Coinbase charge:", error);
      throw new Error("Failed to create crypto payment");
    }
  },

  /**
   * Check Coinbase charge status (STUB)
   * @param chargeId - Charge ID
   * @returns Mock charge status
   */
  async getChargeStatus(chargeId: string) {
    try {
      // NOTE: This is a stub implementation for development
      // Replace with actual Coinbase Commerce API call
      return {
        id: chargeId,
        status: "PENDING", // PENDING, CONFIRMED, FAILED, etc.
        payments: [],
      };
    } catch (error) {
      console.error("Error getting charge status:", error);
      throw new Error("Failed to get payment status");
    }
  },
};

/**
 * Get Stripe subscription price IDs from environment
 * Configure these in your Stripe dashboard and add to .env
 */
export const SUBSCRIPTION_PRICES = {
  PREMIUM: process.env.STRIPE_PREMIUM_PRICE_ID || "",
  GOLD: process.env.STRIPE_GOLD_PRICE_ID || "",
} as const;

export { stripe };

/**
 * Create a Stripe payment intent for escrow transactions
 */
export async function createPaymentIntent(
  amount: number,
  currency: string = "usd",
  metadata: Record<string, string> = {}
): Promise<Stripe.PaymentIntent> {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata,
      // Use manual capture for escrow
      capture_method: "manual",
    });

    return paymentIntent;
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw new Error("Failed to create payment intent");
  }
}

/**
 * Capture a payment intent (release from escrow)
 */
export async function capturePaymentIntent(
  paymentIntentId: string,
  amountToCapture?: number
): Promise<Stripe.PaymentIntent> {
  try {
    const paymentIntent = await stripe.paymentIntents.capture(
      paymentIntentId,
      amountToCapture ? { amount_to_capture: amountToCapture } : {}
    );

    return paymentIntent;
  } catch (error) {
    console.error("Error capturing payment intent:", error);
    throw new Error("Failed to capture payment");
  }
}

/**
 * Cancel a payment intent (refund)
 */
export async function cancelPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  try {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error("Error canceling payment intent:", error);
    throw new Error("Failed to cancel payment");
  }
}

/**
 * Create a Stripe Connect account for sellers
 */
export async function createConnectAccount(
  email: string,
  country: string = "US"
): Promise<Stripe.Account> {
  try {
    const account = await stripe.accounts.create({
      type: "express",
      country,
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    return account;
  } catch (error) {
    console.error("Error creating Connect account:", error);
    throw new Error("Failed to create seller account");
  }
}

/**
 * Utility function to format currency amounts
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Calculate platform fee (percentage)
 */
export function calculatePlatformFee(
  amount: number,
  feePercentage: number = 2.5
): number {
  return Math.round((amount * feePercentage) / 100);
}

// TODO: Add webhook handling for Stripe events
// TODO: Add Coinbase Commerce webhook handling
// TODO: Add dispute management utilities
// TODO: Add multi-party payment splitting
