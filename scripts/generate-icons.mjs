import sharp from 'sharp'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const src = path.join(root, 'public/icon/app-icon.svg')
const svgBuffer = readFileSync(src)

const sizes = [192, 512]
for (const size of sizes) {
  const out = path.join(root, `public/icon/icon-${size}.png`)
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(out)
  console.log(`✓ icon-${size}.png`)
}

// apple-touch-icon (180x180, no rounded corners — iOS adds them)
const appleOut = path.join(root, 'public/icon/apple-touch-icon.png')
await sharp(svgBuffer).resize(180, 180).png().toFile(appleOut)
console.log('✓ apple-touch-icon.png')
