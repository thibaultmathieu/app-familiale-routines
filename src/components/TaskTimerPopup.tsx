import { useState } from 'react'
import DurationPicker from './DurationPicker'
import { Button, Overlay, Pill } from './ui'

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
    <Overlay onBackdropClick={onClose} cardClassName="p-6 max-w-sm w-full text-left">
      <h3 className="text-lg font-display font-semibold text-ink mb-1">⏳ Minuteur</h3>
      <p className="text-sm text-ink-faint mb-4">{label}</p>

      <div className="flex flex-wrap gap-2 mb-3">
        {TIMER_DURATIONS.map(d => (
          <Pill
            key={d.seconds}
            selected
            onClick={() => handlePreset(d.seconds)}
          >
            {d.label}
          </Pill>
        ))}
        <Pill selected={showCustom} onClick={() => setShowCustom(!showCustom)}>
          Personnalisé
        </Pill>
      </div>

      {showCustom && (
        <div className="mb-3">
          <DurationPicker value={customMinutes} onChange={setCustomMinutes} />
          <Button variant="honey" size="lg" className="w-full mt-2" onClick={handleCustomStart}>
            Lancer ({customMinutes} min)
          </Button>
        </div>
      )}

      <Button variant="ghost" size="md" className="w-full" onClick={onClose}>
        Annuler
      </Button>
    </Overlay>
  )
}
