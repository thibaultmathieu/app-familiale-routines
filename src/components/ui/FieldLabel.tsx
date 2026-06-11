import { ReactNode } from 'react'

interface FieldLabelProps {
  children: ReactNode
  hint?: string
  className?: string
}

export default function FieldLabel({ children, hint, className = '' }: FieldLabelProps) {
  return (
    <label className={`block text-sm font-bold text-ink-faint uppercase tracking-wide mb-2 ${className}`}>
      {children}
      {hint && <span className="font-normal normal-case tracking-normal text-ink-faint/80 ml-2">{hint}</span>}
    </label>
  )
}
