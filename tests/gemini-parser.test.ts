import assert from "node:assert/strict";
import test from "node:test";

import { parseAiPricingRecommendation } from "../src/server/gemini/gemini-pricing.service";

test("parses a valid Gemini JSON recommendation", () => {
  const result = parseAiPricingRecommendation(
    '{"recommendedPrice": 125.456, "reason": "Inventory is low."}',
  );

  assert.deepEqual(result, {
    recommendedPrice: 125.46,
    reason: "Inventory is low.",
  });
});

test("parses JSON even when Gemini wraps it with prose", () => {
  const result = parseAiPricingRecommendation(
    'Here is the result: {"recommendedPrice": 110, "reason": "Low stock."}',
  );

  assert.equal(result?.recommendedPrice, 110);
});

test("returns null for malformed Gemini JSON", () => {
  const result = parseAiPricingRecommendation("not-json");

  assert.equal(result, null);
});

test("returns null for missing required Gemini fields", () => {
  const result = parseAiPricingRecommendation('{"price": 110}');

  assert.equal(result, null);
});
