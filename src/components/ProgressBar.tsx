interface ProgressBarProps {
  done: number
  total: number
  color: string
}

export default function ProgressBar({ done, total, color }: ProgressBarProps) {
  const pct = total > 0 ? (done / total) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-3 bg-warm-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-medium text-gray-500">{done}/{total}</span>
    </div>
  )
}
