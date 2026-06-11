import { ReactNode, CSSProperties } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  /** Avec onClick, la carte devient un bouton avec feedback tactile. */
  onClick?: () => void
  disabled?: boolean
}

export default function Card({ children, className = '', style, onClick, disabled }: CardProps) {
  const base = `bg-white rounded-3xl shadow-card border border-line ${className}`
  if (onClick) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        style={style}
        className={`${base} text-left active:scale-[0.98] transition-transform disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {children}
      </button>
    )
  }
  return (
    <div className={base} style={style}>
      {children}
    </div>
  )
}
