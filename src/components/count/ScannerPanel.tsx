import {
  CameraIcon,
  CameraOffIcon,
  FlashlightIcon,
  FlashlightOffIcon,
  ImageIcon,
  RotateCwIcon,
  ShieldAlertIcon,
  VideoOffIcon,
} from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  useBarcodeScanner,
  type ScannerStatus,
} from "@/hooks/useBarcodeScanner"
import { useCountSession } from "@/hooks/useCountSession"
import { decodeImageFile } from "@/lib/barcode"
import { feedback } from "@/lib/feedback"
import { cn } from "@/lib/utils"

const STATUS_COPY: Partial<
  Record<
    ScannerStatus,
    {
      title: string
      body: string
      icon: typeof ShieldAlertIcon
      retry?: boolean
    }
  >
> = {
  denied: {
    title: "Sin permiso de cámara",
    body: "Permite la cámara para este sitio en los ajustes del navegador (ícono junto a la dirección) y toca Reintentar.",
    icon: ShieldAlertIcon,
    retry: true,
  },
  "no-camera": {
    title: "Este equipo no tiene cámara",
    body: "Conecta una cámara y toca Reintentar, o usa un lector de códigos USB o el teclado. Los asesores pueden contar desde su celular.",
    icon: VideoOffIcon,
    retry: true,
  },
  "in-use": {
    title: "La cámara está ocupada",
    body: "Otra aplicación la está usando (videollamada, otra pestaña). Ciérrala y toca Reintentar.",
    icon: VideoOffIcon,
    retry: true,
  },
  insecure: {
    title: "El navegador no permite la cámara",
    body: "Abre la app desde su dirección https:// o usa la foto o el teclado.",
    icon: ShieldAlertIcon,
  },
  error: {
    title: "No pudimos iniciar la cámara",
    body: "Toca Reintentar. Si sigue fallando, usa la foto o el teclado.",
    icon: ShieldAlertIcon,
    retry: true,
  },
}

export function ScannerPanel() {
  const { scan, unknownCode, isOpen } = useCountSession()
  const videoRef = useRef<HTMLVideoElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const [cameraOn, setCameraOn] = useState(true)
  const [decoding, setDecoding] = useState(false)
  const [flash, setFlash] = useState(0)

  const { status, torchSupported, torchOn, toggleTorch, retry } =
    useBarcodeScanner({
      videoRef,
      enabled: cameraOn && isOpen,
      paused: !!unknownCode,
      onDetected: (code) => {
        setFlash((n) => n + 1)
        scan(code)
      },
    })

  const onPhoto = async (file: File | undefined) => {
    if (!file) return
    setDecoding(true)
    try {
      const code = await decodeImageFile(file)
      if (code) scan(code)
      else {
        feedback.error()
        toast.error("No encontramos un código en la foto", {
          description:
            "Acércate, evita reflejos y que el código quede horizontal.",
        })
      }
    } finally {
      setDecoding(false)
    }
  }

  const problem = STATUS_COPY[status]
  const live = status === "scanning"

  return (
    <div className="relative overflow-hidden rounded-3xl bg-neutral-950 ring-1 ring-foreground/10">
      <div className="relative aspect-[4/3] max-h-[38svh] w-full md:max-h-none">
        <video
          ref={videoRef}
          playsInline
          muted
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity",
            live ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Guía de encuadre */}
        {live && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              key={flash}
              className="relative h-[38%] w-[78%] [animation:pop_300ms_ease-out] rounded-2xl border-2 border-white/80 shadow-[0_0_0_100vmax_rgb(0_0_0/0.35)]"
            >
              <div className="absolute inset-x-3 top-1 h-0.5 [animation:scan-line_2.2s_ease-in-out_infinite] rounded-full bg-primary shadow-[0_0_12px_2px] shadow-primary [--scan-travel:calc(38svh*0.3)] md:[--scan-travel:7rem]" />
            </div>
          </div>
        )}

        {!live && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-white">
            {status === "starting" ? (
              <>
                <Spinner className="size-6" />
                <span className="text-sm text-white/80">Abriendo cámara…</span>
              </>
            ) : problem ? (
              <>
                <problem.icon className="size-7 text-warning" />
                <span className="font-medium">{problem.title}</span>
                <span className="max-w-xs text-sm text-white/70">
                  {problem.body}
                </span>
                {problem.retry && (
                  <Button
                    size="lg"
                    variant="secondary"
                    className="mt-1 bg-white/15 text-white hover:bg-white/25"
                    onClick={retry}
                  >
                    <RotateCwIcon /> Reintentar
                  </Button>
                )}
              </>
            ) : !isOpen ? (
              <span className="text-sm text-white/80">
                Este conteo está cerrado.
              </span>
            ) : (
              <>
                <CameraOffIcon className="size-7 text-white/70" />
                <span className="text-sm text-white/80">Cámara en pausa</span>
              </>
            )}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-3">
          <Button
            size="icon-xl"
            variant="secondary"
            className="rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"
            onClick={() => setCameraOn((v) => !v)}
            disabled={!isOpen}
            aria-label={cameraOn ? "Pausar cámara" : "Encender cámara"}
          >
            {cameraOn ? <CameraOffIcon /> : <CameraIcon />}
          </Button>
          <Button
            variant="secondary"
            className="h-12 rounded-full bg-white/15 px-4 text-white backdrop-blur hover:bg-white/25"
            onClick={() => photoRef.current?.click()}
            disabled={!isOpen || decoding}
          >
            {decoding ? <Spinner /> : <ImageIcon />}
            Foto
          </Button>
          <Button
            size="icon-xl"
            variant="secondary"
            className="rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"
            onClick={toggleTorch}
            disabled={!torchSupported}
            aria-label={torchOn ? "Apagar linterna" : "Encender linterna"}
            aria-pressed={torchOn}
          >
            {torchOn ? <FlashlightOffIcon /> : <FlashlightIcon />}
          </Button>
        </div>
      </div>
      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          onPhoto(e.target.files?.[0])
          e.target.value = ""
        }}
      />
    </div>
  )
}
