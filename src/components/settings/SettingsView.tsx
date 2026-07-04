"use client";

import {
  BlockStack,
  Box,
  Button,
  Card,
  Form,
  FormLayout,
  Page,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import { useState } from "react";

import {
  useSettings,
  useUpdateSettings,
} from "@/features/pricing/queries";
import type {
  MerchantSettingsDto,
  ReviewFrequency,
} from "@/features/pricing/types";

const frequencyOptions = [
  { label: "Hourly", value: "HOURLY" },
  { label: "Daily", value: "DAILY" },
  { label: "Weekly", value: "WEEKLY" },
  { label: "Monthly", value: "MONTHLY" },
];

export function SettingsView() {
  const settings = useSettings();

  return (
    <Page
      title="Merchant settings"
      subtitle="Control when pricing runs and the safety limits Gemini must follow."
    >
      {settings.data?.settings ? (
        <SettingsForm
          key={settings.data.settings.updatedAt}
          settings={settings.data.settings}
        />
      ) : (
        <Card>
          <Box padding="400">
            <Text as="p" tone="subdued">
              Loading settings...
            </Text>
          </Box>
        </Card>
      )}
    </Page>
  );
}

function SettingsForm({ settings }: { settings: MerchantSettingsDto }) {
  const updateSettings = useUpdateSettings();
  const [inventoryThreshold, setInventoryThreshold] = useState(
    String(settings.inventoryThreshold),
  );
  const [maximumAllowedPrice, setMaximumAllowedPrice] = useState(
    String(settings.maximumAllowedPrice),
  );
  const [reviewFrequency, setReviewFrequency] =
    useState<ReviewFrequency>(settings.reviewFrequency);
  const [aiBehaviorPrompt, setAiBehaviorPrompt] = useState(
    settings.aiBehaviorPrompt ?? "",
  );

  return (
    <>
      <Card>
        <Box padding="400">
          <Form
            onSubmit={() => {
              updateSettings.mutate({
                inventoryThreshold: Number(inventoryThreshold),
                maximumAllowedPrice: Number(maximumAllowedPrice),
                reviewFrequency,
                aiBehaviorPrompt,
              });
            }}
          >
            <FormLayout>
              <TextField
                label="Inventory threshold"
                type="number"
                min={0}
                value={inventoryThreshold}
                onChange={setInventoryThreshold}
                autoComplete="off"
                helpText="Dynamic pricing only applies when inventory is at or below this value."
              />
              <TextField
                label="Maximum allowed price"
                type="number"
                min={0}
                step={0.01}
                value={maximumAllowedPrice}
                onChange={setMaximumAllowedPrice}
                autoComplete="off"
                helpText="Gemini recommendations above this price are rejected safely."
              />
              <Select
                label="Review frequency"
                options={frequencyOptions}
                value={reviewFrequency}
                onChange={(value) => setReviewFrequency(value as ReviewFrequency)}
              />
              <TextField
                label="AI behavior prompt"
                value={aiBehaviorPrompt}
                onChange={setAiBehaviorPrompt}
                multiline={4}
                autoComplete="off"
                helpText="Optional merchant instructions included in the Gemini prompt."
              />
              <Button submit variant="primary" loading={updateSettings.isPending}>
                Save settings
              </Button>
            </FormLayout>
          </Form>
        </Box>
      </Card>

      <Box paddingBlockStart="400">
        <Card>
          <Box padding="400">
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Current automation state
              </Text>
              <Text as="p" tone="subdued">
                Last scheduled run:{" "}
                {settings.lastRunAt
                  ? new Date(settings.lastRunAt).toLocaleString()
                  : "Not run yet"}
              </Text>
              {updateSettings.isError ? (
                <Text as="p" tone="critical">
                  {updateSettings.error.message}
                </Text>
              ) : null}
              {updateSettings.isSuccess ? (
                <Text as="p" tone="success">
                  Settings saved.
                </Text>
              ) : null}
            </BlockStack>
          </Box>
        </Card>
      </Box>
    </>
  );
}
