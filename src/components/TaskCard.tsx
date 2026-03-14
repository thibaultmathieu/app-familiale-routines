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
      onClick={done ? undefined : onToggle}
      onKeyDown={e => { if (!done && (e.key === 'Enter' || e.key === ' ')) onToggle() }}
      className={`
        w-full rounded-2xl p-4 flex items-center gap-4 transition-all duration-300
        ${done
          ? 'bg-green-50 border-2 border-green-200'
          : 'bg-white border-2 border-gray-100 active:scale-[0.97]'
        }
        ${!done ? 'cursor-pointer' : 'cursor-default'}
      `}
    >
      <span className="text-3xl flex-shrink-0">{icon}</span>
      <span className={`text-lg font-medium flex-1 text-left ${done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
        {label}
      </span>
      {onTimerPress && !done && (
        <button
          onClick={e => { e.stopPropagation(); onTimerPress() }}
          className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-lg flex-shrink-0 active:scale-90 transition-transform border-2 border-amber-200"
          aria-label="Lancer un minuteur"
        >
          ⏳
        </button>
      )}
      <div
        className={`
          w-12 h-12 rounded-full border-3 flex items-center justify-center flex-shrink-0
          transition-all duration-300
          ${done
            ? 'border-green-400 bg-green-400'
            : 'border-gray-300'
          }
        `}
        style={!done ? { borderColor: color + '60' } : {}}
      >
        {done && (
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>
  )
}
