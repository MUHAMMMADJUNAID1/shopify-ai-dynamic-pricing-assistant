import { apiError, apiJson, getErrorMessage } from "@/server/http/json";
import { listPricingRuns } from "@/server/repositories/pricing.repository";
import { serializePricingRun } from "@/server/serializers";

export async function GET() {
  try {
    const runs = await listPricingRuns();
    return apiJson({ runs: runs.map((run) => serializePricingRun(run)) });
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}
