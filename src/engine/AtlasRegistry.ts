import * as PIXI from 'pixi.js'
import { TILE_SIZE } from '../world/constants'
import type { RenderCtx } from './types'

// ─── Atlas coordinate maps ────────────────────────────────────────────────────
// Single source of truth for every sprite region in every atlas.
// Format: [x, y, width, height] in pixels.

export const NA = {
  BAMB_WIDE:  [32,   33, 514, 161] as const,
  BAMB_SM:    [32,   33,  85, 161] as const,
  BAMB_MID:   [132,  33, 200, 161] as const,
  CHERRY_1:   [847,  33, 210, 161] as const,
  CHERRY_2:   [1059, 33, 188, 161] as const,
  CHERRY_3:   [1249, 33, 176, 161] as const,
  BONSAI_1:   [27,  361, 218, 191] as const,
  BONSAI_2:   [245, 361, 218, 191] as const,
  BONSAI_3:   [463, 361, 218, 191] as const,
  BONSAI_4:   [681, 361, 218, 191] as const,
  ROCK_LG:    [31,  556, 210, 164] as const,
  ROCK_MED:   [240, 556, 195, 164] as const,
  ROCK_SM:    [430, 556, 145, 164] as const,
} as const

export const BA = {
  FAC_WIDE:    [229,  323, 328, 136] as const,
  FAC_NARR:    [37,   323, 173, 136] as const,
  FAC_MED1:    [673,  323, 148, 136] as const,
  FAC_MED2:    [829,  323,  95, 136] as const,
  ARCH_OPEN:   [1374, 323, 124, 136] as const,
  FAC_B1:      [33,   501, 154, 124] as const,
  FAC_B2:      [198,  501, 150, 124] as const,
  FAC_B3:      [488,  501, 149, 124] as const,
  DOORS:       [949,  501, 155, 124] as const,
  GATE_LG:     [676,  740, 611, 230] as const,
  GATE_SM:     [1293, 740, 234, 230] as const,
  RAILING_LG:  [41,   658, 303,  57] as const,
  RAILING_RED: [358,  658, 101,  57] as const,
} as const

export const PA = {
  STONE_LAN: [29,   24,  58, 126] as const,
  WELL:      [406,  24, 103, 126] as const,
  DUMMY_1:   [37,  155,  58, 125] as const,
  DUMMY_2:   [107, 155,  59, 125] as const,
  DUMMY_3:   [187, 155,  73, 125] as const,
  BARREL:    [23,  415,  63, 115] as const,
  INCENSE:   [855, 840, 140, 143] as const,
} as const

// ─── Overlay Atlas (pixel-art-overlay-atlas.png, 1536×1024 RGBA) ──────────────
// Clouds, roof eaves, petal heaps, water patches, mist bands.
export const OA = {
  ROOF_LG_1:   [14,   10, 290, 142] as const,
  ROOF_LG_2:   [314,  10, 220, 142] as const,
  ROOF_SM_1:   [540,  10, 100, 100] as const,
  ROOF_SM_2:   [648,  10,  90, 100] as const,

  CLOUD_DK_1:  [668,   8, 148, 120] as const,
  CLOUD_DK_2:  [820,   8, 155, 120] as const,
  CLOUD_DK_3:  [978,   8, 148, 120] as const,
  CLOUD_DK_4:  [1130,  8, 155, 120] as const,
  CLOUD_DK_5:  [1288,  8, 148, 120] as const,

  CLOUD_WH_1:  [6,   942, 330,  80] as const,
  CLOUD_WH_2:  [342, 942, 280,  80] as const,
  CLOUD_WH_3:  [630, 942, 240,  80] as const,

  CLOUD_SND_1: [8,   500, 220,  80] as const,
  CLOUD_SND_2: [238, 500, 225,  80] as const,
  CLOUD_SND_3: [472, 500, 215,  80] as const,

  FOG_STRIP_1: [838, 660, 698,  52] as const,
  FOG_STRIP_2: [838, 718, 698,  58] as const,
  FOG_STRIP_3: [838, 790, 698,  52] as const,

  WATER_PAT_1: [8,   660, 210,  68] as const,
  WATER_PAT_2: [228, 660, 218,  68] as const,
  WATER_PAT_3: [454, 660, 210,  68] as const,
  WATER_PAT_4: [672, 660, 188,  68] as const,

  PETAL_HEAP:  [328, 330, 190, 100] as const,
  GOLD_HEAP:   [10,  330, 155, 100] as const,
} as const

