import { useState, useCallback, useEffect, useRef } from 'react'
import { ActiveRoutine, ActiveTimer, Child, RewardImage, RoutineTemplate, Screen } from '../types'
import TaskCard from './TaskCard'
import ProgressBar from './ProgressBar'
import CelebrationOverlay from './CelebrationOverlay'
import TimerDisplay from './TimerDisplay'
import TimerExpiredOverlay from './TimerExpiredOverlay'
import TaskTimerPopup from './TaskTimerPopup'
import ChildAvatar from './ChildAvatar'
import UniverseUnlockOverlay from './UniverseUnlockOverlay'
import { useSound } from '../hooks/useSound'
import { ACTIVE_UNIVERSES } from '../data/universes'
import { ownedUniverseIds, pendingUniverseChoices } from '../data/universeProgress'
import { childTextColor, tint } from '../theme'
import { deName } from '../utils/frenchName'
import { Button, Overlay } from './ui'

interface ActiveRoutineScreenProps {
  children: Child[]
  routineTemplates: RoutineTemplate[]
  activeRoutines: ActiveRoutine[]
  activeTimers: ActiveTimer[]
  activeViewTemplateId: string | null
  setCurrentScreen: (screen: Screen) => void
  setGalleryChildId: (id: string | null) => void
  setGalleryReturnScreen: (screen: Screen | null) => void
  toggleTask: (routineId: string, taskId: string) => void
  unlockReward: (childId: string) => RewardImage | null
  addChildUniverse: (childId: string, universeId: string) => void
  startTimer: (childIds: string[], durationSeconds: number, label?: string) => void
  cancelTimer: (timerId: string) => void
  musicPlay: () => void
}

