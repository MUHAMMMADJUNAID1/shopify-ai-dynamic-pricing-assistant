export type ReviewFrequency = "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY";

export type MerchantSettingsDto = {
  id: string;
  inventoryThreshold: number;
  maximumAllowedPrice: number;
  reviewFrequency: ReviewFrequency;
  aiBehaviorPrompt: string | null;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ShopifyProductDto = {
  productId: string;
  variantId: string;
  title: string;
  productType: string | null;
  vendor: string | null;
  currentPrice: number;
  inventoryQuantity: number;
};

export type PricingRunDto = {
  id: string;
  status: "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED";
  triggerSource: "MANUAL" | "SCHEDULED";
  productsScanned: number;
  productsUpdated: number;
  failuresCount: number;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
};

export type PricingDecisionDto = {
  id: string;
  runId: string;
  shopifyProductId: string;
  shopifyVariantId: string;
  productTitle: string;
  productType: string | null;
  vendor: string | null;
  inventoryQuantity: number;
  oldPrice: number;
  recommendedNewPrice: number | null;
  aiReason: string | null;
  status:
    | "UPDATED"
    | "SKIPPED"
    | "INVALID_AI_RESPONSE"
    | "VALIDATION_FAILED"
    | "SHOPIFY_UPDATE_FAILED";
  message: string | null;
  createdAt: string;
  run?: {
    triggerSource: string;
    startedAt: string;
  };
};
