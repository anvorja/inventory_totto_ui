/** Retroalimentación sensorial al escanear: vibración + tono corto (sin archivos de audio). */
let audio: AudioContext | null = null

function tone(frequency: number, duration: number, volume = 0.08) {
  try {
    audio ??= new AudioContext()
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = "sine"
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(volume, audio.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration)
    osc.connect(gain).connect(audio.destination)
    osc.start()
    osc.stop(audio.currentTime + duration)
  } catch {
    // Sin audio disponible: la vibración y el color bastan.
  }
}

const vibrate = (pattern: number | number[]) => navigator.vibrate?.(pattern)

export const feedback = {
  success() {
    vibrate(40)
    tone(1320, 0.09)
  },
  warning() {
    vibrate([40, 60, 40])
    tone(660, 0.14)
  },
  error() {
    vibrate([80, 60, 80])
    tone(220, 0.25, 0.1)
  },
}
