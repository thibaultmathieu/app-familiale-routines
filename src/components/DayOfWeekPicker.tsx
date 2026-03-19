const DAYS = [
  { label: 'L', value: 1 },
  { label: 'M', value: 2 },
  { label: 'M', value: 3 },
  { label: 'J', value: 4 },
  { label: 'V', value: 5 },
  { label: 'S', value: 6 },
  { label: 'D', value: 0 },
]

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
    <div className="flex gap-2">
      {DAYS.map(day => {
        const selected = value.includes(day.value)
        return (
          <button
            key={day.value}
            type="button"
            onClick={() => toggle(day.value)}
            className={`w-10 h-10 rounded-full text-sm font-bold transition-colors ${
              selected
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {day.label}
          </button>
        )
      })}
    </div>
  )
}
