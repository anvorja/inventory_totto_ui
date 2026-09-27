import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api/endpoints"
import { queryKeys } from "@/lib/api/query-keys"

export function useUsers() {
  return useQuery({ queryKey: queryKeys.users, queryFn: api.users.list })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.users.create,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: { id: number } & Parameters<typeof api.users.update>[1]) =>
      api.users.update(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  })
}

export function useResetPassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.users.resetPassword,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  })
}
