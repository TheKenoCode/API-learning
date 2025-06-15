import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const orderRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      listingId: z.string(),
      amount: z.number(),
    }))
    .mutation(({ ctx, input }) => {
      // TODO: Implement order creation with escrow
      return ctx.db.order.create({
        data: {
          ...input,
          buyerId: ctx.userId,
          escrowStatus: "PENDING",
        },
      });
    }),

  getMyOrders: protectedProcedure.query(({ ctx }) => {
    // TODO: Implement user order retrieval
    return ctx.db.order.findMany({
      where: { buyerId: ctx.userId },
      include: {
        listing: {
          include: {
            car: true,
          },
        },
      },
    });
  }),
}); 