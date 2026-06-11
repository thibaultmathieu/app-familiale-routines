import { useRef, useEffect, useCallback } from 'react'

interface DurationPickerProps {
  value: number // minutes
  onChange: (minutes: number) => void
}

const MIN = 1
const MAX = 60
const ITEM_HEIGHT = 48
const VISIBLE_ITEMS = 3
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS

export default function DurationPicker({ value, onChange }: DurationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitialScroll = useRef(true)

  // Scroll to initial value on mount
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    isInitialScroll.current = true
    el.scrollTop = (value - MIN) * ITEM_HEIGHT
    // Allow scroll events after initial positioning
    requestAnimationFrame(() => { isInitialScroll.current = false })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = useCallback(() => {
    if (isInitialScroll.current) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const el = containerRef.current
      if (!el) return
      const index = Math.round(el.scrollTop / ITEM_HEIGHT)
      const selected = Math.max(MIN, Math.min(MAX, index + MIN))
      onChange(selected)
    }, 80)
  }, [onChange])

  const items = Array.from({ length: MAX - MIN + 1 }, (_, i) => i + MIN)

  return (
    <div className="relative mx-auto" style={{ width: 132, height: CONTAINER_HEIGHT }}>
      {/* Highlight band */}
      <div
        className="absolute left-0 right-0 bg-honey-100 rounded-xl pointer-events-none z-0"
        style={{ top: ITEM_HEIGHT, height: ITEM_HEIGHT }}
      />
      {/* Scroll container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto z-10 no-scrollbar"
        style={{
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Top padding */}
        <div style={{ height: ITEM_HEIGHT }} />
        {items.map(m => (
          <div
            key={m}
            className="flex items-center justify-center font-bold font-display text-lg select-none"
            style={{
              height: ITEM_HEIGHT,
              scrollSnapAlign: 'center',
              color: m === value ? '#945C10' : '#9C938A',
            }}
          >
            {m} min
          </div>
        ))}
        {/* Bottom padding */}
        <div style={{ height: ITEM_HEIGHT }} />
      </div>
    </div>
  )
}
