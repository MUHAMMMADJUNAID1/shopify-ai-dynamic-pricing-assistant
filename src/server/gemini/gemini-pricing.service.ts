import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { requireEnv } from "@/server/env";
import type {
  AiPricingRecommendation,
  ShopifyProductForPricing,
} from "@/server/pricing/types";

const aiResponseSchema = z.object({
  recommendedPrice: z.coerce.number().positive(),
  reason: z.string().min(5).max(500),
});

function extractJson(text: string) {
  const trimmed = text.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] ?? trimmed;
}

export async function generatePricingRecommendation(input: {
  product: ShopifyProductForPricing;
  inventoryThreshold: number;
  maximumAllowedPrice: number;
  aiBehaviorPrompt?: string | null;
}): Promise<AiPricingRecommendation | null> {
  const ai = new GoogleGenAI({ apiKey: requireEnv("GEMINI_API_KEY") });
  const prompt = `
You are an AI pricing assistant for a Shopify merchant.
Return only JSON with this shape:
{"recommendedPrice": number, "reason": "short business reason"}

Rules:
- Inventory threshold: ${input.inventoryThreshold}
- Current inventory: ${input.product.inventoryQuantity}
- Current price: ${input.product.currentPrice}
- Maximum allowed price: ${input.maximumAllowedPrice}
- Recommended price must never be below current price.
- Recommended price must never exceed maximum allowed price.
- Keep the reason concise and merchant-friendly.

Product:
- Title: ${input.product.title}
- Product type: ${input.product.productType ?? "Unknown"}
- Vendor: ${input.product.vendor ?? "Unknown"}

Merchant behavior instructions:
${input.aiBehaviorPrompt || "Use a balanced pricing strategy."}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "";
  const parsed = aiResponseSchema.safeParse(JSON.parse(extractJson(text)));

  if (!parsed.success) {
    return null;
  }

  return {
    recommendedPrice: Number(parsed.data.recommendedPrice.toFixed(2)),
    reason: parsed.data.reason,
  };
}
