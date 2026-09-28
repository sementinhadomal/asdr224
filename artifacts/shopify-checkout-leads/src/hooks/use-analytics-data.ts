import {
  getGetShopifyAnalyticsDashboardQueryKey,
  useGetShopifyAnalyticsDashboard,
} from '@workspace/api-client-react';

export function useAnalyticsDashboard(days: 7 | 30 | 90) {
  const params = { days };
  return useGetShopifyAnalyticsDashboard(params, {
    query: {
      queryKey: getGetShopifyAnalyticsDashboardQueryKey(params),
      staleTime: 8_000,
      refetchInterval: 10_000,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
      placeholderData: (previous) => previous?.days === days ? previous : undefined,
      retry: (attempt, error) => error.status !== 403 && attempt < 2,
    },
  });
}