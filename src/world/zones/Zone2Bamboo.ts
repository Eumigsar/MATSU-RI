import * as PIXI from 'pixi.js'
import { GY, K } from '../constants'
import { NA } from '../../engine/AtlasRegistry'
import { drawBridge, drawSign } from '../drawHelpers'
import type { RenderCtx, ZoneLayers } from '../../engine/types'

// ─── Zone 2 — Bamboo Forest (x: 540–1080) ────────────────────────────────────
// 竹林徑 — dense bamboo grove with stream crossing and stone bridge.
// Nature: bamboo clusters (back + fore rows), rocks ×4
// Infrastructure: stone bridge, stone bench, directional signs

export function buildZone2Bamboo(layers: ZoneLayers, ctx: RenderCtx): void {
  const { ground, infra, ysort } = layers

  // ── Ground ─────────────────────────────────────────────────────
  const grassBase = ctx.gt(0, 0, 540, 320); grassBase.x = 540; grassBase.y = 580; ground.addChild(grassBase)
  const d1 = ctx.gt(4, 0,  70, 200); d1.x = 590; d1.y = 680; ground.addChild(d1)
  const d2 = ctx.gt(4, 0,  80, 220); d2.x = 780; d2.y = 660; ground.addChild(d2)
  const d3 = ctx.gt(4, 0, 120, 210); d3.x = 950; d3.y = 670; ground.addChild(d3)

  // Streambed
  const bedG = new PIXI.Graphics(); bedG.rect(718, 600, 70, 300).fill(K.stoneD); ground.addChild(bedG)
  const waterStr = ctx.gt(7, 2, 58, 296); waterStr.x = 724; waterStr.y = 604; ground.addChild(waterStr)

  // ── Infrastructure ─────────────────────────────────────────────
  const br = new PIXI.Graphics(); drawBridge(br, 710, GY, 88); infra.addChild(br)

  // Rest stones beside the path — ysort so player can pass behind/in front
  const rs1 = ctx.nsp(...NA.ROCK_SM); rs1.anchor.set(0.5, 1); rs1.x = 850; rs1.y = GY; rs1.scale.set(0.52); ysort.addChild(rs1)
  const rs2 = ctx.nsp(...NA.ROCK_SM); rs2.anchor.set(0.5, 1); rs2.x = 878; rs2.y = GY; rs2.scale.set(0.44); ysort.addChild(rs2)

  drawSign(infra, 580, GY, '竹林徑')
  drawSign(infra, 760, GY, '清溪橋')

  // ── Y-sorted objects ───────────────────────────────────────────
  // Bamboo back row (taller, further back by Y)
  const bambBack: [number, number][] = [
    [548, 0.90], [566, 1.00], [584, 0.86], [602, 1.05], [620, 0.92], [638, 1.00], [656, 0.88],
    [808, 0.95], [828, 1.10], [848, 0.88], [868, 1.00], [888, 0.93], [908, 1.05],
    [928, 0.87], [948, 1.00], [968, 0.90], [988, 1.08], [1008, 0.92], [1030, 0.86], [1052, 1.00],
  ]
  bambBack.forEach(([bx, sc], i) => {
    const b = i % 4 === 0 ? ctx.nsp(...NA.BAMB_MID) : ctx.nsp(...NA.BAMB_SM)
    b.anchor.set(0.5, 1); b.x = bx; b.y = GY; b.scale.set(sc); ysort.addChild(b)
  })

  // Bamboo fore row (denser, same Y so ysort interleaves correctly)
  const bambFore: [number, number][] = [
    [558, 1.05], [578, 0.96], [598, 1.10], [618, 0.90], [638, 1.00], [658, 0.88],
    [820, 1.00], [842, 1.12], [864, 0.92], [886, 1.05], [910, 0.90], [932, 1.00], [956, 0.88], [980, 1.05],
  ]
  bambFore.forEach(([bx, sc]) => {
    const b = ctx.nsp(...NA.BAMB_SM); b.anchor.set(0.5, 1); b.x = bx; b.y = GY; b.scale.set(sc); ysort.addChild(b)
  })

  // Rocks scattered around grove
  const rk1 = ctx.nsp(...NA.ROCK_MED); rk1.anchor.set(0.5, 1); rk1.x = 660;  rk1.y = GY;    rk1.scale.set(0.55); ysort.addChild(rk1)
  const rk2 = ctx.nsp(...NA.ROCK_LG);  rk2.anchor.set(0.5, 1); rk2.x = 900;  rk2.y = GY;    rk2.scale.set(0.62); ysort.addChild(rk2)
  const rk3 = ctx.nsp(...NA.ROCK_SM);  rk3.anchor.set(0.5, 1); rk3.x = 980;  rk3.y = GY;    rk3.scale.set(0.50); ysort.addChild(rk3)
  const rk4 = ctx.nsp(...NA.ROCK_MED); rk4.anchor.set(0.5, 1); rk4.x = 1050; rk4.y = GY;    rk4.scale.set(0.52); ysort.addChild(rk4)
}
