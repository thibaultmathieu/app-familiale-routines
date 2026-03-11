import { useState } from 'react'
import { ActiveRoutine, ActiveTimer, Child, RoutineTemplate, Screen } from '../types'
import ProgressBar from './ProgressBar'
import TimerDisplay from './TimerDisplay'
import { useSound } from '../hooks/useSound'

interface ParentPanelProps {
  children: Child[]
  routineTemplates: RoutineTemplate[]
  activeRoutines: ActiveRoutine[]
  activeTimers: ActiveTimer[]
  setCurrentScreen: (screen: Screen) => void
  setGalleryChildId: (id: string | null) => void
  setGalleryReturnScreen: (screen: Screen | null) => void
  resetChildRoutine: (childId: string) => void
  stopRoutines: () => void
  startTimer: (childIds: string[], durationSeconds: number, label?: string) => void
  cancelTimer: (timerId: string) => void
}

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

export default function ParentPanel({
  children,
  routineTemplates,
  activeRoutines,
  activeTimers,
  setCurrentScreen,
  resetChildRoutine,
  stopRoutines,
  startTimer,
  cancelTimer,
}: ParentPanelProps) {
  const [timerDuration, setTimerDuration] = useState(5 * 60)
  const [timerTarget, setTimerTarget] = useState<'both' | string>('both')
  const [timerLabel, setTimerLabel] = useState(MISSION_PRESETS[0])
  const [showCustomLabel, setShowCustomLabel] = useState(false)
  const [customLabelText, setCustomLabelText] = useState('')
  const { playTimerEnd } = useSound()

  const hasActiveRoutine = activeRoutines.length > 0
  const firstRoutine = activeRoutines[0]
  const template = firstRoutine
    ? routineTemplates.find(r => r.id === firstRoutine.templateId)
    : null

  const handleStartTimer = () => {
    const childIds = timerTarget === 'both'
      ? children.map(c => c.id)
      : [timerTarget]
    const label = showCustomLabel ? customLabelText.trim() || 'Minuteur' : timerLabel
    startTimer(childIds, timerDuration, label)
  }

  const handleSelectPreset = (preset: string) => {
    setShowCustomLabel(false)
    setTimerLabel(preset)
  }

  const handleSelectCustom = () => {
    setShowCustomLabel(true)
  }

  return (
    <div className="h-full flex flex-col p-6 max-w-2xl mx-auto overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => setCurrentScreen('home')}
          className="text-gray-400 text-lg font-medium px-4 py-2"
        >
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Espace Parent</h1>
        <div className="w-24" />
      </div>

      {/* Routine en cours */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100 mb-6">
        <h2 className="text-lg font-semibold text-gray-500 mb-4">ROUTINE EN COURS</h2>
        {hasActiveRoutine && template ? (
          <>
            <p className="text-xl font-bold text-gray-800 mb-4">
              {template.icon} {template.name}
            </p>
            {children.map(child => {
              const childRoutine = activeRoutines.find(ar => ar.childId === child.id)
              if (!childRoutine) return null
              const done = childRoutine.tasks.filter(t => t.done).length
              const total = childRoutine.tasks.length
              return (
                <div key={child.id} className="flex items-center gap-4 mb-3">
                  <img src={child.photo} alt={child.name} className="w-10 h-10 rounded-full object-cover" />
                  <span className="font-medium text-gray-700 w-28">{child.name}</span>
                  <div className="flex-1">
                    <ProgressBar done={done} total={total} color={child.color} />
                  </div>
                  <button
                    onClick={() => resetChildRoutine(child.id)}
                    className="text-sm text-orange-500 font-medium px-3 py-1 rounded-lg bg-orange-50 active:scale-95 transition-transform"
                  >
                    Réinitialiser
                  </button>
                </div>
              )
            })}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setCurrentScreen('routine')}
                className="flex-1 py-3 bg-blue-50 text-blue-500 rounded-xl font-medium active:scale-95 transition-transform"
              >
                Voir la routine →
              </button>
              <button
                onClick={stopRoutines}
                className="flex-1 py-3 bg-red-50 text-red-500 rounded-xl font-medium active:scale-95 transition-transform"
              >
                Arrêter la routine
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-400">Aucune routine en cours</p>
        )}
      </div>

      {/* Minuteur */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100">
        <h2 className="text-lg font-semibold text-gray-500 mb-4">MINUTEUR</h2>

        {/* Active timers */}
        {(activeTimers ?? []).length > 0 && (
          <div className="mb-4 space-y-3">
            {(activeTimers ?? []).map(timer => {
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
        <div className="space-y-3">
          {/* Mission */}
          <div>
            <p className="text-sm text-gray-400 mb-2">Mission</p>
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
                onClick={handleSelectCustom}
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
            <p className="text-sm text-gray-400 mb-2">Durée</p>
            <div className="flex gap-2">
              {TIMER_DURATIONS.map(d => (
                <button
                  key={d.seconds}
                  onClick={() => setTimerDuration(d.seconds)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    timerDuration === d.seconds
                      ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                      : 'bg-gray-50 text-gray-500 border-2 border-gray-100'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target */}
          <div>
            <p className="text-sm text-gray-400 mb-2">Pour</p>
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
          <button
            onClick={handleStartTimer}
            className="w-full py-3 bg-amber-50 text-amber-600 rounded-xl font-medium active:scale-95 transition-transform mt-2"
          >
            ⏳ Lancer le minuteur
          </button>
        </div>
      </div>
    </div>
  )
}
