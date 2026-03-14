import { useEffect, useRef } from 'react'
import { ActiveTimer } from '../types'
import { useTimerTick } from '../hooks/useTimer'

type TimerSize = 'small' | 'medium' | 'large'

const SIZE_MAP: Record<TimerSize, number> = {
  small: 80,
  medium: 120,
  large: 220,
}

const STROKE_MAP: Record<TimerSize, number> = {
  small: 6,
  medium: 8,
  large: 12,
}

const FONT_MAP: Record<TimerSize, string> = {
  small: 'text-sm',
  medium: 'text-xl',
  large: 'text-4xl',
}

interface TimerDisplayProps {
  timer: ActiveTimer
  color: string
  size?: TimerSize
  onExpired?: () => void
}

export default function TimerDisplay({ timer, color, size = 'small', onExpired }: TimerDisplayProps) {
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

  const pixelSize = SIZE_MAP[size]
  const strokeWidth = STROKE_MAP[size]
  const radius = (pixelSize - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  const ringColor = isExpired ? '#F59E0B' : color
  const ringOpacity = isExpired ? 1 : 0.4

  return (
    <div className="flex flex-col items-center">
      {/* Label above the ring for medium/large */}
      {size !== 'small' && timer.label && (
        <p className={`text-center font-medium text-gray-600 mb-1 ${size === 'large' ? 'text-lg' : 'text-sm'}`}>
          {timer.label}
        </p>
      )}
      {/* Ring + centered time text */}
      <div className="relative" style={{ width: pixelSize, height: pixelSize }}>
        <svg width={pixelSize} height={pixelSize} className="absolute inset-0 transform -rotate-90">
          <circle
            cx={pixelSize / 2}
            cy={pixelSize / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={pixelSize / 2}
            cy={pixelSize / 2}
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
          className={`${FONT_MAP[size]} font-medium absolute inset-0 flex items-center justify-center`}
          style={{ color: isExpired ? '#F59E0B' : '#9CA3AF' }}
        >
          {isExpired ? '✓' : timeStr}
        </span>
      </div>
    </div>
  )
}
