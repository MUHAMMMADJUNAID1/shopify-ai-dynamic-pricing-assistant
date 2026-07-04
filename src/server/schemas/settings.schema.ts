import { ReviewFrequency } from "@/generated/prisma/client";
import { z } from "zod";

export const settingsInputSchema = z.object({
  inventoryThreshold: z.coerce.number().int().min(0).max(1_000_000),
  maximumAllowedPrice: z.coerce.number().positive().max(1_000_000),
  reviewFrequency: z.nativeEnum(ReviewFrequency),
  aiBehaviorPrompt: z
    .string()
    .max(1_000)
    .optional()
    .transform((value) => value?.trim() || null),
});

export type SettingsInput = z.infer<typeof settingsInputSchema>;
