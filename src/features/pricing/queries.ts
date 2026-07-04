"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api-client";

import type {
  MerchantSettingsDto,
  PricingDecisionDto,
  PricingRunDto,
  ReviewFrequency,
  ShopifyProductDto,
} from "./types";

type SettingsPayload = {
  inventoryThreshold: number;
  maximumAllowedPrice: number;
  reviewFrequency: ReviewFrequency;
  aiBehaviorPrompt: string | null;
};

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () =>
      apiRequest<{ settings: MerchantSettingsDto }>("/api/settings"),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SettingsPayload) =>
      apiRequest<{ settings: MerchantSettingsDto }>("/api/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: () =>
      apiRequest<{ products: ShopifyProductDto[] }>("/api/products"),
    retry: false,
  });
}

export function usePricingHistory() {
  return useQuery({
    queryKey: ["pricing-history"],
    queryFn: () =>
      apiRequest<{ history: PricingDecisionDto[] }>("/api/pricing/history"),
  });
}

export function useLatestPricingDecisions() {
  return useQuery({
    queryKey: ["pricing-latest"],
    queryFn: () =>
      apiRequest<{ history: PricingDecisionDto[] }>("/api/pricing/latest"),
  });
}

export function usePricingRuns() {
  return useQuery({
    queryKey: ["pricing-runs"],
    queryFn: () => apiRequest<{ runs: PricingRunDto[] }>("/api/pricing/runs"),
  });
}

export function useClearPricingHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiRequest<{ ok: true }>("/api/pricing/clear-history", {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["pricing-history"] }),
        queryClient.invalidateQueries({ queryKey: ["pricing-latest"] }),
        queryClient.invalidateQueries({ queryKey: ["pricing-runs"] }),
      ]);
    },
  });
}

export function useRunPricingCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiRequest<{ run: PricingRunDto }>("/api/pricing/run", {
        method: "POST",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["pricing-history"] }),
        queryClient.invalidateQueries({ queryKey: ["pricing-latest"] }),
        queryClient.invalidateQueries({ queryKey: ["pricing-runs"] }),
        queryClient.invalidateQueries({ queryKey: ["settings"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ]);
    },
  });
}
