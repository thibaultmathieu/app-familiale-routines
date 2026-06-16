/**
 * Logique de sélection d'une cible d'enfants (tâche d'une routine, cible d'une
 * routine personnalisée). La cible est un sous-ensemble d'enfants, où
 * `undefined` signifie « tous les enfants » (aucune restriction).
 *
 * Sémantique pensée pour le tactile (corrige le bug « ça bascule sur l'autre
 * enfant ou sur Tous ») : partant de « Tous », taper un enfant le sélectionne
 * LUI SEUL ; en mode spécifique, taper un enfant l'ajoute/le retire. Revenir à
 * l'ensemble complet (ou à zéro) repasse en « Tous ».
 */

/** La cible couvre-t-elle tous les enfants ? (`undefined` = tous.) */
export function isAllTargets(value: string[] | undefined, allIds: string[]): boolean {
  if (!value) return true
  if (value.length === 0) return true
  const set = new Set(value)
  return allIds.length > 0 && allIds.every(id => set.has(id))
}

/**
 * Nouvelle cible après un tap sur l'enfant `clickedId`.
 * Retourne `undefined` quand le résultat couvre tous les enfants (ou aucun).
 */
export function toggleChildTarget(
  value: string[] | undefined,
  clickedId: string,
  allIds: string[],
): string[] | undefined {
  // Depuis « Tous », un tap = cet enfant seulement (comportement attendu par les parents)
  if (isAllTargets(value, allIds)) {
    return [clickedId]
  }
  const set = new Set(value)
  if (set.has(clickedId)) {
    set.delete(clickedId)
  } else {
    set.add(clickedId)
  }
  // Ordre stable calqué sur allIds
  const next = allIds.filter(id => set.has(id))
  if (next.length === 0 || next.length === allIds.length) return undefined
  return next
}
