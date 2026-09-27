import { CornerDownLeftIcon, KeyboardIcon, TypeIcon } from "lucide-react"
import { useRef, useState } from "react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useCountSession } from "@/hooks/useCountSession"

const MULTIPLIERS = [1, 2, 3, 6, 12]

/**
 * Entrada por teclado. También recibe lectores láser/Bluetooth que "escriben" el código
 * y envían Enter, habituales en tiendas.
 */
export function ManualEntry() {
  const { scan, multiplier, setMultiplier, isOpen } = useCountSession()
  const [value, setValue] = useState("")
  const [alpha, setAlpha] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = () => {
    if (!value.trim()) return
    scan(value)
    setValue("")
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <InputGroup className="h-12 rounded-2xl">
          <InputGroupAddon>
            <KeyboardIcon />
          </InputGroupAddon>
          <InputGroupInput
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={
              alpha ? "Referencia (AC53IND398…)" : "Código de barras (EAN)"
            }
            inputMode={alpha ? "text" : "numeric"}
            enterKeyHint="go"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            disabled={!isOpen}
            aria-label="Código de barras o referencia"
            className="text-base"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-sm"
              onClick={() => {
                setAlpha((v) => !v)
                inputRef.current?.focus()
              }}
              aria-label={alpha ? "Teclado numérico" : "Teclado con letras"}
              title={alpha ? "Teclado numérico" : "Teclado con letras"}
            >
              <TypeIcon />
            </InputGroupButton>
            <InputGroupButton
              type="submit"
              variant="default"
              size="sm"
              disabled={!value.trim() || !isOpen}
            >
              <CornerDownLeftIcon />
              Sumar
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">
          Unidades por lectura
        </span>
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={1}
          value={String(multiplier)}
          onValueChange={(v) => v && setMultiplier(Number(v))}
          aria-label="Unidades por lectura"
        >
          {MULTIPLIERS.map((n) => (
            <ToggleGroupItem
              key={n}
              value={String(n)}
              className="tabular h-10 min-w-10 px-2 font-semibold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              ×{n}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  )
}
