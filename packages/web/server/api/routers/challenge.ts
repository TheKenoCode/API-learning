import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
import {
  CreateChallengeSchema,
  ParticipateInChallengeSchema,
  SubmitChallengeResultSchema,
  GetPreMadeChallengesSchema,
  GetLeaderboardSchema,
} from "@redline/shared";

export const challengeRouter = createTRPCRouter({
  // Create a new challenge
  create: protectedProcedure
    .input(CreateChallengeSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user can create challenges in the club (if specified)
      if (input.clubId) {
        const membership = await ctx.db.clubMember.findUnique({
          where: {
            userId_clubId: {
              userId: ctx.userId,
              clubId: input.clubId,
            },
          },
        });

        if (!membership || !["ADMIN", "MODERATOR"].includes(membership.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins and moderators can create club challenges",
          });
        }
      }

      const challenge = await ctx.db.challenge.create({
        data: {
          ...input,
          creatorId: ctx.userId,
          parameters: input.parameters || {},
        },
        include: {
          creator: {
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
              participants: true,
            },
          },
        },
      });

      return challenge;
    }),

  // Get challenge by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const challenge = await ctx.db.challenge.findUnique({
        where: { id: input.id },
        include: {
          creator: {
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
          participants: {
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
              score: "desc",
            },
          },
          _count: {
            select: {
              participants: true,
            },
          },
        },
      });

      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found",
        });
      }

      // Check if challenge is in a private club and user has access
      if (challenge.club?.isPrivate) {
        const membership = ctx.userId
          ? await ctx.db.clubMember.findUnique({
              where: {
                userId_clubId: {
                  userId: ctx.userId,
                  clubId: challenge.club.id,
                },
              },
            })
          : null;

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This challenge is in a private club",
          });
        }
      }

      // Check if user is participating
      const userParticipation = ctx.userId
        ? await ctx.db.challengeParticipant.findUnique({
            where: {
              userId_challengeId: {
                userId: ctx.userId,
                challengeId: challenge.id,
              },
            },
          })
        : null;

      return {
        ...challenge,
        userParticipation,
      };
    }),

  // Get pre-made challenges
  getPreMade: publicProcedure
    .input(GetPreMadeChallengesSchema)
    .query(async ({ ctx, input }) => {
      const where = {
        isPreMade: true,
        isActive: true,
        ...(input.type && { type: input.type }),
        ...(input.difficulty && { difficulty: input.difficulty }),
        ...(input.city && { city: input.city }),
        ...(input.territory && { territory: input.territory }),
      };

      const challenges = await ctx.db.challenge.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
          _count: {
            select: {
              participants: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input.limit,
        ...(input.cursor && {
          skip: 1,
          cursor: { id: input.cursor },
        }),
      });

      const nextCursor = challenges.length === input.limit ? challenges[challenges.length - 1]?.id : null;

      return {
        challenges,
        nextCursor,
      };
    }),

  // Participate in a challenge
  participate: protectedProcedure
    .input(ParticipateInChallengeSchema)
    .mutation(async ({ ctx, input }) => {
      const challenge = await ctx.db.challenge.findUnique({
        where: { id: input.challengeId },
        include: {
          club: true,
        },
      });

      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found",
        });
      }

      if (!challenge.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Challenge is not active",
        });
      }

      // Check if challenge is in a club and user is a member
      if (challenge.clubId) {
        const membership = await ctx.db.clubMember.findUnique({
          where: {
            userId_clubId: {
              userId: ctx.userId,
              clubId: challenge.clubId,
            },
          },
        });

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Must be a club member to participate in club challenges",
          });
        }
      }

      // Check if already participating
      const existingParticipation = await ctx.db.challengeParticipant.findUnique({
        where: {
          userId_challengeId: {
            userId: ctx.userId,
            challengeId: input.challengeId,
          },
        },
      });

      if (existingParticipation) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already participating in this challenge",
        });
      }

      const participation = await ctx.db.challengeParticipant.create({
        data: {
          userId: ctx.userId,
          challengeId: input.challengeId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
          challenge: {
            select: {
              id: true,
              title: true,
              type: true,
              difficulty: true,
            },
          },
        },
      });

      return participation;
    }),

  // Submit challenge result
  submitResult: protectedProcedure
    .input(SubmitChallengeResultSchema)
    .mutation(async ({ ctx, input }) => {
      const participation = await ctx.db.challengeParticipant.findUnique({
        where: {
          userId_challengeId: {
            userId: ctx.userId,
            challengeId: input.challengeId,
          },
        },
        include: {
          challenge: {
            include: {
              club: true,
            },
          },
        },
      });

      if (!participation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Not participating in this challenge",
        });
      }

      if (!participation.challenge.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Challenge is not active",
        });
      }

      // Update participation with result
      const updatedParticipation = await ctx.db.challengeParticipant.update({
        where: {
          userId_challengeId: {
            userId: ctx.userId,
            challengeId: input.challengeId,
          },
        },
        data: {
          score: input.score,
          completedAt: new Date(),
          evidence: input.evidence,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
          challenge: {
            include: {
              club: true,
            },
          },
        },
      });

      // Update leaderboards - create entries for different scopes
      await updateLeaderboards(ctx, input.challengeId, ctx.userId, input.score);

      return updatedParticipation;
    }),

  // Get leaderboard for a challenge
  getLeaderboard: publicProcedure
    .input(GetLeaderboardSchema)
    .query(async ({ ctx, input }) => {
      const challenge = await ctx.db.challenge.findUnique({
        where: { id: input.challengeId },
        include: {
          club: {
            select: {
              id: true,
              isPrivate: true,
            },
          },
        },
      });

      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found",
        });
      }

      // Check if challenge is in a private club
      if (challenge.club?.isPrivate) {
        const membership = ctx.userId
          ? await ctx.db.clubMember.findUnique({
              where: {
                userId_clubId: {
                  userId: ctx.userId,
                  clubId: challenge.club.id,
                },
              },
            })
          : null;

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This challenge is in a private club",
          });
        }
      }

      const where = {
        challengeId: input.challengeId,
        scope: input.scope,
        ...(input.scopeValue && { scopeValue: input.scopeValue }),
      };

      const leaderboard = await ctx.db.leaderboardEntry.findMany({
        where,
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
          rank: "asc",
        },
        take: input.limit,
      });

      return leaderboard;
    }),

  // Get user's challenge progress
  getMyProgress: protectedProcedure.query(async ({ ctx }) => {
    const participations = await ctx.db.challengeParticipant.findMany({
      where: {
        userId: ctx.userId,
      },
      include: {
        challenge: {
          include: {
            creator: {
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
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return participations;
  }),

  // Get challenges for a club
  getClubChallenges: publicProcedure
    .input(z.object({ clubId: z.string() }))
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

      // Challenges are viewable by everyone regardless of club privacy
      // No access restrictions needed for challenges

      const challenges = await ctx.db.challenge.findMany({
        where: {
          clubId: input.clubId,
          isActive: true,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
          _count: {
            select: {
              participants: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return challenges;
    }),
});

// Helper function to update leaderboards
async function updateLeaderboards(ctx: any, challengeId: string, userId: string, score: number) {
  const challenge = await ctx.db.challenge.findUnique({
    where: { id: challengeId },
    include: {
      club: true,
    },
  });

  if (!challenge) return;

  // Update global leaderboard
  await ctx.db.leaderboardEntry.upsert({
    where: {
      userId_challengeId_scope_scopeValue: {
        userId,
        challengeId,
        scope: "GLOBAL",
        scopeValue: null,
      },
    },
    update: {
      score,
      updatedAt: new Date(),
    },
    create: {
      userId,
      challengeId,
      scope: "GLOBAL",
      scopeValue: null,
      score,
      rank: 1, // Will be updated by background job
    },
  });

  // Update city leaderboard if applicable
  if (challenge.city) {
    await ctx.db.leaderboardEntry.upsert({
      where: {
        userId_challengeId_scope_scopeValue: {
          userId,
          challengeId,
          scope: "CITY",
          scopeValue: challenge.city,
        },
      },
      update: {
        score,
        updatedAt: new Date(),
      },
      create: {
        userId,
        challengeId,
        scope: "CITY",
        scopeValue: challenge.city,
        score,
        rank: 1,
      },
    });
  }

  // Update territory leaderboard if applicable
  if (challenge.territory) {
    await ctx.db.leaderboardEntry.upsert({
      where: {
        userId_challengeId_scope_scopeValue: {
          userId,
          challengeId,
          scope: "TERRITORY",
          scopeValue: challenge.territory,
        },
      },
      update: {
        score,
        updatedAt: new Date(),
      },
      create: {
        userId,
        challengeId,
        scope: "TERRITORY",
        scopeValue: challenge.territory,
        score,
        rank: 1,
      },
    });
  }

  // Update club leaderboard if applicable
  if (challenge.clubId) {
    await ctx.db.leaderboardEntry.upsert({
      where: {
        userId_challengeId_scope_scopeValue: {
          userId,
          challengeId,
          scope: "CLUB",
          scopeValue: challenge.clubId,
        },
      },
      update: {
        score,
        updatedAt: new Date(),
      },
      create: {
        userId,
        challengeId,
        scope: "CLUB",
        scopeValue: challenge.clubId,
        score,
        rank: 1,
      },
    });
  }
} 