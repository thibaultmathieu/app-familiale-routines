import { useState, useRef, useCallback } from 'react'
import { ActiveRoutine, ActiveTimer, RoutineTemplate, Screen, Child } from '../types'
import ProgressBar from './ProgressBar'
import TimerDisplay from './TimerDisplay'
import TimerExpiredOverlay from './TimerExpiredOverlay'
import { useSound } from '../hooks/useSound'
import { useTimerTick } from '../hooks/useTimer'

interface HomeScreenProps {
  children: Child[]
  routineTemplates: RoutineTemplate[]
  activeRoutines: ActiveRoutine[]
  activeTimers: ActiveTimer[]
  setCurrentScreen: (screen: Screen) => void
  launchRoutine: (templateId: string, childIds: string[]) => void
  addRoutine: (template: Omit<import('../types').RoutineTemplate, 'id'>) => string
  setGalleryChildId: (id: string | null) => void
  setGalleryReturnScreen: (screen: Screen | null) => void
  setActiveViewTemplateId: (id: string | null) => void
  setTimerReturnScreen: (screen: Screen | null) => void
  setTimerPrefill: (prefill: { label?: string; childIds?: string[] } | null) => void
  cancelTimer: (timerId: string) => void
}

function TimerExpirationWatcher({ timer, onExpired }: {
  timer: ActiveTimer
  onExpired: (timer: ActiveTimer) => void
}) {
  const { isExpired } = useTimerTick(timer)
  const notifiedRef = useRef(false)
  if (isExpired && !notifiedRef.current) {
    notifiedRef.current = true
    onExpired(timer)
  }
  return null
}

