import { apiError, apiJson, getErrorMessage } from "@/server/http/json";
import { clearPricingHistory } from "@/server/repositories/pricing.repository";

export async function DELETE() {
  if (process.env.NODE_ENV === "production") {
    return apiError("History clearing is disabled in production.", 403);
  }

  try {
    await clearPricingHistory();
    return apiJson({ ok: true });
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}
