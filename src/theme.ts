/**
 * Source de vérité du thème — couleurs d'identité des enfants et utilitaires.
 * Remplace les COLOR_PALETTE dupliquées et le hack de concaténation hex (`color + '15'`).
 */

/** 8 couleurs d'identité proposées à la création d'un enfant. */
export const COLOR_PALETTE = [
  '#A78BFA', // violet
  '#60A5FA', // bleu
  '#F472B6', // rose
  '#34D399', // menthe
  '#FBBF24', // soleil
  '#FB923C', // mandarine
  '#F87171', // corail
  '#A3E635', // citron vert
] as const

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const value = hex.replace('#', '')
  const full = value.length === 3
    ? value.split('').map(c => c + c).join('')
    : value
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

/**
 * Teinte translucide d'une couleur d'identité (fonds, surfaces).
 * `tint('#A78BFA', 0.12)` → 'rgba(167, 139, 250, 0.12)'.
 * Tolère les hex 3 ou 6 chiffres ; couleur invalide → gris neutre.
 */
export function tint(hex: string, alpha: number): string {
  const rgb = parseHex(hex)
  if (!rgb) return `rgba(156, 147, 138, ${alpha})`
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

/**
 * Variante assombrie d'une couleur d'identité, utilisable comme texte sur fond
 * blanc/crème (contraste ≥ 3:1 pour du texte large/gras — usage : prénoms, titres).
 * Réduit la luminance vers une cible fixe pour homogénéiser les 8 couleurs.
 */
export function childTextColor(hex: string): string {
  const rgb = parseHex(hex)
  if (!rgb) return '#3F3A35'
  // Conversion RGB → HSL
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  const l = (max + min) / 2
  const d = max - min
  let s = 0
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      default: h = ((r - g) / d + 4) / 6
    }
  }
  // Luminance plafonnée + saturation plancher → texte lisible et toujours coloré
  const targetL = Math.min(l, 0.38)
  const targetS = Math.max(s, 0.45)
  // Conversion HSL → RGB
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }
  const q = targetL < 0.5 ? targetL * (1 + targetS) : targetL + targetS - targetL * targetS
  const p = 2 * targetL - q
  const toHexByte = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0')
  return `#${toHexByte(hue2rgb(p, q, h + 1 / 3))}${toHexByte(hue2rgb(p, q, h))}${toHexByte(hue2rgb(p, q, h - 1 / 3))}`
}
