import * as PIXI from 'pixi.js'
import { GY, K } from '../constants'
import { NA } from '../../engine/AtlasRegistry'
import { drawDirt, drawStoneWall, drawSign } from '../drawHelpers'
import type { RenderCtx, ZoneLayers } from '../../engine/types'

// ─── Zone 4 — Mountain Path (x: 1620–2160) ───────────────────────────────────
// 山道 — ascending cliff path with waterfall, cave entrance, and mountain flora.
// Terrain: graded slope from GY to GY-160, stone steps ×12
// Water: waterfall + basin
// Nature: bonsai trees ×5, rocks ×7
// Infrastructure: cave entrance with stone arch, hidden valley sign

export function buildZone4Mountain(layers: ZoneLayers, ctx: RenderCtx): void {
  const { ground, infra, ysort } = layers

  // ── Ground ─────────────────────────────────────────────────────
  const grassBase = ctx.gt(0, 0, 540, 420); grassBase.x = 1620; grassBase.y = 480; ground.addChild(grassBase)

  // Terrain slope polygon
  const terr = new PIXI.Graphics()
  terr.poly([1620, 900, 1620, GY, 1680, GY - 20, 1780, GY - 60, 1900, GY - 130,
             2000, GY - 160, 2100, GY - 150, 2160, GY - 80, 2160, 900]).fill(K.grassD)
  ground.addChild(terr)

  // Cliff face
  const cliffG = new PIXI.Graphics(); drawStoneWall(cliffG, 1620, GY - 100, 540, 16); ground.addChild(cliffG)

  // Dirt path segments ascending the slope
  const dirtPath = new PIXI.Graphics()
  drawDirt(dirtPath, 1640, GY - 15,   80, 120)
  drawDirt(dirtPath, 1720, GY - 55,   80,  80)
  drawDirt(dirtPath, 1800, GY - 105,  80,  70)
  drawDirt(dirtPath, 1880, GY - 140, 120,  60)
  drawDirt(dirtPath, 2000, GY - 160, 160,  50)
  ground.addChild(dirtPath)

  // Rocky ledges
  const rockyG = new PIXI.Graphics()
  rockyG.rect(1620, GY - 120, 540, 20).fill(K.stone)
  rockyG.rect(1800, GY - 150, 240, 25).fill(K.stoneD)
  rockyG.rect(2000, GY - 170, 160, 20).fill(K.stone)
  ground.addChild(rockyG)

  // ── Infrastructure ─────────────────────────────────────────────
  // Stone steps ascending the mountain path
  const sts = new PIXI.Graphics()
  for (let i = 0; i < 12; i++) {
    const sx = 1660 + i * 28, sy = GY - 12 - i * 12
    sts.rect(sx, sy, 36, 10).fill(i % 2 === 0 ? K.stoneL : K.stone)
    sts.rect(sx, sy, 36,  2).fill({ color: 0xFFFFFF, alpha: 0.08 })
  }
  infra.addChild(sts)

  // Waterfall + basin
  const wf = new PIXI.Graphics()
  wf.ellipse(1940, GY - 115, 50, 28).fill(K.wD)
  wf.ellipse(1940, GY - 117, 44, 24).fill(K.wM)
  wf.rect(1930, GY - 280, 22, 168).fill({ color: K.wL, alpha: 0.7 })
  for (let i = 0; i < 8;  i++) wf.ellipse(1924 + i * 4, GY - 280, 5, 4).fill({ color: K.wF, alpha: 0.60 })
  for (let i = 0; i < 10; i++) wf.ellipse(1916 + i * 5, GY - 118, 7, 4).fill({ color: K.wF, alpha: 0.55 })
  infra.addChild(wf)

  // Cave entrance — rock arch formation from nature atlas
  drawSign(infra, 2130, GY - 160, '隱谷')

  // ── Y-sorted objects ───────────────────────────────────────────
  // Trees placed at slope-correct Y positions — higher on slope = lower Y = draws behind
  // Cave entrance arch — large rocks framing the dark passage at slope height
  const caveL = ctx.nsp(...NA.ROCK_LG);  caveL.anchor.set(0.5, 1); caveL.x = 2108; caveL.y = GY - 112; caveL.scale.set(0.88); ysort.addChild(caveL)
  const caveR = ctx.nsp(...NA.ROCK_MED); caveR.anchor.set(0.5, 1); caveR.x = 2155; caveR.y = GY - 120; caveR.scale.set(0.72); ysort.addChild(caveR)
  const caveT = ctx.nsp(...NA.ROCK_SM);  caveT.anchor.set(0.5, 1); caveT.x = 2132; caveT.y = GY - 128; caveT.scale.set(0.60); ysort.addChild(caveT)

  const tr1 = ctx.nsp(...NA.BONSAI_1); tr1.anchor.set(0.5, 1); tr1.x = 1640; tr1.y = GY;       tr1.scale.set(1.00); ysort.addChild(tr1)
  const tr2 = ctx.nsp(...NA.BONSAI_3); tr2.anchor.set(0.5, 1); tr2.x = 1700; tr2.y = GY - 50;  tr2.scale.set(0.85); ysort.addChild(tr2)
  const tr3 = ctx.nsp(...NA.BONSAI_2); tr3.anchor.set(0.5, 1); tr3.x = 1820; tr3.y = GY - 100; tr3.scale.set(0.92); ysort.addChild(tr3)
  const tr4 = ctx.nsp(...NA.BONSAI_4); tr4.anchor.set(0.5, 1); tr4.x = 2050; tr4.y = GY - 160; tr4.scale.set(1.10); ysort.addChild(tr4)
  const tr5 = ctx.nsp(...NA.BONSAI_1); tr5.anchor.set(0.5, 1); tr5.x = 2120; tr5.y = GY - 140; tr5.scale.set(0.82); ysort.addChild(tr5)

  // Rocks along the path and near waterfall
  const rk1 = ctx.nsp(...NA.ROCK_LG);  rk1.anchor.set(0.5, 1); rk1.x = 1670; rk1.y = GY;       rk1.scale.set(0.80); ysort.addChild(rk1)
  const rk2 = ctx.nsp(...NA.ROCK_MED); rk2.anchor.set(0.5, 1); rk2.x = 1750; rk2.y = GY - 65;  rk2.scale.set(0.62); ysort.addChild(rk2)
  const rk3 = ctx.nsp(...NA.ROCK_LG);  rk3.anchor.set(0.5, 1); rk3.x = 1860; rk3.y = GY - 138; rk3.scale.set(0.85); ysort.addChild(rk3)
  const rk4 = ctx.nsp(...NA.ROCK_MED); rk4.anchor.set(0.5, 1); rk4.x = 2080; rk4.y = GY - 175; rk4.scale.set(0.65); ysort.addChild(rk4)
  const rk5 = ctx.nsp(...NA.ROCK_SM);  rk5.anchor.set(0.5, 1); rk5.x = 2140; rk5.y = GY - 92;  rk5.scale.set(0.50); ysort.addChild(rk5)
  const rw1 = ctx.nsp(...NA.ROCK_MED); rw1.anchor.set(0.5, 1); rw1.x = 1905; rw1.y = GY - 125; rw1.scale.set(0.68); ysort.addChild(rw1)
  const rw2 = ctx.nsp(...NA.ROCK_SM);  rw2.anchor.set(0.5, 1); rw2.x = 1968; rw2.y = GY - 120; rw2.scale.set(0.54); ysort.addChild(rw2)
}
