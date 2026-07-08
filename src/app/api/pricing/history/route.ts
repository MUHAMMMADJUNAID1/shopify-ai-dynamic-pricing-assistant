import { apiError, apiJson, getErrorMessage } from "@/server/http/json";
import { parsePagination } from "@/server/http/pagination";
import { listPricingHistory } from "@/server/repositories/pricing.repository";
import { serializePricingDecision } from "@/server/serializers";

export async function GET(request: Request) {
  try {
    const pagination = parsePagination(request);
    const result = await listPricingHistory(pagination);

    return apiJson({
      history: result.items.map((decision) => serializePricingDecision(decision)),
      nextCursor: result.nextCursor,
    });
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}
