import { ReactNode } from 'react'

interface ScreenHeaderProps {
  title: ReactNode
  onBack?: () => void
  backLabel?: string
  /** Slot droit (action contextuelle) — un espaceur équilibre le titre sinon. */
  right?: ReactNode
  className?: string
}

export default function ScreenHeader({ title, onBack, backLabel = 'Retour', right, className = '' }: ScreenHeaderProps) {
  return (
    <div className={`flex items-center justify-between gap-2 ${className}`}>
      {onBack ? (
        <button
          onClick={onBack}
          className="min-h-12 px-4 py-2 -ml-4 rounded-2xl text-ink-faint text-lg font-display font-medium active:scale-95 transition-transform"
        >
          ← {backLabel}
        </button>
      ) : (
        <div className="w-24" />
      )}
      <h1 className="text-2xl font-display font-semibold text-ink text-center">{title}</h1>
      {right ?? <div className="w-24" />}
    </div>
  )
}
