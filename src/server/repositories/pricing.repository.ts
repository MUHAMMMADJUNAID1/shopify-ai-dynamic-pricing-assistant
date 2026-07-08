import {
  PricingDecisionStatus,
  PricingRunStatus,
  PricingRunTrigger,
  Prisma,
} from "@/generated/prisma/client";

import { prisma } from "@/server/db/prisma";

export type DecisionInput = {
  runId: string;
  shopifyProductId: string;
  shopifyVariantId: string;
  productTitle: string;
  productType?: string | null;
  vendor?: string | null;
  inventoryQuantity: number;
  oldPrice: number;
  recommendedNewPrice?: number | null;
  aiReason?: string | null;
  status: PricingDecisionStatus;
  message?: string | null;
};

export async function createPricingRun(triggerSource: PricingRunTrigger) {
  return prisma.pricingRun.create({
    data: {
      triggerSource,
      status: PricingRunStatus.RUNNING,
    },
  });
}

export async function completePricingRun(
  runId: string,
  input: {
    status: PricingRunStatus;
    productsScanned: number;
    productsUpdated: number;
    failuresCount: number;
    errorMessage?: string | null;
  },
) {
  return prisma.pricingRun.update({
    where: { id: runId },
    data: {
      ...input,
      finishedAt: new Date(),
    },
  });
}

export async function createPricingDecision(input: DecisionInput) {
  return prisma.pricingDecision.create({
    data: {
      ...input,
      oldPrice: new Prisma.Decimal(input.oldPrice),
      recommendedNewPrice:
        input.recommendedNewPrice == null
          ? null
          : new Prisma.Decimal(input.recommendedNewPrice),
    },
  });
}

export async function listPricingHistory(input: {
  limit: number;
  cursor?: string | null;
}) {
  const decisions = await prisma.pricingDecision.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: input.limit + 1,
    ...(input.cursor
      ? {
          cursor: { id: input.cursor },
          skip: 1,
        }
      : {}),
    include: {
      run: {
        select: {
          triggerSource: true,
          startedAt: true,
        },
      },
    },
  });

  const nextItem = decisions.length > input.limit ? decisions.pop() : null;

  return {
    items: decisions,
    nextCursor: nextItem?.id ?? null,
  };
}

export async function listLatestRunDecisions() {
  const latestRun = await prisma.pricingRun.findFirst({
    orderBy: { startedAt: "desc" },
    select: { id: true },
  });

  if (!latestRun) {
    return [];
  }

  return prisma.pricingDecision.findMany({
    where: { runId: latestRun.id },
    orderBy: { createdAt: "asc" },
    include: {
      run: {
        select: {
          triggerSource: true,
          startedAt: true,
        },
      },
    },
  });
}

export async function listPricingRuns(input: {
  limit: number;
  cursor?: string | null;
}) {
  const runs = await prisma.pricingRun.findMany({
    orderBy: [{ startedAt: "desc" }, { id: "desc" }],
    take: input.limit + 1,
    ...(input.cursor
      ? {
          cursor: { id: input.cursor },
          skip: 1,
        }
      : {}),
  });

  const nextItem = runs.length > input.limit ? runs.pop() : null;

  return {
    items: runs,
    nextCursor: nextItem?.id ?? null,
  };
}

export async function clearPricingHistory() {
  await prisma.pricingDecision.deleteMany();
  await prisma.pricingRun.deleteMany();
}
