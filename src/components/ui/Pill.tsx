import { ReactNode, CSSProperties } from 'react'

interface PillProps {
  children: ReactNode
  onClick?: () => void
  selected?: boolean
  /** Classes appliquées quand la puce est sélectionnée (défaut : miel). */
  selectedClassName?: string
  style?: CSSProperties
  className?: string
}

/** Puce sélectionnable ≥48px de haut (presets, cibles, filtres). */
export default function Pill({
  children,
  onClick,
  selected = false,
  selectedClassName = 'bg-honey-100 text-honey-700 border-honey-300',
  style,
  className = '',
}: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      aria-pressed={selected}
      className={`min-h-12 px-5 py-2 rounded-full text-base font-semibold font-display
        border-2 transition-all active:scale-95 inline-flex items-center justify-center gap-2
        ${selected ? selectedClassName : 'bg-warm-50 text-ink-soft border-line'}
        ${className}`}
    >
      {children}
    </button>
  )
}
