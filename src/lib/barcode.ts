import {
  BarcodeDetector as PonyfillDetector,
  prepareZXingModule,
  type BarcodeFormat,
} from "barcode-detector/ponyfill"
import wasmUrl from "virtual-zxing-reader.wasm?url"

/** Formatos que aparecen en etiquetas de retail (Totto usa EAN-13). */
export const RETAIL_FORMATS: BarcodeFormat[] = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "itf",
]

interface Detector {
  detect(source: ImageBitmapSource): Promise<{ rawValue: string }[]>
}

let detectorPromise: Promise<Detector> | null = null

// El WASM se sirve desde la propia app (no desde un CDN) para funcionar en redes de tienda.
prepareZXingModule({
  overrides: {
    locateFile: (path: string, prefix: string) =>
      path.endsWith(".wasm") ? wasmUrl : prefix + path,
  },
})

async function createDetector(): Promise<Detector> {
  // Android/Chrome traen un detector nativo (más rápido). iOS usa el de ZXing en WASM.
  const Native = (globalThis as { BarcodeDetector?: typeof PonyfillDetector })
    .BarcodeDetector
  if (Native) {
    try {
      const supported = await Native.getSupportedFormats()
      if (supported.includes("ean_13")) {
        return new Native({
          formats: RETAIL_FORMATS.filter((f) => supported.includes(f)),
        })
      }
    } catch {
      // Cae al ponyfill.
    }
  }
  return new PonyfillDetector({ formats: RETAIL_FORMATS })
}

export function getDetector() {
  detectorPromise ??= createDetector()
  return detectorPromise
}

export async function decodeImageFile(file: Blob): Promise<string | null> {
  const detector = await getDetector()
  const bitmap = await createImageBitmap(file)
  try {
    const [result] = await detector.detect(bitmap)
    return result?.rawValue ?? null
  } finally {
    bitmap.close()
  }
}
