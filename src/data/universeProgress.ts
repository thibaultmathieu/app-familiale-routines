import { ActiveRoutine, Child, RewardImage, RoutineTemplate } from '../types'
import { getRewardImagesForUniverse, resolveUniverseId } from './rewardImages'

/**
 * Progression des univers — gamification douce :
 * l'enfant choisit son premier univers à la création, en débloque un nouveau
 * après FIRST_UNLOCK_DAYS journées de routines complètes, puis un autre tous
 * les NEXT_UNLOCK_INTERVAL_DAYS. Une journée compte quand TOUTES les routines
 * programmées du jour qui concernent l'enfant ont été lancées aujourd'hui et
 * terminées (un jour sans programme compte dès qu'une routine à la demande ou
 * une mission est terminée) — même règle que la bannière « nouvelle journée ».
 * Pas de streak, pas de perte : rien ne se dégrade les jours sans routine.
 */
export const FIRST_UNLOCK_DAYS = 2
export const NEXT_UNLOCK_INTERVAL_DAYS = 5

/** Jour local au format YYYY-MM-DD (clé de comptage des jours de routines). */
export function localDayKey(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Routines programmées un jour donné (scheduledDays non vide contenant ce jour). */
export function scheduledTemplatesForDay(templates: RoutineTemplate[], date: Date = new Date()): RoutineTemplate[] {
  const day = date.getDay()
  return templates.filter(r => r.scheduledDays && r.scheduledDays.length > 0 && r.scheduledDays.includes(day))
}

/** Une routine concerne un enfant si au moins une de ses tâches s'applique à lui. */
export function templateAppliesToChild(template: RoutineTemplate, childId: string): boolean {
  return template.tasks.some(t => !t.childIds || t.childIds.includes(childId))
}

/**
 * Journée de routines complète pour UN enfant : toutes les routines programmées
 * du jour qui le concernent ont été lancées aujourd'hui ET terminées, et au
 * moins une routine a été terminée aujourd'hui (un jour sans programme compte
 * via une routine à la demande ou une mission express). C'est la règle qui
 * fait avancer la progression d'univers — alignée sur la bannière d'accueil.
 */
export function childDayComplete(
  templates: RoutineTemplate[],
  activeRoutines: ActiveRoutine[],
  childId: string,
  date: Date = new Date()
): boolean {
  const dayKey = localDayKey(date)
  const childInstancesToday = activeRoutines.filter(
    ar => ar.childId === childId && localDayKey(new Date(ar.startedAt)) === dayKey
  )
  const scheduled = scheduledTemplatesForDay(templates, date).filter(t => templateAppliesToChild(t, childId))
  const allScheduledDone = scheduled.every(t =>
    childInstancesToday.some(ar => ar.templateId === t.id && ar.completedAt != null)
  )
  const anyCompletedToday = childInstancesToday.some(ar => ar.completedAt != null)
  return allScheduledDone && anyCompletedToday
}

/**
 * Journée complète pour la FAMILLE : tous les enfants concernés par au moins
 * une routine programmée du jour ont leur journée complète. C'est le prédicat
 * de la bannière « nouvelle journée » de l'accueil — même règle que la
 * progression d'univers, agrégée par enfant.
 */
export function familyDayComplete(
  templates: RoutineTemplate[],
  activeRoutines: ActiveRoutine[],
  children: Child[],
  date: Date = new Date()
): boolean {
  const scheduled = scheduledTemplatesForDay(templates, date)
  if (scheduled.length === 0) return false
  const concerned = children.filter(c => scheduled.some(t => templateAppliesToChild(t, c.id)))
  if (concerned.length === 0) return false
  return concerned.every(c => childDayComplete(templates, activeRoutines, c.id, date))
}

/**
 * Avance `routineDayCount` des enfants dont la journée est complète (une seule
 * fois par jour local, via `lastRoutineDay`). Jamais de retour en arrière :
 * un jour compté reste compté même si un parent réinitialise une routine.
 */
export function advanceDayProgress(
  children: Child[],
  templates: RoutineTemplate[],
  activeRoutines: ActiveRoutine[],
  date: Date = new Date()
): Child[] {
  const today = localDayKey(date)
  let changed = false
  const next = children.map(c => {
    if (c.lastRoutineDay === today) return c
    if (!childDayComplete(templates, activeRoutines, c.id, date)) return c
    changed = true
    return { ...c, routineDayCount: (c.routineDayCount ?? 0) + 1, lastRoutineDay: today }
  })
  return changed ? next : children
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

/**
 * Pool de tirage de l'enfant : l'UNION des images de tous ses univers possédés.
 * Source unique — le tirage (unlockReward), l'image mystère, les sanctions et
 * l'impression doivent voir exactement le même pool.
 */
export function ownedRewardImages(child: Child, childIndex: number): RewardImage[] {
  return ownedUniverseIds(child, childIndex).flatMap(getRewardImagesForUniverse)
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
