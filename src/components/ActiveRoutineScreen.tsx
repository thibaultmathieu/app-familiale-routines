import { useState, useCallback, useEffect, useRef } from 'react'
import { ActiveRoutine, ActiveTimer, Child, RewardImage, RoutineTemplate, Screen } from '../types'
import TaskCard from './TaskCard'
import ProgressBar from './ProgressBar'
import CelebrationOverlay from './CelebrationOverlay'
import TimerDisplay from './TimerDisplay'
import TimerExpiredOverlay from './TimerExpiredOverlay'
import { useSound } from '../hooks/useSound'
import { useMusic } from '../hooks/useMusic'

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
  cancelTimer: (timerId: string) => void
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
  cancelTimer,
}: ActiveRoutineScreenProps) {
  const [celebration, setCelebration] = useState<{ childName: string; reward: RewardImage | null } | null>(null)
  const [expiredTimer, setExpiredTimer] = useState<ActiveTimer | null>(null)
  const { playTaskComplete, playRoutineComplete, playTimerEnd } = useSound()
  const music = useMusic()
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

  // Check if both children completed evening routine → play music
  useEffect(() => {
    if (musicTriggered.current) return

    const eveningRoutines = activeRoutines.filter(ar => ar.templateId === 'evening')
    if (eveningRoutines.length === 0) return

    const allCompleted = children.every(child => {
      const routine = eveningRoutines.find(ar => ar.childId === child.id)
      return routine?.completedAt != null
    })

    if (allCompleted && children.length >= 2) {
      musicTriggered.current = true
      music.play()
    }
  }, [activeRoutines, children, music])

  // Reset music trigger when no evening routines
  useEffect(() => {
    const hasEvening = activeRoutines.some(ar => ar.templateId === 'evening')
    if (!hasEvening) {
      musicTriggered.current = false
    }
  }, [activeRoutines])

  const handleToggle = useCallback((routineId: string, taskId: string, childId: string) => {
    toggleTask(routineId, taskId)

    const routine = activeRoutines.find(ar => ar.id === routineId)
    if (!routine) return

    const remainingAfterToggle = routine.tasks.filter(t => !t.done && t.taskId !== taskId).length
    if (remainingAfterToggle === 0) {
      // Routine complete
      playRoutineComplete()
      const child = children.find(c => c.id === childId)
      if (child) {
        const reward = unlockReward(childId)
        setCelebration({ childName: child.name, reward })
      }
    } else {
      playTaskComplete()
    }
  }, [activeRoutines, children, toggleTask, unlockReward, playTaskComplete, playRoutineComplete])

  const openGallery = useCallback((childId: string) => {
    setGalleryChildId(childId)
    setGalleryReturnScreen('routine')
    setCurrentScreen('gallery')
  }, [setGalleryChildId, setGalleryReturnScreen, setCurrentScreen])

  const handleTimerExpired = useCallback((timerId: string) => {
    // Only show overlay if no celebration is showing
    if (celebration) return
    const timer = (activeTimers ?? []).find(t => t.id === timerId)
    if (timer) {
      playTimerEnd()
      setExpiredTimer(timer)
    }
  }, [activeTimers, celebration, playTimerEnd])

  const handleDismissExpired = useCallback(() => {
    if (expiredTimer) {
      cancelTimer(expiredTimer.id)
    }
    setExpiredTimer(null)
  }, [expiredTimer, cancelTimer])

  if (activeRoutines.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <p className="text-xl text-gray-400 mb-4">Aucune routine en cours</p>
        <button
          onClick={() => setCurrentScreen('home')}
          className="px-6 py-3 bg-blue-100 text-blue-600 rounded-full text-lg font-medium"
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
          className="text-gray-400 text-lg font-medium px-4 py-2"
        >
          ← Accueil
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {template ? `${template.icon} ${template.name}` : 'Routine en cours'}
        </h1>
        <div className="flex items-center gap-2">
          {music.isPlaying && (
            <button
              onClick={music.stop}
              className="text-sm text-gray-400 px-3 py-1 rounded-lg bg-gray-100 active:scale-95 transition-transform"
            >
              🔇 Stop musique
            </button>
          )}
          <div className="w-12" />
        </div>
      </div>

      {/* Split-screen : 2 colonnes */}
      <div className="flex-1 grid grid-cols-2 gap-6 overflow-hidden">
        {children.map(child => {
          const childRoutine = viewRoutines.find(ar => ar.childId === child.id)
          if (!childRoutine) return (
            <div key={child.id} className="flex items-center justify-center text-gray-300">
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
              className={`flex flex-col rounded-2xl p-4 ${
                child.id === 'evangelina' ? 'border-r border-gray-200' : ''
              }`}
            >
              {/* Profil enfant + progression */}
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={child.photo}
                  alt={child.name}
                  className="w-14 h-14 rounded-full object-cover border-3"
                  style={{ borderColor: child.color }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2
                      className="text-xl font-bold"
                      style={{ color: child.color }}
                    >
                      {child.name}
                    </h2>
                    <button
                      onClick={() => openGallery(child.id)}
                      className="text-lg opacity-50 active:scale-90 transition-transform"
                      title="Voir ma collection"
                    >
                      📸
                    </button>
                  </div>
                  <ProgressBar done={done} total={total} color={child.color} />
                </div>
                {allDone && (
                  <span className="text-3xl">🎉</span>
                )}
              </div>

              {/* Timers — visible between header and tasks */}
              {childTimers.length > 0 && (
                <div className="flex justify-center gap-4 mb-3 py-2 bg-amber-50 rounded-xl">
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
                  return (
                    <TaskCard
                      key={task.taskId}
                      icon={taskTemplate.icon}
                      label={taskTemplate.label}
                      done={task.done}
                      color={child.color}
                      onToggle={() => handleToggle(childRoutine.id, task.taskId, child.id)}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Overlay de célébration */}
      {celebration && (
        <CelebrationOverlay
          childName={celebration.childName}
          reward={celebration.reward}
          onClose={() => setCelebration(null)}
        />
      )}

      {/* Timer expired overlay */}
      {expiredTimer && !celebration && (
        <TimerExpiredOverlay
          timer={expiredTimer}
          children={children}
          onDismiss={handleDismissExpired}
        />
      )}
    </div>
  )
}
