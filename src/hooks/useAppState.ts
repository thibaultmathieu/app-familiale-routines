import { useCallback, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { ActiveRoutine, ActiveTimer, Child, RewardImage, RoutineTemplate, Screen } from '../types'
import { defaultRoutines } from '../data/defaultRoutines'
import { findRewardImage, getRewardImagesForUniverse, legacyUniverseIdForIndex } from '../data/rewardImages'
import { advanceDayProgress, ownedUniverseIds } from '../data/universeProgress'
import { assetUrl } from '../utils/assetUrl'

export interface PersistedState {
  children: Child[]
  routineTemplates: RoutineTemplate[]
  activeRoutines: ActiveRoutine[]
  activeTimers: ActiveTimer[]
  schemaVersion?: number
  onboardingCompleted?: boolean
  /** Code parents à 4 chiffres (optionnel) — absent = appui long seul. */
  parentPin?: string
}

export const CURRENT_SCHEMA_VERSION = 7

// Plafonds anti-accumulation (enfants qui spamment, routines à la volée jamais nettoyées)
export const MAX_ROUTINE_TEMPLATES = 30
export const MAX_ACTIVE_TIMERS = 6

const initialState: PersistedState = {
  children: [],
  routineTemplates: defaultRoutines,
  activeRoutines: [],
  activeTimers: [],
  schemaVersion: CURRENT_SCHEMA_VERSION,
  onboardingCompleted: false,
}

export function migrateState(state: PersistedState): PersistedState {
  let needsMigration = false
  let { children, activeTimers, routineTemplates, activeRoutines } = state
  const version = state.schemaVersion ?? 1

  // V1→V2: detect old emoji-based reward IDs and reset them
  children = children.map(child => {
    const completedCycles = child.completedCycles ?? 0
    const hasOldIds = child.unlockedImages.some(id => /^r\d{2}$/.test(id))
    if (hasOldIds) {
      needsMigration = true
      return { ...child, unlockedImages: [], completedCycles: 0 }
    }
    if (child.completedCycles === undefined) {
      needsMigration = true
      return { ...child, completedCycles }
    }
    return child
  })

  // Add activeTimers if missing + migrate timers without label
  if (!state.activeTimers) {
    activeTimers = []
    needsMigration = true
  }
  activeTimers = activeTimers.map(t => {
    if (!t.label) {
      needsMigration = true
      return { ...t, label: 'Minuteur' }
    }
    return t
  })

  // V2→V3: remove type field, add scheduledDays
  if (version < 3) {
    needsMigration = true
    routineTemplates = routineTemplates.map(r => {
      const { type, ...rest } = r as RoutineTemplate & { type?: string }
      if (!rest.scheduledDays && ['morning', 'afterschool', 'evening'].includes(rest.id)) {
        return { ...rest, scheduledDays: [1, 2, 3, 4, 5] }
      }
      return rest
    })
  }

  // V3→V4: just bump the version — existing users keep their children as-is
  if (version < 4) {
    needsMigration = true
  }

  // V4→V5: add onboardingCompleted — existing users skip onboarding
  if (version < 5) {
    needsMigration = true
  }

  // V5→V6: fige l'univers de chaque enfant sur son attribution legacy par index
  // (round-robin) — comportement de tirage strictement identique.
  if (version < 6) {
    needsMigration = true
    children = children.map((child, index) =>
      child.universeId ? child : { ...child, universeId: legacyUniverseIdForIndex(index) }
    )
  }

  // V6→V7: (a) re-mappe les enfants dont l'univers a disparu (retrait des
  // collections legacy sous copyright) et retire les IDs d'images qui ne
  // résolvent plus vers aucun pool ; (b) retire la tâche pré-enregistrée
  // « pipi » (retour famille 12/06) du template du soir et des instances.
  if (version < 7) {
    needsMigration = true
    children = children.map((child, index) => {
      const hasValidUniverse = !!child.universeId && getRewardImagesForUniverse(child.universeId).length > 0
      const universeId = hasValidUniverse ? child.universeId : legacyUniverseIdForIndex(index)
      return {
        ...child,
        universeId,
        unlockedImages: child.unlockedImages.filter(id => findRewardImage(id) !== undefined),
        unlockedUniverseIds: child.unlockedUniverseIds ?? (universeId ? [universeId] : []),
        routineDayCount: child.routineDayCount ?? 0,
      }
    })
    const isPipiTask = (t: { id: string; label: string }) => t.id === 'e3' && /pipi/i.test(t.label)
    routineTemplates = routineTemplates.map(r =>
      r.id === 'evening' && r.tasks.some(isPipiTask)
        ? { ...r, tasks: r.tasks.filter(t => !isPipiTask(t)) }
        : r
    )
    const eveningTaskIds = new Set(
      routineTemplates.find(r => r.id === 'evening')?.tasks.map(t => t.id) ?? []
    )
    activeRoutines = activeRoutines.map(ar => {
      if (ar.templateId !== 'evening') return ar
      const tasks = ar.tasks.filter(t => eveningTaskIds.has(t.taskId))
      if (tasks.length === ar.tasks.length) return ar
      const allDone = tasks.length > 0 && tasks.every(t => t.done)
      return {
        ...ar,
        tasks,
        completedAt: allDone ? (ar.completedAt ?? new Date().toISOString()) : ar.completedAt,
      }
    })
  }

  if (needsMigration) {
    return {
      ...state,
      children,
      activeTimers,
      routineTemplates,
      activeRoutines,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      onboardingCompleted: state.onboardingCompleted ?? true,
    }
  }

  // Ensure schemaVersion is set even without migration
  if (state.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    return { ...state, schemaVersion: CURRENT_SCHEMA_VERSION }
  }

  return state
}

export function useAppState() {
  const [rawState, setState] = useLocalStorage<PersistedState>('routines-familiales', initialState)
  const state = migrateState(rawState)
  if (state !== rawState) {
    setState(state)
  }

  const [currentScreen, setCurrentScreen] = useLocalStorage<Screen>('routines-screen', 'home')
  const [galleryChildId, setGalleryChildId] = useLocalStorage<string | null>('routines-gallery-child', null)
  const [galleryReturnScreen, setGalleryReturnScreen] = useLocalStorage<Screen | null>('routines-gallery-return', null)
  const [activeViewTemplateId, setActiveViewTemplateId] = useLocalStorage<string | null>('routines-active-view', null)
  const [timerReturnScreen, setTimerReturnScreen] = useLocalStorage<Screen | null>('routines-timer-return', null)
  const [timerPrefill, setTimerPrefill] = useLocalStorage<{ label?: string; childIds?: string[] } | null>('routines-timer-prefill', null)
  const [editorRoutineId, setEditorRoutineId] = useLocalStorage<string | null>('routines-editor-id', null)

  const launchRoutine = useCallback((templateId: string, childIds: string[]) => {
    setState(prev => {
      const template = prev.routineTemplates.find(r => r.id === templateId)
      if (!template) return prev

      const existingChildIds = prev.activeRoutines
        .filter(ar => ar.templateId === templateId)
        .map(ar => ar.childId)
      const newChildIds = childIds.filter(id => !existingChildIds.includes(id))

      if (newChildIds.length === 0) return prev

      const newRoutines: ActiveRoutine[] = newChildIds
        .map(childId => ({
          id: `${templateId}-${childId}-${Date.now()}`,
          templateId,
          childId,
          tasks: template.tasks
            .filter(t => !t.childIds || t.childIds.includes(childId))
            .map(t => ({ taskId: t.id, done: false })),
          startedAt: new Date().toISOString(),
          completedAt: null,
        }))
        // Un enfant sans aucune tâche applicable n'obtient pas d'instance
        // (sinon une routine vide serait considérée « terminée » d'office)
        .filter(ar => ar.tasks.length > 0)

      if (newRoutines.length === 0) return prev

      return {
        ...prev,
        activeRoutines: [...prev.activeRoutines, ...newRoutines],
      }
    })
    setActiveViewTemplateId(templateId)
    setCurrentScreen('routine')
  }, [setState, setCurrentScreen, setActiveViewTemplateId])

  const toggleTask = useCallback((routineId: string, taskId: string) => {
    setState(prev => {
      const activeRoutines = prev.activeRoutines.map(ar => {
        if (ar.id !== routineId) return ar
        const task = ar.tasks.find(t => t.taskId === taskId)
        if (!task || task.done) return ar
        const updatedTasks = ar.tasks.map(t =>
          t.taskId === taskId ? { ...t, done: true } : t
        )
        const allDone = updatedTasks.every(t => t.done)
        return {
          ...ar,
          tasks: updatedTasks,
          completedAt: allDone ? new Date().toISOString() : null,
        }
      })

      // Progression d'univers : la journée d'un enfant ne compte que lorsque
      // toutes ses routines programmées du jour sont terminées (cf. childDayComplete)
      const children = advanceDayProgress(prev.children, prev.routineTemplates, activeRoutines)

      return { ...prev, activeRoutines, children }
    })
  }, [setState])

  const resetChildRoutine = useCallback((childId: string, templateId?: string) => {
    setState(prev => ({
      ...prev,
      activeRoutines: prev.activeRoutines.map(ar => {
        if (ar.childId !== childId) return ar
        if (templateId && ar.templateId !== templateId) return ar
        return {
          ...ar,
          tasks: ar.tasks.map(t => ({ ...t, done: false })),
          completedAt: null,
        }
      }),
    }))
  }, [setState])

  const resetRoutine = useCallback((templateId: string) => {
    setState(prev => ({
      ...prev,
      activeRoutines: prev.activeRoutines.map(ar => {
        if (ar.templateId !== templateId) return ar
        return {
          ...ar,
          tasks: ar.tasks.map(t => ({ ...t, done: false })),
          completedAt: null,
        }
      }),
    }))
  }, [setState])

  const resetAllRoutines = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeRoutines: [],
      // Fin de journée : on purge les routines créées à la volée pour éviter l'accumulation
      routineTemplates: prev.routineTemplates.filter(r => !r.ephemeral),
    }))
  }, [setState])

  const stopRoutines = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeRoutines: [],
      routineTemplates: prev.routineTemplates.filter(r => !r.ephemeral),
    }))
    setActiveViewTemplateId(null)
    setCurrentScreen('home')
  }, [setState, setCurrentScreen, setActiveViewTemplateId])

  // Le tirage est calculé AVANT setState (état du rendu courant) : la valeur de retour
  // est fiable, là où un calcul dans l'updater dépendait de l'évaluation eager de React.
  // Le pool est l'UNION de TOUS les univers possédés par l'enfant (pas seulement
  // l'actif) : un enfant qui a débloqué plusieurs univers reçoit des images des
  // deux, au hasard. La progression vit dans unlockedImages, donc le cycle ne se
  // réinitialise qu'une fois toutes les images de tous ses univers obtenues.
  const unlockReward = useCallback((childId: string): RewardImage | null => {
    const childIndex = state.children.findIndex(c => c.id === childId)
    const child = childIndex >= 0 ? state.children[childIndex] : undefined
    if (!child) return null

    const childImages = ownedUniverseIds(child, childIndex).flatMap(getRewardImagesForUniverse)
    if (childImages.length === 0) return null

    const poolIds = new Set(childImages.map(img => img.id))
    let currentUnlocked = [...child.unlockedImages]
    let currentCycles = child.completedCycles

    const unlockedInPool = currentUnlocked.filter(id => poolIds.has(id))
    if (unlockedInPool.length >= childImages.length) {
      // Cycle complet dans CET univers : on ne réinitialise que ses images
      currentUnlocked = currentUnlocked.filter(id => !poolIds.has(id))
      currentCycles += 1
    }

    const unlockedSet = new Set(currentUnlocked)
    const available = childImages.filter(img => !unlockedSet.has(img.id))
    if (available.length === 0) return null
    const picked = available[Math.floor(Math.random() * available.length)]

    setState(prev => ({
      ...prev,
      children: prev.children.map(c =>
        c.id === childId
          ? {
              ...c,
              unlockedImages: [...currentUnlocked, picked.id],
              completedCycles: currentCycles,
            }
          : c
      ),
    }))
    return picked
  }, [state, setState])

  const removeReward = useCallback((childId: string, imageId: string) => {
    setState(prev => ({
      ...prev,
      children: prev.children.map(c =>
        c.id === childId
          ? { ...c, unlockedImages: c.unlockedImages.filter(id => id !== imageId) }
          : c
      ),
    }))
  }, [setState])

  const addRoutine = useCallback((template: Omit<RoutineTemplate, 'id'>): string => {
    const id = `routine-${Date.now()}`
    setState(prev => {
      if (prev.routineTemplates.length >= MAX_ROUTINE_TEMPLATES) return prev
      return {
        ...prev,
        routineTemplates: [...prev.routineTemplates, { ...template, id }],
      }
    })
    return id
  }, [setState])

  const updateRoutine = useCallback((id: string, updates: Partial<RoutineTemplate>) => {
    setState(prev => {
      // Une routine éditée par un parent devient pérenne (le flag éphémère saute)
      const updatedTemplates = prev.routineTemplates.map(r =>
        r.id === id ? { ...r, ...updates, ephemeral: undefined } : r
      )

      // If tasks changed, sync active routine instances
      if (!updates.tasks) {
        return { ...prev, routineTemplates: updatedTemplates }
      }

      const updatedTemplate = updatedTemplates.find(r => r.id === id)
      if (!updatedTemplate) {
        return { ...prev, routineTemplates: updatedTemplates }
      }

      const updatedActiveRoutines = prev.activeRoutines.map(ar => {
        if (ar.templateId !== id) return ar

        const applicableTasks = updatedTemplate.tasks.filter(
          t => !t.childIds || t.childIds.includes(ar.childId)
        )

        const existingDoneMap = new Map(
          ar.tasks.map(t => [t.taskId, t.done])
        )

        const newTasks = applicableTasks.map(t => ({
          taskId: t.id,
          done: existingDoneMap.get(t.id) ?? false,
        }))

        const allDone = newTasks.length > 0 && newTasks.every(t => t.done)

        return {
          ...ar,
          tasks: newTasks,
          completedAt: allDone ? (ar.completedAt ?? new Date().toISOString()) : null,
        }
      })

      return {
        ...prev,
        routineTemplates: updatedTemplates,
        activeRoutines: updatedActiveRoutines,
        // L'édition peut compléter une routine → la journée peut devenir complète
        children: advanceDayProgress(prev.children, updatedTemplates, updatedActiveRoutines),
      }
    })
  }, [setState])

  const deleteRoutine = useCallback((id: string) => {
    setState(prev => {
      const routineTemplates = prev.routineTemplates.filter(r => r.id !== id)
      const activeRoutines = prev.activeRoutines.filter(ar => ar.templateId !== id)
      return {
        ...prev,
        routineTemplates,
        activeRoutines,
        // Supprimer la dernière routine du jour restante peut compléter la journée
        children: advanceDayProgress(prev.children, routineTemplates, activeRoutines),
      }
    })
  }, [setState])

  const reorderTask = useCallback((routineId: string, taskIndex: number, direction: 'up' | 'down') => {
    setState(prev => ({
      ...prev,
      routineTemplates: prev.routineTemplates.map(r => {
        if (r.id !== routineId) return r
        const tasks = [...r.tasks]
        const swapIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1
        if (swapIndex < 0 || swapIndex >= tasks.length) return r
        ;[tasks[taskIndex], tasks[swapIndex]] = [tasks[swapIndex], tasks[taskIndex]]
        return { ...r, tasks }
      }),
    }))
  }, [setState])

  // Timer methods
  const startTimer = useCallback((childIds: string[], durationSeconds: number, label: string = 'Minuteur') => {
    const timer: ActiveTimer = {
      // Suffixe aléatoire : deux minuteurs lancés dans la même milliseconde restent distincts
      id: `timer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      childIds,
      durationSeconds,
      startedAt: new Date().toISOString(),
      label,
    }
    setState(prev => {
      if ((prev.activeTimers ?? []).length >= MAX_ACTIVE_TIMERS) return prev
      return {
        ...prev,
        activeTimers: [...(prev.activeTimers ?? []), timer],
      }
    })
  }, [setState])

  const cancelTimer = useCallback((timerId: string) => {
    setState(prev => ({
      ...prev,
      activeTimers: (prev.activeTimers ?? []).filter(t => t.id !== timerId),
    }))
  }, [setState])

  // Univers : changer le pool de récompenses d'un enfant (sans perte — la
  // progression de chaque univers vit dans unlockedImages, par intersection)
  const setChildUniverse = useCallback((childId: string, universeId: string) => {
    setState(prev => ({
      ...prev,
      children: prev.children.map(c => c.id === childId ? { ...c, universeId } : c),
    }))
  }, [setState])

  // Univers : ajouter un univers aux possessions de l'enfant (déblocage par
  // progression ou offert par un parent) et le rendre actif
  const addChildUniverse = useCallback((childId: string, universeId: string) => {
    setState(prev => ({
      ...prev,
      children: prev.children.map(c => {
        if (c.id !== childId) return c
        const owned = c.unlockedUniverseIds ?? (c.universeId ? [c.universeId] : [])
        return {
          ...c,
          unlockedUniverseIds: owned.includes(universeId) ? owned : [...owned, universeId],
          universeId,
        }
      }),
    }))
  }, [setState])

  // Child CRUD
  const updateChild = useCallback((id: string, updates: Partial<Pick<Child, 'name' | 'photo' | 'color'>>) => {
    setState(prev => ({
      ...prev,
      children: prev.children.map(c => c.id === id ? { ...c, ...updates } : c),
    }))
  }, [setState])

  const addChild = useCallback((child: Omit<Child, 'unlockedImages' | 'completedCycles'>) => {
    setState(prev => ({
      ...prev,
      children: [...prev.children, { ...child, unlockedImages: [], completedCycles: 0 }],
    }))
  }, [setState])

  const removeChild = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      children: prev.children.filter(c => c.id !== id),
      activeRoutines: prev.activeRoutines.filter(ar => ar.childId !== id),
    }))
  }, [setState])

  const completeOnboarding = useCallback(() => {
    setState(prev => ({ ...prev, onboardingCompleted: true }))
  }, [setState])

  const setParentPin = useCallback((pin: string | null) => {
    setState(prev => {
      const { parentPin: _removed, ...rest } = prev
      return pin ? { ...rest, parentPin: pin } : rest
    })
  }, [setState])

  const childrenWithPhotos = useMemo(
    () => state.children.map(c => ({
      ...c,
      photo: c.photo.startsWith('data:') ? c.photo : assetUrl(c.photo),
    })),
    [state.children]
  )

  return {
    ...state,
    children: childrenWithPhotos,
    currentScreen,
    galleryChildId,
    galleryReturnScreen,
    activeViewTemplateId,
    timerReturnScreen,
    timerPrefill,
    editorRoutineId,
    setCurrentScreen,
    setGalleryChildId,
    setGalleryReturnScreen,
    setActiveViewTemplateId,
    setTimerReturnScreen,
    setTimerPrefill,
    setEditorRoutineId,
    launchRoutine,
    toggleTask,
    resetChildRoutine,
    resetRoutine,
    resetAllRoutines,
    stopRoutines,
    unlockReward,
    removeReward,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    reorderTask,
    startTimer,
    cancelTimer,
    setChildUniverse,
    addChildUniverse,
    updateChild,
    addChild,
    removeChild,
    completeOnboarding,
    setParentPin,
  }
}
