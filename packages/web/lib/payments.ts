import Stripe from "stripe";

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

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
 * Coinbase Commerce helper functions
 */
export const coinbase = {
  /**
   * Create a Coinbase Commerce charge
   */
  async createCharge(
    name: string,
    description: string,
    amount: string,
    currency: string = "USD"
  ) {
    try {
      // TODO: Implement Coinbase Commerce API integration
      const charge = {
        id: `charge_${Date.now()}`,
        name,
        description,
        pricing: {
          local: { amount, currency },
        },
        addresses: {
          ethereum: "0x...", // TODO: Generate actual address
        },
        hosted_url: `https://commerce.coinbase.com/charges/${Date.now()}`,
      };

      console.log("Created Coinbase charge:", charge.id);
      return charge;
    } catch (error) {
      console.error("Error creating Coinbase charge:", error);
      throw new Error("Failed to create crypto payment");
    }
  },

  /**
   * Check Coinbase charge status
   */
  async getChargeStatus(chargeId: string) {
    try {
      // TODO: Implement actual Coinbase API call
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