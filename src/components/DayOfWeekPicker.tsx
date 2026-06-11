const DAYS = [
  { label: 'L', value: 1 },
  { label: 'M', value: 2 },
  { label: 'M', value: 3 },
  { label: 'J', value: 4 },
  { label: 'V', value: 5 },
  { label: 'S', value: 6 },
  { label: 'D', value: 0 },
]

const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

interface DayOfWeekPickerProps {
  value: number[]
  onChange: (days: number[]) => void
}

export default function DayOfWeekPicker({ value, onChange }: DayOfWeekPickerProps) {
  const toggle = (day: number) => {
    if (value.includes(day)) {
      onChange(value.filter(d => d !== day))
    } else {
      onChange([...value, day])
    }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {DAYS.map(day => {
        const selected = value.includes(day.value)
        return (
          <button
            key={day.value}
            type="button"
            onClick={() => toggle(day.value)}
            aria-pressed={selected}
            aria-label={DAY_NAMES[day.value]}
            className={`w-12 h-12 rounded-full text-base font-bold font-display transition-colors active:scale-95 ${
              selected
                ? 'bg-ink text-warm-50'
                : 'bg-warm-100 text-ink-faint'
            }`}
          >
            {day.label}
          </button>
        )
      })}
    </div>
  )
}
