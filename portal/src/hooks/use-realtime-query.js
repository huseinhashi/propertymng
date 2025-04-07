import { useQuery } from "@tanstack/react-query";

export function useRealtimeQuery(queryKey, queryFn, options = {}) {
  return useQuery({
    queryKey,
    queryFn,
    refetchInterval: 3000,
    staleTime: 1000,
    ...options,
  });
}
