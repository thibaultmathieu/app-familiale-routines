import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { migrateState, useAppState, CURRENT_SCHEMA_VERSION, PersistedState } from './useAppState'
import { RoutineTemplate } from '../types'

// Petits pools contrôlés pour tester le cycle de récompenses (3 images par pool)
vi.mock('../data/rewardImages', () => {
  const pools = [
    [
      { id: 'a-001', src: '/rewards/a/a-001.png' },
      { id: 'a-002', src: '/rewards/a/a-002.png' },
      { id: 'a-003', src: '/rewards/a/a-003.png' },
    ],
    [
      { id: 'b-001', src: '/rewards/b/b-001.png' },
      { id: 'b-002', src: '/rewards/b/b-002.png' },
      { id: 'b-003', src: '/rewards/b/b-003.png' },
    ],
  ]
  return {
    getRewardImagesForChild: (childIndex: number) => pools[childIndex % pools.length],
    findRewardImage: (id: string) => pools.flat().find(img => img.id === id),
  }
})

function makeChild(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    name: id,
    photo: '/profiles/default-avatar.svg',
    color: '#A78BFA',
    unlockedImages: [] as string[],
    completedCycles: 0,
    ...overrides,
  }
}

const twoTaskTemplate: RoutineTemplate = {
  id: 'morning',
  name: 'Routine du matin',
  icon: '🌅',
  scheduledDays: [1, 2, 3, 4, 5],
  tasks: [
    { id: 'm1', label: 'je fais mon lit', icon: '🛏️' },
    { id: 'm2', label: "je m'habille", icon: '👕' },
  ],
}

function seedState(partial: Partial<PersistedState>) {
  localStorage.setItem('routines-familiales', JSON.stringify(partial))
}

beforeEach(() => {
  localStorage.clear()
})

// ---------------------------------------------------------------------------
// migrateState — contrat de migration V1→V5
// ---------------------------------------------------------------------------

