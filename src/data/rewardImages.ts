import { Child, RewardImage } from '../types'
import { rewardImagesByChild } from './rewardManifest'
import { assetUrl } from '../utils/assetUrl'

function withBase(images: RewardImage[]): RewardImage[] {
  return images.map(img => ({ ...img, src: assetUrl(img.src) }))
}

const poolKeys = Object.keys(rewardImagesByChild)

/** Pool d'images d'un univers (clé du manifeste). Univers inconnu → []. */
export function getRewardImagesForUniverse(universeId: string): RewardImage[] {
  return withBase(rewardImagesByChild[universeId] ?? [])
}

/**
 * Univers effectif d'un enfant : son `universeId` s'il pointe vers un pool
 * existant, sinon attribution legacy par index (round-robin) — comportement
 * identique au schéma V5.
 */
export function resolveUniverseId(child: Pick<Child, 'universeId'>, childIndex: number): string | null {
  if (child.universeId && rewardImagesByChild[child.universeId]) {
    return child.universeId
  }
  if (poolKeys.length === 0) return null
  return poolKeys[childIndex % poolKeys.length]
}

/** Pool d'images effectif d'un enfant (résolution univers + fallback legacy). */
export function getRewardImagesForChildEntry(child: Pick<Child, 'universeId'>, childIndex: number): RewardImage[] {
  const universeId = resolveUniverseId(child, childIndex)
  if (!universeId) return []
  return getRewardImagesForUniverse(universeId)
}

/** Attribution legacy par index (round-robin) — conservé pour la migration V6. */
export function getRewardImagesForChild(childIndex: number): RewardImage[] {
  if (poolKeys.length === 0) return []
  const key = poolKeys[childIndex % poolKeys.length]
  return withBase(rewardImagesByChild[key] ?? [])
}

/** Clé de pool legacy par index — utilisée pour figer `universeId` en V6. */
export function legacyUniverseIdForIndex(childIndex: number): string | undefined {
  if (poolKeys.length === 0) return undefined
  return poolKeys[childIndex % poolKeys.length]
}

// Find a single reward image by id across all pools
export function findRewardImage(imageId: string): RewardImage | undefined {
  for (const images of Object.values(rewardImagesByChild)) {
    const found = withBase(images).find(img => img.id === imageId)
    if (found) return found
  }
  return undefined
}
