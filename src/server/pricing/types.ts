export type ShopifyProductForPricing = {
  productId: string;
  variantId: string;
  title: string;
  productType: string | null;
  vendor: string | null;
  currentPrice: number;
  inventoryQuantity: number;
};

export type AiPricingRecommendation = {
  recommendedPrice: number;
  reason: string;
};