export default function HomeScreen({
  children,
  routineTemplates,
  activeRoutines,
  activeTimers,
  setCurrentScreen,
  launchRoutine,
  addRoutine,
  setGalleryChildId,
  setGalleryReturnScreen,
  setActiveViewTemplateId,
  setTimerReturnScreen,
  setTimerPrefill,
  cancelTimer,
}: HomeScreenProps) {
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customTasks, setCustomTasks] = useState<string[]>([''])
  const [customTarget, setCustomTarget] = useState<'both' | 'evangelina' | 'noah'>('both')
  const [expiredTimer, setExpiredTimer] = useState<ActiveTimer | null>(null)
  const [showGearHint, setShowGearHint] = useState(() => {
    return !localStorage.getItem('gearHintSeen')
  })
  const { playTimerEnd } = useSound()

  // Appui long pour accéder à l'espace parent
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleGearDown = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setCurrentScreen('parent')
    }, 2000)
  }, [setCurrentScreen])
  const handleGearUp = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }, [])

  const today = new Date().getDay()
  const todayRoutines = routineTemplates.filter(r =>
    r.scheduledDays && r.scheduledDays.length > 0 && r.scheduledDays.includes(today)
  )
  const onDemandRoutines = routineTemplates.filter(r =>
    !r.scheduledDays || r.scheduledDays.length === 0
  )

  // Group active routines by templateId
  const activeTemplateIds = [...new Set(activeRoutines.map(ar => ar.templateId))]

  const handleLaunchFixed = (templateId: string) => {
    // If routine already active, just navigate to it
    if (activeTemplateIds.includes(templateId)) {
      setActiveViewTemplateId(templateId)
      setCurrentScreen('routine')
      return
    }
    const childIds = children.map(c => c.id)
    launchRoutine(templateId, childIds)
  }

  const handleLaunchCustom = () => {
    const validTasks = customTasks.filter(t => t.trim())
    if (!customName.trim() || validTasks.length === 0) return

    const templateId = addRoutine({
      name: customName.trim(),
      icon: '📋',
      tasks: validTasks.map((t, i) => ({ id: `t-${Date.now()}-${i}`, label: t.trim(), icon: '📋' })),
    })

    const childIds = customTarget === 'both'
      ? children.map(c => c.id)
      : [customTarget]

    launchRoutine(templateId, childIds)
    setShowCustomForm(false)
    setCustomName('')
    setCustomTasks([''])
  }

  const openGallery = (childId: string) => {
    setGalleryChildId(childId)
    setGalleryReturnScreen('home')
    setCurrentScreen('gallery')
  }

  const handleTimerExpired = useCallback((timer: ActiveTimer) => {
    playTimerEnd()
    setExpiredTimer(timer)
  }, [playTimerEnd])

  const handleDismissExpired = useCallback(() => {
    if (expiredTimer) {
      cancelTimer(expiredTimer.id)
    }
    setExpiredTimer(null)
  }, [expiredTimer, cancelTimer])

  const safeTimers = activeTimers ?? []

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      {/* Timer expiration watchers */}
      {safeTimers.map(timer => (
        <TimerExpirationWatcher
          key={timer.id}
          timer={timer}
          onExpired={handleTimerExpired}
        />
      ))}

      {/* 1. Titre */}
      <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">
        Routines Familiales
      </h1>

      {/* 2. Zone mission/timer active */}
      {safeTimers.length > 0 && (
        <div className="mb-6 max-w-3xl mx-auto w-full">
          {safeTimers.map(timer => {
            const targetNames = timer.childIds
              .map(id => children.find(c => c.id === id)?.name)
              .filter(Boolean)
              .join(' & ')
            const targetChild = children.find(c => timer.childIds.includes(c.id))
            return (
              <div key={timer.id} className="bg-white rounded-2xl p-6 shadow-sm border-2 border-amber-100 flex flex-col items-center mb-3">
                <p className="text-sm font-medium text-amber-600 mb-1">Mission {targetNames}</p>
                <TimerDisplay
                  timer={timer}
                  color={targetChild?.color ?? '#F59E0B'}
                  size="large"
                />
              </div>
            )
          })}
        </div>
      )}

      {/* 3. Boutons routines */}
      <div className="flex flex-col items-center gap-4 max-w-3xl mx-auto w-full">
        {todayRoutines.length > 0 && (
          <div className={`grid ${todayRoutines.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-4 w-full`}>
            {todayRoutines.map(routine => {
              const isActive = activeTemplateIds.includes(routine.id)
              const routinesForThis = activeRoutines.filter(ar => ar.templateId === routine.id)
              const isCompleted = isActive && routinesForThis.every(ar => ar.completedAt != null)
              return (
                <button
                  key={routine.id}
                  onClick={() => handleLaunchFixed(routine.id)}
                  className={`bg-white rounded-2xl p-6 shadow-sm border-2 relative
                             active:scale-95 transition-transform flex flex-col items-center gap-3
                             hover:border-gray-200 ${isCompleted ? 'border-amber-300' : isActive ? 'border-green-300' : 'border-gray-100'}`}
                >
                  {isActive && (
                    <span className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                      isCompleted ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {isCompleted ? 'TERMINÉE' : 'EN COURS'}
                    </span>
                  )}
                  <span className="text-5xl">{routine.icon}</span>
                  <span className="text-xl font-semibold text-gray-700">{routine.name}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* On-demand routines */}
        {onDemandRoutines.length > 0 && (
          <div className="w-full">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">Autres routines</p>
            <div className="grid grid-cols-2 gap-3">
              {onDemandRoutines.map(routine => {
                const isActive = activeTemplateIds.includes(routine.id)
                return (
                  <button
                    key={routine.id}
                    onClick={() => handleLaunchFixed(routine.id)}
                    className={`bg-white rounded-xl p-4 shadow-sm border-2 flex items-center gap-3
                               active:scale-95 transition-transform text-left
                               ${isActive ? 'border-green-300' : 'border-gray-100'}`}
                  >
                    <span className="text-2xl">{routine.icon}</span>
                    <span className="text-base font-medium text-gray-700">{routine.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Bouton minuteur */}
        <button
          onClick={() => {
            setTimerReturnScreen('home')
            setTimerPrefill(null)
            setCurrentScreen('timer')
          }}
          className="bg-amber-50 rounded-2xl px-8 py-4 shadow-sm border-2 border-amber-200
                     active:scale-95 transition-transform text-amber-700 text-lg font-medium
                     hover:border-amber-300 w-full max-w-md"
        >
          ⏳ Minuteur
        </button>

        {/* Bouton routine personnalisée */}
        {!showCustomForm ? (
          <button
            onClick={() => setShowCustomForm(true)}
            className="bg-white rounded-2xl px-8 py-4 shadow-sm border-2 border-dashed border-gray-300
                       active:scale-95 transition-transform text-gray-500 text-lg font-medium
                       hover:border-gray-400 w-full max-w-md"
          >
            ➕ Routine personnalisée
          </button>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100 w-full">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Nouvelle routine</h3>
            <input
              type="text"
              placeholder="Nom de la routine"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg mb-3 focus:outline-none focus:border-blue-300"
            />
            {customTasks.map((task, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder={`Tâche ${i + 1}`}
                  value={task}
                  onChange={e => {
                    const updated = [...customTasks]
                    updated[i] = e.target.value
                    setCustomTasks(updated)
                  }}
                  className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2 text-lg focus:outline-none focus:border-blue-300"
                />
                {customTasks.length > 1 && (
                  <button
                    onClick={() => setCustomTasks(customTasks.filter((_, j) => j !== i))}
                    className="text-gray-400 px-2 text-xl"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setCustomTasks([...customTasks, ''])}
              className="text-blue-500 text-sm font-medium mb-4"
            >
              + Ajouter une tâche
            </button>

            {/* Sélection de la cible */}
            <div className="flex gap-2 mb-4">
              {(['both', 'evangelina', 'noah'] as const).map(target => (
                <button
                  key={target}
                  onClick={() => setCustomTarget(target)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    customTarget === target
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {target === 'both' ? 'Les deux' : target === 'evangelina' ? 'Evangéline' : 'Noah'}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleLaunchCustom}
                className="flex-1 bg-green-400 text-white rounded-xl py-3 text-lg font-medium active:scale-95 transition-transform"
              >
                Lancer
              </button>
              <button
                onClick={() => { setShowCustomForm(false); setCustomName(''); setCustomTasks(['']) }}
                className="px-6 bg-gray-100 text-gray-500 rounded-xl py-3 text-lg font-medium"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Résumé routines en cours — grouped by templateId */}
      {activeTemplateIds.length > 0 && (
        <div className="mt-6 space-y-4 max-w-3xl mx-auto w-full">
          <span className="text-sm font-bold text-green-600 uppercase tracking-wide">Routines</span>
          {activeTemplateIds.map(templateId => {
            const routinesForTemplate = activeRoutines.filter(ar => ar.templateId === templateId)
            const template = routineTemplates.find(r => r.id === templateId)
            if (!template) return null
            const allCompleted = routinesForTemplate.every(ar => ar.completedAt != null)
            return (
              <div key={templateId} className={`bg-white rounded-2xl p-5 shadow-sm border-2 ${allCompleted ? 'border-amber-200' : 'border-green-100'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-bold text-gray-800">
                    {template.icon} {template.name}
                    {allCompleted && <span className="ml-2 text-sm text-amber-600">✓ Terminée</span>}
                  </span>
                  <button
                    onClick={() => {
                      setActiveViewTemplateId(templateId)
                      setCurrentScreen('routine')
                    }}
                    className="text-blue-500 text-sm font-medium"
                  >
                    Voir la routine →
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {children.map(child => {
                    const childRoutine = routinesForTemplate.find(ar => ar.childId === child.id)
                    if (!childRoutine) return null
                    const done = childRoutine.tasks.filter(t => t.done).length
                    const total = childRoutine.tasks.length
                    return (
                      <div key={child.id} className="flex items-center gap-3">
                        <img src={child.photo} alt={child.name} className="w-8 h-8 rounded-full object-cover" />
                        <span className="text-sm font-medium text-gray-700">{child.name}</span>
                        <div className="flex-1">
                          <ProgressBar done={done} total={total} color={child.color} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 5. Collections */}
      <div className="mt-6 max-w-3xl mx-auto w-full">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">Collections</h2>
        <div className="flex gap-4">
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => openGallery(child.id)}
              className="flex-1 flex items-center gap-3 p-4 rounded-2xl active:scale-95 transition-transform"
              style={{ backgroundColor: child.color + '15' }}
            >
              <img src={child.photo} alt={child.name} className="w-12 h-12 rounded-full object-cover border-2" style={{ borderColor: child.color }} />
              <div className="text-left">
                <p className="font-medium text-gray-700">{child.name}</p>
                <p className="text-sm text-gray-400">{child.unlockedImages.length} images</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Spacer to make room for gear button */}
      <div className="h-16" />

      {/* Bouton ⚙️ — appui long */}
      <div className="fixed bottom-4 right-4 flex flex-col items-center gap-1">
        <span className="text-[10px] font-medium text-gray-300 uppercase tracking-wide">Parents</span>
        <span className="text-[8px] text-gray-400/60 -mt-1">appui long</span>
        <button
          onMouseDown={handleGearDown}
          onMouseUp={handleGearUp}
          onMouseLeave={handleGearUp}
          onTouchStart={handleGearDown}
          onTouchEnd={handleGearUp}
          className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xl"
          aria-label="Espace parent"
        >
          ⚙️
        </button>
      </div>

      {/* First-time gear button hint overlay */}
      {showGearHint && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end"
          onClick={() => {
            localStorage.setItem('gearHintSeen', '1')
            setShowGearHint(false)
          }}
        >
          {/* Dark backdrop with a cutout around the gear button */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Tooltip bubble pointing to gear button */}
          <div className="absolute bottom-24 right-2 bg-white rounded-2xl px-5 py-4 shadow-xl max-w-[240px] z-10 animate-bounce">
            <p className="text-sm font-semibold text-gray-800 mb-1">Espace Parents</p>
            <p className="text-xs text-gray-500">
              Maintenez appuyé 2 secondes sur le bouton ⚙️ pour accéder aux réglages.
            </p>
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white rotate-45" />
          </div>

          {/* Highlight ring around gear button area */}
          <div className="relative z-10 mb-4 mr-4 flex flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-gray-300 uppercase tracking-wide">Parents</span>
            <span className="text-[8px] text-gray-400/60 -mt-1">appui long</span>
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xl ring-4 ring-white/80 shadow-lg shadow-white/50">
              ⚙️
            </div>
          </div>
        </div>
      )}

      {/* Timer expired overlay */}
      {expiredTimer && (
        <TimerExpiredOverlay
          timer={expiredTimer}
          children={children}
          onDismiss={handleDismissExpired}
        />
      )}
    </div>
  )
}
