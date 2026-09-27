export type ProductSource = "catalog" | "stock" | "manual"
export type SessionStatus = "open" | "closed"
export type LineStatus = "ok" | "missing" | "surplus" | "unexpected"
export type ImportKind = "stock" | "catalog"
export type UserRole = "asesor" | "administrador"
/** count: unidades encontradas al contar · sale: unidades vendidas durante el conteo */
export type EntryKind = "count" | "sale"

export interface Store {
  id: number
  code: string
  name: string
}

export interface StoreOverview extends Store {
  latestSnapshotAt: string | null
  openSessions: number
}

export interface Product {
  id: number
  reference: string | null
  ean: string | null
  name: string
  businessUnit: string | null
  size: string | null
  colorCode: string | null
  colorName: string | null
  source: ProductSource
}

export interface Snapshot {
  id: number
  storeId: number
  sourceFilename: string
  effectiveAt: string
  createdAt: string
  lineCount: number
  totalUnits: number
}

export interface CountSession {
  id: number
  store: Store
  name: string
  status: SessionStatus
  createdAt: string
  closedAt: string | null
  baselineSnapshotId: number | null
  baseline: Snapshot | null
  countedUnits: number
  countedProducts: number
  soldUnits: number
  entries: number
  counters: string[]
  lastActivityAt: string | null
}

export interface CountEntry {
  id: number
  kind: EntryKind
  product: Product
  quantity: number
  scannedCode: string | null
  userId: number | null
  countedBy: string | null
  zone: string | null
  createdAt: string
}

export interface ScanResult {
  entry: CountEntry
  product: Product
  counted: number
  expected: number
  inBaseline: boolean
  /** Ventas registradas después de la hora del reporte (ya descontadas de `expected`). */
  sold: number
  status: LineStatus
}

export interface UndoResult {
  product: Product
  kind: EntryKind
  counted: number
  expected: number
  sold: number
}

/** Producto con su situación en el conteo (para registrar ventas). */
export interface ProductStock {
  product: Product
  inReport: boolean
  reported: number
  sold: number
  expected: number
  counted: number
}

export interface ComparisonLine {
  productId: number
  reference: string | null
  ean: string | null
  name: string
  businessUnit: string | null
  size: string | null
  colorName: string | null
  /** Lo que dice el reporte de existencias. */
  reported: number
  /** Vendido durante el conteo después de la hora del reporte. */
  sold: number
  /** Esperado ahora = reporte − vendido. */
  expected: number
  counted: number
  difference: number
  status: LineStatus
}

export interface Bucket {
  lines: number
  units: number
}

export interface ComparisonSummary {
  expectedUnits: number
  countedUnits: number
  matchedUnits: number
  accuracy: number
  progress: number
  expectedLines: number
  linesWithoutEan: number
  soldUnits: number
  buckets: Record<LineStatus, Bucket>
}

export interface Comparison {
  snapshot: Snapshot | null
  summary: ComparisonSummary
  lines: ComparisonLine[]
}

export interface ImportResult {
  kind: ImportKind
  skippedRows: number
  snapshots: {
    snapshot: Snapshot
    store: Store
    duplicate: boolean
    newProducts: number
    linesWithoutEan: number
  }[]
  catalog: {
    created: number
    updated: number
    unchanged: number
    conflicts: number
    total: number
    /** El Excel traía BARCODE y SKU invertidos; se corrigió leyendo el contenido. */
    columnsSwapped: boolean
  } | null
}

export interface ScanInput {
  code?: string
  productId?: number
  quantity?: number
  zone?: string | null
}

export interface ProductInput {
  ean?: string | null
  reference?: string | null
  name?: string | null
}

export interface User {
  id: number
  username: string
  fullName: string
  role: UserRole
  store: Store | null
  isActive: boolean
  mustChangePassword: boolean
  lastLoginAt: string | null
  createdAt: string
}

export interface UserInput {
  username: string
  fullName: string
  role: UserRole
  storeId: number | null
}

export interface UserWithPassword {
  user: User
  temporaryPassword: string
}
