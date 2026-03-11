import { useEffect, useRef } from 'react'
import { ActiveTimer } from '../types'
import { useTimerTick } from '../hooks/useTimer'

interface TimerDisplayProps {
  timer: ActiveTimer
  color: string
  onExpired?: () => void
}

export default function TimerDisplay({ timer, color, onExpired }: TimerDisplayProps) {
  const { remaining, isExpired } = useTimerTick(timer)
  const hasNotified = useRef(false)

  useEffect(() => {
    if (isExpired && !hasNotified.current) {
      hasNotified.current = true
      onExpired?.()
    }
  }, [isExpired, onExpired])

  const progress = remaining / timer.durationSeconds
  const minutes = Math.floor(remaining / 60)
  const seconds = Math.floor(remaining % 60)
  const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`

  // SVG circle params
  const size = 80
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  const ringColor = isExpired ? '#F59E0B' : color
  const ringOpacity = isExpired ? 1 : 0.4

  return (
    <div className="flex flex-col items-center mt-2">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          opacity={ringOpacity}
          className="transition-all duration-1000"
        />
      </svg>
      <span
        className="text-sm font-medium -mt-[54px] mb-[34px]"
        style={{ color: isExpired ? '#F59E0B' : '#9CA3AF' }}
      >
        {isExpired ? '✓' : timeStr}
      </span>
    </div>
  )
}
