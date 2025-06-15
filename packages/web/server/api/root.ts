import { createTRPCRouter } from "@/server/api/trpc";
import { listingRouter } from "./routers/listing";
import { orderRouter } from "./routers/order";
import { eventRouter } from "./routers/event";

export const appRouter = createTRPCRouter({
  listing: listingRouter,
  order: orderRouter,
  event: eventRouter,
});

export type AppRouter = typeof appRouter; 