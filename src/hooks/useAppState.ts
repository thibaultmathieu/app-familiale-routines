import { useCallback, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { ActiveRoutine, ActiveTimer, Child, RewardImage, RoutineTemplate, Screen } from '../types'
import { defaultRoutines, defaultChildren } from '../data/defaultRoutines'
import { getRewardImagesForChild } from '../data/rewardImages'
import { assetUrl } from '../utils/assetUrl'

interface PersistedState {
  children: Child[]
  routineTemplates: RoutineTemplate[]
  activeRoutines: ActiveRoutine[]
  activeTimers: ActiveTimer[]
}

const initialState: PersistedState = {
  children: defaultChildren,
  routineTemplates: defaultRoutines,
  activeRoutines: [],
  activeTimers: [],
}

// Migration V1→V2: detect old emoji-based reward IDs and reset them
function migrateState(state: PersistedState): PersistedState {
  let needsMigration = false

  const children = state.children.map(child => {
    // Add completedCycles if missing
    const completedCycles = child.completedCycles ?? 0

    // Detect V1 emoji IDs (r01, r02, etc.)
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
  let activeTimers = state.activeTimers ?? []
  if (!state.activeTimers) needsMigration = true
  const migratedTimers = activeTimers.map(t => {
    if (!t.label) {
      needsMigration = true
      return { ...t, label: 'Minuteur' }
    }
    return t
  })
  if (needsMigration) activeTimers = migratedTimers

  // Always sync fixed routine templates from defaults (so new tasks are picked up)
  const customRoutines = state.routineTemplates.filter(r => r.type === 'custom')
  const freshFixed = defaultRoutines.filter(r => r.type === 'fixed')
  const mergedTemplates = [...freshFixed, ...customRoutines]
  if (JSON.stringify(mergedTemplates) !== JSON.stringify(state.routineTemplates)) {
    needsMigration = true
  }

  if (needsMigration) {
    return { ...state, children, activeTimers, routineTemplates: mergedTemplates }
  }
  return state
}

export function useAppState() {
  const [rawState, setState] = useLocalStorage<PersistedState>('routines-familiales', initialState)
  const state = migrateState(rawState)
  // Persist migration if it changed something
  if (state !== rawState) {
    setState(state)
  }

  const [currentScreen, setCurrentScreen] = useLocalStorage<Screen>('routines-screen', 'home')
  const [galleryChildId, setGalleryChildId] = useLocalStorage<string | null>('routines-gallery-child', null)
  const [galleryReturnScreen, setGalleryReturnScreen] = useLocalStorage<Screen | null>('routines-gallery-return', null)
  const [activeViewTemplateId, setActiveViewTemplateId] = useLocalStorage<string | null>('routines-active-view', null)
  const [timerReturnScreen, setTimerReturnScreen] = useLocalStorage<Screen | null>('routines-timer-return', null)
  const [timerPrefill, setTimerPrefill] = useLocalStorage<{ label?: string; childIds?: string[] } | null>('routines-timer-prefill', null)

  const launchRoutine = useCallback((templateId: string, childIds: string[]) => {
    setState(prev => {
      const template = prev.routineTemplates.find(r => r.id === templateId)
      if (!template) return prev

      // Only create routines for children who don't already have this templateId active
      const existingChildIds = prev.activeRoutines
        .filter(ar => ar.templateId === templateId)
        .map(ar => ar.childId)
      const newChildIds = childIds.filter(id => !existingChildIds.includes(id))

      if (newChildIds.length === 0) return prev

      const newRoutines: ActiveRoutine[] = newChildIds.map(childId => ({
        id: `${templateId}-${childId}-${Date.now()}`,
        templateId,
        childId,
        tasks: template.tasks
          .filter(t => !t.childIds || t.childIds.includes(childId))
          .map(t => ({ taskId: t.id, done: false })),
        startedAt: new Date().toISOString(),
        completedAt: null,
      }))

      return {
        ...prev,
        activeRoutines: [...prev.activeRoutines, ...newRoutines],
      }
    })
    setActiveViewTemplateId(templateId)
    setCurrentScreen('routine')
  }, [setState, setCurrentScreen, setActiveViewTemplateId])

  const toggleTask = useCallback((routineId: string, taskId: string) => {
    setState(prev => ({
      ...prev,
      activeRoutines: prev.activeRoutines.map(ar => {
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
      }),
    }))
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
    }))
  }, [setState])

  const stopRoutines = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeRoutines: [],
    }))
    setActiveViewTemplateId(null)
    setCurrentScreen('home')
  }, [setState, setCurrentScreen, setActiveViewTemplateId])

  const unlockReward = useCallback((childId: string): RewardImage | null => {
    let unlockedImage: RewardImage | null = null
    setState(prev => {
      const child = prev.children.find(c => c.id === childId)
      if (!child) return prev

      const childImages = getRewardImagesForChild(childId)
      if (childImages.length === 0) return prev

      let currentUnlocked = [...child.unlockedImages]
      let currentCycles = child.completedCycles

      // If all images unlocked, reset for new cycle
      if (currentUnlocked.length >= childImages.length) {
        currentUnlocked = []
        currentCycles += 1
      }

      // Pick random from available
      const available = childImages.filter(img => !currentUnlocked.includes(img.id))
      if (available.length === 0) return prev
      const picked = available[Math.floor(Math.random() * available.length)]
      unlockedImage = picked

      return {
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
      }
    })
    return unlockedImage
  }, [setState])

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

  const addCustomRoutine = useCallback((name: string, tasks: { label: string; icon: string }[]) => {
    const id = `custom-${Date.now()}`
    const template: RoutineTemplate = {
      id,
      name,
      icon: '📋',
      type: 'custom',
      tasks: tasks.map((t, i) => ({ id: `${id}-t${i}`, label: t.label, icon: t.icon })),
    }
    setState(prev => ({
      ...prev,
      routineTemplates: [...prev.routineTemplates, template],
    }))
    return id
  }, [setState])

  // Timer methods
  const startTimer = useCallback((childIds: string[], durationSeconds: number, label: string = 'Minuteur') => {
    const timer: ActiveTimer = {
      id: `timer-${Date.now()}`,
      childIds,
      durationSeconds,
      startedAt: new Date().toISOString(),
      label,
    }
    setState(prev => ({
      ...prev,
      activeTimers: [...(prev.activeTimers ?? []), timer],
    }))
  }, [setState])

  const cancelTimer = useCallback((timerId: string) => {
    setState(prev => ({
      ...prev,
      activeTimers: (prev.activeTimers ?? []).filter(t => t.id !== timerId),
    }))
  }, [setState])

  // Resolve photo URLs with base path for GitHub Pages compatibility
  const childrenWithPhotos = useMemo(
    () => state.children.map(c => ({ ...c, photo: assetUrl(c.photo) })),
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
    setCurrentScreen,
    setGalleryChildId,
    setGalleryReturnScreen,
    setActiveViewTemplateId,
    setTimerReturnScreen,
    setTimerPrefill,
    launchRoutine,
    toggleTask,
    resetChildRoutine,
    resetRoutine,
    resetAllRoutines,
    stopRoutines,
    unlockReward,
    removeReward,
    addCustomRoutine,
    startTimer,
    cancelTimer,
  }
}
