import { createContext } from "react"

import type {
  CountEntry,
  CountSession,
  Product,
  ProductInput,
  ScanResult,
} from "@/lib/api/types"

/** Lo que muestra la tarjeta de resultado tras cada acción. */
export type CountFeedback =
  | { kind: "pending"; code: string }
  | { kind: "scan"; result: ScanResult; quantity: number }
  | { kind: "undo"; product: Product; counted: number }
  | { kind: "unknown"; code: string }
  | { kind: "error"; message: string; code?: string }

export interface CountSessionContextValue {
  sessionId: number
  session: CountSession | undefined
  isLoading: boolean
  isOpen: boolean
  recent: CountEntry[]
  feedback: CountFeedback | null
  /** Código leído que no está en el catálogo y espera ser registrado. */
  unknownCode: string | null
  /** Unidades que suma la próxima lectura (vuelve a 1 después de usarse). */
  multiplier: number
  setMultiplier: (n: number) => void
  zone: string | null
  setZone: (zone: string | null) => void
  scan: (code: string) => void
  adjust: (product: Product, delta: number) => void
  undo: (entry: CountEntry) => void
  registerUnknown: (input: ProductInput) => Promise<void>
  dismissUnknown: () => void
  isRegistering: boolean
}

export const CountSessionContext = createContext<
  CountSessionContextValue | undefined
>(undefined)
