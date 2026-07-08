import { apiError, apiJson, getErrorMessage } from "@/server/http/json";
import { parsePagination } from "@/server/http/pagination";
import { listPricingRuns } from "@/server/repositories/pricing.repository";
import { serializePricingRun } from "@/server/serializers";

export async function GET(request: Request) {
  try {
    const pagination = parsePagination(request);
    const result = await listPricingRuns(pagination);

    return apiJson({
      runs: result.items.map((run) => serializePricingRun(run)),
      nextCursor: result.nextCursor,
    });
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}
