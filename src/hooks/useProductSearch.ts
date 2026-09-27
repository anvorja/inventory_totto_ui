import { useQuery } from "@tanstack/react-query"

import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { api } from "@/lib/api/endpoints"
import { queryKeys } from "@/lib/api/query-keys"

export function useProductSearch(query: string) {
  const q = useDebouncedValue(query.trim(), 300)
  return useQuery({
    queryKey: queryKeys.productSearch(q),
    queryFn: () => api.products.search(q),
    enabled: q.length >= 2,
    staleTime: 60_000,
  })
}
