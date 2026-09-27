import {
  CameraIcon,
  CameraOffIcon,
  FlashlightIcon,
  FlashlightOffIcon,
  ImageIcon,
  ShieldAlertIcon,
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
  Record<ScannerStatus, { title: string; body: string }>
> = {
  denied: {
    title: "Sin permiso de cámara",
    body: "Actívalo en los ajustes del navegador para este sitio, o usa la foto o el teclado.",
  },
  unavailable: {
    title: "Cámara no disponible",
    body: "La cámara en vivo necesita HTTPS. Puedes tomar una foto de la etiqueta o escribir el código.",
  },
  error: {
    title: "No pudimos iniciar la cámara",
    body: "Cierra otras apps que la estén usando y vuelve a intentarlo.",
  },
}

export function ScannerPanel() {
  const { scan, unknownCode, isOpen } = useCountSession()
  const videoRef = useRef<HTMLVideoElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const [cameraOn, setCameraOn] = useState(true)
  const [decoding, setDecoding] = useState(false)
  const [flash, setFlash] = useState(0)

  const { status, torchSupported, torchOn, toggleTorch } = useBarcodeScanner({
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
                <ShieldAlertIcon className="size-7 text-warning" />
                <span className="font-medium">{problem.title}</span>
                <span className="max-w-xs text-sm text-white/70">
                  {problem.body}
                </span>
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
