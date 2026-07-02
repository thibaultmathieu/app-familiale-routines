import { getRewardImagesForUniverse } from './rewardImages'

/**
 * Rareté des images-récompenses — le sel de la collection :
 * chaque pool contient quelques images rares et légendaires, les mêmes pour
 * tous les enfants et tous les appareils (déterministe, aucun stockage).
 * Les raretés pèsent sur l'ordre de tirage (elles se font désirer) et
 * s'affichent dans la célébration, la galerie et les cartes imprimées.
 */
export type Rarity = 'commune' | 'rare' | 'legendaire'

export const RARITY_META: Record<Rarity, { label: string; emoji: string }> = {
  commune: { label: 'Commune', emoji: '' },
  rare: { label: 'Rare', emoji: '✨' },
  legendaire: { label: 'Légendaire', emoji: '🌟' },
}

/** Hash déterministe (djb2) — stable entre sessions et appareils. */
export function hashString(value: string): number {
  let hash = 5381
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) + hash + value.charCodeAt(i)) >>> 0
  }
  return hash
}

/** Générateur pseudo-aléatoire déterministe (mulberry32), valeurs dans [0, 1). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Clé de pool d'un id d'image (`kpop-003` → `kpop`, `super-heros-012` → `super-heros`). */
function poolKeyOf(imageId: string): string {
  const idx = imageId.lastIndexOf('-')
  return idx > 0 ? imageId.slice(0, idx) : imageId
}

const poolRarityCache = new Map<string, Map<string, Rarity>>()

/**
 * Rareté d'une image. Attribution par pool, par classement de hash : pour 30
 * images → 2 légendaires et 5 rares (proportions conservées, minimum 1 de
 * chaque pour les petits pools). Id inconnu → commune.
 */
export function rarityOf(imageId: string): Rarity {
  const poolKey = poolKeyOf(imageId)
  let map = poolRarityCache.get(poolKey)
  if (!map) {
    map = new Map()
    const pool = getRewardImagesForUniverse(poolKey)
    if (pool.length > 0) {
      const nLegendary = Math.max(1, Math.floor(pool.length / 15))
      const nRare = Math.max(1, Math.floor(pool.length / 6))
      const ranked = [...pool].sort(
        (a, b) => hashString(b.id + '|rarete') - hashString(a.id + '|rarete')
      )
      ranked.forEach((img, i) => {
        map!.set(img.id, i < nLegendary ? 'legendaire' : i < nLegendary + nRare ? 'rare' : 'commune')
      })
    }
    poolRarityCache.set(poolKey, map)
  }
  return map.get(imageId) ?? 'commune'
}

/** Poids de tirage : plus une image est rare, plus elle se fait attendre. */
export function rarityWeight(rarity: Rarity): number {
  return rarity === 'legendaire' ? 0.18 : rarity === 'rare' ? 0.45 : 1
}
