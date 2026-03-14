import { useState, useEffect } from 'react'
import { ActiveTimer, Child, Screen } from '../types'
import TimerDisplay from './TimerDisplay'
import DurationPicker from './DurationPicker'
import { useSound } from '../hooks/useSound'

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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleBack}
          className="text-gray-400 text-lg font-medium px-4 py-2"
        >
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-gray-800">⏳ Minuteur</h1>
        <div className="w-24" />
      </div>

      {/* Active timers */}
      {safeTimers.length > 0 && (
        <div className="mb-6 space-y-3">
          <h2 className="text-sm font-bold text-amber-600 uppercase tracking-wide">Minuteurs actifs</h2>
          {safeTimers.map(timer => {
            const targetNames = timer.childIds
              .map(id => children.find(c => c.id === id)?.name)
              .filter(Boolean)
              .join(' & ')
            const targetChild = children.find(c => timer.childIds.includes(c.id))
            return (
              <div key={timer.id} className="flex items-center gap-4 p-3 bg-amber-50 rounded-xl">
                <TimerDisplay
                  timer={timer}
                  color={targetChild?.color ?? '#F59E0B'}
                  size="small"
                  onExpired={playTimerEnd}
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-700">{timer.label}</p>
                  <p className="text-sm text-gray-400">{targetNames} — {timer.durationSeconds / 60} min</p>
                </div>
                <button
                  onClick={() => cancelTimer(timer.id)}
                  className="text-sm text-red-400 font-medium px-3 py-1 rounded-lg bg-red-50 active:scale-95 transition-transform"
                >
                  Annuler
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* New timer form */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100 space-y-5">
        {/* Mission */}
        <div>
          <p className="text-sm font-semibold text-gray-400 mb-2">Mission</p>
          <div className="flex flex-wrap gap-2">
            {MISSION_PRESETS.map(preset => (
              <button
                key={preset}
                onClick={() => handleSelectPreset(preset)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  !showCustomLabel && timerLabel === preset
                    ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                    : 'bg-gray-50 text-gray-500 border-2 border-gray-100'
                }`}
              >
                {preset}
              </button>
            ))}
            <button
              onClick={() => setShowCustomLabel(true)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                showCustomLabel
                  ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                  : 'bg-gray-50 text-gray-500 border-2 border-gray-100'
              }`}
            >
              Autre…
            </button>
          </div>
          {showCustomLabel && (
            <input
              type="text"
              placeholder="Mission personnalisée"
              value={customLabelText}
              onChange={e => setCustomLabelText(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-sm mt-2 focus:outline-none focus:border-amber-300"
            />
          )}
        </div>

        {/* Duration */}
        <div>
          <p className="text-sm font-semibold text-gray-400 mb-2">Durée</p>
          <div className="flex flex-wrap gap-2">
            {TIMER_DURATIONS.map(d => (
              <button
                key={d.seconds}
                onClick={() => handleSelectDurationPreset(d.seconds)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  !showCustomDuration && timerDuration === d.seconds
                    ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                    : 'bg-gray-50 text-gray-500 border-2 border-gray-100'
                }`}
              >
                {d.label}
              </button>
            ))}
            <button
              onClick={() => setShowCustomDuration(true)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                showCustomDuration
                  ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                  : 'bg-gray-50 text-gray-500 border-2 border-gray-100'
              }`}
            >
              Personnalisé
            </button>
          </div>
          {showCustomDuration && (
            <div className="mt-3">
              <DurationPicker value={customMinutes} onChange={setCustomMinutes} />
            </div>
          )}
        </div>

        {/* Target */}
        <div>
          <p className="text-sm font-semibold text-gray-400 mb-2">Pour</p>
          <div className="flex gap-2">
            {children.map(child => (
              <button
                key={child.id}
                onClick={() => setTimerTarget(child.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  timerTarget === child.id
                    ? 'border-2 text-gray-700'
                    : 'bg-gray-50 text-gray-500 border-2 border-gray-100'
                }`}
                style={timerTarget === child.id ? { borderColor: child.color, backgroundColor: child.color + '20' } : {}}
              >
                <img src={child.photo} alt={child.name} className="w-6 h-6 rounded-full object-cover" />
                {child.name}
              </button>
            ))}
            <button
              onClick={() => setTimerTarget('both')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                timerTarget === 'both'
                  ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                  : 'bg-gray-50 text-gray-500 border-2 border-gray-100'
              }`}
            >
              Les deux
            </button>
          </div>
        </div>

        {/* Launch button */}
        <button
          onClick={handleStartTimer}
          className="w-full py-3 bg-amber-400 text-white rounded-xl font-semibold text-lg active:scale-95 transition-transform"
        >
          ⏳ Lancer le minuteur
        </button>
      </div>
    </div>
  )
}
