import type { AiPricingRecommendation, ShopifyProductForPricing } from "./types";

export type PriceValidationResult =
  | { valid: true; price: number; reason: string }
  | { valid: false; message: string };

export function validateRecommendedPrice(input: {
  product: ShopifyProductForPricing;
  recommendation: AiPricingRecommendation;
  maximumAllowedPrice: number;
}): PriceValidationResult {
  const price = Number(input.recommendation.recommendedPrice);

  if (!Number.isFinite(price)) {
    return { valid: false, message: "AI returned a non-numeric price." };
  }

  if (price < input.product.currentPrice) {
    return {
      valid: false,
      message: "Recommended price is below the current price.",
    };
  }

  if (price > input.maximumAllowedPrice) {
    return {
      valid: false,
      message: "Recommended price exceeds the maximum allowed price.",
    };
  }

  return {
    valid: true,
    price: Number(price.toFixed(2)),
    reason: input.recommendation.reason,
  };
}
