// Generates PWA icons from inline SVG using sharp.
// Run: node scripts/generate-icons.mjs
import sharp from "sharp"
import { mkdir } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, "..")
const PUBLIC = resolve(root, "public")

const GREEN = "#00853F"

// Paper-plane mark on green — matches Jaypai travel/delivery theme.
// `padded` = true adds safe-zone padding for Android maskable icons.
function svg({ size, bg = GREEN, padded = false }) {
  const s = size
  const inset = padded ? s * 0.18 : s * 0.0
  const planeBox = s - inset * 2
  // Simple paper plane path scaled into a 0..100 viewBox, centered.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" rx="${padded ? 0 : s * 0.22}" fill="${bg}"/>
  <g transform="translate(${inset}, ${inset})">
    <svg width="${planeBox}" height="${planeBox}" viewBox="0 0 100 100">
      <path d="M85 15 L15 45 L42 53 L50 80 L60 55 L85 15 Z M42 53 L60 35"
            fill="none" stroke="#FFFFFF" stroke-width="6"
            stroke-linejoin="round" stroke-linecap="round"/>
      <path d="M85 15 L42 53 L50 80 Z" fill="#FFFFFF" fill-opacity="0.9"/>
    </svg>
  </g>
</svg>`
}

const targets = [
  { file: "icons/icon-192.png", size: 192, padded: false },
  { file: "icons/icon-512.png", size: 512, padded: false },
  { file: "icons/icon-maskable-512.png", size: 512, padded: true },
  { file: "icons/apple-touch-icon.png", size: 180, padded: false },
  { file: "favicon.png", size: 64, padded: false },
]

await mkdir(resolve(PUBLIC, "icons"), { recursive: true })

for (const t of targets) {
  const buf = Buffer.from(svg({ size: t.size, padded: t.padded }))
  await sharp(buf).png().toFile(resolve(PUBLIC, t.file))
  console.log(`✓ ${t.file} (${t.size}x${t.size})`)
}

console.log("Done generating icons.")
