import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
import {
  CreateClubEventSchema,
  UpdateEventAttendanceSchema,
} from "@redline/shared";
import { createRateLimitMiddleware } from "@/server/security/rateLimiter";
import { requireClubPermission } from "@/server/auth/permissions";
import { SecurityValidator } from "@/server/security/validation";
import { auditLogger } from "@/server/audit/auditLogger";

export const clubEventRouter = createTRPCRouter({
  // Create a new club event
  create: protectedProcedure
    .input(CreateClubEventSchema)
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for content creation
      await createRateLimitMiddleware("CONTENT_CREATE")(ctx);
      
      // Input validation
      if (!SecurityValidator.validateNoXSS(input.title)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid event title" });
      }
      if (input.description && !SecurityValidator.validateNoXSS(input.description)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid event description" });
      }
      if (!SecurityValidator.validateId(input.clubId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid club ID" });
      }
      if (input.location && !SecurityValidator.validateLocation(input.location)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid location" });
      }
      
      // Permission checking
      await requireClubPermission((input) => input.clubId, "events:create")(ctx, input);
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.clubEvent.create({
        data: {
          ...input,
          organizerId: ctx.userId,
        },
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
          club: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              attendees: true,
            },
          },
        },
      });

      // Audit logging
      await auditLogger.logUserAction("event.created", ctx.userId, {
        severity: "low",
        category: "user_action",
        resourceType: "event",
        resourceId: event.id,
        metadata: {
          clubId: input.clubId,
          clubName: event.club.name,
          eventTitle: event.title,
          eventDate: event.date.toISOString(),
          location: event.location,
          maxAttendees: event.maxAttendees,
        },
      });

      return event;
    }),

  // Get event by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for read operations
      await createRateLimitMiddleware("READ_OPERATIONS")(ctx);
      
      // Input validation
      if (!SecurityValidator.validateId(input.id)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid event ID" });
      }
      
      return next();
    })
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.clubEvent.findUnique({
        where: { id: input.id },
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
          club: {
            select: {
              id: true,
              name: true,
              isPrivate: true,
            },
          },
          attendees: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
            orderBy: {
              status: "asc",
            },
          },
          _count: {
            select: {
              attendees: true,
            },
          },
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      // Check if event is in a private club and user has access
      if (event.club.isPrivate) {
        const membership = ctx.userId
          ? await ctx.db.clubMember.findUnique({
              where: {
                userId_clubId: {
                  userId: ctx.userId,
                  clubId: event.club.id,
                },
              },
            })
          : null;

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This event is in a private club",
          });
        }
      }

      // Check user's attendance status
      const userAttendance = ctx.userId
        ? await ctx.db.eventAttendee.findUnique({
            where: {
              userId_eventId: {
                userId: ctx.userId,
                eventId: event.id,
              },
            },
          })
        : null;

      return {
        ...event,
        userAttendance,
      };
    }),

  // Get events for a club
  getClubEvents: publicProcedure
    .input(z.object({ clubId: z.string() }))
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for read operations
      await createRateLimitMiddleware("READ_OPERATIONS")(ctx);
      
      // Input validation
      if (!SecurityValidator.validateId(input.clubId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid club ID" });
      }
      
      return next();
    })
    .query(async ({ ctx, input }) => {
      // First, check if the club exists and its privacy settings
      const club = await ctx.db.club.findUnique({
        where: { id: input.clubId },
        select: { 
          id: true,
          isPrivate: true,
          name: true
        },
      });

      if (!club) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Club not found",
        });
      }

      // Events are viewable by everyone regardless of club privacy
      // No access restrictions needed for events

      const events = await ctx.db.clubEvent.findMany({
        where: {
          clubId: input.clubId,
        },
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
          _count: {
            select: {
              attendees: {
                where: {
                  status: "ATTENDING",
                },
              },
            },
          },
        },
        orderBy: {
          date: "asc",
        },
      });

      return events;
    }),

  // Update event attendance
  updateAttendance: protectedProcedure
    .input(UpdateEventAttendanceSchema)
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for general operations
      await createRateLimitMiddleware("GENERAL")(ctx);
      
      // Input validation
      if (!SecurityValidator.validateId(input.eventId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid event ID" });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.clubEvent.findUnique({
        where: { id: input.eventId },
        include: {
          club: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      // Check if user is a member of the club
      const membership = await ctx.db.clubMember.findUnique({
        where: {
          userId_clubId: {
            userId: ctx.userId,
            clubId: event.clubId,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Must be a club member to attend club events",
        });
      }

      // Check if event has max attendees and is full
      if (event.maxAttendees && input.status === "ATTENDING") {
        const currentAttendees = await ctx.db.eventAttendee.count({
          where: {
            eventId: input.eventId,
            status: "ATTENDING",
          },
        });

        if (currentAttendees >= event.maxAttendees) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Event is full",
          });
        }
      }

      const attendance = await ctx.db.eventAttendee.upsert({
        where: {
          userId_eventId: {
            userId: ctx.userId,
            eventId: input.eventId,
          },
        },
        update: {
          status: input.status,
        },
        create: {
          userId: ctx.userId,
          eventId: input.eventId,
          status: input.status,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
              date: true,
            },
          },
        },
      });

      // Audit logging
      await auditLogger.logUserAction("event.attendance_updated", ctx.userId, {
        severity: "low",
        category: "user_action",
        resourceType: "event",
        resourceId: input.eventId,
        metadata: {
          clubId: event.club.id,
          clubName: event.club.name,
          eventTitle: event.title,
          attendanceStatus: input.status,
        },
      });

      return attendance;
    }),

  // Get user's event attendances
  getMyEvents: protectedProcedure
    .use(async ({ ctx, next }) => {
      // Rate limiting for read operations
      await createRateLimitMiddleware("READ_OPERATIONS")(ctx);
      return next();
    })
    .query(async ({ ctx }) => {
      const attendances = await ctx.db.eventAttendee.findMany({
        where: {
          userId: ctx.userId,
        },
        include: {
          event: {
            include: {
              club: {
                select: {
                  id: true,
                  name: true,
                },
              },
              organizer: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
        orderBy: {
          event: {
            date: "asc",
          },
        },
      });

      return attendances;
    }),

  // Update event (organizer only)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        date: z.date().optional(),
        location: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        maxAttendees: z.number().int().positive().optional(),
      })
    )
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for content updates
      await createRateLimitMiddleware("CONTENT_CREATE")(ctx);
      
      // Input validation
      if (!SecurityValidator.validateId(input.id)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid event ID" });
      }
      if (input.title && !SecurityValidator.validateNoXSS(input.title)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid event title" });
      }
      if (input.description && !SecurityValidator.validateNoXSS(input.description)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid event description" });
      }
      if (input.location && !SecurityValidator.validateLocation(input.location)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid location" });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Check if user is the organizer or club admin
      const event = await ctx.db.clubEvent.findUnique({
        where: { id },
        include: {
          club: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      const membership = await ctx.db.clubMember.findUnique({
        where: {
          userId_clubId: {
            userId: ctx.userId,
            clubId: event.clubId,
          },
        },
      });

      const canEdit = 
        event.organizerId === ctx.userId || 
        (membership && ["ADMIN", "MODERATOR"].includes(membership.role));

      if (!canEdit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Can only edit events you organized or if you're a club admin/moderator",
        });
      }

      const updatedEvent = await ctx.db.clubEvent.update({
        where: { id },
        data: updateData,
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
          club: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              attendees: true,
            },
          },
        },
      });

      // Audit logging
      await auditLogger.logUserAction("event.updated", ctx.userId, {
        severity: "low",
        category: "user_action",
        resourceType: "event",
        resourceId: id,
        metadata: {
          clubId: event.club.id,
          clubName: event.club.name,
          eventTitle: event.title,
          changes: updateData,
          isOrganizer: event.organizerId === ctx.userId,
        },
      });

      return updatedEvent;
    }),

  // Delete event (organizer only)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .use(async ({ ctx, next, input }) => {
      // Rate limiting for admin operations
      await createRateLimitMiddleware("ADMIN_OPERATIONS")(ctx);
      
      // Input validation
      if (!SecurityValidator.validateId(input.id)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid event ID" });
      }
      
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      // Check if user is the organizer or club admin
      const event = await ctx.db.clubEvent.findUnique({
        where: { id: input.id },
        include: {
          club: {
            select: {
              id: true,
              name: true,
            },
          },
          organizer: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      const membership = await ctx.db.clubMember.findUnique({
        where: {
          userId_clubId: {
            userId: ctx.userId,
            clubId: event.clubId,
          },
        },
      });

      const canDelete = 
        event.organizerId === ctx.userId || 
        (membership && ["ADMIN", "MODERATOR"].includes(membership.role));

      if (!canDelete) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Can only delete events you organized or if you're a club admin/moderator",
        });
      }

      await ctx.db.clubEvent.delete({
        where: { id: input.id },
      });

      // Audit logging
      await auditLogger.logUserAction("event.deleted", ctx.userId, {
        severity: "medium",
        category: "moderation",
        resourceType: "event",
        resourceId: input.id,
        metadata: {
          clubId: event.club.id,
          clubName: event.club.name,
          eventTitle: event.title,
          organizerName: event.organizer.name,
          deletedByOrganizer: event.organizerId === ctx.userId,
        },
      });

      return { success: true };
    }),
}); 