import {
  getGetShopifyCheckoutLeadSummaryQueryKey,
  getListShopifyCheckoutLeadsQueryKey,
  useGetShopifyCheckoutLeadSummary,
  useListShopifyCheckoutLeads,
} from '@workspace/api-client-react';
import type { ListShopifyCheckoutLeadsParams } from '@workspace/api-client-react';

export function useLeadSummary(enabled = true) {
  return useGetShopifyCheckoutLeadSummary({
    query: {
      queryKey: getGetShopifyCheckoutLeadSummaryQueryKey(),
      enabled,
      staleTime: 15_000,
      refetchInterval: 30_000,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
      retry: (attempt, error) => error.status !== 403 && attempt < 2,
    },
  });
}

export function useLeads(params: ListShopifyCheckoutLeadsParams, enabled = true) {
  return useListShopifyCheckoutLeads(params, {
    query: {
      queryKey: getListShopifyCheckoutLeadsQueryKey(params),
      enabled,
      staleTime: 15_000,
      refetchInterval: 30_000,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
      placeholderData: (previous) => previous,
      retry: (attempt, error) => error.status !== 403 && attempt < 2,
    },
  });
}