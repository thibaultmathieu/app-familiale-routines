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
  scheduledDays?: number[]
  tasks: TaskTemplate[]
  /** Routine créée à la volée depuis l'accueil — purgée à la fin de la journée si plus active. */
  ephemeral?: boolean
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
  /** Univers de récompenses dont l'enfant tire ses images (V6). Absent = pool par index (legacy). */
  universeId?: string
  /** Univers possédés (choisis à la création, gagnés par progression ou offerts par un parent). */
  unlockedUniverseIds?: string[]
  /** Nombre de jours distincts avec au moins une routine terminée (progression univers). */
  routineDayCount?: number
  /** Dernier jour local (YYYY-MM-DD) comptabilisé dans routineDayCount. */
  lastRoutineDay?: string
}

export interface RewardImage {
  id: string
  src: string
}

/** Univers thématique de récompenses (Jalon 2). Un univers = un pool d'images. */
export interface Universe {
  id: string
  name: string
  emoji: string
  description?: string
  /** Univers annoncé mais sans images — visible verrouillé, non sélectionnable. */
  comingSoon?: boolean
}

export interface ActiveTimer {
  id: string
  childIds: string[]
  durationSeconds: number
  startedAt: string
  label: string
}

export type Screen = 'home' | 'routine' | 'parent' | 'gallery' | 'timer' | 'routine-list' | 'routine-editor' | 'child-editor' | 'universe-select'

export interface AppState {
  children: Child[]
  routineTemplates: RoutineTemplate[]
  activeRoutines: ActiveRoutine[]
  currentScreen: Screen
  galleryChildId: string | null
  galleryReturnScreen: Screen | null
  activeTimers: ActiveTimer[]
  editorRoutineId: string | null
}
