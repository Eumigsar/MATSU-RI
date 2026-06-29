// ─── World constants ──────────────────────────────────────────────────────────
// All magic numbers live here. Never hardcode these values elsewhere.

export const W  = 900   // viewport width  (px)
export const H  = 560   // viewport height (px)
export const WW = 2700  // world width     (px)
export const WH = 900   // world height    (px)
export const GY = 770   // ground Y — foot anchor line for all Y-sorted sprites

export const FW = 32    // sprite frame width
export const FH = 32    // sprite frame height

// Tile size used in ground-atlas.png (128×128 grid, 12×8 tiles)
export const TILE_SIZE = 128

// ─── Zone X ranges (world space) ──────────────────────────────────────────────
export const ZONES = {
  ACADEMY: { x0:    0, x1:  540 },
  BAMBOO:  { x0:  540, x1: 1080 },
  VILLAGE: { x0: 1080, x1: 1620 },
  MOUNTAIN:{ x0: 1620, x1: 2160 },
  TEMPLE:  { x0: 2160, x1: 2700 },
} as const

// ─── Color palette ────────────────────────────────────────────────────────────
// Single source of truth — never duplicate hex values in zone files.
export const K = {
  skyT: 0x5A8CC8, skyM: 0x8ABCD8, skyH: 0xC0D8EC,
  mtnF: 0x8AAABB, mtnM: 0x6A8898, mtnN: 0x587888,
  hillF: 0x3A6030, hillN: 0x2A4E22,
  grass: 0x4A7C38, grassD: 0x3A6028, grassL: 0x5E9A48,
  moss: 0x2E5C20, dirt: 0x8A6E34, dirtL: 0xA08040,
  stone: 0x888078, stoneL: 0xA09888, stoneD: 0x68605A,
  cobble: 0x706860, cobbleL: 0x888080,
  wD: 0x1A5068, wM: 0x2A7090, wL: 0x4A9AB0, wF: 0x9ACFE0,
  wood: 0x5C3820, woodL: 0x7A5030, woodD: 0x3A2010,
  beam: 0x6A4020,
  roof: 0x241408, roofM: 0x342010, roofL: 0x483018, roofE: 0x563A20,
  wall: 0xEEE4D0, wallS: 0xD4C8B0, wallD: 0xB8AA90,
  colR: 0xAA1010, colRD: 0x880808,
  gold: 0xC8A040, goldL: 0xE8C060, goldD: 0xA07820,
  lanR: 0xCC2000, lanG: 0xFF5522,
  bk: 0x4A2808, bkL: 0x6A4020,
  cherry: 0xFFB0C0, cherryD: 0xF080A0, cherryB: 0xFFD8E4,
  bamb: 0x5A8830, bambL: 0x78AA48, bambN: 0x486E20,
  leaf: 0x2A7028, leafL: 0x488040, leafD: 0x1A5018,
  pine: 0x1A4A18, pineL: 0x2A5E28,
  bark: 0x4A2808,
  path: 0xBCA868, pathD: 0x9A8848,
  red: 0xAA0000, redB: 0xCC2020, redD: 0x880000,
} as const

// Deterministic pseudo-random — same seed always produces same value.
export function rng(a: number, b: number): number {
  return (((a * 1103515245 + 12345 + b * 214013) >>> 0) & 0x7fffffff) / 0x7fffffff
}
