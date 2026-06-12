import { describe, it, expect } from 'vitest'
import { allowedUniverseCount, daysUntilNextUnlock, pendingUniverseChoices } from './universeProgress'
import { Child } from '../types'

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
