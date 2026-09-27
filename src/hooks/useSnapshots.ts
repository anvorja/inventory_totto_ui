import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api/endpoints"
import { queryKeys } from "@/lib/api/query-keys"

export function useSnapshots(storeId: number | undefined) {
  const query = useQuery({
    queryKey: queryKeys.snapshots(storeId ?? 0),
    queryFn: () => api.stores.snapshots(storeId!),
    enabled: !!storeId,
  })
  return {
    ...query,
    snapshots: query.data ?? [],
    latest: query.data?.[0] ?? null,
  }
}

export function useDeleteSnapshot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.snapshots.remove,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.stores }),
  })
}
