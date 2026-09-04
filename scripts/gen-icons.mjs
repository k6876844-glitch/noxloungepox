// Generates the PWA icons (public/icon-192.png, public/icon-512.png) and
// public/favicon.svg with zero dependencies. The PNG is a flat brand-teal
// square with a simple bag glyph — safe as a maskable icon.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public')
mkdirSync(outDir, { recursive: true })

const BG = [15, 118, 110, 255] // #0f766e
const FG = [255, 255, 255, 255]

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function makePng(size) {
  const px = (x, y) => {
    // Draw a rounded "shopping bag": body rectangle + handle arc.
    const u = x / size
    const v = y / size
    const inBody = u > 0.24 && u < 0.76 && v > 0.36 && v < 0.82
    const cx = 0.5
    const handleR = 0.16
    const dHandle = Math.hypot(u - cx, v - 0.36)
    const onHandle = v < 0.4 && Math.abs(dHandle - handleR) < 0.045
    return inBody || onHandle ? FG : BG
  }

  const raw = Buffer.alloc(size * (size * 4 + 1))
  let o = 0
  for (let y = 0; y < size; y++) {
    raw[o++] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = px(x, y)
      raw[o++] = r
      raw[o++] = g
      raw[o++] = b
      raw[o++] = a
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type RGBA
  const idat = deflateSync(raw, { level: 9 })

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

writeFileSync(join(outDir, 'icon-192.png'), makePng(192))
writeFileSync(join(outDir, 'icon-512.png'), makePng(512))

writeFileSync(
  join(outDir, 'favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#0f766e"/>
  <path d="M20 26h24l-2 22H22z" fill="#fff"/>
  <path d="M25 26a7 7 0 0 1 14 0" fill="none" stroke="#fff" stroke-width="3"/>
</svg>\n`,
)

console.log('Generated public/icon-192.png, public/icon-512.png, public/favicon.svg')
