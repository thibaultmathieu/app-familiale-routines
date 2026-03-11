import { RewardImage } from '../types'
import { rewardImagesByChild } from './rewardManifest'
import { assetUrl } from '../utils/assetUrl'

function withBase(images: RewardImage[]): RewardImage[] {
  return images.map(img => ({ ...img, src: assetUrl(img.src) }))
}

// Per-child reward images — used by unlockReward and GalleryScreen
export function getRewardImagesForChild(childId: string): RewardImage[] {
  return withBase(rewardImagesByChild[childId] ?? [])
}

// Find a single reward image by id across all children
export function findRewardImage(imageId: string): RewardImage | undefined {
  for (const images of Object.values(rewardImagesByChild)) {
    const found = withBase(images).find(img => img.id === imageId)
    if (found) return found
  }
  return undefined
}
