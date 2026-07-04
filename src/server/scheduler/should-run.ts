import { ReviewFrequency } from "@/generated/prisma/client";

const FREQUENCY_MS: Record<ReviewFrequency, number> = {
  HOURLY: 60 * 60 * 1_000,
  DAILY: 24 * 60 * 60 * 1_000,
  WEEKLY: 7 * 24 * 60 * 60 * 1_000,
  MONTHLY: 30 * 24 * 60 * 60 * 1_000,
};

export function shouldRunPricingCycle(input: {
  lastRunAt: Date | null;
  reviewFrequency: ReviewFrequency;
  now?: Date;
}) {
  if (!input.lastRunAt) {
    return true;
  }

  const now = input.now ?? new Date();
  return (
    now.getTime() - input.lastRunAt.getTime() >=
    FREQUENCY_MS[input.reviewFrequency]
  );
}
