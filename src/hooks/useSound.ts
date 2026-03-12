import { useCallback, useRef } from 'react'

let audioCtx: AudioContext | null = null

async function getAudioContext(): Promise<AudioContext> {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume()
  }
  return audioCtx
}

function playTone(
  frequency: number,
  duration: number,
  startTime: number,
  ctx: AudioContext,
  type: OscillatorType = 'sine',
  volume: number = 0.15
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, startTime)
  gain.gain.setValueAtTime(volume, startTime)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(startTime)
  osc.stop(startTime + duration)
  osc.onended = () => {
    osc.disconnect()
    gain.disconnect()
  }
}

// Variant A: sweep 880→1108Hz (original)
function taskSoundA(ctx: AudioContext, t: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, t)
  osc.frequency.exponentialRampToValueAtTime(1108, t + 0.3)
  gain.gain.setValueAtTime(0.12, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.5)
  osc.onended = () => {
    osc.disconnect()
    gain.disconnect()
  }
}

// Variant B: two notes 660→880Hz
function taskSoundB(ctx: AudioContext, t: number) {
  playTone(660, 0.25, t, ctx)
  playTone(880, 0.3, t + 0.15, ctx)
}

// Variant C: sparkle 1047→1319Hz
function taskSoundC(ctx: AudioContext, t: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(1047, t)
  osc.frequency.exponentialRampToValueAtTime(1319, t + 0.2)
  gain.gain.setValueAtTime(0.10, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.4)
  osc.onended = () => {
    osc.disconnect()
    gain.disconnect()
  }
}

// Variant D: triple bell 440-550-660Hz
function taskSoundD(ctx: AudioContext, t: number) {
  playTone(440, 0.2, t, ctx, 'sine', 0.10)
  playTone(550, 0.2, t + 0.12, ctx, 'sine', 0.10)
  playTone(660, 0.25, t + 0.24, ctx, 'sine', 0.10)
}

const taskSoundVariants = [taskSoundA, taskSoundB, taskSoundC, taskSoundD]

// Call once from App root to unlock AudioContext on first user gesture (mobile)
export function initAudioOnGesture(): () => void {
  const handler = () => {
    getAudioContext()
    window.removeEventListener('touchstart', handler)
    window.removeEventListener('click', handler)
  }
  window.addEventListener('touchstart', handler, { once: true })
  window.addEventListener('click', handler, { once: true })
  return () => {
    window.removeEventListener('touchstart', handler)
    window.removeEventListener('click', handler)
  }
}

export function useSound() {
  const lastPlayRef = useRef(0)

  const playTaskComplete = useCallback(async () => {
    const now = Date.now()
    if (now - lastPlayRef.current < 100) return
    lastPlayRef.current = now

    const ctx = await getAudioContext()
    const t = ctx.currentTime
    const variant = taskSoundVariants[Math.floor(Math.random() * taskSoundVariants.length)]
    variant(ctx, t)
  }, [])

  const playRoutineComplete = useCallback(async () => {
    const ctx = await getAudioContext()
    const t = ctx.currentTime
    // Arpège C5-E5-G5-C6
    const notes = [523.25, 659.25, 783.99, 1046.50]
    notes.forEach((freq, i) => {
      playTone(freq, 0.3, t + i * 0.2, ctx)
    })
  }, [])

  const playTimerEnd = useCallback(async () => {
    const ctx = await getAudioContext()
    const t = ctx.currentTime
    // Reinforced pattern: triangle wave, played twice with spacing
    const playPattern = (offset: number) => {
      playTone(659.25, 0.4, t + offset, ctx, 'triangle', 0.18)
      playTone(783.99, 0.5, t + offset + 0.3, ctx, 'triangle', 0.18)
    }
    playPattern(0)
    playPattern(1.0)
  }, [])

  return { playTaskComplete, playRoutineComplete, playTimerEnd }
}
