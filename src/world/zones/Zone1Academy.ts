import * as PIXI from 'pixi.js'
import { GY, K, rng } from '../constants'
import { BA, NA, PA } from '../../engine/AtlasRegistry'
import { drawStoneWall, drawFence, drawLantern } from '../drawHelpers'
import type { RenderCtx, ZoneLayers } from '../../engine/types'

// ─── Zone 1 — Academy (x: 0–540) ─────────────────────────────────────────────
// 武館 / 武德堂 — martial arts academy with training courtyard.
// Buildings: main hall (FAC_WIDE), side building (FAC_NARR)
// Props: well, training dummies ×3
// Nature: cherry blossom trees ×4
// Infrastructure: stone walls, wooden fence, stone steps, lanterns

export function buildZone1Academy(layers: ZoneLayers, ctx: RenderCtx): void {
  const { ground, infra, ysort } = layers

  // ── Ground ─────────────────────────────────────────────────────
  const grassBase = ctx.gt(0, 0, 560, 320); grassBase.x = 0;   grassBase.y = 580; ground.addChild(grassBase)
  const court     = ctx.gt(5, 1, 420, 200); court.x = 60;      court.y = 660;     ground.addChild(court)
  const grassBot  = ctx.gt(1, 0, 560,  80); grassBot.x = 0;    grassBot.y = 820;  ground.addChild(grassBot)

  // Fallen cherry blossom petals on courtyard ground
  const fl = new PIXI.Graphics()
  for (let i = 0; i < 35; i++) {
    fl.ellipse(60 + rng(i,50)*400, 680 + rng(i,51)*120, 5 + rng(i,52)*3, 3 + rng(i,53)*2)
      .fill({ color: K.cherryB, alpha: 0.45 })
  }
  ground.addChild(fl)

  // ── Infrastructure ─────────────────────────────────────────────
  const ow = new PIXI.Graphics()
  drawStoneWall(ow, 0, 640, 60, 50)
  drawStoneWall(ow, 0, 640, 16, 250)
  drawFence(ow, 470, 780, 70)
  infra.addChild(ow)

  const steps = new PIXI.Graphics()
  steps.rect(215, GY - 4,  155, 8).fill(K.stoneL)
  steps.rect(220, GY - 10, 145, 8).fill(K.stone)
  steps.rect(225, GY - 16, 135, 8).fill(K.stoneD)
  infra.addChild(steps)

  drawLantern(infra, 140, 700)
  drawLantern(infra, 290, 700)
  drawLantern(infra, 440, 700)
  const rope = new PIXI.Graphics()
  rope.moveTo(140, 706).quadraticCurveTo(215, 716, 290, 706).stroke({ color: K.woodD, width: 1.5 })
  rope.moveTo(290, 706).quadraticCurveTo(365, 716, 440, 706).stroke({ color: K.woodD, width: 1.5 })
  infra.addChild(rope)

  // Building name signs
  const mkBldgSign = (text: string, x: number, y: number) => {
    const g = new PIXI.Graphics(); g.rect(x - 28, y, 56, 20).fill(K.redD); infra.addChild(g)
    const t = new PIXI.Text({ text, style: { fontSize: 11, fill: '#F0D050', fontFamily: '"Noto Serif SC",serif', fontWeight: '700' } })
    t.anchor.set(0.5, 0.5); t.x = x; t.y = y + 10; infra.addChild(t)
  }
  mkBldgSign('武館',  90, GY - 155)
  mkBldgSign('武德堂', 366, GY - 175)

  // ── Y-sorted objects ───────────────────────────────────────────
  // Buildings (anchor bottom-left, y = GY)
  const sideB = ctx.bsp(...BA.FAC_NARR); sideB.anchor.set(0, 1); sideB.x = 0;   sideB.y = GY; sideB.scale.set(1.05); ysort.addChild(sideB)
  const mainH = ctx.bsp(...BA.FAC_WIDE); mainH.anchor.set(0, 1); mainH.x = 175; mainH.y = GY; mainH.scale.set(1.15); ysort.addChild(mainH)

  // Props
  const well   = ctx.psp(...PA.WELL);    well.anchor.set(0.5, 1);   well.x = 55;    well.y = GY;   well.scale.set(0.55);   ysort.addChild(well)
  const dummy1 = ctx.psp(...PA.DUMMY_1); dummy1.anchor.set(0.5, 1); dummy1.x = 195; dummy1.y = GY; dummy1.scale.set(0.62); ysort.addChild(dummy1)
  const dummy2 = ctx.psp(...PA.DUMMY_2); dummy2.anchor.set(0.5, 1); dummy2.x = 275; dummy2.y = GY; dummy2.scale.set(0.62); ysort.addChild(dummy2)
  const dummy3 = ctx.psp(...PA.DUMMY_3); dummy3.anchor.set(0.5, 1); dummy3.x = 355; dummy3.y = GY; dummy3.scale.set(0.62); ysort.addChild(dummy3)

  // Trees (all in ysort for correct depth with player)
  const ch1 = ctx.nsp(...NA.CHERRY_2); ch1.anchor.set(0.5, 1); ch1.x = 55;  ch1.y = GY; ch1.scale.set(0.72); ysort.addChild(ch1)
  const ch2 = ctx.nsp(...NA.CHERRY_3); ch2.anchor.set(0.5, 1); ch2.x = 38;  ch2.y = GY; ch2.scale.set(0.52); ysort.addChild(ch2)
  const ch3 = ctx.nsp(...NA.CHERRY_1); ch3.anchor.set(0.5, 1); ch3.x = 490; ch3.y = GY; ch3.scale.set(0.68); ysort.addChild(ch3)
  const ch4 = ctx.nsp(...NA.CHERRY_3); ch4.anchor.set(0.5, 1); ch4.x = 522; ch4.y = GY; ch4.scale.set(0.50); ysort.addChild(ch4)
}
