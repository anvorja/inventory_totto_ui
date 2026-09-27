import {
  DatabaseIcon,
  GitCompareArrowsIcon,
  HouseIcon,
  ScanBarcodeIcon,
} from "lucide-react"

export type NavKey = "home" | "count" | "compare" | "data"

export const NAV_ITEMS: {
  key: NavKey
  label: string
  icon: typeof HouseIcon
}[] = [
  { key: "home", label: "Inicio", icon: HouseIcon },
  { key: "count", label: "Contar", icon: ScanBarcodeIcon },
  { key: "compare", label: "Diferencias", icon: GitCompareArrowsIcon },
  { key: "data", label: "Existencias", icon: DatabaseIcon },
]
