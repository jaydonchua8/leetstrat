import { Prisma } from '@prisma/client';
import {
  CategoryAccuracy,
  CategoryKind,
  MasteryLevel,
  TagOutcome,
  UserAccuracyStats,
} from '../types';

/** Below this sample count a tag is too noisy to label weak or strong. */
const MIN_SAMPLES_FOR_MASTERY = 3;
const WEAK_THRESHOLD = 0.5;
const STRONG_THRESHOLD = 0.8;
const LEADERBOARD_SIZE = 5;

function toMastery(timesSeen: number, accuracy: number): MasteryLevel {
  if (timesSeen < MIN_SAMPLES_FOR_MASTERY) return 'UNSEEN';
  if (accuracy < WEAK_THRESHOLD) return 'WEAK';
  if (accuracy < STRONG_THRESHOLD) return 'DEVELOPING';
  return 'STRONG';
}

function toCategoryAccuracy(row: {
  kind: CategoryKind;
  key: string;
  timesSeen: number;
  timesCorrect: number;
}): CategoryAccuracy {
  const accuracy = row.timesSeen === 0 ? 0 : row.timesCorrect / row.timesSeen;
  return {
    kind: row.kind,
    key: row.key,
    timesSeen: row.timesSeen,
    timesCorrect: row.timesCorrect,
    accuracy: Number(accuracy.toFixed(4)),
    mastery: toMastery(row.timesSeen, accuracy),
  };
}

/**
 * Applies per-tag outcomes to user_category_stats.
 *
 * Runs inside the caller's transaction. Upserts are sequential because Prisma
 * has no batch upsert; at ~4-8 tags per attempt this is fine. If tag counts
 * grow, replace with a single `INSERT ... ON CONFLICT DO UPDATE` via $executeRaw.
 */
export async function applyTagOutcomes(
  tx: Prisma.TransactionClient,
  userId: string,
  outcomes: TagOutcome[],
): Promise<void> {
  for (const outcome of outcomes) {
    await tx.userCategoryStat.upsert({
      where: {
        userId_kind_key: { userId, kind: outcome.kind, key: outcome.key },
      },
      create: {
        userId,
        kind: outcome.kind,
        key: outcome.key,
        timesSeen: 1,
        timesCorrect: outcome.wasCorrect ? 1 : 0,
      },
      update: {
        timesSeen: { increment: 1 },
        timesCorrect: { increment: outcome.wasCorrect ? 1 : 0 },
        lastSeenAt: new Date(),
      },
    });
  }
}

/** Increments the denormalized counters on the User row. */
export async function applyAttemptCounters(
  tx: Prisma.TransactionClient,
  userId: string,
  isFullyCorrect: boolean,
): Promise<{ totalAttempts: number; totalFullyCorrect: number }> {
  const user = await tx.user.update({
    where: { id: userId },
    data: {
      totalAttempts: { increment: 1 },
      totalFullyCorrect: { increment: isFullyCorrect ? 1 : 0 },
    },
    select: { totalAttempts: true, totalFullyCorrect: true },
  });
  return user;
}

/**
 * Reads back the user's full stat picture after the write. Must be called
 * inside the same transaction so the response reflects this attempt.
 */
export async function buildAccuracyStats(
  tx: Prisma.TransactionClient,
  userId: string,
  totals: { totalAttempts: number; totalFullyCorrect: number },
  touchedKeys: TagOutcome[],
): Promise<UserAccuracyStats> {
  const rows = await tx.userCategoryStat.findMany({
    where: { userId },
    select: { kind: true, key: true, timesSeen: true, timesCorrect: true },
  });

  const all = rows.map(toCategoryAccuracy);

  // Only rank tags with enough samples; otherwise a single miss reads as "weak".
  const ranked = all
    .filter((c) => c.timesSeen >= MIN_SAMPLES_FOR_MASTERY)
    .sort((a, b) => a.accuracy - b.accuracy || b.timesSeen - a.timesSeen);

  const touchedSet = new Set(touchedKeys.map((t) => `${t.kind}:${t.key}`));

  return {
    totalAttempts: totals.totalAttempts,
    totalFullyCorrect: totals.totalFullyCorrect,
    overallAccuracy:
      totals.totalAttempts === 0
        ? 0
        : Number((totals.totalFullyCorrect / totals.totalAttempts).toFixed(4)),
    weakestCategories: ranked.slice(0, LEADERBOARD_SIZE),
    strongestCategories: [...ranked].reverse().slice(0, LEADERBOARD_SIZE),
    touchedCategories: all.filter((c) => touchedSet.has(`${c.kind}:${c.key}`)),
  };
}
