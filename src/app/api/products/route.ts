import { apiError, apiJson, getErrorMessage } from "@/server/http/json";
import { fetchProductsForPricing } from "@/server/shopify/shopify-admin.service";

export async function GET() {
  try {
    const products = await fetchProductsForPricing(25);
    return apiJson({ products });
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}
