import * as PIXI from 'pixi.js'
import { GY, rng, K } from '../constants'
import { BA, NA } from '../../engine/AtlasRegistry'
import { drawWater, drawLantern, drawSign } from '../drawHelpers'
import type { RenderCtx, ZoneLayers } from '../../engine/types'

// ─── Zone 3 — Village (x: 1080–1620) ─────────────────────────────────────────
// 村落 — market village with tea house, library, market stalls and koi pond.
// Buildings: tea house (FAC_B2), library (FAC_B1)
// Props: market stalls ×3, koi pond, bonsai + cherry trees

export function buildZone3Village(layers: ZoneLayers, ctx: RenderCtx): void {
  const { ground, infra, ysort } = layers

  // ── Ground ─────────────────────────────────────────────────────
  const grassBase = ctx.gt(0, 0, 540, 320); grassBase.x = 1080; grassBase.y = 580; ground.addChild(grassBase)
  const street    = ctx.gt(9, 0, 460, 180); street.x = 1120;    street.y = 680;    ground.addChild(street)

  // Koi pond
  const pondG = new PIXI.Graphics()
  pondG.ellipse(1560, GY + 30, 55, 38).fill(K.stoneD)
  drawWater(pondG, 1508, GY - 2, 104, 64)
  pondG.ellipse(1560, GY + 32, 50, 34).fill(K.wM)
  ground.addChild(pondG)

  // Lily pads and koi
  const pond = new PIXI.Graphics()
  for (let i = 0; i < 5; i++) {
    pond.ellipse(1515 + rng(i, 70) * 90, GY + 5 + rng(i, 71) * 40, 12 + rng(i, 72) * 8, 5 + rng(i, 73) * 3)
      .fill({ color: 0x60C040, alpha: 0.65 })
  }
  for (let i = 0; i < 3; i++) pond.circle(1525 + i * 25, GY + 25, 3).fill({ color: 0xFF8030, alpha: 0.8 })
  ground.addChild(pond)

  // ── Infrastructure ─────────────────────────────────────────────
  // Building name plates
  const mkS = (text: string, x: number, y: number) => {
    const g = new PIXI.Graphics(); g.rect(x - 32, y, 64, 22).fill(K.redD); infra.addChild(g)
    const t = new PIXI.Text({ text, style: { fontSize: 12, fill: '#F0D050', fontFamily: '"Noto Serif SC",serif', fontWeight: '700' } })
    t.anchor.set(0.5, 0.5); t.x = x; t.y = y + 11; infra.addChild(t)
  }

  // Market stalls
  const stalls = new PIXI.Graphics()
  for (let i = 0; i < 3; i++) {
    const sx = 1440 + i * 65
    stalls.rect(sx, GY - 60, 55, 60).fill(K.wood)
    stalls.rect(sx - 4, GY - 72, 63, 15).fill(i % 2 === 0 ? K.red : K.colRD)
    stalls.rect(sx + 6, GY - 58, 42, 50).fill(K.wallS)
    for (let j = 0; j < 4; j++) {
      const c = j % 4 === 0 ? 0xE03030 : j % 4 === 1 ? 0xF0C040 : j % 4 === 2 ? 0x40A040 : 0x8060E0
      stalls.circle(sx + 10 + j * 10, GY - 30, 5).fill(c)
    }
  }
  infra.addChild(stalls)
  drawSign(infra, 1457, GY, '藥材')
  drawSign(infra, 1522, GY, '茶葉')
  drawSign(infra, 1587, GY, '布匹')

  drawLantern(infra, 1170, 700); drawLantern(infra, 1320, 700)
  drawLantern(infra, 1470, 700); drawLantern(infra, 1600, 700)

  // Library steps
  const libSteps = new PIXI.Graphics()
  libSteps.rect(1330, GY - 54, 80, 8).fill(K.stoneL)
  libSteps.rect(1335, GY - 60, 70, 8).fill(K.stone)
  infra.addChild(libSteps)

  // ── Y-sorted objects ───────────────────────────────────────────
  const teaH = ctx.bsp(...BA.FAC_B2); teaH.anchor.set(0, 1); teaH.x = 1090; teaH.y = GY;     teaH.scale.set(1.28); ysort.addChild(teaH)
  mkS('茶館', 1185, GY - 148)

  const lib = ctx.bsp(...BA.FAC_B1); lib.anchor.set(0, 1); lib.x = 1285; lib.y = GY - 50; lib.scale.set(1.18); ysort.addChild(lib)
  mkS('書院', 1375, GY - 192)

  const oak1 = ctx.nsp(...NA.BONSAI_2); oak1.anchor.set(0.5, 1); oak1.x = 1086; oak1.y = GY; oak1.scale.set(0.75); ysort.addChild(oak1)
  const ch1  = ctx.nsp(...NA.CHERRY_2); ch1.anchor.set(0.5, 1);  ch1.x  = 1610; ch1.y  = GY; ch1.scale.set(0.80);  ysort.addChild(ch1)
  const ch2  = ctx.nsp(...NA.CHERRY_3); ch2.anchor.set(0.5, 1);  ch2.x  = 1070; ch2.y  = GY; ch2.scale.set(0.58);  ysort.addChild(ch2)
}
