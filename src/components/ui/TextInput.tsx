import { RefObject } from 'react'

interface TextInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
  inputRef?: RefObject<HTMLInputElement>
  /** 'bare' : sans bordure (champ dans une rangée déjà encadrée). */
  variant?: 'boxed' | 'bare'
}

export default function TextInput({
  value,
  onChange,
  placeholder,
  className = '',
  autoFocus,
  inputRef,
  variant = 'boxed',
}: TextInputProps) {
  const base = variant === 'boxed'
    ? 'w-full border-2 border-line rounded-xl px-4 py-3 text-lg bg-white text-ink placeholder:text-ink-faint/70 focus:border-honey-300 transition-colors'
    : 'flex-1 min-w-0 border-0 text-base bg-transparent text-ink placeholder:text-ink-faint/70'
  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={`${base} ${className}`}
    />
  )
}
