import { useCallback, useRef } from 'react'

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function playTone(frequency: number, duration: number, startTime: number, ctx: AudioContext) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(frequency, startTime)
  gain.gain.setValueAtTime(0.15, startTime)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

export function useSound() {
  const lastPlayRef = useRef(0)

  const playTaskComplete = useCallback(() => {
    // Debounce: no double-play within 100ms
    const now = Date.now()
    if (now - lastPlayRef.current < 100) return
    lastPlayRef.current = now

    const ctx = getAudioContext()
    const t = ctx.currentTime
    // Gentle ding: sine sweep 880→1108Hz
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
  }, [])

  const playRoutineComplete = useCallback(() => {
    const ctx = getAudioContext()
    const t = ctx.currentTime
    // Arpège C5-E5-G5-C6
    const notes = [523.25, 659.25, 783.99, 1046.50]
    notes.forEach((freq, i) => {
      playTone(freq, 0.3, t + i * 0.2, ctx)
    })
  }, [])

  const playTimerEnd = useCallback(() => {
    const ctx = getAudioContext()
    const t = ctx.currentTime
    // Two gentle tones E5-G5
    playTone(659.25, 0.4, t, ctx)
    playTone(783.99, 0.5, t + 0.3, ctx)
  }, [])

  return { playTaskComplete, playRoutineComplete, playTimerEnd }
}
