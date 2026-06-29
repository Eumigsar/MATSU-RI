import * as PIXI from 'pixi.js'

// ─── Atlas sprite factories ────────────────────────────────────────────────────
// gt  = ground tile   (TilingSprite from ground-atlas.png)
// bsp = building sprite (Sprite from building-atlas.png)
// nsp = nature sprite   (Sprite from nature-atlas.png)
// psp = prop sprite     (Sprite from props-atlas.png)
// tsp = tileset sprite  (Sprite from tileset.png — JPEG, no alpha, bg removed)
export interface RenderCtx {
  gt:  (col: number, row: number, w: number, h: number) => PIXI.TilingSprite
  bsp: (x: number, y: number, w: number, h: number) => PIXI.Sprite
  nsp: (x: number, y: number, w: number, h: number) => PIXI.Sprite
  psp: (x: number, y: number, w: number, h: number) => PIXI.Sprite
  tsp: (x: number, y: number, w: number, h: number) => PIXI.Sprite
  osp: (x: number, y: number, w: number, h: number) => PIXI.Sprite
}

// ─── Zone layer set ───────────────────────────────────────────────────────────
// Passed to every zone builder. Contains the three containers it may populate.
export interface ZoneLayers {
  ground: PIXI.Container  // #05-06 terrain tiles and ground graphics
  infra:  PIXI.Container  // #07    fixed infrastructure (walls, fences, signs)
  ysort:  PIXI.Container  // #08-11 Y-sorted world objects
}

// ─── Render layer IDs ─────────────────────────────────────────────────────────
// Matches the 18-layer render order defined in RenderPipeline.
export type LayerId =
  | 'sky'
  | 'mountains'
  | 'bgDecoration'
  | 'ground'
  | 'autotile'
  | 'roads'
  | 'water'
  | 'overlays'
  | 'buildings'
  | 'trees'
  | 'props'
  | 'interactive'
  | 'npcs'
  | 'player'
  | 'particles'
  | 'weather'
  | 'lighting'
  | 'ui'

// ─── Character animation types ────────────────────────────────────────────────
// Shared between AnimationController and CharacterRenderer.

export interface FrameRect { x: number; y: number; w: number; h: number }

export type Direction = 'down' | 'left' | 'right' | 'up'

export interface AnimDef {
  frames:      FrameRect[]
  fps:         number
  loop:        boolean
  next:        string | null                          // plays on completion (non-looping)
  directions?: Partial<Record<Direction, FrameRect[]>> // per-direction frame overrides
}

export type AnimationSet = Record<string, AnimDef>

// ─── Chunk definition ─────────────────────────────────────────────────────────
// A chunk is a rectangular region of the world with its own layer containers.
// Future ChunkManager will load/unload chunks based on camera position.
export interface ChunkDef {
  id:    string
  x0:    number    // world x start
  x1:    number    // world x end
  loaded: boolean
}