// ─── Atlas Registry ───────────────────────────────────────────────────────────
// Loads all atlases once. Provides sprite factory functions via buildCtx().
export class AtlasRegistry {
  private groundTex!:   PIXI.Texture
  private buildingTex!: PIXI.Texture
  private natureTex!:   PIXI.Texture
  private propsTex!:    PIXI.Texture
  private tilesetTex!:  PIXI.Texture
  private overlayTex!:  PIXI.Texture

  // Load a PNG via canvas so alpha is preserved correctly across browsers.
  private static loadTex(src: string): Promise<PIXI.Texture> {
    return new Promise(resolve => {
      const img = new Image()
      img.onload = () => {
        const cv = document.createElement('canvas')
        cv.width = img.width; cv.height = img.height
        cv.getContext('2d')!.drawImage(img, 0, 0)
        resolve(PIXI.Texture.from(cv))
      }
      img.src = src
    })
  }

  // tileset.png is JPEG with no alpha channel — remove white/grey background.
  private static loadAndRemoveBg(src: string): Promise<PIXI.Texture> {
    return new Promise(resolve => {
      const img = new Image()
      img.onload = () => {
        const cv = document.createElement('canvas')
        cv.width = img.width; cv.height = img.height
        const ctx = cv.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        const id = ctx.getImageData(0, 0, cv.width, cv.height)
        const d  = id.data
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i+1], b = d[i+2]
          const hi = Math.max(r, g, b), lo = Math.min(r, g, b)
          if (r > 185 && g > 185 && b > 185 && (hi - lo) < 35) d[i+3] = 0
        }
        ctx.putImageData(id, 0, 0)
        resolve(PIXI.Texture.from(cv))
      }
      img.src = src
    })
  }

  async load(): Promise<void> {
    const [ground, building, nature, props, tileset, overlay] = await Promise.all([
      AtlasRegistry.loadTex('/assets/terrain/ground-atlas.png'),
      AtlasRegistry.loadTex('/assets/objects/building-atlas.png'),
      AtlasRegistry.loadTex('/assets/objects/nature-atlas.png'),
      AtlasRegistry.loadTex('/assets/objects/props-atlas.png'),
      AtlasRegistry.loadAndRemoveBg('/assets/objects/tileset.png'),
      AtlasRegistry.loadTex('/assets/objects/overlay-atlas.png'),
    ])
    this.groundTex   = ground
    this.buildingTex = building
    this.natureTex   = nature
    this.propsTex    = props
    this.tilesetTex  = tileset
    this.overlayTex  = overlay
  }

  // Load additional walk sprite textures (for NPCs and player).
  static loadWalkTex(src: string): Promise<PIXI.Texture> {
    return AtlasRegistry.loadTex(src)
  }

  // Build a RenderCtx with factory functions backed by the loaded textures.
  buildCtx(): RenderCtx {
    const crop = (tex: PIXI.Texture, x: number, y: number, w: number, h: number): PIXI.Sprite =>
      new PIXI.Sprite(new PIXI.Texture({ source: tex.source, frame: new PIXI.Rectangle(x, y, w, h) }))

    const gt = (col: number, row: number, w: number, h: number): PIXI.TilingSprite =>
      new PIXI.TilingSprite({
        texture: new PIXI.Texture({
          source: this.groundTex.source,
          frame:  new PIXI.Rectangle(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE),
        }),
        width: w, height: h,
      })

    const bsp = (x: number, y: number, w: number, h: number) => crop(this.buildingTex, x, y, w, h)
    const nsp = (x: number, y: number, w: number, h: number) => crop(this.natureTex,   x, y, w, h)
    const psp = (x: number, y: number, w: number, h: number) => crop(this.propsTex,    x, y, w, h)
    const tsp = (x: number, y: number, w: number, h: number) => crop(this.tilesetTex,  x, y, w, h)
    const osp = (x: number, y: number, w: number, h: number) => crop(this.overlayTex,  x, y, w, h)

    return { gt, bsp, nsp, psp, tsp, osp }
  }
}
