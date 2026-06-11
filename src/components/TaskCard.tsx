import { tint } from '../theme'

interface TaskCardProps {
  icon: string
  label: string
  done: boolean
  onToggle: () => void
  color: string
  onTimerPress?: () => void
}

export default function TaskCard({ icon, label, done, onToggle, color, onTimerPress }: TaskCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={done}
      onClick={done ? undefined : onToggle}
      onKeyDown={e => { if (!done && (e.key === 'Enter' || e.key === ' ')) onToggle() }}
      className={`
        w-full rounded-2xl p-4 flex items-center gap-4 transition-all duration-300
        ${done
          ? 'bg-success-50 border-2 border-success-200'
          : 'bg-white border-2 border-line shadow-card active:scale-[0.97]'
        }
        ${!done ? 'cursor-pointer' : 'cursor-default'}
      `}
    >
      <span className="text-3xl flex-shrink-0" aria-hidden="true">{icon}</span>
      <span className={`text-lg flex-1 text-left ${done ? 'font-medium text-ink-faint line-through' : 'font-semibold text-ink'}`}>
        {label}
      </span>
      {onTimerPress && !done && (
        <button
          onClick={e => { e.stopPropagation(); onTimerPress() }}
          className="w-12 h-12 rounded-full bg-honey-50 border-2 border-honey-200 flex items-center justify-center text-lg flex-shrink-0 active:scale-90 transition-transform"
          aria-label="Lancer un minuteur pour cette tâche"
        >
          ⏳
        </button>
      )}
      <div
        className={`
          w-12 h-12 rounded-full border-[3px] flex items-center justify-center flex-shrink-0
          transition-all duration-300 bg-white
          ${done ? 'border-success-400 bg-success-400' : ''}
        `}
        style={!done ? { borderColor: tint(color, 0.55) } : undefined}
      >
        {done && (
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>
  )
}
