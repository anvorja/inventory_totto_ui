import { useCallback, useEffect, useRef, useState, type RefObject } from "react"

import { getDetector } from "@/lib/barcode"

export type ScannerStatus =
  | "idle"
  | "starting"
  | "scanning"
  | "denied" // el usuario negó el permiso de cámara
  | "insecure" // el navegador no permite cámara (sin HTTPS o sin soporte)
  | "no-camera" // el equipo no tiene cámara conectada (típico en un PC)
  | "in-use" // otra aplicación está usando la cámara
  | "error"

/** Traduce el error de getUserMedia a un estado que la interfaz sabe explicar. */
function statusFromError(error: unknown): ScannerStatus {
  switch ((error as DOMException)?.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "denied"
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "no-camera"
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return "in-use"
    default:
      return "error"
  }
}

/** ¿Hay alguna cámara conectada? No requiere permiso (solo cuenta dispositivos). */
async function hasCamera(): Promise<boolean> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.some((d) => d.kind === "videoinput")
  } catch {
    return true // si no se puede saber, se intenta abrirla igual
  }
}

async function openCamera(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    })
  } catch (error) {
    // Algunas cámaras (webcams de PC) rechazan las preferencias: se reintenta sin ellas.
    if ((error as DOMException)?.name !== "OverconstrainedError") throw error
    return navigator.mediaDevices.getUserMedia({ audio: false, video: true })
  }
}

interface Options {
  videoRef: RefObject<HTMLVideoElement | null>
  /** Enciende/apaga la cámara (apagarla ahorra batería cuando no se usa). */
  enabled: boolean
  /** Mantiene la cámara encendida pero deja de leer (p. ej. con un diálogo abierto). */
  paused?: boolean
  onDetected: (code: string) => void
}

const SCAN_INTERVAL_MS = 120
const SAME_CODE_COOLDOWN_MS = 1800 // evita contar dos veces la misma etiqueta
const ANY_CODE_COOLDOWN_MS = 700

type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean }

export function useBarcodeScanner({
  videoRef,
  enabled,
  paused = false,
  onDetected,
}: Options) {
  const [status, setStatus] = useState<ScannerStatus>("idle")
  const [torchSupported, setTorchSupported] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const streamRef = useRef<MediaStream | null>(null)
  const onDetectedRef = useRef(onDetected)
  const pausedRef = useRef(paused)
  const lastRef = useRef({ code: "", at: 0 })

  useEffect(() => {
    onDetectedRef.current = onDetected
    pausedRef.current = paused
  })

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    async function start() {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setStatus("insecure")
        return
      }
      setStatus("starting")
      if (!(await hasCamera())) {
        if (!cancelled) setStatus("no-camera")
        return
      }
      try {
        const stream = await openCamera()
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        const track = stream.getVideoTracks()[0]
        const caps = track?.getCapabilities?.() as TorchCapabilities | undefined
        setTorchSupported(!!caps?.torch)
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play().catch(() => undefined)
        const detector = await getDetector()
        if (cancelled) return
        setStatus("scanning")

        const tick = async () => {
          if (cancelled) return
          if (!pausedRef.current && video.readyState >= 2) {
            try {
              const [hit] = await detector.detect(video)
              const code = hit?.rawValue?.trim()
              const now = Date.now()
              const last = lastRef.current
              const cooldown =
                code === last.code
                  ? SAME_CODE_COOLDOWN_MS
                  : ANY_CODE_COOLDOWN_MS
              if (code && now - last.at > cooldown) {
                lastRef.current = { code, at: now }
                onDetectedRef.current(code)
              }
            } catch {
              // Un frame fallido no detiene el escaneo.
            }
          }
          timer = setTimeout(tick, SCAN_INTERVAL_MS)
        }
        tick()
      } catch (error) {
        if (cancelled) return
        // Cada navegador nombra distinto el error de "no hay cámara": se confirma contando.
        const next = statusFromError(error)
        setStatus(
          next !== "denied" && !(await hasCamera()) ? "no-camera" : next
        )
      }
    }

    start()
    return () => {
      cancelled = true
      clearTimeout(timer)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      setTorchOn(false)
      setStatus("idle")
    }
  }, [enabled, videoRef, attempt])

  /** Vuelve a intentar abrir la cámara (p. ej. tras conectarla o cerrar otra app). */
  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    const next = !torchOn
    try {
      await track.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      })
      setTorchOn(next)
    } catch {
      setTorchSupported(false)
    }
  }, [torchOn])

  /** Permite volver a leer el mismo código de inmediato (tras deshacer, por ejemplo). */
  const resetCooldown = useCallback(() => {
    lastRef.current = { code: "", at: 0 }
  }, [])

  return { status, torchSupported, torchOn, toggleTorch, resetCooldown, retry }
}
