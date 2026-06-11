import { ReactNode } from 'react'

type Tone = 'success' | 'honey' | 'neutral' | 'danger'

const TONES: Record<Tone, string> = {
  success: 'bg-success-100 text-success-600',
  honey: 'bg-honey-100 text-honey-700',
  neutral: 'bg-warm-200 text-ink-soft',
  danger: 'bg-danger-100 text-danger-600',
}

interface BadgeProps {
  children: ReactNode
  tone?: Tone
  className?: string
}

export default function Badge({ children, tone = 'neutral', className = '' }: BadgeProps) {
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${TONES[tone]} ${className}`}>
      {children}
    </span>
  )
}
