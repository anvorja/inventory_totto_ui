import type { LineStatus } from "@/lib/api/types"

export const STATUS_META: Record<
  LineStatus,
  { label: string; plural: string; hint: string; tone: string; dot: string }
> = {
  missing: {
    label: "Faltante",
    plural: "Faltantes",
    hint: "Hay menos de lo que dice el sistema",
    tone: "text-destructive",
    dot: "bg-destructive",
  },
  surplus: {
    label: "Sobrante",
    plural: "Sobrantes",
    hint: "Hay más de lo que dice el sistema",
    tone: "text-warning",
    dot: "bg-warning",
  },
  unexpected: {
    label: "No esperado",
    plural: "No esperados",
    hint: "Contado, pero no aparece en existencias",
    tone: "text-info",
    dot: "bg-info",
  },
  ok: {
    label: "Cuadrado",
    plural: "Cuadrados",
    hint: "Coincide con el sistema",
    tone: "text-success",
    dot: "bg-success",
  },
}

export const STATUS_ORDER: LineStatus[] = [
  "missing",
  "surplus",
  "unexpected",
  "ok",
]
