import { useState, useEffect } from 'react'
import { ActiveTimer, Child, Screen } from '../types'
import ChildAvatar from './ChildAvatar'
import TimerDisplay from './TimerDisplay'
import DurationPicker from './DurationPicker'
import { useSound } from '../hooks/useSound'
import { childTextColor, tint } from '../theme'
import { Button, Card, Pill, ScreenHeader } from './ui'

const TIMER_DURATIONS = [
  { label: '2 min', seconds: 2 * 60 },
  { label: '5 min', seconds: 5 * 60 },
  { label: '10 min', seconds: 10 * 60 },
  { label: '15 min', seconds: 15 * 60 },
]

const MISSION_PRESETS = [
  'Finir le repas',
  'Sortir du bain',
  'Ranger la chambre',
  'Finir les devoirs',
  'Se préparer',
  'Se laver les dents',
]

interface TimerSetupScreenProps {
  children: Child[]
  activeTimers: ActiveTimer[]
  timerReturnScreen: Screen | null
  timerPrefill: { label?: string; childIds?: string[] } | null
  setCurrentScreen: (screen: Screen) => void
  startTimer: (childIds: string[], durationSeconds: number, label?: string) => void
  cancelTimer: (timerId: string) => void
  setTimerPrefill: (prefill: { label?: string; childIds?: string[] } | null) => void
}

export default function TimerSetupScreen({
  children,
  activeTimers,
  timerReturnScreen,
  timerPrefill,
  setCurrentScreen,
  startTimer,
  cancelTimer,
  setTimerPrefill,
}: TimerSetupScreenProps) {
  const [timerDuration, setTimerDuration] = useState(5 * 60)
  const [timerTarget, setTimerTarget] = useState<'both' | string>('both')
  const [timerLabel, setTimerLabel] = useState(MISSION_PRESETS[0])
  const [showCustomLabel, setShowCustomLabel] = useState(false)
  const [customLabelText, setCustomLabelText] = useState('')
  const [showCustomDuration, setShowCustomDuration] = useState(false)
  const [customMinutes, setCustomMinutes] = useState(7)
  const { playTimerEnd } = useSound()

  // Apply prefill on mount
  useEffect(() => {
    if (timerPrefill) {
      if (timerPrefill.label) {
        setShowCustomLabel(true)
        setCustomLabelText(timerPrefill.label)
      }
      if (timerPrefill.childIds?.length === 1) {
        setTimerTarget(timerPrefill.childIds[0])
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleBack = () => {
    setTimerPrefill(null)
    setCurrentScreen(timerReturnScreen ?? 'home')
  }

  const handleStartTimer = () => {
    const childIds = timerTarget === 'both'
      ? children.map(c => c.id)
      : [timerTarget]
    const label = showCustomLabel ? customLabelText.trim() || 'Minuteur' : timerLabel
    const duration = showCustomDuration ? customMinutes * 60 : timerDuration
    startTimer(childIds, duration, label)

    // If prefilled from a task, go back to routine
    if (timerPrefill) {
      setTimerPrefill(null)
      setCurrentScreen(timerReturnScreen ?? 'home')
    }
  }

  const handleSelectPreset = (preset: string) => {
    setShowCustomLabel(false)
    setTimerLabel(preset)
  }

  const handleSelectDurationPreset = (seconds: number) => {
    setShowCustomDuration(false)
    setTimerDuration(seconds)
  }

  const safeTimers = activeTimers ?? []

  return (
    <div className="h-full flex flex-col p-6 max-w-2xl mx-auto overflow-y-auto">
      <ScreenHeader className="mb-6" onBack={handleBack} title="⏳ Minuteur" />

      {/* Active timers */}
      {safeTimers.length > 0 && (
        <div className="mb-6 space-y-3">
          <h2 className="text-sm font-bold text-honey-600 uppercase tracking-wide">Minuteurs actifs</h2>
          {safeTimers.map(timer => {
            const targetNames = timer.childIds
              .map(id => children.find(c => c.id === id)?.name)
              .filter(Boolean)
              .join(' & ')
            const targetChild = children.find(c => timer.childIds.includes(c.id))
            return (
              <div key={timer.id} className="flex items-center gap-4 p-3 bg-honey-50 border border-honey-100 rounded-2xl">
                <TimerDisplay
                  timer={timer}
                  color={targetChild?.color ?? '#D98E20'}
                  size="small"
                  onExpired={playTimerEnd}
                />
                <div className="flex-1">
                  <p className="font-display font-semibold text-ink">{timer.label}</p>
                  <p className="text-sm text-ink-faint">{targetNames} — {Math.round(timer.durationSeconds / 60)} min</p>
                </div>
                <Button variant="danger-soft" size="md" onClick={() => cancelTimer(timer.id)}>
                  Annuler
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {/* New timer form */}
      <Card className="p-6 space-y-6">
        {/* Mission */}
        <div>
          <p className="text-sm font-bold text-ink-faint uppercase tracking-wide mb-3">Mission</p>
          <div className="flex flex-wrap gap-2">
            {MISSION_PRESETS.map(preset => (
              <Pill
                key={preset}
                selected={!showCustomLabel && timerLabel === preset}
                onClick={() => handleSelectPreset(preset)}
              >
                {preset}
              </Pill>
            ))}
            <Pill selected={showCustomLabel} onClick={() => setShowCustomLabel(true)}>
              Autre…
            </Pill>
          </div>
          {showCustomLabel && (
            <input
              type="text"
              placeholder="Mission personnalisée"
              value={customLabelText}
              onChange={e => setCustomLabelText(e.target.value)}
              className="w-full border-2 border-line rounded-xl px-4 py-3 text-base mt-3 bg-white text-ink placeholder:text-ink-faint/70 focus:border-honey-300 transition-colors"
            />
          )}
        </div>

        {/* Duration */}
        <div>
          <p className="text-sm font-bold text-ink-faint uppercase tracking-wide mb-3">Durée</p>
          <div className="flex flex-wrap gap-2">
            {TIMER_DURATIONS.map(d => (
              <Pill
                key={d.seconds}
                selected={!showCustomDuration && timerDuration === d.seconds}
                onClick={() => handleSelectDurationPreset(d.seconds)}
              >
                {d.label}
              </Pill>
            ))}
            <Pill selected={showCustomDuration} onClick={() => setShowCustomDuration(true)}>
              Personnalisé
            </Pill>
          </div>
          {showCustomDuration && (
            <div className="mt-3">
              <DurationPicker value={customMinutes} onChange={setCustomMinutes} />
            </div>
          )}
        </div>

        {/* Target */}
        <div>
          <p className="text-sm font-bold text-ink-faint uppercase tracking-wide mb-3">Pour</p>
          <div className="flex gap-2 flex-wrap">
            {children.map(child => {
              const selected = timerTarget === child.id
              return (
                <Pill
                  key={child.id}
                  selected={selected}
                  onClick={() => setTimerTarget(child.id)}
                  selectedClassName=""
                  style={selected ? {
                    borderColor: child.color,
                    backgroundColor: tint(child.color, 0.12),
                    color: childTextColor(child.color),
                  } : undefined}
                >
                  <ChildAvatar photo={child.photo} color={child.color} size={28} />
                  {child.name}
                </Pill>
              )
            })}
            <Pill selected={timerTarget === 'both'} onClick={() => setTimerTarget('both')}>
              Les deux
            </Pill>
          </div>
        </div>

        {/* Launch button */}
        <Button variant="honey" size="xl" onClick={handleStartTimer}>
          ⏳ Lancer le minuteur
        </Button>
      </Card>
      <div className="h-6 shrink-0" />
    </div>
  )
}
