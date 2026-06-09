// Rasterize public/og-image.svg → public/og-image.png (1200×630) for social/link
// previews on platforms that don't render SVG OG images. Uses sharp (already a
// dependency via @nuxt/image). Run: node scripts/gen-og.mjs
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'

const svg = readFileSync('public/og-image.svg')
const png = await sharp(svg, { density: 144 }).resize(1200, 630, { fit: 'cover' }).png().toBuffer()
writeFileSync('public/og-image.png', png)
console.log(`og-image.png written (${(png.length / 1024).toFixed(0)} KB)`)
