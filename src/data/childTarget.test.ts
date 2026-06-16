import { describe, it, expect } from 'vitest'
import { isAllTargets, toggleChildTarget } from './childTarget'

const ALL = ['eva', 'noah']
const THREE = ['eva', 'noah', 'lea']

describe('childTarget — isAllTargets', () => {
  it('undefined ou vide = tous', () => {
    expect(isAllTargets(undefined, ALL)).toBe(true)
    expect(isAllTargets([], ALL)).toBe(true)
  })
  it('couvrir tous les enfants = tous', () => {
    expect(isAllTargets(['eva', 'noah'], ALL)).toBe(true)
  })
  it('un sous-ensemble strict n\'est pas « tous »', () => {
    expect(isAllTargets(['eva'], ALL)).toBe(false)
    expect(isAllTargets(['eva', 'noah'], THREE)).toBe(false)
  })
})

describe('childTarget — toggleChildTarget (corrige le bug de bascule)', () => {
  it('depuis « Tous », taper un enfant le sélectionne LUI SEUL', () => {
    // Cœur du bug #3 : avant, taper Éva retirait Éva et laissait Noah.
    expect(toggleChildTarget(undefined, 'eva', ALL)).toEqual(['eva'])
    expect(toggleChildTarget(undefined, 'noah', ALL)).toEqual(['noah'])
  })

  it('en mode spécifique, re-taper l\'enfant sélectionné repasse à « Tous »', () => {
    expect(toggleChildTarget(['eva'], 'eva', ALL)).toBeUndefined()
  })

  it('taper le second enfant (2 enfants) couvre tout → « Tous »', () => {
    expect(toggleChildTarget(['eva'], 'noah', ALL)).toBeUndefined()
  })

  it('3 enfants : on construit un sous-ensemble de 2 sans revenir à Tous', () => {
    // Tous → Éva seule → +Noah = {Éva, Noah} (2/3, pas « Tous »)
    const onlyEva = toggleChildTarget(undefined, 'eva', THREE)
    expect(onlyEva).toEqual(['eva'])
    const evaNoah = toggleChildTarget(onlyEva, 'noah', THREE)
    expect(evaNoah).toEqual(['eva', 'noah'])
    // +Léa = tous → « Tous »
    expect(toggleChildTarget(evaNoah, 'lea', THREE)).toBeUndefined()
  })

  it('ordre stable calqué sur la liste des enfants', () => {
    // Ajouter dans le désordre conserve l'ordre de allIds
    const fromLea = toggleChildTarget(undefined, 'lea', THREE) // ['lea']
    const leaEva = toggleChildTarget(fromLea, 'eva', THREE)
    expect(leaEva).toEqual(['eva', 'lea'])
  })
})
