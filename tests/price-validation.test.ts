import assert from "node:assert/strict";
import test from "node:test";

import { validateRecommendedPrice } from "../src/server/pricing/price-validation";
import type { ShopifyProductForPricing } from "../src/server/pricing/types";

const product: ShopifyProductForPricing = {
  productId: "gid://shopify/Product/1",
  variantId: "gid://shopify/ProductVariant/1",
  title: "Premium Hoodie",
  productType: "Apparel",
  vendor: "MG Test",
  currentPrice: 100,
  inventoryQuantity: 10,
};

test("accepts a valid recommendation inside price bounds", () => {
  const result = validateRecommendedPrice({
    product,
    maximumAllowedPrice: 150,
    recommendation: {
      recommendedPrice: 120,
      reason: "Inventory is low.",
    },
  });

  assert.equal(result.valid, true);

  if (result.valid) {
    assert.equal(result.price, 120);
  }
});

test("rejects a recommendation below the current price", () => {
  const result = validateRecommendedPrice({
    product,
    maximumAllowedPrice: 150,
    recommendation: {
      recommendedPrice: 90,
      reason: "Bad discount.",
    },
  });

  assert.equal(result.valid, false);
});

test("rejects a recommendation above the maximum allowed price", () => {
  const result = validateRecommendedPrice({
    product,
    maximumAllowedPrice: 150,
    recommendation: {
      recommendedPrice: 175,
      reason: "Too aggressive.",
    },
  });

  assert.equal(result.valid, false);
});

test("rounds accepted recommendations to two decimals", () => {
  const result = validateRecommendedPrice({
    product,
    maximumAllowedPrice: 150,
    recommendation: {
      recommendedPrice: 119.999,
      reason: "Low inventory.",
    },
  });

  assert.equal(result.valid, true);

  if (result.valid) {
    assert.equal(result.price, 120);
  }
});
