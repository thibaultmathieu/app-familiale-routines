import { ReactNode, CSSProperties } from 'react'

interface IconButtonProps {
  children: ReactNode
  onClick?: (e: React.MouseEvent) => void
  ariaLabel: string
  className?: string
  style?: CSSProperties
  disabled?: boolean
  /** Taille du carré tactile en px — jamais sous 44. */
  size?: 44 | 48 | 56
}

export default function IconButton({
  children,
  onClick,
  ariaLabel,
  className = '',
  style,
  disabled,
  size = 48,
}: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{ width: size, height: size, ...style }}
      className={`rounded-full flex items-center justify-center flex-shrink-0
        active:scale-90 transition-transform disabled:opacity-30 disabled:active:scale-100
        ${className}`}
    >
      {children}
    </button>
  )
}
