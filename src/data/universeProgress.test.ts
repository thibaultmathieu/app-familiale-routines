import { describe, it, expect } from 'vitest'
import { allowedUniverseCount, daysUntilNextUnlock, familyDayComplete, pendingUniverseChoices } from './universeProgress'
import { ActiveRoutine, Child, RoutineTemplate } from '../types'

function makeChild(overrides: Partial<Child> = {}): Child {
  return {
    id: 'c1',
    name: 'Test',
    photo: '',
    color: '#A78BFA',
    unlockedImages: [],
    completedCycles: 0,
    ...overrides,
  }
}

describe('universeProgress — seuils de déblocage doux', () => {
  it('1 univers de base, +1 à 2 jours, puis un tous les 5 jours', () => {
    expect(allowedUniverseCount(0)).toBe(1)
    expect(allowedUniverseCount(1)).toBe(1)
    expect(allowedUniverseCount(2)).toBe(2)
    expect(allowedUniverseCount(6)).toBe(2)
    expect(allowedUniverseCount(7)).toBe(3)
    expect(allowedUniverseCount(11)).toBe(3)
    expect(allowedUniverseCount(12)).toBe(4)
  })

  it('pendingUniverseChoices est plafonné par les univers disponibles', () => {
    const child = makeChild({ unlockedUniverseIds: ['a'], routineDayCount: 100 })
    expect(pendingUniverseChoices(child, 0, 3)).toBe(2)
    expect(pendingUniverseChoices(child, 0, 1)).toBe(0)
  })

  it('daysUntilNextUnlock décompte vers le prochain seuil, null quand tout est possédé', () => {
    expect(daysUntilNextUnlock(makeChild({ unlockedUniverseIds: ['a'], routineDayCount: 0 }), 0, 6)).toBe(2)
    expect(daysUntilNextUnlock(makeChild({ unlockedUniverseIds: ['a'], routineDayCount: 1 }), 0, 6)).toBe(1)
    expect(daysUntilNextUnlock(makeChild({ unlockedUniverseIds: ['a', 'b'], routineDayCount: 2 }), 0, 6)).toBe(5)
    expect(daysUntilNextUnlock(makeChild({ unlockedUniverseIds: ['a', 'b', 'c'], routineDayCount: 7 }), 0, 6)).toBe(5)
    expect(daysUntilNextUnlock(makeChild({ unlockedUniverseIds: ['a', 'b'], routineDayCount: 0 }), 0, 2)).toBeNull()
  })
})

describe('familyDayComplete — bannière « nouvelle journée »', () => {
  const allDays = [0, 1, 2, 3, 4, 5, 6]
  const now = new Date()
  const makeTemplate = (id: string, childIds?: string[]): RoutineTemplate => ({
    id,
    name: id,
    icon: '📋',
    scheduledDays: allDays,
    tasks: [{ id: `${id}-t1`, label: 'tâche', icon: '📋', childIds }],
  })
  const makeInstance = (templateId: string, childId: string, done: boolean): ActiveRoutine => ({
    id: `${templateId}-${childId}`,
    templateId,
    childId,
    tasks: [{ taskId: `${templateId}-t1`, done }],
    startedAt: now.toISOString(),
    completedAt: done ? now.toISOString() : null,
  })
  const kids = [makeChild({ id: 'c1' }), makeChild({ id: 'c2' })]

  it('vraie seulement quand chaque enfant concerné a terminé toutes ses routines du jour', () => {
    const templates = [makeTemplate('morning')]
    expect(familyDayComplete(templates, [makeInstance('morning', 'c1', true)], kids, now)).toBe(false)
    expect(familyDayComplete(
      templates,
      [makeInstance('morning', 'c1', true), makeInstance('morning', 'c2', true)],
      kids,
      now
    )).toBe(true)
  })

  it("une routine ciblant un seul enfant n'exige rien de l'autre", () => {
    const templates = [makeTemplate('piano', ['c2'])]
    // c1 n'est concerné par rien → seul c2 compte
    expect(familyDayComplete(templates, [makeInstance('piano', 'c2', true)], kids, now)).toBe(true)
    expect(familyDayComplete(templates, [], kids, now)).toBe(false)
  })

  it('fausse sans routine programmée ce jour ou sans enfant concerné', () => {
    expect(familyDayComplete([], [], kids, now)).toBe(false)
    const notToday: RoutineTemplate = { ...makeTemplate('x'), scheduledDays: [] }
    expect(familyDayComplete([notToday], [], kids, now)).toBe(false)
  })
})
