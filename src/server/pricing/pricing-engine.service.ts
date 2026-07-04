import {
  PricingDecisionStatus,
  PricingRunStatus,
  PricingRunTrigger,
} from "@/generated/prisma/client";

import { generatePricingRecommendation } from "@/server/gemini/gemini-pricing.service";
import {
  completePricingRun,
  createPricingDecision,
  createPricingRun,
} from "@/server/repositories/pricing.repository";
import {
  getSettings,
  markSettingsRunAt,
} from "@/server/repositories/settings.repository";
import {
  fetchProductsForPricing,
  updateVariantPrice,
} from "@/server/shopify/shopify-admin.service";

import { validateRecommendedPrice } from "./price-validation";
import type { ShopifyProductForPricing } from "./types";

const PRODUCTS_PER_RUN = 25;

function baseDecision(runId: string, product: ShopifyProductForPricing) {
  return {
    runId,
    shopifyProductId: product.productId,
    shopifyVariantId: product.variantId,
    productTitle: product.title,
    productType: product.productType,
    vendor: product.vendor,
    inventoryQuantity: product.inventoryQuantity,
    oldPrice: product.currentPrice,
  };
}

export async function runPricingCycle(input: {
  triggerSource: PricingRunTrigger;
}) {
  const run = await createPricingRun(input.triggerSource);
  let productsScanned = 0;
  let productsUpdated = 0;
  let failuresCount = 0;

  try {
    const settings = await getSettings();
    const maximumAllowedPrice = Number(settings.maximumAllowedPrice);
    const products = await fetchProductsForPricing(PRODUCTS_PER_RUN);

    productsScanned = products.length;

    for (const product of products) {
      if (product.inventoryQuantity > settings.inventoryThreshold) {
        await createPricingDecision({
          ...baseDecision(run.id, product),
          recommendedNewPrice: null,
          aiReason: null,
          status: PricingDecisionStatus.SKIPPED,
          message: "Inventory is above the configured threshold.",
        });
        continue;
      }

      let recommendation;

      try {
        recommendation = await generatePricingRecommendation({
          product,
          inventoryThreshold: settings.inventoryThreshold,
          maximumAllowedPrice,
          aiBehaviorPrompt: settings.aiBehaviorPrompt,
        });
      } catch (error) {
        failuresCount += 1;
        await createPricingDecision({
          ...baseDecision(run.id, product),
          recommendedNewPrice: null,
          aiReason: null,
          status: PricingDecisionStatus.INVALID_AI_RESPONSE,
          message:
            error instanceof Error
              ? error.message
              : "Gemini returned an invalid response.",
        });
        continue;
      }

      if (!recommendation) {
        failuresCount += 1;
        await createPricingDecision({
          ...baseDecision(run.id, product),
          recommendedNewPrice: null,
          aiReason: null,
          status: PricingDecisionStatus.INVALID_AI_RESPONSE,
          message: "Gemini response was missing required JSON fields.",
        });
        continue;
      }

      const validation = validateRecommendedPrice({
        product,
        recommendation,
        maximumAllowedPrice,
      });

      if (!validation.valid) {
        failuresCount += 1;
        await createPricingDecision({
          ...baseDecision(run.id, product),
          recommendedNewPrice: recommendation.recommendedPrice,
          aiReason: recommendation.reason,
          status: PricingDecisionStatus.VALIDATION_FAILED,
          message: validation.message,
        });
        continue;
      }

      try {
        await updateVariantPrice({
          productId: product.productId,
          variantId: product.variantId,
          price: validation.price,
        });

        productsUpdated += 1;
        await createPricingDecision({
          ...baseDecision(run.id, product),
          recommendedNewPrice: validation.price,
          aiReason: validation.reason,
          status: PricingDecisionStatus.UPDATED,
          message: "Shopify price updated successfully.",
        });
      } catch (error) {
        failuresCount += 1;
        await createPricingDecision({
          ...baseDecision(run.id, product),
          recommendedNewPrice: validation.price,
          aiReason: validation.reason,
          status: PricingDecisionStatus.SHOPIFY_UPDATE_FAILED,
          message:
            error instanceof Error
              ? error.message
              : "Shopify price update failed.",
        });
      }
    }

    const finishedRun = await completePricingRun(run.id, {
      status: PricingRunStatus.COMPLETED,
      productsScanned,
      productsUpdated,
      failuresCount,
    });

    await markSettingsRunAt(new Date());

    return finishedRun;
  } catch (error) {
    return completePricingRun(run.id, {
      status: PricingRunStatus.FAILED,
      productsScanned,
      productsUpdated,
      failuresCount: failuresCount + 1,
      errorMessage:
        error instanceof Error ? error.message : "Unknown pricing run failure.",
    });
  }
}
