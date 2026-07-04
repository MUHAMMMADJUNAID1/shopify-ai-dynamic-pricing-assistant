-- CreateEnum
CREATE TYPE "ReviewFrequency" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "PricingRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "PricingRunTrigger" AS ENUM ('MANUAL', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "PricingDecisionStatus" AS ENUM ('UPDATED', 'SKIPPED', 'INVALID_AI_RESPONSE', 'VALIDATION_FAILED', 'SHOPIFY_UPDATE_FAILED');

-- CreateTable
CREATE TABLE "MerchantSettings" (
    "id" TEXT NOT NULL,
    "inventoryThreshold" INTEGER NOT NULL DEFAULT 50,
    "maximumAllowedPrice" DECIMAL(12,2) NOT NULL,
    "reviewFrequency" "ReviewFrequency" NOT NULL DEFAULT 'DAILY',
    "aiBehaviorPrompt" TEXT,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingRun" (
    "id" TEXT NOT NULL,
    "status" "PricingRunStatus" NOT NULL DEFAULT 'RUNNING',
    "triggerSource" "PricingRunTrigger" NOT NULL,
    "productsScanned" INTEGER NOT NULL DEFAULT 0,
    "productsUpdated" INTEGER NOT NULL DEFAULT 0,
    "failuresCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "PricingRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingDecision" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "shopifyVariantId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "productType" TEXT,
    "vendor" TEXT,
    "inventoryQuantity" INTEGER NOT NULL,
    "oldPrice" DECIMAL(12,2) NOT NULL,
    "recommendedNewPrice" DECIMAL(12,2),
    "aiReason" TEXT,
    "status" "PricingDecisionStatus" NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PricingRun_startedAt_idx" ON "PricingRun"("startedAt");

-- CreateIndex
CREATE INDEX "PricingRun_status_idx" ON "PricingRun"("status");

-- CreateIndex
CREATE INDEX "PricingDecision_shopifyProductId_idx" ON "PricingDecision"("shopifyProductId");

-- CreateIndex
CREATE INDEX "PricingDecision_createdAt_idx" ON "PricingDecision"("createdAt");

-- CreateIndex
CREATE INDEX "PricingDecision_status_idx" ON "PricingDecision"("status");

-- AddForeignKey
ALTER TABLE "PricingDecision" ADD CONSTRAINT "PricingDecision_runId_fkey" FOREIGN KEY ("runId") REFERENCES "PricingRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
