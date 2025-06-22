import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import {
  CreateSubscriptionSchema,
  UpdateSubscriptionSchema,
} from "@redline/shared";

export const subscriptionRouter = createTRPCRouter({
  // Get current user's subscription
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await ctx.db.subscription.findUnique({
      where: { userId: ctx.userId },
    });

    // If no subscription exists, user is on free tier
    if (!subscription) {
      return {
        tier: "FREE" as const,
        status: "ACTIVE" as const,
        isFree: true,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      };
    }

    return {
      ...subscription,
      isFree: false,
    };
  }),

  // Create or upgrade subscription
  create: protectedProcedure
    .input(CreateSubscriptionSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user already has a subscription
      const existingSubscription = await ctx.db.subscription.findUnique({
        where: { userId: ctx.userId },
      });

      if (existingSubscription) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User already has a subscription. Use update instead.",
        });
      }

      // Create subscription
      const subscription = await ctx.db.subscription.create({
        data: {
          userId: ctx.userId,
          tier: input.tier,
          stripePriceId: input.stripePriceId,
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      return subscription;
    }),

  // Update subscription
  update: protectedProcedure
    .input(UpdateSubscriptionSchema)
    .mutation(async ({ ctx, input }) => {
      const existingSubscription = await ctx.db.subscription.findUnique({
        where: { userId: ctx.userId },
      });

      if (!existingSubscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No subscription found for user",
        });
      }

      const updatedSubscription = await ctx.db.subscription.update({
        where: { userId: ctx.userId },
        data: input,
      });

      return updatedSubscription;
    }),

  // Cancel subscription
  cancel: protectedProcedure.mutation(async ({ ctx }) => {
    const existingSubscription = await ctx.db.subscription.findUnique({
      where: { userId: ctx.userId },
    });

    if (!existingSubscription) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No subscription found for user",
      });
    }

    const canceledSubscription = await ctx.db.subscription.update({
      where: { userId: ctx.userId },
      data: { status: "CANCELED" },
    });

    return canceledSubscription;
  }),

  // Check subscription limits
  checkLimits: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await ctx.db.subscription.findUnique({
      where: { userId: ctx.userId },
    });

    const tier = subscription?.tier || "FREE";

    // Get user's current usage
    const [clubCount, marketplacePostCount] = await Promise.all([
      ctx.db.clubMember.count({
        where: { userId: ctx.userId },
      }),
      ctx.db.marketplacePost.count({
        where: { 
          sellerId: ctx.userId,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
          },
        },
      }),
    ]);

    // Define limits based on tier
    const limits = {
      FREE: {
        maxClubs: 3,
        maxMarketplacePostsPerMonth: 5,
        canCreatePrivateClubs: false,
        canCreateClubs: false,
        canCreateChallenges: false,
      },
      PREMIUM: {
        maxClubs: Infinity,
        maxMarketplacePostsPerMonth: Infinity,
        canCreatePrivateClubs: true,
        canCreateClubs: true,
        canCreateChallenges: true,
        maxClubMembers: 50,
      },
      PRO: {
        maxClubs: Infinity,
        maxMarketplacePostsPerMonth: Infinity,
        canCreatePrivateClubs: true,
        canCreateClubs: true,
        canCreateChallenges: true,
        maxClubMembers: Infinity,
        hasApiAccess: true,
        hasAdvancedAnalytics: true,
        hasCustomBranding: true,
      },
    };

    const currentLimits = limits[tier];

    return {
      tier,
      limits: currentLimits,
      usage: {
        clubCount,
        marketplacePostCount,
      },
      canJoinMoreClubs: clubCount < currentLimits.maxClubs,
      canCreateMoreMarketplacePosts: marketplacePostCount < currentLimits.maxMarketplacePostsPerMonth,
    };
  }),

  // Get subscription features
  getFeatures: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await ctx.db.subscription.findUnique({
      where: { userId: ctx.userId },
    });

    const tier = subscription?.tier || "FREE";

    const features = {
      FREE: [
        "Join up to 3 clubs",
        "Participate in public challenges",
        "Basic marketplace access (5 listings/month)",
        "View global leaderboards",
      ],
      PREMIUM: [
        "Join unlimited clubs",
        "Create private clubs (max 50 members)",
        "Create custom challenges",
        "Enhanced marketplace (unlimited listings)",
        "Priority customer support",
        "Advanced statistics & analytics",
      ],
      PRO: [
        "Everything in Premium",
        "Create large clubs (unlimited members)",
        "Advanced club management tools",
        "API access for integrations",
        "Custom branding for clubs",
        "Bulk challenge creation",
        "Priority placement in search",
      ],
    };

    return {
      tier,
      features: features[tier],
      isActive: subscription?.status === "ACTIVE" || tier === "FREE",
    };
  }),

  // Get pricing information
  getPricing: protectedProcedure.query(async () => {
    return {
      tiers: [
        {
          name: "Free",
          tier: "FREE" as const,
          price: 0,
          interval: "forever",
          features: [
            "Join up to 3 clubs",
            "Participate in public challenges",
            "Basic marketplace access (5 listings/month)",
            "View global leaderboards",
          ],
          stripePriceId: null,
        },
        {
          name: "Premium",
          tier: "PREMIUM" as const,
          price: 9.99,
          interval: "month",
          features: [
            "Join unlimited clubs",
            "Create private clubs (max 50 members)",
            "Create custom challenges",
            "Enhanced marketplace (unlimited listings)",
            "Priority customer support",
            "Advanced statistics & analytics",
          ],
          stripePriceId: "price_premium_monthly", // This would be actual Stripe price ID
          popular: true,
        },
        {
          name: "Pro",
          tier: "PRO" as const,
          price: 24.99,
          interval: "month",
          features: [
            "Everything in Premium",
            "Create large clubs (unlimited members)",
            "Advanced club management tools",
            "API access for integrations",
            "Custom branding for clubs",
            "Bulk challenge creation",
            "Priority placement in search",
          ],
          stripePriceId: "price_pro_monthly", // This would be actual Stripe price ID
        },
      ],
    };
  }),

  // Webhook handler for Stripe events (would be called by Stripe)
  handleWebhook: protectedProcedure
    .input(
      z.object({
        eventType: z.string(),
        customerId: z.string(),
        subscriptionId: z.string().optional(),
        priceId: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // This would typically be called by a Stripe webhook, not directly by users
      // For now, this is a placeholder for the webhook logic

      switch (input.eventType) {
        case "customer.subscription.created":
        case "customer.subscription.updated":
          if (input.priceId && input.status) {
            // Map Stripe price ID to tier
            const tierMap: Record<string, "PREMIUM" | "PRO"> = {
              price_premium_monthly: "PREMIUM",
              price_pro_monthly: "PRO",
            };

            const tier = tierMap[input.priceId];
            if (tier) {
              await ctx.db.subscription.upsert({
                where: { stripeCustomerId: input.customerId },
                update: {
                  tier,
                  status: input.status as any,
                  stripePriceId: input.priceId,
                  currentPeriodStart: new Date(),
                  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
                create: {
                  userId: ctx.userId, // This would need to be looked up by customerId
                  tier,
                  status: input.status as any,
                  stripeCustomerId: input.customerId,
                  stripePriceId: input.priceId,
                  currentPeriodStart: new Date(),
                  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
              });
            }
          }
          break;

        case "customer.subscription.deleted":
          await ctx.db.subscription.update({
            where: { stripeCustomerId: input.customerId },
            data: { status: "CANCELED" },
          });
          break;

        default:
          // Silently ignore unhandled webhook events
      }

      return { success: true };
    }),
}); 