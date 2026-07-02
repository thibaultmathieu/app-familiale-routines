import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  migrateState,
  useAppState,
  CURRENT_SCHEMA_VERSION,
  MAX_ROUTINE_TEMPLATES,
  MAX_ACTIVE_TIMERS,
  ONBOARDING_REPLAY_BACKUP_KEY,
  PersistedState,
} from './useAppState'
import { RoutineTemplate } from '../types'

// Petits pools contrôlés pour tester le cycle de récompenses (3 images par pool).
// Reproduit le contrat de src/data/rewardImages.ts avec deux univers 'a' et 'b'.
vi.mock('../data/rewardImages', () => {
  const pools: Record<string, { id: string; src: string }[]> = {
    a: [
      { id: 'a-001', src: '/rewards/a/a-001.png' },
      { id: 'a-002', src: '/rewards/a/a-002.png' },
      { id: 'a-003', src: '/rewards/a/a-003.png' },
    ],
    b: [
      { id: 'b-001', src: '/rewards/b/b-001.png' },
      { id: 'b-002', src: '/rewards/b/b-002.png' },
      { id: 'b-003', src: '/rewards/b/b-003.png' },
    ],
  }
  const poolKeys = Object.keys(pools)
  const legacyUniverseIdForIndex = (i: number) => poolKeys[i % poolKeys.length]
  const resolveUniverseId = (child: { universeId?: string }, i: number) =>
    child.universeId && pools[child.universeId] ? child.universeId : legacyUniverseIdForIndex(i)
  return {
    getRewardImagesForUniverse: (id: string) => pools[id] ?? [],
    resolveUniverseId,
    getRewardImagesForChildEntry: (child: { universeId?: string }, i: number) =>
      pools[resolveUniverseId(child, i)] ?? [],
    getRewardImagesForChild: (i: number) => pools[legacyUniverseIdForIndex(i)],
    legacyUniverseIdForIndex,
    findRewardImage: (id: string) => Object.values(pools).flat().find(img => img.id === id),
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
      children: [makeChild('c1', { unlockedImages: ['a-001', 'a-003'] })],
      routineTemplates: [twoTaskTemplate],
      activeRoutines: [],
      activeTimers: [],
    } as unknown as PersistedState

    const out = migrateState(state)
    expect(out.children[0].unlockedImages).toEqual(['a-001', 'a-003'])
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

  it('V5→V6 : fige l’univers de chaque enfant selon son index (round-robin legacy)', () => {
    const state = {
      children: [makeChild('c1'), makeChild('c2'), makeChild('c3')],
      routineTemplates: [],
      activeRoutines: [],
      activeTimers: [],
      schemaVersion: 5,
      onboardingCompleted: true,
    } as unknown as PersistedState

    const out = migrateState(state)
    expect(out.children.map(c => c.universeId)).toEqual(['a', 'b', 'a'])
    expect(out.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('V6→V7 : re-mappe un univers disparu et retire les IDs d\'images orphelins', () => {
    const state = {
      children: [
        makeChild('c1', { universeId: 'evangelina', unlockedImages: ['evangelina-001', 'a-002', 'noah-010'] }),
        makeChild('c2', { universeId: 'b', unlockedImages: ['b-001'] }),
      ],
      routineTemplates: [],
      activeRoutines: [],
      activeTimers: [],
      schemaVersion: 6,
      onboardingCompleted: true,
    } as unknown as PersistedState

    const out = migrateState(state)
    // c1 : pool 'evangelina' disparu → retombe sur l'attribution par index ; IDs morts purgés
    expect(out.children[0].universeId).toBe('a')
    expect(out.children[0].unlockedImages).toEqual(['a-002'])
    // c2 : univers valide et IDs vivants → intacts
    expect(out.children[1].universeId).toBe('b')
    expect(out.children[1].unlockedImages).toEqual(['b-001'])
    // Progression univers initialisée : l'univers actif est possédé, compteur à zéro
    expect(out.children[0].unlockedUniverseIds).toEqual(['a'])
    expect(out.children[1].unlockedUniverseIds).toEqual(['b'])
    expect(out.children.every(c => c.routineDayCount === 0)).toBe(true)
  })

  it('V6→V7 : retire la tâche « pipi » du template du soir et des instances actives', () => {
    const evening: RoutineTemplate = {
      id: 'evening',
      name: 'Routine du soir',
      icon: '🌙',
      scheduledDays: [1, 2, 3, 4, 5],
      tasks: [
        { id: 'e1', label: 'je débarrasse la table', icon: '🍽️' },
        { id: 'e2', label: 'je me lave les dents', icon: '🪥' },
        { id: 'e3', label: "j'ai bien fait pipi 3 fois aujourd'hui", icon: '🚽' },
      ],
    }
    const state = {
      children: [],
      routineTemplates: [evening],
      activeRoutines: [
        {
          id: 'evening-c1-1',
          templateId: 'evening',
          childId: 'c1',
          tasks: [
            { taskId: 'e1', done: true },
            { taskId: 'e2', done: true },
            { taskId: 'e3', done: false },
          ],
          startedAt: new Date().toISOString(),
          completedAt: null,
        },
      ],
      activeTimers: [],
      schemaVersion: 6,
      onboardingCompleted: true,
    } as unknown as PersistedState

    const out = migrateState(state)
    expect(out.routineTemplates.find(r => r.id === 'evening')!.tasks.map(t => t.id)).toEqual(['e1', 'e2'])
    // L'instance perd la tâche retirée et se complète (les deux restantes sont faites)
    expect(out.activeRoutines[0].tasks.map(t => t.taskId)).toEqual(['e1', 'e2'])
    expect(out.activeRoutines[0].completedAt).not.toBeNull()
  })

  it('V6→V7 : une tâche e3 renommée par les parents est conservée', () => {
    const state = {
      children: [],
      routineTemplates: [
        {
          id: 'evening',
          name: 'Soir',
          icon: '🌙',
          tasks: [{ id: 'e3', label: 'je range ma chambre', icon: '🧸' }],
        },
      ],
      activeRoutines: [],
      activeTimers: [],
      schemaVersion: 6,
      onboardingCompleted: true,
    } as unknown as PersistedState

    const out = migrateState(state)
    expect(out.routineTemplates[0].tasks.map(t => t.id)).toEqual(['e3'])
  })

  it('V7→V8 : initialise le total cumulé, les bons remis et la liste des bons', () => {
    const state = {
      children: [makeChild('c1', { unlockedImages: ['a-001', 'b-002'] })],
      routineTemplates: [],
      activeRoutines: [],
      activeTimers: [],
      schemaVersion: 7,
      onboardingCompleted: true,
    } as unknown as PersistedState

    const out = migrateState(state)
    expect(out.children[0].totalUnlocked).toBe(2)
    expect(out.children[0].claimedBonuses).toEqual([])
    expect(out.bonusRewards).toEqual([])
    expect(out.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('état déjà à jour : retourne la même référence (pas de boucle de re-render)', () => {
    const state: PersistedState = {
      children: [makeChild('c1', { totalUnlocked: 0, claimedBonuses: [] })],
      routineTemplates: [twoTaskTemplate],
      activeRoutines: [],
      activeTimers: [],
      schemaVersion: CURRENT_SCHEMA_VERSION,
      onboardingCompleted: false,
      bonusRewards: [],
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

  it('launchRoutine n\'instancie pas un enfant sans aucune tâche applicable', () => {
    const template: RoutineTemplate = {
      ...twoTaskTemplate,
      id: 'solo',
      tasks: [
        { id: 's1', label: 'pour c1', icon: '📋', childIds: ['c1'] },
        { id: 's2', label: 'pour c1 aussi', icon: '📋', childIds: ['c1'] },
      ],
    }
    const { result } = setupHook({ routineTemplates: [template] })
    act(() => result.current.launchRoutine('solo', ['c1', 'c2']))
    // c2 n'a aucune tâche → pas d'instance « vide » terminée d'office
    expect(result.current.activeRoutines.map(ar => ar.childId)).toEqual(['c1'])
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

  it('les routines éphémères sont purgées par resetAllRoutines, pas les pérennes', () => {
    const { result } = setupHook({})
    let ephemeralId = ''
    act(() => {
      ephemeralId = result.current.addRoutine({ name: 'À la volée', icon: '📋', ephemeral: true, tasks: [] })
    })
    act(() => result.current.resetAllRoutines())

    expect(result.current.routineTemplates.find(r => r.id === ephemeralId)).toBeUndefined()
    expect(result.current.routineTemplates.find(r => r.id === 'morning')).toBeDefined()
  })

  it('une routine éphémère éditée devient pérenne', () => {
    const { result } = setupHook({})
    let ephemeralId = ''
    act(() => {
      ephemeralId = result.current.addRoutine({ name: 'À la volée', icon: '📋', ephemeral: true, tasks: [] })
    })
    act(() => result.current.updateRoutine(ephemeralId, { name: 'Gardée' }))
    act(() => result.current.resetAllRoutines())

    expect(result.current.routineTemplates.find(r => r.id === ephemeralId)?.name).toBe('Gardée')
  })

  it('plafond de templates : addRoutine au-delà de la limite est ignoré', () => {
    const templates = Array.from({ length: MAX_ROUTINE_TEMPLATES }, (_, i) => ({
      ...twoTaskTemplate,
      id: `r-${i}`,
    }))
    const { result } = setupHook({ routineTemplates: templates })
    act(() => { result.current.addRoutine({ name: 'Trop', icon: '📋', tasks: [] }) })
    expect(result.current.routineTemplates).toHaveLength(MAX_ROUTINE_TEMPLATES)
  })

  it('plafond de minuteurs : startTimer au-delà de la limite est ignoré', () => {
    const { result } = setupHook({})
    for (let i = 0; i < MAX_ACTIVE_TIMERS + 2; i++) {
      act(() => result.current.startTimer(['c1'], 60, `T${i}`))
    }
    expect(result.current.activeTimers).toHaveLength(MAX_ACTIVE_TIMERS)
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

  it('unlockReward retourne l’image effectivement débloquée', () => {
    const { result } = setupHook({})
    let returned: { id: string } | null = null
    act(() => { returned = result.current.unlockReward('c1') })

    const child = result.current.children.find(c => c.id === 'c1')!
    expect(returned).not.toBeNull()
    expect(child.unlockedImages).toEqual([returned!.id])
  })

  it('setChildUniverse change le pool de tirage sans perdre les images des autres univers', () => {
    const { result } = setupHook({})
    act(() => { result.current.unlockReward('c1') })
    const fromA = result.current.children.find(c => c.id === 'c1')!.unlockedImages[0]
    expect(fromA.startsWith('a-')).toBe(true)

    act(() => result.current.setChildUniverse('c1', 'b'))
    act(() => { result.current.unlockReward('c1') })

    const child = result.current.children.find(c => c.id === 'c1')!
    expect(child.universeId).toBe('b')
    expect(child.unlockedImages).toContain(fromA)
    expect(child.unlockedImages.some(id => id.startsWith('b-'))).toBe(true)
  })

  it('le reset de cycle ne touche que les images de l’univers courant', () => {
    const { result } = setupHook({
      children: [
        makeChild('c1', { name: 'Éva', universeId: 'a', unlockedImages: ['b-001', 'b-002'] }),
        makeChild('c2', { name: 'Noé', universeId: 'b' }),
      ],
    })
    // Épuise le pool 'a' (3 images) puis déclenche le reset de cycle
    for (let i = 0; i < 3; i++) {
      act(() => { result.current.unlockReward('c1') })
    }
    act(() => { result.current.unlockReward('c1') })

    const child = result.current.children.find(c => c.id === 'c1')!
    expect(child.completedCycles).toBe(1)
    // Les images de l'univers 'b' restent acquises, le pool 'a' est reparti à 1
    expect(child.unlockedImages).toContain('b-001')
    expect(child.unlockedImages).toContain('b-002')
    expect(child.unlockedImages.filter(id => id.startsWith('a-'))).toHaveLength(1)
  })

  it('multi-univers : unlockReward tire dans TOUS les univers possédés', () => {
    const { result } = setupHook({
      children: [makeChild('c1', { universeId: 'a', unlockedUniverseIds: ['a', 'b'] })],
    })
    // 6 images au total (3 'a' + 3 'b') : toutes obtenables avant tout reset
    for (let i = 0; i < 6; i++) {
      act(() => { result.current.unlockReward('c1') })
    }
    const child = result.current.children.find(c => c.id === 'c1')!
    expect(child.unlockedImages).toHaveLength(6)
    expect(new Set(child.unlockedImages).size).toBe(6)
    expect(child.unlockedImages.some(id => id.startsWith('a-'))).toBe(true)
    expect(child.unlockedImages.some(id => id.startsWith('b-'))).toBe(true)
    expect(child.completedCycles).toBe(0)
  })

  it('multi-univers : le reset de cycle n\'arrive qu\'une fois tous les univers épuisés', () => {
    const { result } = setupHook({
      children: [makeChild('c1', { universeId: 'a', unlockedUniverseIds: ['a', 'b'] })],
    })
    for (let i = 0; i < 6; i++) {
      act(() => { result.current.unlockReward('c1') })
    }
    // 7e tirage : pool combiné (6 images) épuisé → reset de cycle
    act(() => { result.current.unlockReward('c1') })
    const child = result.current.children.find(c => c.id === 'c1')!
    expect(child.completedCycles).toBe(1)
    expect(child.unlockedImages).toHaveLength(1)
  })

  it('removeReward retire une image (sanction)', () => {
    const { result } = setupHook({})
    act(() => { result.current.unlockReward('c1') })
    const imageId = result.current.children.find(c => c.id === 'c1')!.unlockedImages[0]
    act(() => result.current.removeReward('c1', imageId))
    expect(result.current.children.find(c => c.id === 'c1')!.unlockedImages).toHaveLength(0)
  })

  it("unlockReward attribue l'image mystère annoncée (ordre du jour déterministe)", async () => {
    const { mysteryImageFor } = await import('../data/mystery')
    const { result } = setupHook({})
    const before = result.current.children.find(c => c.id === 'c1')!
    const expected = mysteryImageFor(before, 0)!
    let returned: { id: string } | null = null
    act(() => { returned = result.current.unlockReward('c1') })
    expect(returned!.id).toBe(expected.id)
  })

  it('totalUnlocked cumule sans jamais baisser (cycles et sanctions compris)', () => {
    const { result } = setupHook({})
    for (let i = 0; i < 3; i++) {
      act(() => { result.current.unlockReward('c1') })
    }
    let child = result.current.children.find(c => c.id === 'c1')!
    expect(child.totalUnlocked).toBe(3)

    // Sanction : la collection baisse, pas le total
    act(() => result.current.removeReward('c1', child.unlockedImages[0]))
    child = result.current.children.find(c => c.id === 'c1')!
    expect(child.unlockedImages).toHaveLength(2)
    expect(child.totalUnlocked).toBe(3)

    // Le pool (3 images, 1 retirée) se complète puis repart en cycle : total toujours croissant
    act(() => { result.current.unlockReward('c1') })
    act(() => { result.current.unlockReward('c1') })
    child = result.current.children.find(c => c.id === 'c1')!
    expect(child.completedCycles).toBe(1)
    expect(child.totalUnlocked).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// useAppState — bons cadeaux (récompenses réelles)
// ---------------------------------------------------------------------------

describe('useAppState — bons cadeaux', () => {
  it('cycle de vie : créer → atteindre → marquer remis → supprimer', async () => {
    const { bonusStatusFor } = await import('../data/bonusRewards')
    const { result } = setupHook({})

    act(() => result.current.addBonusReward({ label: 'Soirée pizza', emoji: '🍕', threshold: 2 }))
    expect(result.current.bonusRewards).toHaveLength(1)
    const bonusId = result.current.bonusRewards[0].id

    // 1 image : pas encore atteint, c'est le prochain objectif
    act(() => { result.current.unlockReward('c1') })
    let child = result.current.children.find(c => c.id === 'c1')!
    let status = bonusStatusFor(child, result.current.bonusRewards)
    expect(status.reached).toHaveLength(0)
    expect(status.next!.remaining).toBe(1)

    // 2 images : atteint
    act(() => { result.current.unlockReward('c1') })
    child = result.current.children.find(c => c.id === 'c1')!
    status = bonusStatusFor(child, result.current.bonusRewards)
    expect(status.reached.map(b => b.id)).toEqual([bonusId])

    // Remis par un parent : sort des « atteints »
    act(() => result.current.markBonusGiven('c1', bonusId))
    child = result.current.children.find(c => c.id === 'c1')!
    expect(child.claimedBonuses).toEqual([bonusId])
    expect(bonusStatusFor(child, result.current.bonusRewards).reached).toHaveLength(0)

    // Suppression : le bon disparaît et la trace « remis » est purgée
    act(() => result.current.deleteBonusReward(bonusId))
    expect(result.current.bonusRewards).toHaveLength(0)
    expect(result.current.children.find(c => c.id === 'c1')!.claimedBonuses).toEqual([])
  })

  it('markBonusGiven est idempotent', () => {
    const { result } = setupHook({})
    act(() => result.current.addBonusReward({ label: 'Ciné', emoji: '🎬', threshold: 1 }))
    const bonusId = result.current.bonusRewards[0].id
    act(() => result.current.markBonusGiven('c1', bonusId))
    act(() => result.current.markBonusGiven('c1', bonusId))
    expect(result.current.children.find(c => c.id === 'c1')!.claimedBonuses).toEqual([bonusId])
  })
})

// ---------------------------------------------------------------------------
// useAppState — progression des univers (déblocage doux)
// ---------------------------------------------------------------------------

const allDays = [0, 1, 2, 3, 4, 5, 6]
// Programmées tous les jours : les tests de progression ne dépendent pas du jour d'exécution
const morningDaily: RoutineTemplate = { ...twoTaskTemplate, scheduledDays: allDays }
const eveningDaily: RoutineTemplate = {
  id: 'evening',
  name: 'Routine du soir',
  icon: '🌙',
  scheduledDays: allDays,
  tasks: [{ id: 'e1', label: 'je me lave les dents', icon: '🪥' }],
}

describe('useAppState — progression des univers', () => {
  it('compléter la seule routine programmée compte un jour, une seule fois par jour', () => {
    const { result } = setupHook({ routineTemplates: [morningDaily] })
    act(() => result.current.launchRoutine('morning', ['c1']))
    const routineId = result.current.activeRoutines[0].id

    act(() => result.current.toggleTask(routineId, 'm1'))
    expect(result.current.children.find(c => c.id === 'c1')!.routineDayCount ?? 0).toBe(0)

    act(() => result.current.toggleTask(routineId, 'm2'))
    expect(result.current.children.find(c => c.id === 'c1')!.routineDayCount).toBe(1)

    // Une seconde routine terminée le même jour ne recompte pas
    act(() => result.current.resetChildRoutine('c1'))
    act(() => result.current.toggleTask(routineId, 'm1'))
    act(() => result.current.toggleTask(routineId, 'm2'))
    expect(result.current.children.find(c => c.id === 'c1')!.routineDayCount).toBe(1)
  })

  it('la journée ne compte que quand TOUTES les routines programmées du jour sont terminées (bug Noah)', () => {
    const { result } = setupHook({ routineTemplates: [morningDaily, eveningDaily] })
    act(() => result.current.launchRoutine('morning', ['c1']))
    const morningId = result.current.activeRoutines.find(ar => ar.templateId === 'morning')!.id
    act(() => result.current.toggleTask(morningId, 'm1'))
    act(() => result.current.toggleTask(morningId, 'm2'))
    // Le matin est terminé mais la routine du soir programmée reste à faire
    expect(result.current.children.find(c => c.id === 'c1')!.routineDayCount ?? 0).toBe(0)

    act(() => result.current.launchRoutine('evening', ['c1']))
    const eveningId = result.current.activeRoutines.find(ar => ar.templateId === 'evening')!.id
    act(() => result.current.toggleTask(eveningId, 'e1'))
    expect(result.current.children.find(c => c.id === 'c1')!.routineDayCount).toBe(1)
  })

  it('une mission express seule ne compte pas la journée si une routine programmée reste à faire', () => {
    const { result } = setupHook({ routineTemplates: [morningDaily] })
    let missionId = ''
    act(() => {
      missionId = result.current.addRoutine({
        name: 'Mission',
        icon: '🎯',
        ephemeral: true,
        tasks: [{ id: 'x1', label: 'ranger le salon', icon: '🎯' }],
      })
    })
    act(() => result.current.launchRoutine(missionId, ['c1']))
    const missionInstance = result.current.activeRoutines.find(ar => ar.templateId === missionId)!
    act(() => result.current.toggleTask(missionInstance.id, 'x1'))
    expect(result.current.children.find(c => c.id === 'c1')!.routineDayCount ?? 0).toBe(0)

    act(() => result.current.launchRoutine('morning', ['c1']))
    const morningInstance = result.current.activeRoutines.find(ar => ar.templateId === 'morning')!
    act(() => result.current.toggleTask(morningInstance.id, 'm1'))
    act(() => result.current.toggleTask(morningInstance.id, 'm2'))
    expect(result.current.children.find(c => c.id === 'c1')!.routineDayCount).toBe(1)
  })

  it("un jour sans routine programmée compte dès qu'une routine est terminée", () => {
    const onDemand: RoutineTemplate = {
      id: 'weekend',
      name: 'Week-end',
      icon: '🎈',
      tasks: [{ id: 'w1', label: 'ranger sa chambre', icon: '🎈' }],
    }
    const { result } = setupHook({ routineTemplates: [onDemand] })
    act(() => result.current.launchRoutine('weekend', ['c1']))
    const id = result.current.activeRoutines[0].id
    act(() => result.current.toggleTask(id, 'w1'))
    expect(result.current.children.find(c => c.id === 'c1')!.routineDayCount).toBe(1)
  })

  it("une routine terminée hier ne compte pas pour la journée d'aujourd'hui", () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString()
    const { result } = setupHook({
      routineTemplates: [morningDaily, eveningDaily],
      activeRoutines: [{
        id: 'morning-c1-old',
        templateId: 'morning',
        childId: 'c1',
        tasks: [{ taskId: 'm1', done: true }, { taskId: 'm2', done: true }],
        startedAt: yesterday,
        completedAt: yesterday,
      }],
    })
    act(() => result.current.launchRoutine('evening', ['c1']))
    const eveningId = result.current.activeRoutines.find(ar => ar.templateId === 'evening')!.id
    act(() => result.current.toggleTask(eveningId, 'e1'))
    // Le matin n'a pas été lancé AUJOURD'HUI → journée incomplète
    expect(result.current.children.find(c => c.id === 'c1')!.routineDayCount ?? 0).toBe(0)
  })

  it('la journée compte par enfant, indépendamment', () => {
    const { result } = setupHook({ routineTemplates: [morningDaily] })
    act(() => result.current.launchRoutine('morning', ['c1', 'c2']))
    const c1Routine = result.current.activeRoutines.find(ar => ar.childId === 'c1')!
    act(() => result.current.toggleTask(c1Routine.id, 'm1'))
    act(() => result.current.toggleTask(c1Routine.id, 'm2'))
    expect(result.current.children.find(c => c.id === 'c1')!.routineDayCount).toBe(1)
    expect(result.current.children.find(c => c.id === 'c2')!.routineDayCount ?? 0).toBe(0)
  })

  it("réinitialiser une instance de la veille la re-date : la journée d'aujourd'hui peut compter", () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString()
    const { result } = setupHook({
      routineTemplates: [morningDaily],
      activeRoutines: [{
        id: 'morning-c1-old',
        templateId: 'morning',
        childId: 'c1',
        tasks: [{ taskId: 'm1', done: true }, { taskId: 'm2', done: true }],
        startedAt: yesterday,
        completedAt: yesterday,
      }],
    })
    // Le matin, un parent réinitialise la routine restée de la veille…
    act(() => result.current.resetRoutine('morning'))
    const instance = result.current.activeRoutines[0]
    expect(instance.completedAt).toBeNull()
    // …l'enfant la refait aujourd'hui : elle compte (startedAt re-daté)
    act(() => result.current.toggleTask(instance.id, 'm1'))
    act(() => result.current.toggleTask(instance.id, 'm2'))
    expect(result.current.children.find(c => c.id === 'c1')!.routineDayCount).toBe(1)
  })

  it("une routine programmée qui ne concerne pas l'enfant n'est pas exigée pour sa journée", () => {
    const onlyC2: RoutineTemplate = {
      id: 'piano',
      name: 'Piano',
      icon: '🎹',
      scheduledDays: allDays,
      tasks: [{ id: 'p1', label: 'répéter le piano', icon: '🎹', childIds: ['c2'] }],
    }
    const { result } = setupHook({ routineTemplates: [morningDaily, onlyC2] })
    act(() => result.current.launchRoutine('morning', ['c1']))
    const id = result.current.activeRoutines[0].id
    act(() => result.current.toggleTask(id, 'm1'))
    act(() => result.current.toggleTask(id, 'm2'))
    // 'piano' ne concerne que c2 → la journée de c1 est complète sans lui
    expect(result.current.children.find(c => c.id === 'c1')!.routineDayCount).toBe(1)
  })

  it('un jour différent du dernier jour compté incrémente à nouveau', () => {
    const { result } = setupHook({
      children: [makeChild('c1', { routineDayCount: 3, lastRoutineDay: '2026-01-01' })],
    })
    act(() => result.current.launchRoutine('morning', ['c1']))
    const routineId = result.current.activeRoutines[0].id
    act(() => result.current.toggleTask(routineId, 'm1'))
    act(() => result.current.toggleTask(routineId, 'm2'))
    expect(result.current.children.find(c => c.id === 'c1')!.routineDayCount).toBe(4)
  })

  it('addChildUniverse ajoute l\'univers aux possessions et le rend actif', () => {
    const { result } = setupHook({
      children: [makeChild('c1', { universeId: 'a', unlockedUniverseIds: ['a'] })],
    })
    act(() => result.current.addChildUniverse('c1', 'b'))
    const child = result.current.children.find(c => c.id === 'c1')!
    expect(child.unlockedUniverseIds).toEqual(['a', 'b'])
    expect(child.universeId).toBe('b')

    // Idempotent : ré-ajouter un univers possédé ne crée pas de doublon
    act(() => result.current.addChildUniverse('c1', 'b'))
    expect(result.current.children.find(c => c.id === 'c1')!.unlockedUniverseIds).toEqual(['a', 'b'])
  })
})

// ---------------------------------------------------------------------------
// useAppState — test de l'onboarding en bac à sable (replay + restauration)
// ---------------------------------------------------------------------------

describe('useAppState — revivre l\'onboarding', () => {
  it('startOnboardingReplay repart comme une installation neuve, la sauvegarde existe', () => {
    const { result } = setupHook({
      children: [makeChild('c1', { name: 'Éva', unlockedImages: ['a-001', 'a-002'], totalUnlocked: 2 })],
    })
    act(() => result.current.startOnboardingReplay())

    expect(result.current.onboardingCompleted).toBe(false)
    expect(result.current.children).toHaveLength(0)
    expect(localStorage.getItem(ONBOARDING_REPLAY_BACKUP_KEY)).not.toBeNull()
  })

  it('terminer le test restaure intégralement les données réelles (collections comprises)', () => {
    const { result } = setupHook({
      children: [makeChild('c1', { name: 'Éva', unlockedImages: ['a-001', 'a-002'], totalUnlocked: 2, claimedBonuses: [] })],
      bonusRewards: [{ id: 'b1', label: 'Pizza', emoji: '🍕', threshold: 5 }],
    })
    act(() => result.current.startOnboardingReplay())

    // Pendant le test : l'utilisateur crée des enfants bac à sable
    act(() => result.current.addChild({ id: 'sandbox-1', name: 'Test', photo: '', color: '#fff' }))
    expect(result.current.children).toHaveLength(1)

    act(() => result.current.completeOnboarding())

    // Restauration : l'enfant réel et sa collection sont revenus, le bac à sable a disparu
    expect(result.current.onboardingCompleted).toBe(true)
    expect(result.current.children.map(c => c.name)).toEqual(['Éva'])
    expect(result.current.children[0].unlockedImages).toEqual(['a-001', 'a-002'])
    expect(result.current.children[0].totalUnlocked).toBe(2)
    expect(result.current.bonusRewards.map(b => b.label)).toEqual(['Pizza'])
    expect(localStorage.getItem(ONBOARDING_REPLAY_BACKUP_KEY)).toBeNull()
    expect(result.current.currentScreen).toBe('home')
  })

  it('completeOnboarding sans sauvegarde de test garde le comportement normal', () => {
    const { result } = setupHook({ onboardingCompleted: false })
    act(() => result.current.completeOnboarding())
    expect(result.current.onboardingCompleted).toBe(true)
    expect(result.current.children).toHaveLength(2)
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
