import type {
  MerchantSettings,
  PricingDecision,
  PricingRun,
} from "@/generated/prisma/client";

export function serializeSettings(settings: MerchantSettings) {
  return {
    ...settings,
    maximumAllowedPrice: Number(settings.maximumAllowedPrice),
    createdAt: settings.createdAt.toISOString(),
    updatedAt: settings.updatedAt.toISOString(),
    lastRunAt: settings.lastRunAt?.toISOString() ?? null,
  };
}

export function serializePricingRun(run: PricingRun) {
  return {
    ...run,
    startedAt: run.startedAt.toISOString(),
    finishedAt: run.finishedAt?.toISOString() ?? null,
  };
}

export function serializePricingDecision(
  decision: PricingDecision & {
    run?: {
      triggerSource: string;
      startedAt: Date;
    };
  },
) {
  return {
    ...decision,
    oldPrice: Number(decision.oldPrice),
    recommendedNewPrice:
      decision.recommendedNewPrice == null
        ? null
        : Number(decision.recommendedNewPrice),
    createdAt: decision.createdAt.toISOString(),
    run: decision.run
      ? {
          ...decision.run,
          startedAt: decision.run.startedAt.toISOString(),
        }
      : undefined,
  };
}