export default function ActiveRoutineScreen({
  children,
  routineTemplates,
  activeRoutines,
  activeTimers,
  activeViewTemplateId,
  setCurrentScreen,
  setGalleryChildId,
  setGalleryReturnScreen,
  toggleTask,
  unlockReward,
  addChildUniverse,
  startTimer,
  cancelTimer,
  musicPlay,
}: ActiveRoutineScreenProps) {
  const [celebration, setCelebration] = useState<{ childId: string; childName: string; reward: RewardImage | null } | null>(null)
  const [universePickChildId, setUniversePickChildId] = useState<string | null>(null)
  const [expiredTimer, setExpiredTimer] = useState<ActiveTimer | null>(null)
  const [taskTimerPopup, setTaskTimerPopup] = useState<{ label: string; childId: string } | null>(null)
  const [showEndOfDay, setShowEndOfDay] = useState(false)
  const { playTaskComplete, playRoutineComplete, playTimerEnd } = useSound()
  const musicTriggered = useRef(false)

  // Determine which template to view
  const activeTemplateIds = [...new Set(activeRoutines.map(ar => ar.templateId))]
  const viewTemplateId = activeViewTemplateId && activeTemplateIds.includes(activeViewTemplateId)
    ? activeViewTemplateId
    : activeTemplateIds[0] ?? null

  const viewRoutines = activeRoutines.filter(ar => ar.templateId === viewTemplateId)
  const template = viewTemplateId
    ? routineTemplates.find(r => r.id === viewTemplateId)
    : null

  // Reset music trigger when all evening routines are cleared
  useEffect(() => {
    const hasEvening = activeRoutines.some(ar => ar.templateId === 'evening')
    if (!hasEvening) {
      musicTriggered.current = false
    }
  }, [activeRoutines])

  const handleToggle = useCallback((routineId: string, taskId: string, childId: string) => {
    toggleTask(routineId, taskId)

    // Auto-cancel timers linked to this task
    const routine = activeRoutines.find(ar => ar.id === routineId)
    const taskTemplate = routine ? routineTemplates.find(r => r.id === routine.templateId)?.tasks.find(t => t.id === taskId) : null
    if (taskTemplate) {
      const matchingTimers = (activeTimers ?? []).filter(
        t => t.label === taskTemplate.label && t.childIds.includes(childId)
      )
      matchingTimers.forEach(t => cancelTimer(t.id))
    }
    if (!routine) return

    const remainingAfterToggle = routine.tasks.filter(t => !t.done && t.taskId !== taskId).length
    if (remainingAfterToggle === 0) {
      // This child's routine is now complete
      playRoutineComplete()
      const child = children.find(c => c.id === childId)
      if (child) {
        const reward = unlockReward(childId)
        setCelebration({ childId, childName: child.name, reward })
      }

      // If this was the evening routine, check if all other children already finished too
      // Call musicPlay() directly here (within the user gesture) to satisfy mobile autoplay policy
      if (routine.templateId === 'evening' && !musicTriggered.current) {
        const otherEveningDone = activeRoutines
          .filter(ar => ar.templateId === 'evening' && ar.childId !== childId)
          .every(ar => ar.completedAt != null)
        if (otherEveningDone) {
          musicTriggered.current = true
          musicPlay()
          setShowEndOfDay(true)
        }
      }
    } else {
      playTaskComplete()
    }
  }, [activeRoutines, activeTimers, routineTemplates, children, toggleTask, unlockReward, cancelTimer, playTaskComplete, playRoutineComplete, musicPlay])

  const openGallery = useCallback((childId: string) => {
    setGalleryChildId(childId)
    setGalleryReturnScreen('routine')
    setCurrentScreen('gallery')
  }, [setGalleryChildId, setGalleryReturnScreen, setCurrentScreen])

  // L'overlay d'expiration n'est rendu que hors célébration (voir le JSX),
  // mais l'événement est mémorisé quand même : un minuteur qui expire pendant
  // la célébration (désormais longue) s'affiche dès sa fermeture au lieu
  // d'être avalé (TimerDisplay ne notifie qu'une seule fois).
  const handleTimerExpired = useCallback((timerId: string) => {
    const timer = (activeTimers ?? []).find(t => t.id === timerId)
    if (timer) {
      playTimerEnd()
      setExpiredTimer(timer)
    }
  }, [activeTimers, playTimerEnd])

  const handleDismissExpired = useCallback(() => {
    if (expiredTimer) {
      cancelTimer(expiredTimer.id)
    }
    setExpiredTimer(null)
  }, [expiredTimer, cancelTimer])

  if (activeRoutines.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <p className="text-xl text-ink-faint mb-4">Aucune routine en cours</p>
        <button
          onClick={() => setCurrentScreen('home')}
          className="min-h-12 px-6 py-3 bg-warm-100 text-ink-soft rounded-full text-lg font-display font-medium active:scale-95 transition-transform"
        >
          ← Accueil
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setCurrentScreen('home')}
          className="min-h-12 text-ink-faint text-lg font-display font-medium px-4 py-2 active:scale-95 transition-transform rounded-2xl"
        >
          ← Accueil
        </button>
        <h1 className="text-2xl font-display font-semibold text-ink">
          {template ? `${template.icon} ${template.name}` : 'Routine en cours'}
        </h1>
        <div className="w-12" />
      </div>

      {/* Split-screen : N colonnes */}
      <div className={`flex-1 grid gap-4 overflow-hidden`} style={{ gridTemplateColumns: `repeat(${children.length}, 1fr)` }}>
        {children.map(child => {
          const childRoutine = viewRoutines.find(ar => ar.childId === child.id)
          if (!childRoutine) return (
            <div key={child.id} className="flex items-center justify-center text-ink-faint/50">
              Pas de routine
            </div>
          )

          const done = childRoutine.tasks.filter(t => t.done).length
          const total = childRoutine.tasks.length
          const allDone = done === total

          // Find timers for this child
          const childTimers = (activeTimers ?? []).filter(t => t.childIds.includes(child.id))

          return (
            <div
              key={child.id}
              className="flex flex-col rounded-3xl p-4"
              style={{ backgroundColor: tint(child.color, 0.07) }}
            >
              {/* Profil enfant + progression */}
              <div className="flex items-center gap-3 mb-3">
                <div className="border-[3px] rounded-full bg-white" style={{ borderColor: child.color }}>
                  <ChildAvatar photo={child.photo} color={child.color} size={56} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2
                      className="text-xl font-display font-bold"
                      style={{ color: childTextColor(child.color) }}
                    >
                      {child.name}
                    </h2>
                    <button
                      onClick={() => openGallery(child.id)}
                      className="w-11 h-11 flex items-center justify-center text-lg opacity-60 active:scale-90 transition-transform"
                      aria-label={`Voir la collection ${deName(child.name)}`}
                    >
                      📸
                    </button>
                  </div>
                  <ProgressBar done={done} total={total} color={child.color} />
                </div>
                {allDone && (
                  <span className="text-3xl" role="img" aria-label="Routine terminée">🎉</span>
                )}
              </div>

              {/* Timers — visible between header and tasks */}
              {childTimers.length > 0 && (
                <div className="flex justify-center gap-4 mb-3 py-2 bg-honey-50 border border-honey-100 rounded-2xl">
                  {childTimers.map(timer => (
                    <TimerDisplay
                      key={timer.id}
                      timer={timer}
                      color={child.color}
                      size="medium"
                      onExpired={() => handleTimerExpired(timer.id)}
                    />
                  ))}
                </div>
              )}

              {/* Liste des tâches */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {childRoutine.tasks.map(task => {
                  const taskTemplate = template?.tasks.find(t => t.id === task.taskId)
                  if (!taskTemplate) return null
                  const hasActiveTimer = (activeTimers ?? []).some(
                    t => t.label === taskTemplate.label && t.childIds.includes(child.id)
                  )
                  return (
                    <TaskCard
                      key={task.taskId}
                      icon={taskTemplate.icon}
                      label={taskTemplate.label}
                      done={task.done}
                      color={child.color}
                      onToggle={() => handleToggle(childRoutine.id, task.taskId, child.id)}
                      onTimerPress={hasActiveTimer ? undefined : () => setTaskTimerPopup({ label: taskTemplate.label, childId: child.id })}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Overlay fin de journée */}
      {showEndOfDay && !celebration && (
        <Overlay dim="strong" onBackdropClick={() => setShowEndOfDay(false)} cardClassName="p-10 max-w-md w-full">
          <div className="text-7xl mb-4" role="img" aria-label="Bonne nuit">🌙✨</div>
          <h2 className="text-3xl font-display font-semibold text-ink mb-3">Bravo à tous !</h2>
          <p className="text-xl text-ink-soft mb-6">
            Toutes les routines sont terminées.<br />Bonne nuit !
          </p>
          <Button variant="night" size="lg" className="px-8 rounded-full" onClick={() => setShowEndOfDay(false)}>
            Bonne nuit 🌙
          </Button>
        </Overlay>
      )}

      {/* Overlay de célébration — à la fermeture, propose le choix d'un
          nouvel univers si la progression vient d'en débloquer un */}
      {celebration && (
        <CelebrationOverlay
          childName={celebration.childName}
          reward={celebration.reward}
          onClose={() => {
            const childId = celebration.childId
            setCelebration(null)
            const childIndex = children.findIndex(c => c.id === childId)
            const child = childIndex >= 0 ? children[childIndex] : undefined
            if (child && pendingUniverseChoices(child, childIndex, ACTIVE_UNIVERSES.length) > 0) {
              setUniversePickChildId(childId)
            }
          }}
        />
      )}

      {/* Choix du nouvel univers débloqué */}
      {universePickChildId && !celebration && (() => {
        const childIndex = children.findIndex(c => c.id === universePickChildId)
        const child = childIndex >= 0 ? children[childIndex] : undefined
        if (!child) return null
        return (
          <UniverseUnlockOverlay
            child={child}
            ownedIds={ownedUniverseIds(child, childIndex)}
            onPick={universeId => {
              addChildUniverse(child.id, universeId)
              setUniversePickChildId(null)
            }}
            onLater={() => setUniversePickChildId(null)}
          />
        )
      })()}

      {/* Timer expired overlay */}
      {expiredTimer && !celebration && (
        <TimerExpiredOverlay
          timer={expiredTimer}
          children={children}
          onDismiss={handleDismissExpired}
        />
      )}

      {/* Task timer popup */}
      {taskTimerPopup && (
        <TaskTimerPopup
          label={taskTimerPopup.label}
          childId={taskTimerPopup.childId}
          onStart={startTimer}
          onClose={() => setTaskTimerPopup(null)}
        />
      )}
    </div>
  )
}
