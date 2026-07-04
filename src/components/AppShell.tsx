"use client";

import {
  BlockStack,
  Box,
  Button,
  InlineStack,
  Text,
} from "@shopify/polaris";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <Box background="bg-surface-secondary" minHeight="100vh">
      <Box
        background="bg-surface"
        borderBlockEndWidth="025"
        borderColor="border"
        paddingBlock="300"
        paddingInline="600"
      >
        <InlineStack align="space-between" blockAlign="center" gap="400">
          <BlockStack gap="050">
            <Text as="h1" variant="headingLg">
              Shopify AI Dynamic Pricing Assistant
            </Text>
            <Text as="p" tone="subdued">
              Automated Shopify price updates powered by Gemini and merchant rules.
            </Text>
          </BlockStack>
          <InlineStack gap="200">
            <Button
              url="/"
              variant={pathname === "/" ? "primary" : "secondary"}
              accessibilityLabel="Open dashboard"
            >
              Dashboard
            </Button>
            <Button
              url="/settings"
              variant={pathname === "/settings" ? "primary" : "secondary"}
              accessibilityLabel="Open settings"
            >
              Settings
            </Button>
          </InlineStack>
        </InlineStack>
      </Box>
      <main>{children}</main>
    </Box>
  );
}
