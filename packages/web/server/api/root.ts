import { createTRPCRouter } from "@/server/api/trpc";
import { listingRouter } from "@/server/api/routers/listing";
import { orderRouter } from "@/server/api/routers/order";
import { eventRouter } from "@/server/api/routers/event";
import { clubRouter } from "@/server/api/routers/club";
import { clubPostRouter } from "@/server/api/routers/clubPost";
import { clubEventRouter } from "@/server/api/routers/clubEvent";
import { challengeRouter } from "@/server/api/routers/challenge";
import { marketplaceRouter } from "@/server/api/routers/marketplace";
import { socialRouter } from "@/server/api/routers/social";
import { subscriptionRouter } from "@/server/api/routers/subscription";
// import { userRouter } from "@/server/api/routers/user";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  listing: listingRouter,
  order: orderRouter,
  event: eventRouter,
  club: clubRouter,
  clubPost: clubPostRouter,
  clubEvent: clubEventRouter,
  challenge: challengeRouter,
  marketplace: marketplaceRouter,
  social: socialRouter,
  subscription: subscriptionRouter,
  // user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
