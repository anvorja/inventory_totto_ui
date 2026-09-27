import { useMutation, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api/endpoints"
import type { ImportKind } from "@/lib/api/types"

export function useImportXlsx() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      file,
      kind,
      effectiveAt,
    }: {
      file: File
      kind?: ImportKind
      effectiveAt?: string
    }) => api.imports.upload(file, { kind, effectiveAt }),
    // Un nuevo reporte cambia tiendas, snapshots, sesiones y comparaciones.
    onSuccess: () => queryClient.invalidateQueries(),
  })
}
