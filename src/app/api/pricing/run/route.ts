import { PricingRunTrigger } from "@/generated/prisma/client";

import { apiError, apiJson, getErrorMessage } from "@/server/http/json";
import { runPricingCycle } from "@/server/pricing/pricing-engine.service";
import { serializePricingRun } from "@/server/serializers";

export async function POST() {
  try {
    const run = await runPricingCycle({ triggerSource: PricingRunTrigger.MANUAL });
    return apiJson({ run: serializePricingRun(run) });
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}
