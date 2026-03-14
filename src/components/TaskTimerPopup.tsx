import { useState } from 'react'
import DurationPicker from './DurationPicker'

const TIMER_DURATIONS = [
  { label: '2 min', seconds: 2 * 60 },
  { label: '5 min', seconds: 5 * 60 },
  { label: '10 min', seconds: 10 * 60 },
  { label: '15 min', seconds: 15 * 60 },
]

interface TaskTimerPopupProps {
  label: string
  childId: string
  onStart: (childIds: string[], durationSeconds: number, label: string) => void
  onClose: () => void
}

export default function TaskTimerPopup({ label, childId, onStart, onClose }: TaskTimerPopupProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [customMinutes, setCustomMinutes] = useState(7)

  const handlePreset = (seconds: number) => {
    onStart([childId], seconds, label)
    onClose()
  }

  const handleCustomStart = () => {
    onStart([childId], customMinutes * 60, label)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 shadow-xl max-w-sm mx-4 w-full"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-800 mb-1">⏳ Minuteur</h3>
        <p className="text-sm text-gray-500 mb-4">{label}</p>

        <div className="flex flex-wrap gap-2 mb-3">
          {TIMER_DURATIONS.map(d => (
            <button
              key={d.seconds}
              onClick={() => handlePreset(d.seconds)}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-amber-50 text-amber-700 border-2 border-amber-200 active:scale-95 transition-transform"
            >
              {d.label}
            </button>
          ))}
          <button
            onClick={() => setShowCustom(!showCustom)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              showCustom
                ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                : 'bg-gray-50 text-gray-500 border-2 border-gray-100'
            }`}
          >
            Personnalisé
          </button>
        </div>

        {showCustom && (
          <div className="mb-3">
            <DurationPicker value={customMinutes} onChange={setCustomMinutes} />
            <button
              onClick={handleCustomStart}
              className="w-full mt-2 py-2 bg-amber-400 text-white rounded-xl font-semibold active:scale-95 transition-transform"
            >
              Lancer ({customMinutes} min)
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2 text-gray-400 font-medium"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}
