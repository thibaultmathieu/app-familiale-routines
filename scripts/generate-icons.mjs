import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

// Rend public/icons/icon.svg (source du logo) en PNG aux tailles du manifest PWA.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const svg = fs.readFileSync(path.join(ROOT, 'public', 'icons', 'icon.svg'))

for (const size of [192, 512]) {
  const out = path.join(ROOT, 'public', 'icons', `icon-${size}.png`)
  await sharp(svg, { density: 300 }).resize(size, size).png().toFile(out)
  console.log(`[icons] icon-${size}.png généré`)
}
