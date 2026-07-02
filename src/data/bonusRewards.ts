import { BonusReward, Child } from '../types'

/**
 * Bons cadeaux — le pont entre la collection numérique et le monde réel :
 * les parents définissent des récompenses réelles (« Soirée pizza à 20
 * images ») déclenchées par le TOTAL d'images gagnées depuis le début.
 * Ce total ne baisse jamais (ni cycles, ni sanctions) : un bon gagné ne se
 * reprend pas. Un parent marque le bon « remis » quand il l'honore.
 */

/** Total d'images gagnées depuis toujours (fallback : collection actuelle). */
export function totalUnlockedOf(child: Child): number {
  return child.totalUnlocked ?? child.unlockedImages.length
}

export interface ChildBonusStatus {
  /** Bons atteints, pas encore remis par un parent (seuil croissant). */
  reached: BonusReward[]
  /** Prochain bon à atteindre, avec le nombre d'images restantes. */
  next: { bonus: BonusReward; remaining: number } | null
}

export function bonusStatusFor(child: Child, bonuses: BonusReward[]): ChildBonusStatus {
  const total = totalUnlockedOf(child)
  const claimed = new Set(child.claimedBonuses ?? [])
  const applicable = bonuses.filter(b => !b.childIds || b.childIds.includes(child.id))
  const reached = applicable
    .filter(b => total >= b.threshold && !claimed.has(b.id))
    .sort((a, b) => a.threshold - b.threshold)
  const upcoming = applicable
    .filter(b => total < b.threshold)
    .sort((a, b) => a.threshold - b.threshold)
  return {
    reached,
    next: upcoming.length > 0 ? { bonus: upcoming[0], remaining: upcoming[0].threshold - total } : null,
  }
}
