import { Prisma, ReviewFrequency } from "@/generated/prisma/client";

import { prisma } from "@/server/db/prisma";
import type { SettingsInput } from "@/server/schemas/settings.schema";

const DEFAULT_SETTINGS = {
  inventoryThreshold: 50,
  maximumAllowedPrice: new Prisma.Decimal(150),
  reviewFrequency: ReviewFrequency.DAILY,
  aiBehaviorPrompt:
    "Increase prices conservatively when inventory is low. Never recommend discounts.",
};

export async function getSettings() {
  const existing = await prisma.merchantSettings.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return existing;
  }

  return prisma.merchantSettings.create({
    data: DEFAULT_SETTINGS,
  });
}

export async function updateSettings(input: SettingsInput) {
  const current = await getSettings();

  return prisma.merchantSettings.update({
    where: { id: current.id },
    data: {
      inventoryThreshold: input.inventoryThreshold,
      maximumAllowedPrice: new Prisma.Decimal(input.maximumAllowedPrice),
      reviewFrequency: input.reviewFrequency,
      aiBehaviorPrompt: input.aiBehaviorPrompt,
    },
  });
}

export async function markSettingsRunAt(date: Date) {
  const current = await getSettings();

  return prisma.merchantSettings.update({
    where: { id: current.id },
    data: { lastRunAt: date },
  });
}
