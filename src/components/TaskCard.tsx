interface TaskCardProps {
  icon: string
  label: string
  done: boolean
  onToggle: () => void
  color: string
}

export default function TaskCard({ icon, label, done, onToggle, color }: TaskCardProps) {
  return (
    <button
      onClick={done ? undefined : onToggle}
      className={`
        w-full rounded-2xl p-4 flex items-center gap-4 transition-all duration-300
        ${done
          ? 'bg-green-50 border-2 border-green-200'
          : 'bg-white border-2 border-gray-100 active:scale-[0.97]'
        }
        ${!done ? 'cursor-pointer' : 'cursor-default'}
      `}
      disabled={done}
    >
      <span className="text-3xl flex-shrink-0">{icon}</span>
      <span className={`text-lg font-medium flex-1 text-left ${done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
        {label}
      </span>
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
    </button>
  )
}
