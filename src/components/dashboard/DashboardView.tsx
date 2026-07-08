"use client";

import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  DataTable,
  InlineStack,
  Page,
  Text,
  type DataTableProps,
} from "@shopify/polaris";

import {
  useClearPricingHistory,
  useLatestPricingDecisions,
  usePricingHistory,
  usePricingRuns,
  useProducts,
  useRunPricingCycle,
} from "@/features/pricing/queries";
import type { PricingDecisionDto } from "@/features/pricing/types";

function money(value: number | null) {
  if (value == null) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function statusTone(status: PricingDecisionDto["status"]) {
  if (status === "UPDATED") {
    return "success" as const;
  }

  if (status === "SKIPPED") {
    return "attention" as const;
  }

  return "critical" as const;
}

function dateTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

function decisionReason(decision: PricingDecisionDto) {
  if (decision.aiReason && decision.message) {
    return (
      <BlockStack gap="050">
        <Text as="span">{decision.aiReason}</Text>
        <Text as="span" tone={decision.status === "UPDATED" ? "subdued" : "critical"}>
          {decision.message}
        </Text>
      </BlockStack>
    );
  }

  return decision.aiReason ?? decision.message ?? "-";
}

function PricingDecisionTable({
  decisions,
  emptyText,
  includeTimestamp = false,
}: {
  decisions: PricingDecisionDto[];
  emptyText: string;
  includeTimestamp?: boolean;
}) {
  const columnContentTypes: DataTableProps["columnContentTypes"] = [
    ...(includeTimestamp ? (["text"] as const) : []),
    "text",
    "numeric",
    "numeric",
    "numeric",
    "text",
    "text",
  ];
  const headings = [
    ...(includeTimestamp ? ["Time"] : []),
    "Product",
    "Inventory",
    "Current price",
    "Recommended",
    "Status",
    "AI reason",
  ];

  return (
    <>
      <DataTable
        columnContentTypes={columnContentTypes}
        headings={headings}
        rows={decisions.map((decision) => [
          ...(includeTimestamp ? [dateTime(decision.createdAt)] : []),
          decision.productTitle,
          decision.inventoryQuantity,
          money(decision.oldPrice),
          money(decision.recommendedNewPrice),
          <Badge key={decision.id} tone={statusTone(decision.status)}>
            {decision.status}
          </Badge>,
          decisionReason(decision),
        ])}
      />
      {!decisions.length ? (
        <Text as="p" tone="subdued">
          {emptyText}
        </Text>
      ) : null}
    </>
  );
}

export function DashboardView() {
  const products = useProducts();
  const latestHistory = useLatestPricingDecisions();
  const history = usePricingHistory();
  const runs = usePricingRuns();
  const runPricingCycle = useRunPricingCycle();
  const clearPricingHistory = useClearPricingHistory();

  const paginatedRuns = runs.data?.pages.flatMap((page) => page.runs) ?? [];
  const paginatedHistory =
    history.data?.pages.flatMap((page) => page.history) ?? [];
  const latestRun = paginatedRuns[0];
  const latestDecisions = latestHistory.data?.history ?? [];
  const allDecisions = paginatedHistory;

  return (
    <Page
      title="Pricing dashboard"
      subtitle="Monitor Shopify products, AI decisions, and automated price changes."
      primaryAction={{
        content: runPricingCycle.isPending ? "Running..." : "Run Pricing Check",
        onAction: () => runPricingCycle.mutate(),
        loading: runPricingCycle.isPending,
      }}
    >
      <BlockStack gap="400">
        <InlineStack gap="300" wrap>
          <Card>
            <Box padding="400" minWidth="220px">
              <BlockStack gap="100">
                <Text as="p" tone="subdued">
                  Products loaded
                </Text>
                <Text as="p" variant="heading2xl">
                  {products.data?.products.length ?? 0}
                </Text>
              </BlockStack>
            </Box>
          </Card>
          <Card>
            <Box padding="400" minWidth="220px">
              <BlockStack gap="100">
                <Text as="p" tone="subdued">
                  Last run status
                </Text>
                <Text as="p" variant="headingLg">
                  {latestRun?.status ?? "No runs yet"}
                </Text>
              </BlockStack>
            </Box>
          </Card>
          <Card>
            <Box padding="400" minWidth="220px">
              <BlockStack gap="100">
                <Text as="p" tone="subdued">
                  Last updated count
                </Text>
                <Text as="p" variant="heading2xl">
                  {latestRun?.productsUpdated ?? 0}
                </Text>
              </BlockStack>
            </Box>
          </Card>
        </InlineStack>

        {runPricingCycle.error ? (
          <Card>
            <Box padding="400">
              <Text as="p" tone="critical">
                {runPricingCycle.error.message}
              </Text>
            </Box>
          </Card>
        ) : null}

        <Card>
          <Box padding="400">
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  Latest pricing decisions
                </Text>
                <Button
                  onClick={() => {
                    void latestHistory.refetch();
                    void history.refetch();
                    void runs.refetch();
                    void products.refetch();
                  }}
                >
                  Refresh
                </Button>
              </InlineStack>
              <PricingDecisionTable
                decisions={latestDecisions}
                emptyText="No latest run decisions yet."
              />
            </BlockStack>
          </Box>
        </Card>

        <Card>
          <Box padding="400">
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  All pricing history
                </Text>
                {process.env.NODE_ENV !== "production" ? (
                  <Button
                    tone="critical"
                    loading={clearPricingHistory.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Clear all pricing runs and decisions from the local database?",
                        )
                      ) {
                        clearPricingHistory.mutate();
                      }
                    }}
                  >
                    Clear history
                  </Button>
                ) : null}
              </InlineStack>
              <PricingDecisionTable
                decisions={allDecisions}
                emptyText={
                  history.isLoading
                    ? "Loading pricing history..."
                    : "No historical pricing decisions have been recorded."
                }
                includeTimestamp
              />
              {history.hasNextPage ? (
                <InlineStack align="center">
                  <Button
                    loading={history.isFetchingNextPage}
                    onClick={() => {
                      void history.fetchNextPage();
                    }}
                  >
                    Load more history
                  </Button>
                </InlineStack>
              ) : null}
            </BlockStack>
          </Box>
        </Card>

        <Card>
          <Box padding="400">
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Pricing run history
              </Text>
              <DataTable
                columnContentTypes={[
                  "text",
                  "text",
                  "numeric",
                  "numeric",
                  "numeric",
                  "text",
                ]}
                headings={[
                  "Started",
                  "Trigger",
                  "Scanned",
                  "Updated",
                  "Failures",
                  "Status",
                ]}
                rows={paginatedRuns.map((run) => [
                  dateTime(run.startedAt),
                  run.triggerSource,
                  run.productsScanned,
                  run.productsUpdated,
                  run.failuresCount,
                  run.errorMessage ? `${run.status}: ${run.errorMessage}` : run.status,
                ])}
              />
              {!paginatedRuns.length ? (
                <Text as="p" tone="subdued">
                  {runs.isLoading
                    ? "Loading pricing runs..."
                    : "No pricing runs have been recorded."}
                </Text>
              ) : null}
              {runs.hasNextPage ? (
                <InlineStack align="center">
                  <Button
                    loading={runs.isFetchingNextPage}
                    onClick={() => {
                      void runs.fetchNextPage();
                    }}
                  >
                    Load more runs
                  </Button>
                </InlineStack>
              ) : null}
            </BlockStack>
          </Box>
        </Card>
      </BlockStack>
    </Page>
  );
}
