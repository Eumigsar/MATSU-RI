import * as PIXI from 'pixi.js'
import { WW, H, GY, rng, K } from './constants'
import { drawSign } from './drawHelpers'
import { buildZone1Academy } from './zones/Zone1Academy'
import { buildZone2Bamboo }  from './zones/Zone2Bamboo'
import { buildZone3Village } from './zones/Zone3Village'
import { buildZone4Mountain } from './zones/Zone4Mountain'
import { buildZone5Temple }  from './zones/Zone5Temple'
import type { RenderCtx, ZoneLayers } from '../engine/types'
import type { PipelineLayers } from '../engine/RenderPipeline'

// ─── Sky ──────────────────────────────────────────────────────────────────────
// Viewport-fixed layer — lives on app.stage, never scrolls vertically.
// Extra width (WW+400) so clouds cover the full parallax travel range.
export function buildSky(sky: PIXI.Container): void {
  const g  = new PIXI.Graphics()
  const sw = WW + 400
  g.rect(0, 0, sw, H).fill(K.skyT)
  g.rect(0, 0, sw, H * 0.42).fill({ color: K.skyM, alpha: 0.48 })
  g.rect(0, H * 0.28, sw, H * 0.38).fill({ color: K.skyH, alpha: 0.32 })
  for (let i = 0; i < 20; i++) {
    const cx = rng(i, 90) * sw, cy = H * 0.04 + rng(i, 91) * H * 0.38, cw = 60 + rng(i, 92) * 110
    g.ellipse(cx, cy, cw, 20 + rng(i, 93) * 18).fill({ color: 0xF0F5FA, alpha: 0.55 + rng(i, 94) * 0.25 })
    g.ellipse(cx - cw * 0.25, cy - 10, cw * 0.5,  18 + rng(i, 95) * 10).fill({ color: 0xF8FBFF, alpha: 0.45 + rng(i, 96) * 0.20 })
    g.ellipse(cx + cw * 0.20, cy - 8,  cw * 0.45, 16 + rng(i, 97) *  8).fill({ color: 0xF0F5FA, alpha: 0.40 + rng(i, 98) * 0.20 })
  }
  sky.addChild(g)
}

// ─── Mountains ────────────────────────────────────────────────────────────────
// Viewport-fixed layer — lives on app.stage, x-parallax at 0.06× camera speed.
// Horizon sits at 58% of viewport height (~325 px from top).
export function buildMountains(mtn: PIXI.Container): void {
  const g     = new PIXI.Graphics()
  const sw    = WW + 400
  const horiz = Math.round(H * 0.58)  // ~325 px
  for (let i = 0; i < 9; i++) {
    const mx = rng(i, 80) * sw - 200, mh = 100 + rng(i, 81) * 90,  mw = 200 + rng(i, 82) * 200
    g.poly([mx, horiz, mx + mw / 2, horiz - mh, mx + mw, horiz]).fill({ color: K.mtnF, alpha: 0.35 + rng(i, 83) * 0.15 })
  }
  for (let i = 0; i < 7; i++) {
    const mx = rng(i + 20, 80) * sw - 150, mh = 65 + rng(i + 20, 81) * 65, mw = 170 + rng(i + 20, 82) * 160
    g.poly([mx, horiz + 35, mx + mw / 2, horiz + 35 - mh, mx + mw, horiz + 35]).fill({ color: K.mtnM, alpha: 0.40 + rng(i + 20, 83) * 0.20 })
  }
  for (let i = 0; i < 14; i++) {
    const hx = rng(i, 70) * sw, hy = horiz + 18 + rng(i, 71) * 55, hw = 80 + rng(i, 72) * 130
    g.ellipse(hx, hy, hw, 42 + rng(i, 73) * 32).fill({ color: K.hillF, alpha: 0.50 + rng(i, 74) * 0.25 })
  }
  g.rect(0, horiz + 12, sw, H - horiz).fill(K.hillN)
  mtn.addChild(g)
}

// ─── World builder ────────────────────────────────────────────────────────────
// Populates all 5 zones and places zone-boundary directional signs.
// Call once after AtlasRegistry.load() and RenderPipeline construction.
export function buildWorld(pipeline: PipelineLayers, ctx: RenderCtx): void {
  const zoneLayers: ZoneLayers = {
    ground: pipeline.ground,
    infra:  pipeline.infra,
    ysort:  pipeline.ysort,
  }

  buildZone1Academy(zoneLayers, ctx)
  buildZone2Bamboo(zoneLayers,  ctx)
  buildZone3Village(zoneLayers, ctx)
  buildZone4Mountain(zoneLayers, ctx)
  buildZone5Temple(zoneLayers,  ctx)

  // Zone boundary signs (fixed infra, not Y-sorted)
  drawSign(pipeline.infra,  540, GY, '竹林')
  drawSign(pipeline.infra, 1082, GY, '村落')
  drawSign(pipeline.infra, 1622, GY, '山道')
  drawSign(pipeline.infra, 2162, GY, '古刹')
}
