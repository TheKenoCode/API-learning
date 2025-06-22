import { db } from "./db";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Calculate the bonus pool for a challenge based on event entry fees
 * @param eventId - The ID of the event
 * @returns The bonus pool amount in USD
 */
export async function calculateBonusPool(eventId: string): Promise<number> {
  // Get all challenges for this event with their bonus pool percentages
  const challenges = await db.challenge.findMany({
    where: { eventId },
    select: {
      id: true,
      bonusPoolPercentOfEventFees: true,
    },
  });

  if (challenges.length === 0) {
    return 0;
  }

  // Get total entry fees from event entries
  const eventEntries = await db.eventEntry.findMany({
    where: { eventId },
    select: {
      event: {
        select: {
          entryFeeUSD: true,
        },
      },
    },
  });

  // Calculate total entry fees
  const totalEntryFees = eventEntries.reduce((sum, entry) => {
    const fee = entry.event.entryFeeUSD;
    if (!fee) return sum;
    return sum + (fee instanceof Decimal ? fee.toNumber() : Number(fee));
  }, 0);

  // Calculate bonus pools for each challenge
  const bonusPools = challenges.map((challenge) => {
    const percentage = challenge.bonusPoolPercentOfEventFees instanceof Decimal 
      ? challenge.bonusPoolPercentOfEventFees.toNumber() 
      : Number(challenge.bonusPoolPercentOfEventFees);
    return (totalEntryFees * percentage) / 100;
  });

  // Return the total bonus pool (sum of all challenge bonus pools)
  return bonusPools.reduce((sum, pool) => sum + pool, 0);
}

/**
 * Calculate individual challenge bonus pool
 * @param challengeId - The ID of the challenge
 * @returns The bonus pool amount for this specific challenge in USD
 */
export async function calculateChallengeBonusPool(challengeId: string): Promise<number> {
  const challenge = await db.challenge.findUnique({
    where: { id: challengeId },
    select: {
      bonusPoolPercentOfEventFees: true,
      eventId: true,
    },
  });

  if (!challenge) {
    throw new Error("Challenge not found");
  }

  // Get total entry fees from event entries
  const eventEntries = await db.eventEntry.findMany({
    where: { eventId: challenge.eventId },
    select: {
      event: {
        select: {
          entryFeeUSD: true,
        },
      },
    },
  });

  // Calculate total entry fees
  const totalEntryFees = eventEntries.reduce((sum, entry) => {
    const fee = entry.event.entryFeeUSD;
    if (!fee) return sum;
    return sum + (fee instanceof Decimal ? fee.toNumber() : Number(fee));
  }, 0);

  // Calculate bonus pool for this challenge
  const percentage = challenge.bonusPoolPercentOfEventFees instanceof Decimal 
    ? challenge.bonusPoolPercentOfEventFees.toNumber() 
    : Number(challenge.bonusPoolPercentOfEventFees);
  
  return (totalEntryFees * percentage) / 100;
}

/**
 * Format currency for display
 * @param amount - The amount in USD
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}