import { useState, useEffect, useCallback } from 'react'
import { ActiveTimer } from '../types'

export function useTimerTick(timer: ActiveTimer | null) {
  const [remaining, setRemaining] = useState(0)
  const [isExpired, setIsExpired] = useState(false)

  const calcRemaining = useCallback(() => {
    if (!timer) return 0
    const elapsed = (Date.now() - new Date(timer.startedAt).getTime()) / 1000
    return Math.max(0, timer.durationSeconds - elapsed)
  }, [timer])

  useEffect(() => {
    if (!timer) {
      setRemaining(0)
      setIsExpired(false)
      return
    }

    const update = () => {
      const r = calcRemaining()
      setRemaining(r)
      if (r <= 0) {
        setIsExpired(true)
      }
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [timer, calcRemaining])

  return { remaining, isExpired }
}
