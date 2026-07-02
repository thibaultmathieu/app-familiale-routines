import { Child, RewardImage } from '../types'
import { getRewardImagesForUniverse } from './rewardImages'
import { localDayKey, ownedUniverseIds } from './universeProgress'
import { hashString, rarityOf, rarityWeight, seededRandom } from './rarity'

/**
 * Image mystère du jour — la « prochaine image à gagner » de chaque enfant :
 * un ordre de tirage quotidien déterministe est calculé (même enfant + même
 * jour = même ordre) et la première image encore verrouillée de cet ordre est
 * l'image mystère. C'est elle que le prochain déblocage attribue : l'accueil
 * peut donc l'annoncer (floutée) sans mentir, et chaque gain en révèle une
 * nouvelle. Le mélange est pondéré par la rareté (Efraimidis-Spirakis) : les
 * images rares apparaissent statistiquement plus tard dans la journée.
 */
export function dailyDrawOrder(childId: string, dayKey: string, images: RewardImage[]): RewardImage[] {
  return images
    .map(img => {
      const u = seededRandom(hashString(`${childId}|${dayKey}|${img.id}`))()
      return { img, key: Math.pow(u, 1 / rarityWeight(rarityOf(img.id))) }
    })
    .sort((a, b) => b.key - a.key || a.img.id.localeCompare(b.img.id))
    .map(x => x.img)
}

/** Image mystère du jour d'un enfant (null si tout son pool est déjà gagné). */
export function mysteryImageFor(child: Child, childIndex: number, date: Date = new Date()): RewardImage | null {
  const pool = ownedUniverseIds(child, childIndex).flatMap(getRewardImagesForUniverse)
  if (pool.length === 0) return null
  const unlocked = new Set(child.unlockedImages)
  const order = dailyDrawOrder(child.id, localDayKey(date), pool)
  return order.find(img => !unlocked.has(img.id)) ?? null
}
