import { RewardImage } from '../types'
import { rewardImagesByChild } from './rewardManifest'
import { assetUrl } from '../utils/assetUrl'

function withBase(images: RewardImage[]): RewardImage[] {
  return images.map(img => ({ ...img, src: assetUrl(img.src) }))
}

const poolKeys = Object.keys(rewardImagesByChild)

// Per-child reward images — uses child index (0-based) to pick pool via round-robin
export function getRewardImagesForChild(childIndex: number): RewardImage[] {
  if (poolKeys.length === 0) return []
  const key = poolKeys[childIndex % poolKeys.length]
  return withBase(rewardImagesByChild[key] ?? [])
}

// Find a single reward image by id across all children
export function findRewardImage(imageId: string): RewardImage | undefined {
  for (const images of Object.values(rewardImagesByChild)) {
    const found = withBase(images).find(img => img.id === imageId)
    if (found) return found
  }
  return undefined
}
