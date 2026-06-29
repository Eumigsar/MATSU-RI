import * as PIXI from 'pixi.js'
import { GY, K } from '../constants'
import { BA, NA, PA } from '../../engine/AtlasRegistry'
import { drawStoneWall, drawLantern } from '../drawHelpers'
import type { RenderCtx, ZoneLayers } from '../../engine/types'

// ─── Zone 5 — Temple (x: 2160–2700) ─────────────────────────────────────────
// 古刹 — ancient temple complex with main gate, bell tower, hall and stone tablets.
// Buildings: gate (GATE_SM), bell tower (FAC_NARR), main hall (FAC_WIDE)
// Props: incense (INCENSE), lion statues ×2, Dao/De/Ren tablets ×3
// Nature: bonsai ×2, cherry tree ×1
// Infrastructure: stone wall, stone steps ×4, lanterns ×5

export function buildZone5Temple(layers: ZoneLayers, ctx: RenderCtx): void {
  const { ground, infra, ysort } = layers

  // ── Ground ─────────────────────────────────────────────────────
  const grassBase = ctx.gt(0, 0, 540, 320); grassBase.x = 2160; grassBase.y = 580; ground.addChild(grassBase)
  const court     = ctx.gt(3, 1, 460, 220); court.x = 2200;    court.y = 650;     ground.addChild(court)
  const grassBot  = ctx.gt(1, 0, 540,  80); grassBot.x = 2160; grassBot.y = 820;  ground.addChild(grassBot)

  // ── Infrastructure ─────────────────────────────────────────────
  const tw = new PIXI.Graphics(); drawStoneWall(tw, 2160, 640, 540, 42); infra.addChild(tw)

  // Stone steps in front of main hall
  const ts = new PIXI.Graphics()
  ts.rect(2385, GY - 4,  150, 8).fill(K.stoneL)
  ts.rect(2390, GY - 10, 140, 8).fill(K.stone)
  ts.rect(2395, GY - 16, 130, 8).fill(K.stoneD)
  ts.rect(2400, GY - 22, 120, 8).fill(K.stoneL)
  infra.addChild(ts)

  // Stone lion statues flanking courtyard
  const stat = new PIXI.Graphics()
  for (const sx of [2236, 2640]) {
    stat.ellipse(sx, GY + 8,  16, 10).fill({ color: 0x000000, alpha: 0.1 })
    stat.rect(sx - 8,  GY - 70, 16, 70).fill(K.stoneD)
    stat.ellipse(sx, GY - 72, 14, 14).fill(K.stone)
    stat.rect(sx - 20, GY - 60,  8, 30).fill(K.stoneD)
    stat.rect(sx + 12, GY - 60,  8, 30).fill(K.stoneD)
    stat.rect(sx - 14, GY - 30, 28,  8).fill(K.stoneL)
  }
  infra.addChild(stat)

  // Dao/De/Ren tablets
  const tab = new PIXI.Graphics()
  for (let i = 0; i < 3; i++) {
    const tx = 2310 + i * 80
    tab.rect(tx - 10, GY - 90, 20, 90).fill(K.stoneD)
    tab.rect(tx - 8,  GY - 88, 16, 86).fill(K.stone)
  }
  infra.addChild(tab)
  ;([['道', 2310], ['德', 2390], ['仁', 2470]] as [string, number][]).forEach(([ch, tx]) => {
    const t = new PIXI.Text({ text: ch, style: { fontSize: 18, fill: '#3A2010', fontFamily: '"Noto Serif SC",serif' } })
    t.anchor.set(0.5, 0.5); t.x = tx; t.y = GY - 48; infra.addChild(t)
  })

  // Lanterns along courtyard
  for (let i = 0; i < 5; i++) drawLantern(infra, 2230 + i * 100, GY - 90)

  // Building name signs
  const mkS = (text: string, x: number, y: number) => {
    const g = new PIXI.Graphics(); g.rect(x - 36, y, 72, 24).fill(K.redD); infra.addChild(g)
    const t = new PIXI.Text({ text, style: { fontSize: 13, fill: '#F0D050', fontFamily: '"Noto Serif SC",serif', fontWeight: '700' } })
    t.anchor.set(0.5, 0.5); t.x = x; t.y = y + 12; infra.addChild(t)
  }
  mkS('鐘樓', 2286, GY - 138)
  mkS('古刹',  2510, GY - 145)

  // Main gate title
  const gateT = new PIXI.Text({ text: '學府門', style: { fontSize: 14, fill: '#E8C050', fontFamily: '"Noto Serif SC",serif', fontWeight: '700' } })
  gateT.anchor.set(0.5, 0.5); gateT.x = 2280; gateT.y = GY - 212; infra.addChild(gateT)

  // ── Y-sorted objects ───────────────────────────────────────────
  const gate   = ctx.bsp(...BA.GATE_SM);  gate.anchor.set(0.5, 1);  gate.x   = 2280; gate.y   = GY;      gate.scale.set(1.05);  ysort.addChild(gate)
  const bell   = ctx.bsp(...BA.FAC_NARR); bell.anchor.set(0, 1);    bell.x   = 2210; bell.y   = GY - 30; bell.scale.set(0.88);  ysort.addChild(bell)
  const temple = ctx.bsp(...BA.FAC_WIDE); temple.anchor.set(0, 1);  temple.x = 2345; temple.y = GY;      temple.scale.set(1.12); ysort.addChild(temple)

  const oak1 = ctx.nsp(...NA.BONSAI_2); oak1.anchor.set(0.5, 1); oak1.x = 2192; oak1.y = GY; oak1.scale.set(1.10); ysort.addChild(oak1)
  const oak2 = ctx.nsp(...NA.BONSAI_4); oak2.anchor.set(0.5, 1); oak2.x = 2660; oak2.y = GY; oak2.scale.set(1.00); ysort.addChild(oak2)
  const plum = ctx.nsp(...NA.CHERRY_1); plum.anchor.set(0.5, 1); plum.x = 2175; plum.y = GY; plum.scale.set(0.62); ysort.addChild(plum)

  const inc = ctx.psp(...PA.INCENSE);   inc.anchor.set(0.5, 1);  inc.x  = 2490; inc.y  = GY; inc.scale.set(0.50);  ysort.addChild(inc)
}
