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
  schemaVersion?: number
}

const CURRENT_SCHEMA_VERSION = 4

const initialState: PersistedState = {
  children: defaultChildren,
  routineTemplates: defaultRoutines,
  activeRoutines: [],
  activeTimers: [],
  schemaVersion: CURRENT_SCHEMA_VERSION,
}

function migrateState(state: PersistedState): PersistedState {
  let needsMigration = false
  let { children, activeTimers, routineTemplates } = state
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

  if (needsMigration) {
    return { ...state, children, activeTimers, routineTemplates, schemaVersion: CURRENT_SCHEMA_VERSION }
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
      const childIndex = prev.children.findIndex(c => c.id === childId)
      const child = childIndex >= 0 ? prev.children[childIndex] : undefined
      if (!child) return prev

      const childImages = getRewardImagesForChild(childIndex)
      if (childImages.length === 0) return prev

      let currentUnlocked = [...child.unlockedImages]
      let currentCycles = child.completedCycles

      if (currentUnlocked.length >= childImages.length) {
        currentUnlocked = []
        currentCycles += 1
      }

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

  const addRoutine = useCallback((template: Omit<RoutineTemplate, 'id'>): string => {
    const id = `routine-${Date.now()}`
    setState(prev => ({
      ...prev,
      routineTemplates: [...prev.routineTemplates, { ...template, id }],
    }))
    return id
  }, [setState])

  const updateRoutine = useCallback((id: string, updates: Partial<RoutineTemplate>) => {
    setState(prev => ({
      ...prev,
      routineTemplates: prev.routineTemplates.map(r =>
        r.id === id ? { ...r, ...updates } : r
      ),
    }))
  }, [setState])

  const deleteRoutine = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      routineTemplates: prev.routineTemplates.filter(r => r.id !== id),
      activeRoutines: prev.activeRoutines.filter(ar => ar.templateId !== id),
    }))
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
    updateChild,
    addChild,
    removeChild,
  }
}
