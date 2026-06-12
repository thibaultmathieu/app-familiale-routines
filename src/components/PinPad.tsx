const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'erase'] as const

interface PinPadProps {
  value: string
  onChange: (value: string) => void
  length?: number
  error?: boolean
}

/** Clavier + afficheur à points pour un code à `length` chiffres (gate et réglage parents). */
export default function PinPad({ value, onChange, length = 4, error = false }: PinPadProps) {
  const pressDigit = (d: string) => {
    if (value.length < length) onChange(value + d)
  }
  const erase = () => onChange(value.slice(0, -1))

  return (
    <>
      <div
        className={`h-14 mb-4 rounded-xl border-2 flex items-center justify-center gap-3 ${
          error ? 'border-danger-300 bg-danger-50' : 'border-line bg-warm-50'
        }`}
        aria-label="Code saisi"
      >
        {Array.from({ length }, (_, i) => (
          <span
            key={i}
            className={`w-4 h-4 rounded-full transition-colors ${
              i < value.length ? (error ? 'bg-danger-400' : 'bg-ink') : 'bg-warm-200'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((key, i) => {
          if (key === '') return <div key={`empty-${i}`} />
          if (key === 'erase') {
            return (
              <button
                key={key}
                onClick={erase}
                className="h-14 rounded-xl bg-warm-100 text-ink-soft text-xl font-bold active:scale-95 transition-transform"
                aria-label="Effacer"
              >
                ⌫
              </button>
            )
          }
          return (
            <button
              key={key}
              onClick={() => pressDigit(key)}
              className="h-14 rounded-xl bg-warm-100 text-ink text-xl font-bold tabular-nums active:scale-95 transition-transform"
            >
              {key}
            </button>
          )
        })}
      </div>
    </>
  )
}
