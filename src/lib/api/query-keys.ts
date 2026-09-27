export const queryKeys = {
  me: ["auth", "me"] as const,
  users: ["users"] as const,
  stores: ["stores"] as const,
  snapshots: (storeId: number) => ["stores", storeId, "snapshots"] as const,
  sessions: (storeId: number) => ["stores", storeId, "sessions"] as const,
  session: (id: number) => ["sessions", id] as const,
  recent: (id: number) => ["sessions", id, "recent"] as const,
  comparison: (id: number, snapshotId?: number | null) =>
    ["sessions", id, "comparison", snapshotId ?? "baseline"] as const,
  productSearch: (q: string) => ["products", "search", q] as const,
}
