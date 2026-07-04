import { apiError, apiJson, getErrorMessage } from "@/server/http/json";
import { listPricingHistory } from "@/server/repositories/pricing.repository";
import { serializePricingDecision } from "@/server/serializers";

export async function GET() {
  try {
    const decisions = await listPricingHistory();
    return apiJson({
      history: decisions.map((decision) => serializePricingDecision(decision)),
    });
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}
