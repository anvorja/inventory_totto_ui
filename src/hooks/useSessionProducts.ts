import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { api } from "@/lib/api/endpoints"
import { queryKeys } from "@/lib/api/query-keys"

/** Busca productos por nombre, referencia o EAN con su situación en el conteo. */
export function useSessionProducts(sessionId: number, query: string) {
  const q = useDebouncedValue(query.trim(), 250)
  return useQuery({
    queryKey: queryKeys.sessionProducts(sessionId, q),
    queryFn: () => api.sessions.products(sessionId, q),
    enabled: q.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  })
}
