export interface TaskTemplate {
  id: string
  label: string
  icon: string
  childIds?: string[]
}

export interface RoutineTemplate {
  id: string
  name: string
  icon: string
  type: 'fixed' | 'custom'
  tasks: TaskTemplate[]
}

export interface ActiveTask {
  taskId: string
  done: boolean
}

export interface ActiveRoutine {
  id: string
  templateId: string
  childId: string
  tasks: ActiveTask[]
  startedAt: string
  completedAt: string | null
}

export interface Child {
  id: string
  name: string
  photo: string
  color: string
  unlockedImages: string[]
  completedCycles: number
}

export interface RewardImage {
  id: string
  src: string
}

export interface ActiveTimer {
  id: string
  childIds: string[]
  durationSeconds: number
  startedAt: string
  label: string
}

export type Screen = 'home' | 'routine' | 'parent' | 'gallery'

export interface AppState {
  children: Child[]
  routineTemplates: RoutineTemplate[]
  activeRoutines: ActiveRoutine[]
  currentScreen: Screen
  galleryChildId: string | null
  galleryReturnScreen: Screen | null
  activeTimers: ActiveTimer[]
}
