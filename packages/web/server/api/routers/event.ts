import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";

export const eventRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    // TODO: Implement event retrieval
    return ctx.db.event.findMany({
      include: {
        contests: true,
      },
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        date: z.date(),
        location: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      // TODO: Implement event creation
      return ctx.db.event.create({
        data: {
          ...input,
          organizerId: ctx.userId,
        },
      });
    }),
});
