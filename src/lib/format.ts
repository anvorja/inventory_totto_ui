const numberFmt = new Intl.NumberFormat("es-CO")
const percentFmt = new Intl.NumberFormat("es-CO", {
  style: "percent",
  maximumFractionDigits: 1,
})
const dateTimeFmt = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
})
const timeFmt = new Intl.DateTimeFormat("es-CO", {
  hour: "numeric",
  minute: "2-digit",
})
const relativeFmt = new Intl.RelativeTimeFormat("es", { numeric: "auto" })

export const formatNumber = (n: number) => numberFmt.format(n)
export const formatPercent = (n: number) => percentFmt.format(n)
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso))
export const formatTime = (iso: string) => timeFmt.format(new Date(iso))

/** Solo la hora si es de hoy; con fecha si es de otro día (p. ej. conteos importados). */
export function formatWhen(iso: string) {
  const date = new Date(iso)
  return date.toDateString() === new Date().toDateString()
    ? timeFmt.format(date)
    : dateTimeFmt.format(date)
}

/** "1 unidad", "3 unidades". */
export function plural(
  n: number,
  singular: string,
  pluralForm = `${singular}s`
) {
  return `${numberFmt.format(n)} ${n === 1 ? singular : pluralForm}`
}

export function formatSigned(n: number) {
  return n > 0 ? `+${numberFmt.format(n)}` : numberFmt.format(n)
}

export function formatRelative(iso: string, now = Date.now()) {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 45) return "justo ahora"
  if (abs < 3600) return relativeFmt.format(Math.round(seconds / 60), "minute")
  if (abs < 86_400)
    return relativeFmt.format(Math.round(seconds / 3600), "hour")
  return relativeFmt.format(Math.round(seconds / 86_400), "day")
}

/** Horas desde una fecha; se usa para advertir existencias desactualizadas. */
export const hoursSince = (iso: string) =>
  (Date.now() - new Date(iso).getTime()) / 3_600_000

export function productDetail(p: {
  reference: string | null
  colorName: string | null
  size: string | null
}) {
  return [p.reference, p.colorName, p.size && `Talla ${p.size}`]
    .filter(Boolean)
    .join(" · ")
}

export function defaultSessionName(date = new Date()) {
  const day = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date)
  return `Conteo ${day}`
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("")
}
