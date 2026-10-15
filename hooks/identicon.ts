import type { Picture } from '../types'

// 8 cells tall, drawn two per character with half blocks: 4 rows.
export const HEIGHT = 8

// Columns that make the icon square for a cell `shape` times taller than wide.
export const widthFor = (shape: number): number => Math.round((HEIGHT / 2) * shape)
export const BACKGROUND = '#2b2b2b'

// FNV-1a, then a murmur3 finaliser so nearby seeds spread.
const hash = (text: string, salt: number): number => {
  let h = (0x811c9dc5 ^ salt) >>> 0
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b) >>> 0
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35) >>> 0
  h ^= h >>> 16

  return h >>> 0
}

const hslToHex = (hue: number, sat: number, lum: number): string => {
  const s = sat / 100
  const l = lum / 100
  const a = s * Math.min(l, 1 - l)
  const channel = (n: number) => {
    const k = (n + hue / 30) % 12
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(v * 255).toString(16).padStart(2, '0')
  }

  return `#${channel(0)}${channel(8)}${channel(4)}`
}

// Windows paths use backslashes; git prints forward slashes everywhere.
export const lastPart = (path: string): string => path.split(/[\\/]/).filter(Boolean).pop() ?? path

// Same repo over ssh or https, with or without .git, gives the same seed.
export const normaliseRemote = (url: string): string =>
  url
    .trim()
    .replace(/^[a-z+]+:\/\//i, '')
    .replace(/^[^@/]+@/, '')
    .replace(/:(?!\d)/, '/')
    .replace(/\.git$/, '')
    .replace(/\/+$/, '')
    .toLowerCase()

// Left half (centre column included) from the hash and mirrored, one colour, like GitHub's.
export const identicon = (seed: string, width: number): Picture => {
  const words = [hash(seed, 0), hash(seed, 2)]
  const bit = (i: number) => ((words[i >>> 5] >>> (i & 31)) & 1) === 1
  const tone = hash(seed, 1)
  const half = Math.ceil(width / 2)
  const cells = Array.from({ length: HEIGHT }, (_, row) => {
    const left = Array.from({ length: half }, (_, col) => bit(row * half + col))
    return [...left, ...left.slice(0, width - half).reverse()]
  })
  const color = hslToHex(tone % 360, 65 - ((tone >>> 9) % 20), 62 - ((tone >>> 17) % 16))

  return { seed, color, cells }
}
