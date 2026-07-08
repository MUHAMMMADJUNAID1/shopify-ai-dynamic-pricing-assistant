import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  SHOPIFY_SHOP_DOMAIN: z.string().min(1).optional(),
  SHOPIFY_ACCESS_TOKEN: z.string().min(1).optional(),
  SHOPIFY_API_VERSION: z.string().min(1).default("2026-07"),
  GEMINI_API_KEY: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(12).optional(),
  APP_URL: z.string().url().optional(),
  MOCK_SHOPIFY: z.enum(["true", "false"]).default("false"),
  MOCK_GEMINI: z.enum(["true", "false"]).default("false"),
});

export const env = envSchema.parse(process.env);

export function requireEnv(name: keyof typeof env): string {
  const value = env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
