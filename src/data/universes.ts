import { Universe } from '../types'
import { rewardImagesByChild } from './rewardManifest'

/**
 * Univers de récompenses (Jalon 2).
 * Un univers actif = un pool d'images du manifeste (`rewardImagesByChild`).
 * Les univers `comingSoon` sont des annonces : visibles verrouillés dans la
 * sélection, non sélectionnables tant qu'aucun pool d'images n'existe.
 *
 * Pour activer un nouvel univers : créer un dossier d'images dans
 * `images_rewards/<NomDossier>/`, lancer `npm run sync-assets`, puis ajouter
 * ici une entrée dont l'id = clé du manifeste (nom de dossier en minuscules).
 */
const UNIVERSE_DEFS: Universe[] = [
  {
    id: 'evangelina',
    name: 'Princesses & Merveilles',
    emoji: '👑',
    description: 'Des images féériques à collectionner',
  },
  {
    id: 'noah',
    name: 'Aventures & Héros',
    emoji: '🦸',
    description: 'Des images d’aventure à collectionner',
  },
  {
    id: 'monstres',
    name: 'Petits Monstres',
    emoji: '👾',
    description: 'Bientôt disponible…',
    comingSoon: true,
  },
  {
    id: 'kawaii',
    name: 'Kawaii & Capybaras',
    emoji: '🐹',
    description: 'Bientôt disponible…',
    comingSoon: true,
  },
]

/** Tous les univers à afficher (actifs d'abord, puis annonces). */
export const UNIVERSES: Universe[] = UNIVERSE_DEFS

/** Univers réellement sélectionnables (un pool d'images existe). */
export const ACTIVE_UNIVERSES: Universe[] = UNIVERSE_DEFS.filter(
  u => !u.comingSoon && (rewardImagesByChild[u.id]?.length ?? 0) > 0
)

export function getUniverse(universeId: string): Universe | undefined {
  return UNIVERSE_DEFS.find(u => u.id === universeId)
}
