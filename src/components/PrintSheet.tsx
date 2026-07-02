import { useMemo, useState } from 'react'
import { Child } from '../types'
import { getRewardImagesForUniverse } from '../data/rewardImages'
import { getUniverse } from '../data/universes'
import { ownedUniverseIds } from '../data/universeProgress'
import { rarityOf } from '../data/rarity'
import { Button } from './ui'

interface PrintSheetProps {
  child: Child
  childIndex: number
  onClose: () => void
}

type PrintMode = 'cartes' | 'stickers'

/**
 * Impression de la collection — le pont vers le monde réel demandé par les
 * enfants : cartes de collection (format carte à jouer, 9 par page A4) ou
 * planche d'autocollants (vignettes 35 mm, à imprimer sur papier adhésif).
 * Les styles @media print de index.css isolent .print-sheet à l'impression.
 */
export default function PrintSheet({ child, childIndex, onClose }: PrintSheetProps) {
  const [mode, setMode] = useState<PrintMode>('cartes')

  const images = useMemo(() => {
    const unlockedSet = new Set(child.unlockedImages)
    return ownedUniverseIds(child, childIndex).flatMap(universeId => {
      const universe = getUniverse(universeId)
      return getRewardImagesForUniverse(universeId)
        .filter(img => unlockedSet.has(img.id))
        .map(img => ({ ...img, universe, rarity: rarityOf(img.id) }))
    })
  }, [child, childIndex])

  return (
    <div className="print-sheet fixed inset-0 z-modal bg-white flex flex-col">
      {/* Barre d'actions (masquée à l'impression) */}
      <div className="print-hide flex items-center justify-between gap-3 p-4 border-b border-line flex-wrap">
        <div>
          <h2 className="text-xl font-display font-semibold text-ink">
            🖨️ Collection de {child.name}
          </h2>
          <p className="text-sm text-ink-faint">
            {mode === 'cartes'
              ? 'Cartes de collection — papier épais conseillé, 9 cartes par page.'
              : 'Autocollants 35 mm — à imprimer sur du papier adhésif A4.'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-xl border-2 border-line overflow-hidden">
            <button
              onClick={() => setMode('cartes')}
              aria-pressed={mode === 'cartes'}
              className={`px-4 py-2 text-sm font-display font-semibold ${mode === 'cartes' ? 'bg-honey-100 text-honey-700' : 'bg-white text-ink-faint'}`}
            >
              🃏 Cartes
            </button>
            <button
              onClick={() => setMode('stickers')}
              aria-pressed={mode === 'stickers'}
              className={`px-4 py-2 text-sm font-display font-semibold ${mode === 'stickers' ? 'bg-honey-100 text-honey-700' : 'bg-white text-ink-faint'}`}
            >
              🏷️ Autocollants
            </button>
          </div>
          <Button variant="primary" size="md" onClick={() => window.print()}>
            🖨️ Imprimer
          </Button>
          <Button variant="soft" size="md" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>

      {/* Planche */}
      <div className="flex-1 overflow-y-auto scroll-touch bg-warm-100 print:bg-white p-4">
        {images.length === 0 ? (
          <p className="print-hide text-center text-ink-faint mt-10">
            {child.name} n'a pas encore gagné d'image — la planche se remplira toute seule !
          </p>
        ) : (
          <div className="mx-auto bg-white shadow-card print:shadow-none" style={{ width: '194mm', padding: '2mm' }}>
            {mode === 'cartes' ? (
              <div className="flex flex-wrap">
                {images.map(img => (
                  <div
                    key={img.id}
                    className="border border-dashed border-warm-200 p-[2mm]"
                    style={{ width: '63mm', height: '88mm', breakInside: 'avoid' }}
                  >
                    <div className="w-full h-full rounded-[3mm] border border-line overflow-hidden flex flex-col bg-white">
                      <div className="w-full overflow-hidden" style={{ height: '57mm' }}>
                        <img src={img.src} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center px-2 text-center">
                        <p className="font-display font-semibold text-ink" style={{ fontSize: '3.4mm' }}>
                          {img.universe ? `${img.universe.emoji} ${img.universe.name}` : 'Collection'}
                        </p>
                        <p className="text-ink-faint" style={{ fontSize: '2.9mm' }}>
                          {img.rarity === 'legendaire' ? '🌟 Légendaire' : img.rarity === 'rare' ? '✨ Rare' : `Collection de ${child.name}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap">
                {images.map(img => (
                  <div
                    key={img.id}
                    className="border border-dashed border-warm-200 p-[1.5mm]"
                    style={{ width: '38mm', height: '38mm', breakInside: 'avoid' }}
                  >
                    <img src={img.src} alt="" className="w-full h-full object-cover rounded-[2mm]" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
