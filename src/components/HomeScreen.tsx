import { useState, useRef, useCallback } from 'react'
import { ActiveRoutine, ActiveTimer, RoutineTemplate, Screen, Child } from '../types'
import ChildAvatar from './ChildAvatar'
import ChildTargetPicker from './ChildTargetPicker'
import ProgressBar from './ProgressBar'
import TimerDisplay from './TimerDisplay'
import TimerExpiredOverlay from './TimerExpiredOverlay'
import ParentGate from './ParentGate'
import UniverseUnlockOverlay from './UniverseUnlockOverlay'
import { useSound } from '../hooks/useSound'
import { useTimerTick } from '../hooks/useTimer'
import { ACTIVE_UNIVERSES } from '../data/universes'
import { localDayKey, ownedUniverseIds, pendingUniverseChoices, scheduledTemplatesForDay } from '../data/universeProgress'
import { tint } from '../theme'
import { Badge, Button, Card, TextInput } from './ui'

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
  addChildUniverse: (childId: string, universeId: string) => void
  parentPin?: string
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
  addChildUniverse,
  parentPin,
}: HomeScreenProps) {
  const [showMissionForm, setShowMissionForm] = useState(false)
  const [missionLabel, setMissionLabel] = useState('')
  const [missionTarget, setMissionTarget] = useState<string[] | undefined>(undefined)
  const [expiredTimer, setExpiredTimer] = useState<ActiveTimer | null>(null)
  const [showGearHint, setShowGearHint] = useState(() => {
    return !localStorage.getItem('gearHintSeen')
  })
  const [showParentGate, setShowParentGate] = useState(false)
  const [universePickChildId, setUniversePickChildId] = useState<string | null>(null)
  const { playTimerEnd } = useSound()

  // Verrou parental unifié : appui long 2 s sur une action « parents », + code si
  // configuré. Sert la roue crantée ET la création de tâches à récompense
  // (mission express, routine perso) — les enfants ne peuvent pas en créer.
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingAction = useRef<(() => void) | null>(null)

  const startLongPress = useCallback((action: () => void) => {
    longPressTimer.current = setTimeout(() => {
      if (parentPin) {
        pendingAction.current = action
        setShowParentGate(true)
      } else {
        action()
      }
    }, 2000)
  }, [parentPin])

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }, [])

  const todayRoutines = scheduledTemplatesForDay(routineTemplates)
  const onDemandRoutines = routineTemplates.filter(r =>
    !r.scheduledDays || r.scheduledDays.length === 0
  )

  // Group active routines by templateId
  const activeTemplateIds = [...new Set(activeRoutines.map(ar => ar.templateId))]

  // Message « nouvelle journée » : n'apparaît que si TOUTES les routines
  // programmées du jour ont été lancées aujourd'hui ET terminées. Ferme les
  // faux positifs qui donnaient l'impression d'un message « collé » :
  //  - après la seule routine du matin (l'après-midi / le soir restaient à faire) ;
  //  - sur une simple mission express éphémère terminée (hors `todayRoutines`) ;
  //  - avec des routines de la veille restées à l'écran un nouveau jour.
  const todayKey = localDayKey()
  const startedToday = (ar: ActiveRoutine) => localDayKey(new Date(ar.startedAt)) === todayKey
  const scheduledInstancesToday = activeRoutines.filter(
    ar => startedToday(ar) && todayRoutines.some(t => t.id === ar.templateId)
  )
  const allRoutinesDone =
    todayRoutines.length > 0 &&
    todayRoutines.every(t => scheduledInstancesToday.some(ar => ar.templateId === t.id)) &&
    scheduledInstancesToday.length > 0 &&
    scheduledInstancesToday.every(ar => ar.completedAt != null)

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

  // Mission express : tâche ponctuelle hors routine qui débloque une image.
  // Créée derrière le verrou parental (anti-triche), purgée à la nouvelle journée.
  const handleLaunchMission = () => {
    const label = missionLabel.trim()
    if (!label) return
    const templateId = addRoutine({
      name: label,
      icon: '🎯',
      ephemeral: true,
      tasks: [{ id: `mission-${Date.now()}`, label, icon: '🎯' }],
    })
    const childIds = missionTarget && missionTarget.length > 0 ? missionTarget : children.map(c => c.id)
    launchRoutine(templateId, childIds)
    setShowMissionForm(false)
    setMissionLabel('')
    setMissionTarget(undefined)
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
    <div className="h-full flex flex-col p-6 overflow-y-auto scroll-touch">
      {/* Timer expiration watchers */}
      {safeTimers.map(timer => (
        <TimerExpirationWatcher
          key={timer.id}
          timer={timer}
          onExpired={handleTimerExpired}
        />
      ))}

      {/* 1. Titre */}
      <h1 className="text-3xl font-display font-semibold text-ink text-center mb-6">
        Routines Familiales
      </h1>

      {/* Message « nouvelle journée » — quand tout est terminé */}
      {allRoutinesDone && (
        <div className="mb-6 max-w-3xl mx-auto w-full">
          <Card className="p-5 !border-2 !border-honey-200 text-center">
            <p className="text-3xl mb-1" aria-hidden="true">🎉</p>
            <p className="font-display font-semibold text-ink mb-1">
              Toutes les routines du jour sont terminées, bravo !
            </p>
            <p className="text-sm text-ink-soft">
              Pour démarrer une nouvelle journée, un parent garde le doigt <strong>2 secondes</strong> sur le bouton ⚙️ (en bas à droite).
            </p>
          </Card>
        </div>
      )}

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
              <Card key={timer.id} className="p-6 !border-2 !border-honey-200 flex flex-col items-center mb-3">
                <p className="text-sm font-display font-semibold text-honey-600 mb-1">Mission {targetNames}</p>
                <TimerDisplay
                  timer={timer}
                  color={targetChild?.color ?? '#D98E20'}
                  size="large"
                />
              </Card>
            )
          })}
        </div>
      )}

      {/* 3. Boutons routines */}
      <div className="flex flex-col items-center gap-4 max-w-3xl mx-auto w-full">
        {todayRoutines.length > 0 && (
          <div className={`grid ${todayRoutines.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-4 w-full`}>
            {todayRoutines.map(routine => {
              const routinesForThis = activeRoutines.filter(ar => ar.templateId === routine.id)
              const hasProgress = routinesForThis.some(ar => ar.tasks.some(t => t.done))
              const isCompleted = routinesForThis.length > 0 && routinesForThis.every(ar => ar.completedAt != null)
              return (
                <button
                  key={routine.id}
                  onClick={() => handleLaunchFixed(routine.id)}
                  className={`bg-white rounded-3xl p-6 shadow-card border-2 relative
                             active:scale-95 transition-transform flex flex-col items-center gap-3
                             ${isCompleted ? 'border-honey-300' : hasProgress ? 'border-success-300' : 'border-line hover:border-line-strong'}`}
                >
                  {(hasProgress || isCompleted) && (
                    <Badge tone={isCompleted ? 'honey' : 'success'} className="absolute top-3 right-3">
                      {isCompleted ? 'Terminée' : 'En cours'}
                    </Badge>
                  )}
                  <span className="text-5xl" aria-hidden="true">{routine.icon}</span>
                  <span className="text-xl font-display font-semibold text-ink">{routine.name}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* On-demand routines */}
        {onDemandRoutines.length > 0 && (
          <div className="w-full">
            <p className="text-sm font-bold text-ink-faint uppercase tracking-wide mb-2">Autres routines</p>
            <div className="grid grid-cols-2 gap-3">
              {onDemandRoutines.map(routine => {
                const hasProgress = activeRoutines
                  .filter(ar => ar.templateId === routine.id)
                  .some(ar => ar.tasks.some(t => t.done))
                return (
                  <button
                    key={routine.id}
                    onClick={() => handleLaunchFixed(routine.id)}
                    className={`bg-white rounded-2xl p-4 shadow-card border-2 flex items-center gap-3
                               active:scale-95 transition-transform text-left
                               ${hasProgress ? 'border-success-300' : 'border-line'}`}
                  >
                    <span className="text-2xl" aria-hidden="true">{routine.icon}</span>
                    <span className="text-base font-semibold text-ink">{routine.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Bouton minuteur — accessible à tous (ne débloque pas d'image) */}
        <Button
          variant="honey-soft"
          size="lg"
          className="w-full max-w-md border-2 border-honey-200"
          onClick={() => {
            setTimerReturnScreen('home')
            setTimerPrefill(null)
            setCurrentScreen('timer')
          }}
        >
          ⏳ Minuteur
        </Button>

        {/* Actions parents — création de tâches à récompense (appui long) */}
        {!showMissionForm && (
          <div className="w-full max-w-md">
            <p className="text-center text-[11px] font-bold text-ink-faint/70 uppercase tracking-wide mb-2">
              Réservé aux parents · appui long
            </p>
            <div className="flex flex-col gap-3">
              <Button
                variant="honey-soft"
                size="lg"
                className="w-full border-2 border-honey-200"
                onPressStart={() => startLongPress(() => setShowMissionForm(true))}
                onPressEnd={cancelLongPress}
              >
                🎯 Mission express
              </Button>
            </div>
          </div>
        )}

        {/* Formulaire mission express */}
        {showMissionForm && (
          <Card className="p-6 w-full">
            <h3 className="text-lg font-display font-semibold text-ink mb-1">🎯 Mission express</h3>
            <p className="text-sm text-ink-faint mb-4">
              Une tâche ponctuelle qui débloque une image. À réserver aux exceptions (les images se gagnent normalement avec les routines).
            </p>
            <TextInput value={missionLabel} onChange={setMissionLabel} placeholder="Ex : débarrasser la table" className="mb-4" />

            {children.length >= 2 && (
              <>
                <p className="text-xs font-bold text-ink-faint uppercase tracking-wide mb-2">Pour qui ?</p>
                <div className="mb-4">
                  <ChildTargetPicker children={children} value={missionTarget} onChange={setMissionTarget} />
                </div>
              </>
            )}

            <div className="flex gap-3">
              <Button variant="primary" size="lg" className="flex-1" onClick={handleLaunchMission}>
                Lancer la mission
              </Button>
              <Button
                variant="soft"
                size="lg"
                onClick={() => { setShowMissionForm(false); setMissionLabel(''); setMissionTarget(undefined) }}
              >
                Annuler
              </Button>
            </div>
          </Card>
        )}

      </div>

      {/* 4. Résumé routines en cours — grouped by templateId */}
      {activeTemplateIds.length > 0 && (
        <div className="mt-6 space-y-4 max-w-3xl mx-auto w-full">
          <span className="text-sm font-bold text-success-600 uppercase tracking-wide">Routines</span>
          {activeTemplateIds.map(templateId => {
            const routinesForTemplate = activeRoutines.filter(ar => ar.templateId === templateId)
            const template = routineTemplates.find(r => r.id === templateId)
            if (!template) return null
            const allCompleted = routinesForTemplate.every(ar => ar.completedAt != null)
            return (
              <div key={templateId} className={`bg-white rounded-3xl p-5 shadow-card border-2 ${allCompleted ? 'border-honey-200' : 'border-success-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-display font-semibold text-ink">
                    {template.icon} {template.name}
                    {allCompleted && <span className="ml-2 text-sm text-honey-600">✓ Terminée</span>}
                  </span>
                  <button
                    onClick={() => {
                      setActiveViewTemplateId(templateId)
                      setCurrentScreen('routine')
                    }}
                    className="min-h-11 px-3 text-success-600 text-sm font-semibold active:scale-95 transition-transform"
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
                        <ChildAvatar photo={child.photo} color={child.color} size={32} />
                        <span className="text-sm font-semibold text-ink">{child.name}</span>
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

      {/* 4bis. Nouvel univers gagné — invitation douce à choisir */}
      {children.map((child, childIndex) => {
        if (pendingUniverseChoices(child, childIndex, ACTIVE_UNIVERSES.length) === 0) return null
        return (
          <div key={`unlock-${child.id}`} className="mt-6 max-w-3xl mx-auto w-full">
            <Card
              onClick={() => setUniversePickChildId(child.id)}
              className="w-full p-4 !border-2 !border-honey-200 flex items-center gap-3"
            >
              <span className="text-3xl" aria-hidden="true">🎁</span>
              <span className="font-display font-semibold text-ink flex-1 text-left">
                {child.name}, un nouvel univers t'attend !
              </span>
              <span className="text-honey-600 font-semibold text-sm">Choisir →</span>
            </Card>
          </div>
        )
      })}

      {/* 5. Collections */}
      <div className="mt-6 max-w-3xl mx-auto w-full">
        <h2 className="text-sm font-bold text-ink-faint uppercase tracking-wide mb-3">Collections</h2>
        <div className="flex gap-4">
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => openGallery(child.id)}
              className="flex-1 flex items-center gap-3 p-4 rounded-3xl active:scale-95 transition-transform"
              style={{ backgroundColor: tint(child.color, 0.10) }}
            >
              <div className="border-2 rounded-full" style={{ borderColor: child.color }}>
                <ChildAvatar photo={child.photo} color={child.color} size={48} />
              </div>
              <div className="text-left">
                <p className="font-display font-semibold text-ink">{child.name}</p>
                <p className="text-sm text-ink-faint">{child.unlockedImages.length} images</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Spacer to make room for gear button */}
      <div className="h-16 shrink-0" />

      {/* Bouton ⚙️ — appui long */}
      <div className="fixed bottom-4 right-4 flex flex-col items-center gap-1">
        <span className="text-[10px] font-bold text-ink-faint/60 uppercase tracking-wide">Parents</span>
        <span className="text-[8px] text-ink-faint/50 -mt-1">appui long</span>
        <button
          onMouseDown={() => startLongPress(() => setCurrentScreen('parent'))}
          onMouseUp={cancelLongPress}
          onMouseLeave={cancelLongPress}
          onTouchStart={() => startLongPress(() => setCurrentScreen('parent'))}
          onTouchEnd={cancelLongPress}
          className="w-12 h-12 rounded-full bg-warm-200 flex items-center justify-center text-ink-faint text-xl"
          aria-label="Espace parents (appui long)"
        >
          ⚙️
        </button>
      </div>

      {/* First-time gear button hint overlay */}
      {showGearHint && (
        <div
          className="fixed inset-0 z-modal flex items-end justify-end"
          onClick={() => {
            localStorage.setItem('gearHintSeen', '1')
            setShowGearHint(false)
          }}
        >
          {/* Dark backdrop with a cutout around the gear button */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Tooltip bubble pointing to gear button */}
          <div className="absolute bottom-24 right-2 bg-white rounded-2xl px-5 py-4 shadow-overlay max-w-[240px] z-10 animate-bounce">
            <p className="text-sm font-display font-semibold text-ink mb-1">Espace parents</p>
            <p className="text-xs text-ink-soft">
              Maintenez appuyé 2 secondes sur le bouton ⚙️ pour accéder aux réglages.
            </p>
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white rotate-45" />
          </div>

          {/* Highlight ring around gear button area */}
          <div className="relative z-10 mb-4 mr-4 flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-warm-200 uppercase tracking-wide">Parents</span>
            <span className="text-[8px] text-warm-200/80 -mt-1">appui long</span>
            <div className="w-12 h-12 rounded-full bg-warm-200 flex items-center justify-center text-ink-faint text-xl ring-4 ring-white/80 shadow-lg shadow-white/50">
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

      {/* Choix du nouvel univers débloqué */}
      {universePickChildId && (() => {
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

      {/* Code parents avant une action parents (seulement si configuré) */}
      {showParentGate && parentPin && (
        <ParentGate
          pin={parentPin}
          onSuccess={() => {
            setShowParentGate(false)
            const action = pendingAction.current
            pendingAction.current = null
            action?.()
          }}
          onCancel={() => { setShowParentGate(false); pendingAction.current = null }}
        />
      )}
    </div>
  )
}