describe('migrateState', () => {
  it('V1→V2 : reset des anciens IDs emoji (r01…) et completedCycles', () => {
    const legacy = {
      children: [makeChild('c1', { unlockedImages: ['r01', 'r07'], completedCycles: undefined })],
      routineTemplates: [twoTaskTemplate],
      activeRoutines: [],
      activeTimers: [],
    } as unknown as PersistedState

    const out = migrateState(legacy)
    expect(out.children[0].unlockedImages).toEqual([])
    expect(out.children[0].completedCycles).toBe(0)
    expect(out.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('conserve les IDs récompenses modernes', () => {
    const state = {
      children: [makeChild('c1', { unlockedImages: ['evangelina-001', 'evangelina-014'] })],
      routineTemplates: [twoTaskTemplate],
      activeRoutines: [],
      activeTimers: [],
    } as unknown as PersistedState

    const out = migrateState(state)
    expect(out.children[0].unlockedImages).toEqual(['evangelina-001', 'evangelina-014'])
  })

  it('ajoute activeTimers manquant et label aux timers sans label', () => {
    const legacy = {
      children: [],
      routineTemplates: [],
      activeRoutines: [],
      activeTimers: [
        { id: 't1', childIds: ['c1'], durationSeconds: 300, startedAt: new Date().toISOString() },
      ],
    } as unknown as PersistedState

    const out = migrateState(legacy)
    expect(out.activeTimers[0].label).toBe('Minuteur')

    const noTimers = { children: [], routineTemplates: [], activeRoutines: [] } as unknown as PersistedState
    expect(migrateState(noTimers).activeTimers).toEqual([])
  })

  it('V2→V3 : retire le champ type et ajoute scheduledDays aux routines par défaut', () => {
    const legacy = {
      children: [],
      routineTemplates: [
        { id: 'morning', name: 'Matin', icon: '🌅', type: 'fixed', tasks: [] },
        { id: 'custom-1', name: 'Perso', icon: '📋', type: 'custom', tasks: [] },
      ],
      activeRoutines: [],
      activeTimers: [],
      schemaVersion: 2,
    } as unknown as PersistedState

    const out = migrateState(legacy)
    const morning = out.routineTemplates.find(r => r.id === 'morning')!
    const custom = out.routineTemplates.find(r => r.id === 'custom-1')!
    expect((morning as unknown as Record<string, unknown>).type).toBeUndefined()
    expect(morning.scheduledDays).toEqual([1, 2, 3, 4, 5])
    expect(custom.scheduledDays).toBeUndefined()
  })

  it('utilisateur existant sans version : onboardingCompleted passe à true', () => {
    const legacy = {
      children: [makeChild('c1')],
      routineTemplates: [],
      activeRoutines: [],
    } as unknown as PersistedState

    const out = migrateState(legacy)
    expect(out.onboardingCompleted).toBe(true)
    expect(out.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('état déjà à jour : retourne la même référence (pas de boucle de re-render)', () => {
    const state: PersistedState = {
      children: [makeChild('c1')],
      routineTemplates: [twoTaskTemplate],
      activeRoutines: [],
      activeTimers: [],
      schemaVersion: CURRENT_SCHEMA_VERSION,
      onboardingCompleted: false,
    }
    expect(migrateState(state)).toBe(state)
  })
})

// ---------------------------------------------------------------------------
// useAppState — cycle de vie des routines
// ---------------------------------------------------------------------------

function setupHook(seed?: Partial<PersistedState>) {
  if (seed) {
    seedState({
      children: [makeChild('c1', { name: 'Éva' }), makeChild('c2', { name: 'Noé' })],
      routineTemplates: [twoTaskTemplate],
      activeRoutines: [],
      activeTimers: [],
      schemaVersion: CURRENT_SCHEMA_VERSION,
      onboardingCompleted: true,
      ...seed,
    })
  }
  return renderHook(() => useAppState())
}

describe('useAppState — routines', () => {
  it('launchRoutine crée une instance par enfant et navigue vers routine', () => {
    const { result } = setupHook({})
    act(() => result.current.launchRoutine('morning', ['c1', 'c2']))

    expect(result.current.activeRoutines).toHaveLength(2)
    expect(result.current.activeRoutines.map(ar => ar.childId).sort()).toEqual(['c1', 'c2'])
    expect(result.current.activeRoutines[0].tasks).toEqual([
      { taskId: 'm1', done: false },
      { taskId: 'm2', done: false },
    ])
    expect(result.current.currentScreen).toBe('routine')
  })

  it('launchRoutine filtre les tâches par childIds du template', () => {
    const template: RoutineTemplate = {
      ...twoTaskTemplate,
      id: 'mixed',
      tasks: [
        { id: 'x1', label: 'pour tous', icon: '📋' },
        { id: 'x2', label: 'pour c1 seulement', icon: '📋', childIds: ['c1'] },
      ],
    }
    const { result } = setupHook({ routineTemplates: [template] })
    act(() => result.current.launchRoutine('mixed', ['c1', 'c2']))

    const forC1 = result.current.activeRoutines.find(ar => ar.childId === 'c1')!
    const forC2 = result.current.activeRoutines.find(ar => ar.childId === 'c2')!
    expect(forC1.tasks.map(t => t.taskId)).toEqual(['x1', 'x2'])
    expect(forC2.tasks.map(t => t.taskId)).toEqual(['x1'])
  })

  it('relancer une routine déjà active ne crée pas de doublon', () => {
    const { result } = setupHook({})
    act(() => result.current.launchRoutine('morning', ['c1', 'c2']))
    act(() => result.current.launchRoutine('morning', ['c1', 'c2']))
    expect(result.current.activeRoutines).toHaveLength(2)
  })

  it('toggleTask coche une tâche, completedAt quand tout est fait, re-toggle = no-op', () => {
    const { result } = setupHook({})
    act(() => result.current.launchRoutine('morning', ['c1']))
    const routineId = result.current.activeRoutines[0].id

    act(() => result.current.toggleTask(routineId, 'm1'))
    expect(result.current.activeRoutines[0].tasks.find(t => t.taskId === 'm1')!.done).toBe(true)
    expect(result.current.activeRoutines[0].completedAt).toBeNull()

    act(() => result.current.toggleTask(routineId, 'm1'))
    expect(result.current.activeRoutines[0].tasks.find(t => t.taskId === 'm1')!.done).toBe(true)

    act(() => result.current.toggleTask(routineId, 'm2'))
    expect(result.current.activeRoutines[0].completedAt).not.toBeNull()
  })

  it('updateRoutine synchronise les instances actives en préservant les tâches faites', () => {
    const { result } = setupHook({})
    act(() => result.current.launchRoutine('morning', ['c1']))
    const routineId = result.current.activeRoutines[0].id
    act(() => result.current.toggleTask(routineId, 'm1'))

    act(() =>
      result.current.updateRoutine('morning', {
        tasks: [
          { id: 'm1', label: 'je fais mon lit', icon: '🛏️' },
          { id: 'm3', label: 'nouvelle tâche', icon: '✨' },
        ],
      })
    )

    const instance = result.current.activeRoutines[0]
    expect(instance.tasks).toEqual([
      { taskId: 'm1', done: true },
      { taskId: 'm3', done: false },
    ])
    expect(instance.completedAt).toBeNull()
  })

  it('updateRoutine qui retire la dernière tâche non faite complète la routine', () => {
    const { result } = setupHook({})
    act(() => result.current.launchRoutine('morning', ['c1']))
    const routineId = result.current.activeRoutines[0].id
    act(() => result.current.toggleTask(routineId, 'm1'))

    act(() =>
      result.current.updateRoutine('morning', {
        tasks: [{ id: 'm1', label: 'je fais mon lit', icon: '🛏️' }],
      })
    )
    expect(result.current.activeRoutines[0].completedAt).not.toBeNull()
  })

  it('deleteRoutine supprime le template et ses instances', () => {
    const { result } = setupHook({})
    act(() => result.current.launchRoutine('morning', ['c1', 'c2']))
    act(() => result.current.deleteRoutine('morning'))
    expect(result.current.routineTemplates.find(r => r.id === 'morning')).toBeUndefined()
    expect(result.current.activeRoutines).toHaveLength(0)
  })

  it('resetChildRoutine / resetRoutine / resetAllRoutines', () => {
    const { result } = setupHook({})
    act(() => result.current.launchRoutine('morning', ['c1', 'c2']))
    const r1 = result.current.activeRoutines.find(ar => ar.childId === 'c1')!
    act(() => result.current.toggleTask(r1.id, 'm1'))

    act(() => result.current.resetChildRoutine('c1'))
    expect(result.current.activeRoutines.find(ar => ar.childId === 'c1')!.tasks.every(t => !t.done)).toBe(true)

    act(() => result.current.toggleTask(r1.id, 'm1'))
    act(() => result.current.resetRoutine('morning'))
    expect(result.current.activeRoutines.every(ar => ar.tasks.every(t => !t.done))).toBe(true)

    act(() => result.current.resetAllRoutines())
    expect(result.current.activeRoutines).toHaveLength(0)
  })

  it('removeChild supprime aussi ses routines actives', () => {
    const { result } = setupHook({})
    act(() => result.current.launchRoutine('morning', ['c1', 'c2']))
    act(() => result.current.removeChild('c1'))
    expect(result.current.children.map(c => c.id)).toEqual(['c2'])
    expect(result.current.activeRoutines.map(ar => ar.childId)).toEqual(['c2'])
  })
})

// ---------------------------------------------------------------------------
// useAppState — récompenses (round-robin, sans doublon, reset de cycle)
// ---------------------------------------------------------------------------

describe('useAppState — récompenses', () => {
  it('unlockReward tire dans le pool de l’enfant, sans doublon', () => {
    const { result } = setupHook({})
    act(() => { result.current.unlockReward('c1') })
    act(() => { result.current.unlockReward('c1') })
    act(() => { result.current.unlockReward('c1') })

    const child = result.current.children.find(c => c.id === 'c1')!
    expect(child.unlockedImages).toHaveLength(3)
    expect(new Set(child.unlockedImages).size).toBe(3)
    expect(child.unlockedImages.every(id => id.startsWith('a-'))).toBe(true)
    expect(child.completedCycles).toBe(0)
  })

  it('le second enfant tire dans le second pool (round-robin par index)', () => {
    const { result } = setupHook({})
    act(() => { result.current.unlockReward('c2') })
    const child = result.current.children.find(c => c.id === 'c2')!
    expect(child.unlockedImages[0].startsWith('b-')).toBe(true)
  })

  it('pool épuisé : reset de cycle (unlockedImages repart, completedCycles +1)', () => {
    const { result } = setupHook({})
    for (let i = 0; i < 3; i++) {
      act(() => { result.current.unlockReward('c1') })
    }
    act(() => { result.current.unlockReward('c1') })

    const child = result.current.children.find(c => c.id === 'c1')!
    expect(child.unlockedImages).toHaveLength(1)
    expect(child.completedCycles).toBe(1)
  })

  it('removeReward retire une image (sanction)', () => {
    const { result } = setupHook({})
    act(() => { result.current.unlockReward('c1') })
    const imageId = result.current.children.find(c => c.id === 'c1')!.unlockedImages[0]
    act(() => result.current.removeReward('c1', imageId))
    expect(result.current.children.find(c => c.id === 'c1')!.unlockedImages).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// useAppState — minuteurs
// ---------------------------------------------------------------------------

describe('useAppState — minuteurs', () => {
  it('startTimer / cancelTimer', () => {
    const { result } = setupHook({})
    act(() => result.current.startTimer(['c1'], 300, 'Sortir du bain'))
    expect(result.current.activeTimers).toHaveLength(1)
    expect(result.current.activeTimers[0].label).toBe('Sortir du bain')
    expect(result.current.activeTimers[0].durationSeconds).toBe(300)

    const timerId = result.current.activeTimers[0].id
    act(() => result.current.cancelTimer(timerId))
    expect(result.current.activeTimers).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// useAppState — migration au chargement (end-to-end localStorage)
// ---------------------------------------------------------------------------

describe('useAppState — chargement état legacy', () => {
  it('un état V1 en localStorage ressort migré et persisté en V5', () => {
    seedState({
      children: [makeChild('c1', { unlockedImages: ['r03'], completedCycles: undefined })],
      routineTemplates: [{ id: 'evening', name: 'Soir', icon: '🌙', type: 'fixed', tasks: [] }],
      activeRoutines: [],
      activeTimers: [{ id: 't1', childIds: ['c1'], durationSeconds: 60, startedAt: new Date().toISOString() }],
    } as unknown as PersistedState)

    const { result } = renderHook(() => useAppState())

    expect(result.current.children[0].unlockedImages).toEqual([])
    expect(result.current.routineTemplates[0].scheduledDays).toEqual([1, 2, 3, 4, 5])
    expect(result.current.activeTimers[0].label).toBe('Minuteur')
    expect(result.current.onboardingCompleted).toBe(true)

    const persisted = JSON.parse(localStorage.getItem('routines-familiales')!)
    expect(persisted.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })
})
