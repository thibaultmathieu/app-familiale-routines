import { RewardImage } from '../types'
import { rewardImagesByChild } from './rewardManifest'

// Per-child reward images — used by unlockReward and GalleryScreen
export function getRewardImagesForChild(childId: string): RewardImage[] {
  return rewardImagesByChild[childId] ?? []
}

// Find a single reward image by id across all children
export function findRewardImage(imageId: string): RewardImage | undefined {
  for (const images of Object.values(rewardImagesByChild)) {
    const found = images.find(img => img.id === imageId)
    if (found) return found
  }
  return undefined
}
