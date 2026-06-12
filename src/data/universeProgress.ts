import { Child } from '../types'
import { resolveUniverseId } from './rewardImages'

/**
 * Progression des univers — gamification douce :
 * l'enfant choisit son premier univers à la création, en débloque un nouveau
 * après FIRST_UNLOCK_DAYS jours de routines réussies, puis un autre tous les
 * NEXT_UNLOCK_INTERVAL_DAYS jours. Pas de streak, pas de perte : un jour
 * compte dès qu'au moins une routine est terminée, et rien ne se dégrade
 * les jours sans routine.
 */
export const FIRST_UNLOCK_DAYS = 2
export const NEXT_UNLOCK_INTERVAL_DAYS = 5

/** Jour local au format YYYY-MM-DD (clé de comptage des jours de routines). */
export function localDayKey(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Nombre total d'univers auxquels `dayCount` jours de routines donnent droit. */
export function allowedUniverseCount(dayCount: number): number {
  if (dayCount < FIRST_UNLOCK_DAYS) return 1
  return 2 + Math.floor((dayCount - FIRST_UNLOCK_DAYS) / NEXT_UNLOCK_INTERVAL_DAYS)
}

/** Univers possédés par l'enfant (fallback : son univers actif résolu). */
export function ownedUniverseIds(child: Child, childIndex: number): string[] {
  if (child.unlockedUniverseIds?.length) return child.unlockedUniverseIds
  const resolved = resolveUniverseId(child, childIndex)
  return resolved ? [resolved] : []
}

/** Nombre de nouveaux univers que l'enfant peut choisir maintenant. */
export function pendingUniverseChoices(child: Child, childIndex: number, totalAvailable: number): number {
  const owned = ownedUniverseIds(child, childIndex).length
  if (owned === 0) return 0
  const allowed = Math.min(allowedUniverseCount(child.routineDayCount ?? 0), totalAvailable)
  return Math.max(0, allowed - owned)
}

/**
 * Jours de routines réussies restant avant le prochain déblocage.
 * `null` si tous les univers disponibles sont déjà possédés.
 */
export function daysUntilNextUnlock(child: Child, childIndex: number, totalAvailable: number): number | null {
  const owned = ownedUniverseIds(child, childIndex).length
  if (owned >= totalAvailable) return null
  const nextThreshold = FIRST_UNLOCK_DAYS + (Math.max(owned, 1) - 1) * NEXT_UNLOCK_INTERVAL_DAYS
  return Math.max(0, nextThreshold - (child.routineDayCount ?? 0))
}
