import { ReactNode, CSSProperties } from 'react'

type Variant =
  | 'primary' | 'honey' | 'night' | 'soft'
  | 'honey-soft' | 'success-soft' | 'danger-soft' | 'night-soft'
  | 'outline' | 'ghost'
type Size = 'md' | 'lg' | 'xl'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-success-500 text-white',
  honey: 'bg-honey-400 text-white',
  night: 'bg-night-500 text-white',
  soft: 'bg-warm-100 text-ink-soft',
  'honey-soft': 'bg-honey-50 text-honey-600',
  'success-soft': 'bg-success-50 text-success-600',
  'danger-soft': 'bg-danger-50 text-danger-500',
  'night-soft': 'bg-[#EFEDF9] text-night-500',
  outline: 'bg-white border-2 border-dashed border-line-strong text-ink-faint',
  ghost: 'text-ink-faint',
}

const SIZES: Record<Size, string> = {
  md: 'min-h-12 px-5 text-base rounded-xl',
  lg: 'min-h-12 px-6 py-3 text-lg rounded-2xl',
  xl: 'min-h-14 px-8 py-4 text-lg rounded-2xl w-full',
}

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: Variant
  size?: Size
  disabled?: boolean
  className?: string
  style?: CSSProperties
  ariaLabel?: string
  type?: 'button' | 'submit'
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'lg',
  disabled,
  className = '',
  style,
  ariaLabel,
  type = 'button',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={style}
      aria-label={ariaLabel}
      className={`font-display font-semibold active:scale-95 transition-transform
        disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {children}
    </button>
  )
}
