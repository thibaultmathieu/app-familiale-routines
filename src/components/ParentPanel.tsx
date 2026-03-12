import { useState } from 'react'
import { ActiveRoutine, ActiveTimer, Child, RoutineTemplate, Screen } from '../types'
import ProgressBar from './ProgressBar'
import TimerDisplay from './TimerDisplay'
import { useSound } from '../hooks/useSound'
import { getRewardImagesForChild } from '../data/rewardImages'

interface ParentPanelProps {
  children: Child[]
  routineTemplates: RoutineTemplate[]
  activeRoutines: ActiveRoutine[]
  activeTimers: ActiveTimer[]
  setCurrentScreen: (screen: Screen) => void
  resetRoutine: (templateId: string) => void
  resetAllRoutines: () => void
  removeReward: (childId: string, imageId: string) => void
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
  resetRoutine,
  resetAllRoutines,
  removeReward,
  startTimer,
  cancelTimer,
}: ParentPanelProps) {
  const [timerDuration, setTimerDuration] = useState(5 * 60)
  const [timerTarget, setTimerTarget] = useState<'both' | string>('both')
  const [timerLabel, setTimerLabel] = useState(MISSION_PRESETS[0])
  const [showCustomLabel, setShowCustomLabel] = useState(false)
  const [customLabelText, setCustomLabelText] = useState('')
  const [sanctionChildId, setSanctionChildId] = useState<string | null>(null)
  const { playTimerEnd } = useSound()

  const hasActiveRoutine = activeRoutines.length > 0
  const activeTemplateIds = [...new Set(activeRoutines.map(ar => ar.templateId))]

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

  const handleNewDay = () => {
    if (window.confirm('Réinitialiser toutes les routines ? (Nouvelle journée)')) {
      resetAllRoutines()
    }
  }

  const handleRemoveReward = (childId: string, imageId: string) => {
    if (window.confirm('Retirer cette image comme sanction ?')) {
      removeReward(childId, imageId)
    }
  }

  const sanctionChild = sanctionChildId ? children.find(c => c.id === sanctionChildId) : null
  const sanctionImages = sanctionChildId
    ? (() => {
        const allImages = getRewardImagesForChild(sanctionChildId)
        const child = children.find(c => c.id === sanctionChildId)
        if (!child) return []
        return allImages.filter(img => child.unlockedImages.includes(img.id))
      })()
    : []

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

      {/* Routines en cours — grouped by template */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100 mb-6">
        <h2 className="text-lg font-semibold text-gray-500 mb-4">ROUTINES EN COURS</h2>
        {hasActiveRoutine ? (
          <>
            {activeTemplateIds.map(templateId => {
              const template = routineTemplates.find(r => r.id === templateId)
              if (!template) return null
              const routinesForTemplate = activeRoutines.filter(ar => ar.templateId === templateId)
              return (
                <div key={templateId} className="mb-5 last:mb-0">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-lg font-bold text-gray-800">
                      {template.icon} {template.name}
                    </p>
                    <button
                      onClick={() => resetRoutine(templateId)}
                      className="text-sm text-orange-500 font-medium px-3 py-1 rounded-lg bg-orange-50 active:scale-95 transition-transform"
                    >
                      Réinitialiser
                    </button>
                  </div>
                  {children.map(child => {
                    const childRoutine = routinesForTemplate.find(ar => ar.childId === child.id)
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
                      </div>
                    )
                  })}
                </div>
              )
            })}
            <div className="mt-4">
              <button
                onClick={handleNewDay}
                className="w-full py-3 bg-amber-50 text-amber-600 rounded-xl font-medium active:scale-95 transition-transform"
              >
                Nouvelle journée
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-400">Aucune routine en cours</p>
        )}
      </div>

      {/* Minuteur */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100 mb-6">
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

      {/* Sanctions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100 mb-6">
        <h2 className="text-lg font-semibold text-gray-500 mb-4">SANCTIONS</h2>
        <p className="text-sm text-gray-400 mb-3">Retirer une image de la collection</p>

        {/* Child selection */}
        <div className="flex gap-3 mb-4">
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => setSanctionChildId(child.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                sanctionChildId === child.id
                  ? 'border-2 text-gray-700'
                  : 'bg-gray-50 text-gray-500 border-2 border-gray-100'
              }`}
              style={sanctionChildId === child.id ? { borderColor: child.color, backgroundColor: child.color + '20' } : {}}
            >
              <img src={child.photo} alt={child.name} className="w-8 h-8 rounded-full object-cover" />
              {child.name}
            </button>
          ))}
        </div>

        {/* Images grid */}
        {sanctionChild && (
          sanctionImages.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {sanctionImages.map(img => (
                <button
                  key={img.id}
                  onClick={() => handleRemoveReward(sanctionChildId!, img.id)}
                  className="aspect-square rounded-lg overflow-hidden border-2 border-gray-100 hover:border-red-300 active:scale-95 transition-all"
                >
                  <img src={img.src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Aucune image à retirer</p>
          )
        )}
      </div>
    </div>
  )
}
