import { useCallback, useEffect, useRef, useState, type RefObject } from "react"

import { getDetector } from "@/lib/barcode"

export type ScannerStatus =
  | "idle"
  | "starting"
  | "scanning"
  | "denied" // el usuario negó el permiso de cámara
  | "unavailable" // sin cámara o sin HTTPS
  | "error"

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
      if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
        setStatus("unavailable")
        return
      }
      setStatus("starting")
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
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
        const name = (error as DOMException)?.name
        setStatus(
          name === "NotAllowedError" || name === "SecurityError"
            ? "denied"
            : name === "NotFoundError" || name === "OverconstrainedError"
              ? "unavailable"
              : "error"
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
  }, [enabled, videoRef])

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

  return { status, torchSupported, torchOn, toggleTorch, resetCooldown }
}
