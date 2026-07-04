import { PricingRunStatus, PricingRunTrigger } from "@/generated/prisma/client";

import { env } from "@/server/env";
import { apiError, apiJson, getErrorMessage } from "@/server/http/json";
import { runPricingCycle } from "@/server/pricing/pricing-engine.service";
import { completePricingRun, createPricingRun } from "@/server/repositories/pricing.repository";
import { getSettings } from "@/server/repositories/settings.repository";
import { shouldRunPricingCycle } from "@/server/scheduler/should-run";
import { serializePricingRun } from "@/server/serializers";

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
}

export async function POST(request: Request) {
  try {
    if (!env.CRON_SECRET || getBearerToken(request) !== env.CRON_SECRET) {
      return apiError("Unauthorized cron request.", 401);
    }

    const settings = await getSettings();
    const isDue = shouldRunPricingCycle({
      lastRunAt: settings.lastRunAt,
      reviewFrequency: settings.reviewFrequency,
    });

    if (!isDue) {
      const run = await createPricingRun(PricingRunTrigger.SCHEDULED);
      const skippedRun = await completePricingRun(run.id, {
        status: PricingRunStatus.SKIPPED,
        productsScanned: 0,
        productsUpdated: 0,
        failuresCount: 0,
        errorMessage: "Review frequency is not due yet.",
      });

      return apiJson({ run: serializePricingRun(skippedRun), skipped: true });
    }

    const run = await runPricingCycle({
      triggerSource: PricingRunTrigger.SCHEDULED,
    });

    return apiJson({ run: serializePricingRun(run), skipped: false });
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}

export async function GET(request: Request) {
  return POST(request);
}
