import { useEffect, useMemo, useState } from 'react'
import { localDayKey } from '../data/universeProgress'

/**
 * Date « du jour » réactive : sur la tablette familiale laissée allumée, les
 * écrans qui dépendent du jour (routines programmées, bannière, image mystère)
 * doivent se rafraîchir au passage de minuit et au retour au premier plan —
 * sans ce hook, l'accueil afficherait le programme et le mystère de la veille.
 * L'identité de l'objet Date ne change qu'au changement de jour local.
 */
export function useToday(): Date {
  const [dayKey, setDayKey] = useState(() => localDayKey())

  useEffect(() => {
    const check = () => setDayKey(prev => {
      const key = localDayKey()
      return key === prev ? prev : key
    })
    const interval = setInterval(check, 60_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])

  // Midi local : même journée quelle que soit l'heure, à l'abri des bascules DST
  return useMemo(() => new Date(`${dayKey}T12:00:00`), [dayKey])
}
