import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";

export const listingRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    // TODO: Implement listing retrieval
    return ctx.db.listing.findMany();
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      // TODO: Implement single listing retrieval
      return ctx.db.listing.findUnique({
        where: { id: input.id },
        include: {
          car: true,
          seller: true,
        },
      });
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string(),
      price: z.number(),
      carId: z.string(),
    }))
    .mutation(({ ctx, input }) => {
      // TODO: Implement listing creation
      return ctx.db.listing.create({
        data: {
          ...input,
          sellerId: ctx.userId,
        },
      });
    }),
}); 