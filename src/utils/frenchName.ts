/** Préfixe « de » élidé devant voyelle ou h : dePrefix('Éva') → « d' », dePrefix('Noé') → « de ». */
export function dePrefix(name: string): string {
  return /^[aàâäeéèêëiîïoôöuûüyh]/i.test(name.trim()) ? "d'" : 'de '
}

/** « de » élidé + prénom : deName('Éva') → « d'Éva », deName('Noé') → « de Noé ». */
export function deName(name: string): string {
  return `${dePrefix(name)}${name}`
}
