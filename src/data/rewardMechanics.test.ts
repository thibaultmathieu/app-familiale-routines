import { describe, it, expect, vi } from 'vitest'
import { Child, RewardImage } from '../types'

// Pools contrôlés : 'a' et 'b' de 3 images (mêmes contrats que rewardImages.ts)
vi.mock('./rewardImages', () => {
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
    legacyUniverseIdForIndex,
    findRewardImage: (id: string) => Object.values(pools).flat().find(img => img.id === id),
  }
})

import { rarityOf, rarityWeight, hashString, seededRandom } from './rarity'
import { dailyDrawOrder, mysteryImageFor } from './mystery'
import { bonusStatusFor, totalUnlockedOf } from './bonusRewards'

function makeChild(overrides: Partial<Child> = {}): Child {
  return {
    id: 'c1',
    name: 'Éva',
    photo: '',
    color: '#A78BFA',
    unlockedImages: [],
    completedCycles: 0,
    universeId: 'a',
    unlockedUniverseIds: ['a'],
    ...overrides,
  }
}

describe('rarity', () => {
  it('est déterministe et distribue 1 légendaire + 1 rare + 1 commune par pool de 3', () => {
    const ids = ['a-001', 'a-002', 'a-003']
    const first = ids.map(rarityOf)
    const second = ids.map(rarityOf)
    expect(first).toEqual(second)
    expect([...first].sort()).toEqual(['commune', 'legendaire', 'rare'])
  })

  it('id inconnu → commune ; poids décroissants avec la rareté', () => {
    expect(rarityOf('pool-inconnu-999')).toBe('commune')
    expect(rarityWeight('commune')).toBeGreaterThan(rarityWeight('rare'))
    expect(rarityWeight('rare')).toBeGreaterThan(rarityWeight('legendaire'))
  })

  it('hash et RNG sont stables (mêmes entrées → mêmes sorties)', () => {
    expect(hashString('abc')).toBe(hashString('abc'))
    expect(seededRandom(42)()).toBe(seededRandom(42)())
    const r = seededRandom(7)()
    expect(r).toBeGreaterThanOrEqual(0)
    expect(r).toBeLessThan(1)
  })
})

describe('dailyDrawOrder / image mystère', () => {
  const pool: RewardImage[] = [
    { id: 'a-001', src: '' },
    { id: 'a-002', src: '' },
    { id: 'a-003', src: '' },
  ]

  it("l'ordre du jour est déterministe pour un enfant et un jour donnés", () => {
    const one = dailyDrawOrder('c1', '2026-07-02', pool).map(i => i.id)
    const two = dailyDrawOrder('c1', '2026-07-02', pool).map(i => i.id)
    expect(one).toEqual(two)
    expect([...one].sort()).toEqual(['a-001', 'a-002', 'a-003'])
  })

  it("l'image mystère est la première image verrouillée de l'ordre du jour", () => {
    const child = makeChild()
    const order = dailyDrawOrder('c1', dayKeyToday(), pool).map(i => i.id)
    expect(mysteryImageFor(child, 0)!.id).toBe(order[0])

    // L'image gagnée, le mystère avance à la suivante encore verrouillée
    const after = makeChild({ unlockedImages: [order[0]] })
    expect(mysteryImageFor(after, 0)!.id).toBe(order[1])
  })

  it('pool entièrement gagné → plus de mystère (null)', () => {
    const child = makeChild({ unlockedImages: ['a-001', 'a-002', 'a-003'] })
    expect(mysteryImageFor(child, 0)).toBeNull()
  })

  function dayKeyToday(): string {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }
})

describe('bons cadeaux', () => {
  const bonuses = [
    { id: 'b1', label: 'Soirée pizza', emoji: '🍕', threshold: 3 },
    { id: 'b2', label: 'Sortie vélo', emoji: '🚲', threshold: 5, childIds: ['c2'] },
    { id: 'b3', label: 'Ciné', emoji: '🎬', threshold: 10 },
  ]

  it('totalUnlockedOf : compteur cumulé, fallback sur la collection actuelle', () => {
    expect(totalUnlockedOf(makeChild({ unlockedImages: ['a-001'] }))).toBe(1)
    expect(totalUnlockedOf(makeChild({ unlockedImages: ['a-001'], totalUnlocked: 7 }))).toBe(7)
  })

  it('statut : atteint / prochain, en filtrant par enfant concerné', () => {
    const child = makeChild({ totalUnlocked: 4 })
    const status = bonusStatusFor(child, bonuses)
    // b1 atteint (3 ≤ 4), b2 ne concerne pas c1, b3 est le prochain (10)
    expect(status.reached.map(b => b.id)).toEqual(['b1'])
    expect(status.next!.bonus.id).toBe('b3')
    expect(status.next!.remaining).toBe(6)
  })

  it('un bon remis (claimedBonuses) sort de la liste « atteints »', () => {
    const child = makeChild({ totalUnlocked: 4, claimedBonuses: ['b1'] })
    expect(bonusStatusFor(child, bonuses).reached).toEqual([])
  })

  it('les bons ciblés sur un autre enfant sont invisibles', () => {
    const c2 = makeChild({ id: 'c2', totalUnlocked: 6 })
    const status = bonusStatusFor(c2, bonuses)
    expect(status.reached.map(b => b.id)).toEqual(['b1', 'b2'])
  })
})
