import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api/endpoints"
import { queryKeys } from "@/lib/api/query-keys"
import { downloadBlob } from "@/lib/download"

export function useComparison(sessionId: number, snapshotId?: number | null) {
  return useQuery({
    queryKey: queryKeys.comparison(sessionId, snapshotId),
    queryFn: () => api.sessions.comparison(sessionId, snapshotId),
    placeholderData: keepPreviousData,
  })
}

export function useExportComparison() {
  return useMutation({
    mutationFn: async ({
      sessionId,
      snapshotId,
    }: {
      sessionId: number
      snapshotId?: number | null
    }) => {
      const { blob, filename } = await api.sessions.exportXlsx(
        sessionId,
        snapshotId
      )
      downloadBlob(blob, filename ?? `conteo-${sessionId}.xlsx`)
    },
  })
}
