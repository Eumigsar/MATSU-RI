import * as PIXI from 'pixi.js'
import { GY, K } from '../constants'
import { BA, NA, OA, PA } from '../../engine/AtlasRegistry'
import { drawLantern, drawSign } from '../drawHelpers'
import type { RenderCtx, ZoneLayers } from '../../engine/types'

// ─── Zone 3 — Village (x: 1080–1620) ─────────────────────────────────────────
// 村落 — market village with tea house, library, market stalls and koi pond.
// Buildings: tea house (FAC_B2), library (FAC_B1), 3 market stalls (FAC_B3)
// Props: barrels ×2, koi pond (overlay water patches), bonsai + cherry trees

export function buildZone3Village(layers: ZoneLayers, ctx: RenderCtx): void {
  const { ground, infra, ysort } = layers

  // ── Ground ─────────────────────────────────────────────────────
  const grassBase = ctx.gt(0, 0, 540, 320); grassBase.x = 1080; grassBase.y = 580; ground.addChild(grassBase)
  const street    = ctx.gt(9, 0, 460, 180); street.x = 1120;    street.y = 680;    ground.addChild(street)

  // Koi pond — overlay atlas water patches placed on ground layer
  const pw1 = ctx.osp(...OA.WATER_PAT_2); pw1.x = 1506; pw1.y = GY - 4;  pw1.scale.set(0.92); ground.addChild(pw1)
  const pw2 = ctx.osp(...OA.WATER_PAT_1); pw2.x = 1510; pw2.y = GY + 44; pw2.scale.set(0.80); ground.addChild(pw2)
  const petals = ctx.osp(...OA.PETAL_HEAP); petals.x = 1595; petals.y = GY + 30; petals.scale.set(0.55); ground.addChild(petals)

  // ── Infrastructure ─────────────────────────────────────────────
  // Market stall signs (above each stall)
  drawSign(infra, 1467, GY, '藥材')
  drawSign(infra, 1532, GY, '茶葉')
  drawSign(infra, 1597, GY, '布匹')

  drawLantern(infra, 1170, 700); drawLantern(infra, 1320, 700)
  drawLantern(infra, 1470, 700); drawLantern(infra, 1600, 700)

  // Library steps
  const libSteps = new PIXI.Graphics()
  libSteps.rect(1330, GY - 54, 80, 8).fill(K.stoneL)
  libSteps.rect(1335, GY - 60, 70, 8).fill(K.stone)
  infra.addChild(libSteps)

  // ── Y-sorted objects ───────────────────────────────────────────
  // Tea house
  const teaH = ctx.bsp(...BA.FAC_B2); teaH.anchor.set(0, 1); teaH.x = 1090; teaH.y = GY; teaH.scale.set(1.28); ysort.addChild(teaH)
  const teaLbl = new PIXI.Text({ text: '茶館', style: { fontSize: 12, fill: '#F0D050', fontFamily: '"Noto Serif SC",serif', fontWeight: '700' } })
  teaLbl.anchor.set(0.5, 0.5); teaLbl.x = 1185; teaLbl.y = GY - 148; infra.addChild(teaLbl)

  // Library
  const lib = ctx.bsp(...BA.FAC_B1); lib.anchor.set(0, 1); lib.x = 1285; lib.y = GY - 50; lib.scale.set(1.18); ysort.addChild(lib)
  const libLbl = new PIXI.Text({ text: '書院', style: { fontSize: 12, fill: '#F0D050', fontFamily: '"Noto Serif SC",serif', fontWeight: '700' } })
  libLbl.anchor.set(0.5, 0.5); libLbl.x = 1375; libLbl.y = GY - 192; infra.addChild(libLbl)

  // Market stalls — FAC_B3 building facades, scaled to stall size
  for (let i = 0; i < 3; i++) {
    const stall = ctx.bsp(...BA.FAC_B3)
    stall.anchor.set(0.5, 1); stall.x = 1467 + i * 65; stall.y = GY; stall.scale.set(0.42)
    ysort.addChild(stall)
  }

  // Barrel props for market goods
  const bar1 = ctx.psp(...PA.BARREL); bar1.anchor.set(0.5, 1); bar1.x = 1452; bar1.y = GY; bar1.scale.set(0.45); ysort.addChild(bar1)
  const bar2 = ctx.psp(...PA.BARREL); bar2.anchor.set(0.5, 1); bar2.x = 1517; bar2.y = GY; bar2.scale.set(0.45); ysort.addChild(bar2)

  // Nature
  const oak1 = ctx.nsp(...NA.BONSAI_2); oak1.anchor.set(0.5, 1); oak1.x = 1086; oak1.y = GY; oak1.scale.set(0.75); ysort.addChild(oak1)
  const ch1  = ctx.nsp(...NA.CHERRY_2); ch1.anchor.set(0.5, 1);  ch1.x  = 1610; ch1.y  = GY; ch1.scale.set(0.80);  ysort.addChild(ch1)
  const ch2  = ctx.nsp(...NA.CHERRY_3); ch2.anchor.set(0.5, 1);  ch2.x  = 1070; ch2.y  = GY; ch2.scale.set(0.58);  ysort.addChild(ch2)
}
