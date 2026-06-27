import { useEffect, useRef, useState } from 'react'
import * as PIXI from 'pixi.js'
import { useGameStore } from '../stores/gameStore'
import { TONE_COLORS } from '../types'
import type { HanziData } from '../types'

const W = 900
const H = 560
const WW = 2700
const WH = 900
const GY = 770

const K = {
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
}

const FW = 32, FH = 32

// ── Atlas tile/sprite coordinate references ───────────────────────
// ground-atlas.png  : 1536×1024 RGBA, 128×128 tiles, 12×8 grid
// building-atlas.png: 1536×1024 RGBA — facades, gates, railings
// nature-atlas.png  : 1536×1024 RGBA — bamboo, cherry, bonsai, rocks
// props-atlas.png   : 1024×1024 RGBA — well, dummies, incense, barrels
// Walk sprites      : 128×128 RGBA, 4×4 grid of 32×32 frames
//   Row 0=down, 1=left, 2=right, 3=up

type GroundTiler  = (col: number, row: number, w: number, h: number) => PIXI.TilingSprite
type AtlasSpriter = (x: number, y: number, w: number, h: number) => PIXI.Sprite
interface Ctx { gt: GroundTiler; bsp: AtlasSpriter; nsp: AtlasSpriter; psp: AtlasSpriter }

const NA = {
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

const BA = {
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

const PA = {
  STONE_LAN: [29,   24,  58, 126] as const,
  WELL:      [406,  24, 103, 126] as const,
  DUMMY_1:   [37,  155,  58, 125] as const,
  DUMMY_2:   [107, 155,  59, 125] as const,
  DUMMY_3:   [187, 155,  73, 125] as const,
  BARREL:    [23,  415,  63, 115] as const,
  INCENSE:   [855, 840, 140, 143] as const,
} as const

function rng(a: number, b: number) {
  return (((a * 1103515245 + 12345 + b * 214013) >>> 0) & 0x7fffffff) / 0x7fffffff
}

type OrbData = HanziData & { wx: number; wy: number }

const ORBS: OrbData[] = [
  { hanzi:'一', pinyin:'yī',  pinyin_base:'yi',  tone:1, meaning_pt:'um',     hsk_level:1, stroke_count:1, wx:350,  wy:790,
    etymology:'Um único traço horizontal — o início de toda jornada.' },
  { hanzi:'二', pinyin:'èr',  pinyin_base:'er',  tone:2, meaning_pt:'dois',   hsk_level:1, stroke_count:2, wx:870,  wy:750,
    etymology:'Dois traços: Céu acima, Terra abaixo.' },
  { hanzi:'三', pinyin:'sān', pinyin_base:'san', tone:1, meaning_pt:'três',   hsk_level:1, stroke_count:3, wx:1450, wy:780,
    etymology:'Três traços: Céu, Humanidade e Terra.' },
  { hanzi:'四', pinyin:'sì',  pinyin_base:'si',  tone:4, meaning_pt:'quatro', hsk_level:1, stroke_count:5, wx:2080, wy:680,
    etymology:'Uma boca dentro de um quadrado: os quatro cantos do mundo.' },
  { hanzi:'五', pinyin:'wǔ',  pinyin_base:'wu',  tone:3, meaning_pt:'cinco',  hsk_level:1, stroke_count:4, wx:2510, wy:770,
    etymology:'Os Cinco Elementos em equilíbrio.' },
]

// ─────────────────────────────────────────────────────────────────
// Drawing helpers (vector — used for infrastructure without sprites)
// ─────────────────────────────────────────────────────────────────

function drawDirt(g: PIXI.Graphics, x: number, y: number, w: number, h: number) {
  g.rect(x, y, w, h).fill(K.dirt)
  for (let i = 0; i < Math.floor(w/28); i++) {
    g.ellipse(x + rng(i,13)*w, y + rng(i,14)*h, 14+rng(i,15)*10, 5+rng(i,16)*4).fill({ color: K.dirtL, alpha: 0.28 })
  }
}

function drawWater(g: PIXI.Graphics, x: number, y: number, w: number, h: number) {
  g.rect(x, y, w, h).fill(K.wD)
  g.rect(x, y, w, h * 0.35).fill({ color: K.wM, alpha: 0.55 })
  for (let i = 0; i < 5; i++) {
    g.rect(x + w*0.04, y + h*(0.12 + i*0.17), w*0.92, 3).fill({ color: K.wL, alpha: 0.28 })
  }
}

function drawStoneWall(g: PIXI.Graphics, x: number, y: number, w: number, h: number = 42) {
  g.rect(x, y, w, h).fill(K.stoneD)
  const bw = 38, bh = 20
  for (let row = 0; row * bh < h; row++) {
    for (let col = 0; col * bw < w + bw; col++) {
      const ox = row%2===0 ? 0 : bw/2
      const bx = x + col*bw - ox, by = y + row*bh
      const l = Math.max(bx+1, x), r = Math.min(bx+bw-2, x+w)
      if (r > l) g.rect(l, by+1, r-l, bh-2).fill(K.stone)
    }
  }
}

function drawFence(g: PIXI.Graphics, x: number, y: number, w: number) {
  g.rect(x, y-12, w, 4).fill(K.woodD)
  g.rect(x, y-24, w, 4).fill(K.woodD)
  for (let i = 0; i*18 < w; i++) {
    g.rect(x+i*18, y-36, 10, 36).fill(K.wood)
    g.rect(x+i*18, y-38, 10,  5).fill({ color: 0x000000, alpha: 0.25 })
  }
}

function drawBridge(g: PIXI.Graphics, x: number, y: number, w: number) {
  for (let i = 0; i < Math.floor(w/12); i++) g.rect(x+i*12, y-12, 10, 14).fill(K.wood)
  g.rect(x, y-12, w, 14).stroke({ color: K.woodD, width: 1 })
  g.rect(x, y-28, w, 5).fill(K.woodD)
  g.rect(x, y+2,  w, 5).fill(K.woodD)
  for (let i = 0; i*22 < w; i++) g.rect(x+i*22, y-28, 4, 32).fill(K.woodL)
}

function drawLantern(cont: PIXI.Container, x: number, y: number) {
  const g = new PIXI.Graphics()
  g.moveTo(x, y).lineTo(x, y+9).stroke({ color: K.woodD, width: 2 })
  g.ellipse(x, y+22, 18, 18).fill({ color: K.lanG, alpha: 0.1 })
  g.rect(x-8, y+9, 16, 26).fill(K.lanR)
  for (let i=1;i<4;i++) g.rect(x-8+16*i/4-0.5, y+11, 1, 22).fill({ color: 0x880000, alpha: 0.45 })
  g.rect(x-10, y+7,  20, 5).fill(K.gold)
  g.rect(x-10, y+32, 20, 5).fill(K.gold)
  g.rect(x-7,  y+11, 14, 22).fill({ color: K.lanG, alpha: 0.22 })
  for (let i=0;i<3;i++) g.moveTo(x-5+i*5, y+37).lineTo(x-5+i*5, y+46).stroke({ color: K.gold, width: 1 })
  cont.addChild(g)
}

function drawSign(cont: PIXI.Container, x: number, y: number, text: string) {
  const g = new PIXI.Graphics()
  g.rect(x-2,  y-80, 4,  80).fill(K.woodD)
  g.rect(x-28, y-76, 56, 38).fill(K.wood)
  g.rect(x-26, y-74, 52, 34).fill(K.woodL)
  cont.addChild(g)
  const t = new PIXI.Text({ text, style:{ fontSize:11, fill:'#2A1008', fontFamily:'"Noto Serif SC",serif', fontWeight:'700' } })
  t.anchor.set(0.5, 0.5); t.x = x; t.y = y - 57; cont.addChild(t)
}

// ─────────────────────────────────────────────────────────────────
// Render layer architecture (12 logical layers → 6 PIXI containers)
//
//  app.stage
//    #01-02  skyLay    Sky gradient + clouds                (viewport-fixed, x-parallax 0.12×)
//    #03-04  mtnLay    Mountain silhouettes + hills          (viewport-fixed, x-parallax 0.06×)
//    world   (scrolls with camera)
//      #05-06  groundLay Terrain tiles (grass, stone, water)  (world-fixed)
//      #07     infraLay  Walls, fences, bridges, steps, signs (world-fixed, under Y-sort)
//      #08-11  ysortLay  Y-SORTED: buildings + trees + props + NPCs + player
//      #12     partLay   Particles, weather FX                (always on top)
//
// skyLay/mtnLay on app.stage → never scroll vertically, only horizontal parallax.
// Y-sort rule: every child of ysortLay must have .y = its foot/base Y in world space.
// Ticker sorts ysortLay.children by .y each frame — higher Y renders in front.
// ─────────────────────────────────────────────────────────────────

// ── Zone 1 — Academy (x: 0–540) ──────────────────────────────────
function buildZone1Academy(ground: PIXI.Container, infra: PIXI.Container, ysort: PIXI.Container, ctx: Ctx) {
  const grassBase = ctx.gt(0, 0, 560, 320); grassBase.x = 0;  grassBase.y = 580; ground.addChild(grassBase)
  const court     = ctx.gt(5, 1, 420, 200); court.x = 60;     court.y = 660;     ground.addChild(court)
  const grassBot  = ctx.gt(1, 0, 560,  80); grassBot.x = 0;   grassBot.y = 820;  ground.addChild(grassBot)

  const ow = new PIXI.Graphics()
  drawStoneWall(ow, 0, 640, 60, 50)
  drawStoneWall(ow, 0, 640, 16, 250)
  drawFence(ow, 470, 780, 70)
  infra.addChild(ow)

  // Buildings (sprites — foot at GY, Y-sorted)
  const sideB = ctx.bsp(...BA.FAC_NARR); sideB.anchor.set(0,1); sideB.x=0;   sideB.y=GY; sideB.scale.set(1.05); ysort.addChild(sideB)
  const mainH = ctx.bsp(...BA.FAC_WIDE); mainH.anchor.set(0,1); mainH.x=175; mainH.y=GY; mainH.scale.set(1.15); ysort.addChild(mainH)

  const mkBldgSign = (text: string, x: number, y: number) => {
    const g = new PIXI.Graphics(); g.rect(x-28, y, 56, 20).fill(K.redD); infra.addChild(g)
    const t = new PIXI.Text({ text, style:{ fontSize:11, fill:'#F0D050', fontFamily:'"Noto Serif SC",serif', fontWeight:'700' } })
    t.anchor.set(0.5, 0.5); t.x = x; t.y = y + 10; infra.addChild(t)
  }
  mkBldgSign('武館', 90, GY - 155)
  mkBldgSign('武德堂', 366, GY - 175)

  // Props (sprites — Y-sorted)
  const well   = ctx.psp(...PA.WELL);    well.anchor.set(0.5,1);   well.x=55;    well.y=GY;   well.scale.set(0.55);   ysort.addChild(well)
  const dummy1 = ctx.psp(...PA.DUMMY_1); dummy1.anchor.set(0.5,1); dummy1.x=195; dummy1.y=GY; dummy1.scale.set(0.62); ysort.addChild(dummy1)
  const dummy2 = ctx.psp(...PA.DUMMY_2); dummy2.anchor.set(0.5,1); dummy2.x=275; dummy2.y=GY; dummy2.scale.set(0.62); ysort.addChild(dummy2)
  const dummy3 = ctx.psp(...PA.DUMMY_3); dummy3.anchor.set(0.5,1); dummy3.x=355; dummy3.y=GY; dummy3.scale.set(0.62); ysort.addChild(dummy3)

  const steps = new PIXI.Graphics()
  steps.rect(215, GY-4,  155, 8).fill(K.stoneL)
  steps.rect(220, GY-10, 145, 8).fill(K.stone)
  steps.rect(225, GY-16, 135, 8).fill(K.stoneD)
  infra.addChild(steps)

  const fl = new PIXI.Graphics()
  for (let i=0;i<35;i++) {
    fl.ellipse(60+rng(i,50)*400, 680+rng(i,51)*120, 5+rng(i,52)*3, 3+rng(i,53)*2).fill({ color: K.cherryB, alpha: 0.45 })
  }
  ground.addChild(fl)

  // Trees (sprites — all in ysort so player can walk in front or behind them)
  const ch1 = ctx.nsp(...NA.CHERRY_2); ch1.anchor.set(0.5,1); ch1.x=55;  ch1.y=GY; ch1.scale.set(0.72); ysort.addChild(ch1)
  const ch2 = ctx.nsp(...NA.CHERRY_3); ch2.anchor.set(0.5,1); ch2.x=38;  ch2.y=GY; ch2.scale.set(0.52); ysort.addChild(ch2)
  const ch3 = ctx.nsp(...NA.CHERRY_1); ch3.anchor.set(0.5,1); ch3.x=490; ch3.y=GY; ch3.scale.set(0.68); ysort.addChild(ch3)
  const ch4 = ctx.nsp(...NA.CHERRY_3); ch4.anchor.set(0.5,1); ch4.x=522; ch4.y=GY; ch4.scale.set(0.50); ysort.addChild(ch4)

  drawLantern(infra, 140, 700); drawLantern(infra, 290, 700); drawLantern(infra, 440, 700)
  const rope = new PIXI.Graphics()
  rope.moveTo(140, 706).quadraticCurveTo(215, 716, 290, 706).stroke({ color: K.woodD, width: 1.5 })
  rope.moveTo(290, 706).quadraticCurveTo(365, 716, 440, 706).stroke({ color: K.woodD, width: 1.5 })
  infra.addChild(rope)
}

// ── Zone 2 — Bamboo Forest (x: 540–1080) ─────────────────────────
function buildZone2Bamboo(ground: PIXI.Container, infra: PIXI.Container, ysort: PIXI.Container, ctx: Ctx) {
  const grassBase = ctx.gt(0, 0, 540, 320); grassBase.x = 540; grassBase.y = 580; ground.addChild(grassBase)
  const d1 = ctx.gt(4, 0,  70, 200); d1.x = 590; d1.y = 680; ground.addChild(d1)
  const d2 = ctx.gt(4, 0,  80, 220); d2.x = 780; d2.y = 660; ground.addChild(d2)
  const d3 = ctx.gt(4, 0, 120, 210); d3.x = 950; d3.y = 670; ground.addChild(d3)
  const bedG = new PIXI.Graphics(); bedG.rect(718, 600, 70, 300).fill(K.stoneD); ground.addChild(bedG)
  const waterStr = ctx.gt(7, 2, 58, 296); waterStr.x = 724; waterStr.y = 604; ground.addChild(waterStr)

  // Bamboo — all in ysort so Y-sort handles depth with character
  const bambBack: [number, number][] = [
    [548,0.90],[566,1.00],[584,0.86],[602,1.05],[620,0.92],[638,1.00],[656,0.88],
    [808,0.95],[828,1.10],[848,0.88],[868,1.00],[888,0.93],[908,1.05],
    [928,0.87],[948,1.00],[968,0.90],[988,1.08],[1008,0.92],[1030,0.86],[1052,1.00],
  ]
  bambBack.forEach(([bx, sc], i) => {
    const b = i % 4 === 0 ? ctx.nsp(...NA.BAMB_MID) : ctx.nsp(...NA.BAMB_SM)
    b.anchor.set(0.5, 1); b.x = bx; b.y = GY; b.scale.set(sc); ysort.addChild(b)
  })
  const bambFore: [number, number][] = [
    [558,1.05],[578,0.96],[598,1.10],[618,0.90],[638,1.00],[658,0.88],
    [820,1.00],[842,1.12],[864,0.92],[886,1.05],[910,0.90],[932,1.00],[956,0.88],[980,1.05],
  ]
  bambFore.forEach(([bx, sc]) => {
    const b = ctx.nsp(...NA.BAMB_SM); b.anchor.set(0.5, 1); b.x = bx; b.y = GY; b.scale.set(sc); ysort.addChild(b)
  })

  const br = new PIXI.Graphics(); drawBridge(br, 710, GY, 88); infra.addChild(br)

  const rk1 = ctx.nsp(...NA.ROCK_MED); rk1.anchor.set(0.5,1); rk1.x=660;  rk1.y=GY; rk1.scale.set(0.55); ysort.addChild(rk1)
  const rk2 = ctx.nsp(...NA.ROCK_LG);  rk2.anchor.set(0.5,1); rk2.x=900;  rk2.y=GY; rk2.scale.set(0.62); ysort.addChild(rk2)
  const rk3 = ctx.nsp(...NA.ROCK_SM);  rk3.anchor.set(0.5,1); rk3.x=980;  rk3.y=GY; rk3.scale.set(0.50); ysort.addChild(rk3)
  const rk4 = ctx.nsp(...NA.ROCK_MED); rk4.anchor.set(0.5,1); rk4.x=1050; rk4.y=GY; rk4.scale.set(0.52); ysort.addChild(rk4)

  const bench = new PIXI.Graphics()
  bench.rect(840, GY-24, 60, 10).fill(K.stoneL)
  bench.rect(843, GY-14,  8, 14).fill(K.stone)
  bench.rect(889, GY-14,  8, 14).fill(K.stone)
  infra.addChild(bench)

  drawSign(infra, 580, GY, '竹林徑')
  drawSign(infra, 760, GY, '清溪橋')
}

// ── Zone 3 — Village (x: 1080–1620) ──────────────────────────────
function buildZone3Village(ground: PIXI.Container, infra: PIXI.Container, ysort: PIXI.Container, ctx: Ctx) {
  const grassBase = ctx.gt(0, 0, 540, 320); grassBase.x = 1080; grassBase.y = 580; ground.addChild(grassBase)
  const street    = ctx.gt(9, 0, 460, 180); street.x = 1120;    street.y = 680;    ground.addChild(street)

  const pondG = new PIXI.Graphics()
  pondG.ellipse(1560, GY+30, 55, 38).fill(K.stoneD)
  drawWater(pondG, 1508, GY-2, 104, 64)
  pondG.ellipse(1560, GY+32, 50, 34).fill(K.wM)
  ground.addChild(pondG)

  const pond = new PIXI.Graphics()
  for (let i=0;i<5;i++) {
    const lx=1515+rng(i,70)*90, ly=GY+5+rng(i,71)*40
    pond.ellipse(lx, ly, 12+rng(i,72)*8, 5+rng(i,73)*3).fill({ color: 0x60C040, alpha: 0.65 })
  }
  for (let i=0;i<3;i++) pond.circle(1525+i*25, GY+25, 3).fill({ color: 0xFF8030, alpha: 0.8 })
  ground.addChild(pond)

  const houses = new PIXI.Graphics()
  for (let i=0;i<4;i++) {
    const hx=1110+i*105, hw=88, hh=110
    houses.rect(hx, GY-200-hh, hw, hh).fill(K.wallS)
    for (let j=0;j<2;j++) houses.rect(hx+hw*j/1-(j>0?10:0), GY-200-hh, 10, hh).fill(K.colRD)
    const roh=hw*0.2, rrh=hh*0.5
    houses.poly([hx-roh, GY-200, hx+hw*0.3, GY-200-rrh, hx+hw-hw*0.3, GY-200-rrh, hx+hw+roh, GY-200]).fill(K.roofM)
  }
  ground.addChild(houses)

  const mkS = (text: string, x: number, y: number) => {
    const g = new PIXI.Graphics(); g.rect(x-32, y, 64, 22).fill(K.redD); infra.addChild(g)
    const t = new PIXI.Text({ text, style:{ fontSize:12, fill:'#F0D050', fontFamily:'"Noto Serif SC",serif', fontWeight:'700' } })
    t.anchor.set(0.5, 0.5); t.x = x; t.y = y + 11; infra.addChild(t)
  }

  const teaH = ctx.bsp(...BA.FAC_B2); teaH.anchor.set(0,1); teaH.x=1090; teaH.y=GY;    teaH.scale.set(1.28); ysort.addChild(teaH)
  mkS('茶館', 1185, GY - 148)

  const lib = ctx.bsp(...BA.FAC_B1); lib.anchor.set(0,1); lib.x=1285; lib.y=GY-50; lib.scale.set(1.18); ysort.addChild(lib)
  mkS('書院', 1375, GY - 192)

  const stalls = new PIXI.Graphics()
  for (let i=0;i<3;i++) {
    const sx=1440+i*65
    stalls.rect(sx, GY-60, 55, 60).fill(K.wood)
    stalls.rect(sx-4, GY-72, 63, 15).fill(i%2===0?K.red:K.colRD)
    stalls.rect(sx+6, GY-58, 42, 50).fill(K.wallS)
    for (let j=0;j<4;j++) {
      const c=j%4===0?0xE03030:j%4===1?0xF0C040:j%4===2?0x40A040:0x8060E0
      stalls.circle(sx+10+j*10, GY-30, 5).fill(c)
    }
  }
  infra.addChild(stalls)
  drawSign(infra, 1457, GY, '藥材')
  drawSign(infra, 1522, GY, '茶葉')
  drawSign(infra, 1587, GY, '布匹')

  const oak1 = ctx.nsp(...NA.BONSAI_2); oak1.anchor.set(0.5,1); oak1.x=1086; oak1.y=GY; oak1.scale.set(0.75); ysort.addChild(oak1)
  const ch1  = ctx.nsp(...NA.CHERRY_2); ch1.anchor.set(0.5,1);  ch1.x=1610;  ch1.y=GY; ch1.scale.set(0.80);  ysort.addChild(ch1)
  const ch2  = ctx.nsp(...NA.CHERRY_3); ch2.anchor.set(0.5,1);  ch2.x=1070;  ch2.y=GY; ch2.scale.set(0.58);  ysort.addChild(ch2)

  drawLantern(infra, 1170, 700); drawLantern(infra, 1320, 700)
  drawLantern(infra, 1470, 700); drawLantern(infra, 1600, 700)

  const libSteps = new PIXI.Graphics()
  libSteps.rect(1330, GY-54, 80, 8).fill(K.stoneL)
  libSteps.rect(1335, GY-60, 70, 8).fill(K.stone)
  infra.addChild(libSteps)
}

// ── Zone 4 — Mountain Path (x: 1620–2160) ────────────────────────
function buildZone4Mountain(ground: PIXI.Container, infra: PIXI.Container, ysort: PIXI.Container, ctx: Ctx) {
  const grassBase = ctx.gt(0, 0, 540, 420); grassBase.x = 1620; grassBase.y = 480; ground.addChild(grassBase)

  const terr = new PIXI.Graphics()
  terr.poly([1620,900, 1620,GY, 1680,GY-20, 1780,GY-60, 1900,GY-130, 2000,GY-160, 2100,GY-150, 2160,GY-80, 2160,900]).fill(K.grassD)
  ground.addChild(terr)

  const cliffG = new PIXI.Graphics(); drawStoneWall(cliffG, 1620, GY-100, 540, 16); ground.addChild(cliffG)

  const dirtPath = new PIXI.Graphics()
  drawDirt(dirtPath, 1640, GY-15,  80, 120); drawDirt(dirtPath, 1720, GY-55,   80, 80)
  drawDirt(dirtPath, 1800, GY-105, 80,  70); drawDirt(dirtPath, 1880, GY-140, 120, 60)
  drawDirt(dirtPath, 2000, GY-160, 160, 50)
  ground.addChild(dirtPath)

  const rockyG = new PIXI.Graphics()
  rockyG.rect(1620, GY-120, 540, 20).fill(K.stone)
  rockyG.rect(1800, GY-150, 240, 25).fill(K.stoneD)
  rockyG.rect(2000, GY-170, 160, 20).fill(K.stone)
  ground.addChild(rockyG)

  const sts = new PIXI.Graphics()
  for (let i=0;i<12;i++) {
    const sx=1660+i*28, sy=GY-12-i*12
    sts.rect(sx, sy, 36, 10).fill(i%2===0?K.stoneL:K.stone)
    sts.rect(sx, sy, 36,  2).fill({ color: 0xFFFFFF, alpha: 0.08 })
  }
  infra.addChild(sts)

  const wf = new PIXI.Graphics()
  wf.ellipse(1940, GY-115, 50, 28).fill(K.wD)
  wf.ellipse(1940, GY-117, 44, 24).fill(K.wM)
  wf.rect(1930, GY-280, 22, 168).fill({ color: K.wL, alpha: 0.7 })
  for (let i=0;i<8;i++)  wf.ellipse(1924+i*4, GY-280, 5, 4).fill({ color: K.wF, alpha: 0.60 })
  for (let i=0;i<10;i++) wf.ellipse(1916+i*5, GY-118, 7, 4).fill({ color: K.wF, alpha: 0.55 })
  infra.addChild(wf)

  // Trees — higher on slope have lower Y, so they naturally sort behind valley objects
  const tr1 = ctx.nsp(...NA.BONSAI_1); tr1.anchor.set(0.5,1); tr1.x=1640; tr1.y=GY;     tr1.scale.set(1.00); ysort.addChild(tr1)
  const tr2 = ctx.nsp(...NA.BONSAI_3); tr2.anchor.set(0.5,1); tr2.x=1700; tr2.y=GY-50;  tr2.scale.set(0.85); ysort.addChild(tr2)
  const tr3 = ctx.nsp(...NA.BONSAI_2); tr3.anchor.set(0.5,1); tr3.x=1820; tr3.y=GY-100; tr3.scale.set(0.92); ysort.addChild(tr3)
  const tr4 = ctx.nsp(...NA.BONSAI_4); tr4.anchor.set(0.5,1); tr4.x=2050; tr4.y=GY-160; tr4.scale.set(1.10); ysort.addChild(tr4)
  const tr5 = ctx.nsp(...NA.BONSAI_1); tr5.anchor.set(0.5,1); tr5.x=2120; tr5.y=GY-140; tr5.scale.set(0.82); ysort.addChild(tr5)

  const rk1 = ctx.nsp(...NA.ROCK_LG);  rk1.anchor.set(0.5,1); rk1.x=1670; rk1.y=GY;     rk1.scale.set(0.80); ysort.addChild(rk1)
  const rk2 = ctx.nsp(...NA.ROCK_MED); rk2.anchor.set(0.5,1); rk2.x=1750; rk2.y=GY-65;  rk2.scale.set(0.62); ysort.addChild(rk2)
  const rk3 = ctx.nsp(...NA.ROCK_LG);  rk3.anchor.set(0.5,1); rk3.x=1860; rk3.y=GY-138; rk3.scale.set(0.85); ysort.addChild(rk3)
  const rk4 = ctx.nsp(...NA.ROCK_MED); rk4.anchor.set(0.5,1); rk4.x=2080; rk4.y=GY-175; rk4.scale.set(0.65); ysort.addChild(rk4)
  const rk5 = ctx.nsp(...NA.ROCK_SM);  rk5.anchor.set(0.5,1); rk5.x=2140; rk5.y=GY-92;  rk5.scale.set(0.50); ysort.addChild(rk5)
  const rw1 = ctx.nsp(...NA.ROCK_MED); rw1.anchor.set(0.5,1); rw1.x=1905; rw1.y=GY-125; rw1.scale.set(0.68); ysort.addChild(rw1)
  const rw2 = ctx.nsp(...NA.ROCK_SM);  rw2.anchor.set(0.5,1); rw2.x=1968; rw2.y=GY-120; rw2.scale.set(0.54); ysort.addChild(rw2)

  const cave = new PIXI.Graphics()
  cave.ellipse(2130, GY-135, 32, 24).fill({ color: 0x0A0808, alpha: 0.9 })
  cave.ellipse(2128, GY-134, 28, 20).fill({ color: 0x050505 })
  drawStoneWall(cave, 2100, GY-160, 70, 30)
  infra.addChild(cave)
  drawSign(infra, 2130, GY-160, '隱谷')
}

// ── Zone 5 — Temple (x: 2160–2700) ───────────────────────────────
function buildZone5Temple(ground: PIXI.Container, infra: PIXI.Container, ysort: PIXI.Container, ctx: Ctx) {
  const grassBase = ctx.gt(0, 0, 540, 320); grassBase.x = 2160; grassBase.y = 580; ground.addChild(grassBase)
  const court     = ctx.gt(3, 1, 460, 220); court.x = 2200;    court.y = 650;     ground.addChild(court)
  const grassBot  = ctx.gt(1, 0, 540,  80); grassBot.x = 2160; grassBot.y = 820;  ground.addChild(grassBot)

  const gate = ctx.bsp(...BA.GATE_SM); gate.anchor.set(0.5,1); gate.x=2280; gate.y=GY; gate.scale.set(1.05); ysort.addChild(gate)
  const gateT = new PIXI.Text({ text:'學府門', style:{ fontSize:14, fill:'#E8C050', fontFamily:'"Noto Serif SC",serif', fontWeight:'700' } })
  gateT.anchor.set(0.5, 0.5); gateT.x = 2280; gateT.y = GY - 212; infra.addChild(gateT)

  const bell   = ctx.bsp(...BA.FAC_NARR); bell.anchor.set(0,1);   bell.x=2210;   bell.y=GY-30; bell.scale.set(0.88);   ysort.addChild(bell)
  const temple = ctx.bsp(...BA.FAC_WIDE); temple.anchor.set(0,1); temple.x=2345; temple.y=GY;  temple.scale.set(1.12); ysort.addChild(temple)

  const mkS = (text: string, x: number, y: number) => {
    const g = new PIXI.Graphics(); g.rect(x-36, y, 72, 24).fill(K.redD); infra.addChild(g)
    const t = new PIXI.Text({ text, style:{ fontSize:13, fill:'#F0D050', fontFamily:'"Noto Serif SC",serif', fontWeight:'700' } })
    t.anchor.set(0.5, 0.5); t.x = x; t.y = y + 12; infra.addChild(t)
  }
  mkS('鐘樓', 2286, GY - 138)
  mkS('古刹',  2510, GY - 145)

  const stat = new PIXI.Graphics()
  for (const sx of [2236, 2640]) {
    stat.ellipse(sx, GY+8,  16, 10).fill({ color: 0x000000, alpha: 0.1 })
    stat.rect(sx-8,  GY-70, 16, 70).fill(K.stoneD)
    stat.ellipse(sx, GY-72, 14, 14).fill(K.stone)
    stat.rect(sx-20, GY-60,  8, 30).fill(K.stoneD)
    stat.rect(sx+12, GY-60,  8, 30).fill(K.stoneD)
    stat.rect(sx-14, GY-30, 28,  8).fill(K.stoneL)
  }
  infra.addChild(stat)

  const tab = new PIXI.Graphics()
  for (let i=0;i<3;i++) {
    const tx2=2310+i*80
    tab.rect(tx2-10, GY-90, 20, 90).fill(K.stoneD)
    tab.rect(tx2-8,  GY-88, 16, 86).fill(K.stone)
  }
  infra.addChild(tab)
  ;([['道',2310],['德',2390],['仁',2470]] as [string,number][]).forEach(([ch, tx]) => {
    const t = new PIXI.Text({ text: ch, style:{ fontSize:18, fill:'#3A2010', fontFamily:'"Noto Serif SC",serif' } })
    t.anchor.set(0.5,0.5); t.x = tx; t.y = GY-48; infra.addChild(t)
  })

  const oak1 = ctx.nsp(...NA.BONSAI_2); oak1.anchor.set(0.5,1); oak1.x=2192; oak1.y=GY; oak1.scale.set(1.10); ysort.addChild(oak1)
  const oak2 = ctx.nsp(...NA.BONSAI_4); oak2.anchor.set(0.5,1); oak2.x=2660; oak2.y=GY; oak2.scale.set(1.00); ysort.addChild(oak2)
  const plum = ctx.nsp(...NA.CHERRY_1); plum.anchor.set(0.5,1); plum.x=2175; plum.y=GY; plum.scale.set(0.62); ysort.addChild(plum)

  const ts = new PIXI.Graphics()
  ts.rect(2385, GY-4,  150, 8).fill(K.stoneL)
  ts.rect(2390, GY-10, 140, 8).fill(K.stone)
  ts.rect(2395, GY-16, 130, 8).fill(K.stoneD)
  ts.rect(2400, GY-22, 120, 8).fill(K.stoneL)
  infra.addChild(ts)

  const tw = new PIXI.Graphics(); drawStoneWall(tw, 2160, 640, 540, 42); infra.addChild(tw)

  const inc = ctx.psp(...PA.INCENSE); inc.anchor.set(0.5,1); inc.x=2490; inc.y=GY; inc.scale.set(0.50); ysort.addChild(inc)

  for (let i=0;i<5;i++) drawLantern(infra, 2230+i*100, GY-90)
}

// ── Sky layer ─────────────────────────────────────────────────────
// skyLay is viewport-fixed (on app.stage). All coords are screen-space (W×H).
// Extra width: WW+400 so the content covers the full parallax travel range.
function buildSky(sky: PIXI.Container) {
  const g = new PIXI.Graphics()
  const sw = WW + 400
  g.rect(0, 0, sw, H).fill(K.skyT)
  g.rect(0, 0, sw, H * 0.42).fill({ color: K.skyM, alpha: 0.48 })
  g.rect(0, H * 0.28, sw, H * 0.38).fill({ color: K.skyH, alpha: 0.32 })
  for (let i=0;i<20;i++) {
    const cx=rng(i,90)*sw, cy=H*0.04+rng(i,91)*H*0.38, cw=60+rng(i,92)*110
    g.ellipse(cx, cy, cw, 20+rng(i,93)*18).fill({ color: 0xF0F5FA, alpha: 0.55+rng(i,94)*0.25 })
    g.ellipse(cx-cw*0.25, cy-10, cw*0.5, 18+rng(i,95)*10).fill({ color: 0xF8FBFF, alpha: 0.45+rng(i,96)*0.2 })
    g.ellipse(cx+cw*0.2,  cy-8,  cw*0.45, 16+rng(i,97)*8).fill({ color: 0xF0F5FA, alpha: 0.4+rng(i,98)*0.2 })
  }
  sky.addChild(g)
}

// ── Mountain layer ────────────────────────────────────────────────
// mtnLay is viewport-fixed (on app.stage). All Y coords are screen-space.
// Horizon at 58% of viewport height (~325 px). Extra width for parallax travel.
function buildMountains(mtn: PIXI.Container) {
  const g = new PIXI.Graphics()
  const sw = WW + 400
  const horiz = Math.round(H * 0.58)  // ~325 px
  for (let i=0;i<9;i++) {
    const mx=rng(i,80)*sw-200, mh=100+rng(i,81)*90, mw=200+rng(i,82)*200
    g.poly([mx, horiz, mx+mw/2, horiz-mh, mx+mw, horiz]).fill({ color: K.mtnF, alpha: 0.35+rng(i,83)*0.15 })
  }
  for (let i=0;i<7;i++) {
    const mx=rng(i+20,80)*sw-150, mh=65+rng(i+20,81)*65, mw=170+rng(i+20,82)*160
    g.poly([mx, horiz+35, mx+mw/2, horiz+35-mh, mx+mw, horiz+35]).fill({ color: K.mtnM, alpha: 0.4+rng(i+20,83)*0.2 })
  }
  for (let i=0;i<14;i++) {
    const hx=rng(i,70)*sw, hy=horiz+18+rng(i,71)*55, hw=80+rng(i,72)*130
    g.ellipse(hx, hy, hw, 42+rng(i,73)*32).fill({ color: K.hillF, alpha: 0.5+rng(i,74)*0.25 })
  }
  g.rect(0, horiz+12, sw, H - horiz).fill(K.hillN)
  mtn.addChild(g)
}

// ─────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────

export function GameScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const openLearningRef = useRef(useGameStore.getState().openLearning)
  const masteredRef = useRef(useGameStore.getState().masteredHanzi)
  const [npcText, setNpcText] = useState<string | null>(null)

  useEffect(() => {
    return useGameStore.subscribe((s) => {
      openLearningRef.current = s.openLearning
      masteredRef.current = s.masteredHanzi
    })
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    let app: PIXI.Application
    let destroyed = false
    const keys: Record<string, boolean> = {}

    const init = async () => {
      app = new PIXI.Application()
      await app.init({ width: W, height: H, background: 0x8ABCD8, antialias: true })
      if (!containerRef.current || destroyed) return
      containerRef.current.appendChild(app.canvas as HTMLCanvasElement)

      // tileset.png is a JPEG disguised as PNG — must remove white/grey background
      const tilesetTex = await new Promise<PIXI.Texture>((resolve) => {
        const img = new Image()
        img.onload = () => {
          const cv = document.createElement('canvas')
          cv.width = img.width; cv.height = img.height
          const ctx = cv.getContext('2d')!
          ctx.drawImage(img, 0, 0)
          const id = ctx.getImageData(0, 0, cv.width, cv.height)
          const d = id.data
          for (let i = 0; i < d.length; i += 4) {
            const r = d[i], g = d[i+1], b = d[i+2]
            const hi = Math.max(r, g, b), lo = Math.min(r, g, b)
            if (r > 185 && g > 185 && b > 185 && (hi - lo) < 35) d[i+3] = 0
          }
          ctx.putImageData(id, 0, 0)
          resolve(PIXI.Texture.from(cv))
        }
        img.src = '/assets/tileset.png'
      })
      const tileSprite = (x: number, y: number, w: number, h: number): PIXI.Sprite => {
        const tex = new PIXI.Texture({ source: tilesetTex.source, frame: new PIXI.Rectangle(x, y, w, h) })
        return new PIXI.Sprite(tex)
      }

      const loadTex = (src: string): Promise<PIXI.Texture> =>
        new Promise<PIXI.Texture>(resolve => {
          const img = new Image()
          img.onload = () => {
            const cv = document.createElement('canvas')
            cv.width = img.width; cv.height = img.height
            cv.getContext('2d')!.drawImage(img, 0, 0)
            resolve(PIXI.Texture.from(cv))
          }
          img.src = src
        })

      const [groundAtlasTex, buildingAtlasTex, natureAtlasTex, propsAtlasTex,
             playerWalkTex, sifuWalkTex, grandmaWalkTex, huaWalkTex, wenWalkTex, wuWalkTex,
             jadeWalkTex, redWalkTex, dragonTex] =
        await Promise.all([
          loadTex('/assets/ground-atlas.png'),
          loadTex('/assets/building-atlas.png'),
          loadTex('/assets/nature-atlas.png'),
          loadTex('/assets/props-atlas.png'),
          loadTex('/assets/player_apprentice_blue_walk.png'),
          loadTex('/assets/sifu_liang_walk.png'),
          loadTex('/assets/grandma_zhang_walk.png'),
          loadTex('/assets/hua_lan_walk.png'),
          loadTex('/assets/wen_bo_walk.png'),
          loadTex('/assets/little_wu_walk.png'),
          loadTex('/assets/player_apprentice_jade_walk.png'),
          loadTex('/assets/player_apprentice_red_walk.png'),
          loadTex('/assets/xiao_long_paper_dragon_float.png'),
        ])

      const GTILE = 128
      const gt = (col: number, row: number, w: number, h: number): PIXI.TilingSprite => {
        const tex = new PIXI.Texture({
          source: groundAtlasTex.source,
          frame: new PIXI.Rectangle(col * GTILE, row * GTILE, GTILE, GTILE),
        })
        return new PIXI.TilingSprite({ texture: tex, width: w, height: h })
      }
      const bsp = (x: number, y: number, w: number, h: number): PIXI.Sprite => {
        const tex = new PIXI.Texture({ source: buildingAtlasTex.source, frame: new PIXI.Rectangle(x, y, w, h) })
        return new PIXI.Sprite(tex)
      }
      const nsp = (x: number, y: number, w: number, h: number): PIXI.Sprite => {
        const tex = new PIXI.Texture({ source: natureAtlasTex.source, frame: new PIXI.Rectangle(x, y, w, h) })
        return new PIXI.Sprite(tex)
      }
      const psp = (x: number, y: number, w: number, h: number): PIXI.Sprite => {
        const tex = new PIXI.Texture({ source: propsAtlasTex.source, frame: new PIXI.Rectangle(x, y, w, h) })
        return new PIXI.Sprite(tex)
      }
      const mkFrames = (tex: PIXI.Texture, row: number): PIXI.Texture[] =>
        [0,1,2,3].map(col => new PIXI.Texture({ source: tex.source, frame: new PIXI.Rectangle(col*FW, row*FH, FW, FH) }))

      const gameCtx: Ctx = { gt, bsp, nsp, psp }

      // ── World container ────────────────────────────────────────
      const world = new PIXI.Container()

      // ── 12-Layer Rendering System ──────────────────────────────
      // skyLay/mtnLay go on app.stage FIRST (viewport-fixed backgrounds).
      // world goes on app.stage AFTER them so it renders on top.
      const skyLay    = new PIXI.Container()  // #01-02 Sky + clouds      (viewport-fixed, x-parallax 0.12×)
      const mtnLay    = new PIXI.Container()  // #03-04 Mountains + hills  (viewport-fixed, x-parallax 0.06×)
      const groundLay = new PIXI.Container()  // #05-06 Terrain tiles      (world-fixed)
      const infraLay  = new PIXI.Container()  // #07    Walls/fences/signs (world-fixed, under ysort)
      const ysortLay  = new PIXI.Container()  // #08-11 Y-sorted world objects
      const partLay   = new PIXI.Container()  // #12    Particles + FX     (always on top)
      app.stage.addChild(skyLay, mtnLay, world)   // order matters: sky → mountains → world
      world.addChild(groundLay, infraLay, ysortLay, partLay)

      // ── Build world ────────────────────────────────────────────
      buildSky(skyLay)
      buildMountains(mtnLay)
      buildZone1Academy(groundLay, infraLay, ysortLay, gameCtx)
      buildZone2Bamboo(groundLay,  infraLay, ysortLay, gameCtx)
      buildZone3Village(groundLay, infraLay, ysortLay, gameCtx)
      buildZone4Mountain(groundLay, infraLay, ysortLay, gameCtx)
      buildZone5Temple(groundLay,  infraLay, ysortLay, gameCtx)

      drawSign(infraLay, 540,  GY, '竹林')
      drawSign(infraLay, 1082, GY, '村落')
      drawSign(infraLay, 1622, GY, '山道')
      drawSign(infraLay, 2162, GY, '古刹')

      // ── NPC Sifu Liang (ysort — Y-depth-sorted with world) ────
      const npc = new PIXI.Container()
      npc.x = 290; npc.y = GY
      npc.eventMode = 'static'; npc.cursor = 'pointer'
      const sifuSpr = new PIXI.AnimatedSprite(mkFrames(sifuWalkTex, 0))
      sifuSpr.anchor.set(0.5, 1); sifuSpr.scale.set(2.5); sifuSpr.animationSpeed = 0.05; sifuSpr.play()
      const npcLbl = new PIXI.Text({ text:'師父 Liang', style:{ fontSize:9, fill:'#C9A84C', fontFamily:'Georgia,serif' } })
      npcLbl.anchor.set(0.5, 0); npcLbl.y = 4
      npc.addChild(sifuSpr, npcLbl)
      npc.on('pointerover', () => { sifuSpr.tint = 0xFFEECC })
      npc.on('pointerout',  () => { sifuSpr.tint = 0xFFFFFF })
      npc.on('pointerdown', () => setNpcText('Discípulo... os pergaminhos dos números aguardam. Encontre os cinco orbes de Hanzi espalhados por este mundo — da Academia até o Templo Antigo. Apenas o cultivo verdadeiro desperta o Qi interior.'))
      ysortLay.addChild(npc)

      // ── Wandering NPCs (ysort) ─────────────────────────────────
      interface WalkNPC {
        cont: PIXI.Container; dir: number; spd: number; min: number; max: number; t: number
        spr: PIXI.AnimatedSprite; leftFrames: PIXI.Texture[]; rightFrames: PIXI.Texture[]
      }
      const walkers: WalkNPC[] = []
      const npcWalkTexes = [grandmaWalkTex, huaWalkTex, wenWalkTex, wuWalkTex, jadeWalkTex, redWalkTex]
      const npcZones = [
        { x:230,  min:130,  max:420  },  // Zone 1 Academy courtyard
        { x:1180, min:1140, max:1280 },  // Zone 3 Village
        { x:1350, min:1280, max:1470 },
        { x:1420, min:1340, max:1560 },
        { x:1500, min:1380, max:1580 },
        { x:2380, min:2290, max:2530 },  // Zone 5 Temple courtyard
      ]
      npcZones.forEach((z, i) => {
        const wc = new PIXI.Container()
        wc.x = z.x; wc.y = GY
        const wTex = npcWalkTexes[i % npcWalkTexes.length]
        const leftFrames  = mkFrames(wTex, 1)
        const rightFrames = mkFrames(wTex, 2)
        const initRight = i % 2 === 0
        const wSpr = new PIXI.AnimatedSprite(initRight ? rightFrames : leftFrames)
        wSpr.anchor.set(0.5, 1); wSpr.scale.set(2.5); wSpr.animationSpeed = 0.1; wSpr.play()
        wc.addChild(wSpr)
        ysortLay.addChild(wc)
        walkers.push({ cont:wc, dir:initRight?1:-1, spd:0.5+Math.random()*0.4, min:z.min, max:z.max, t:Math.random()*200, spr:wSpr, leftFrames, rightFrames })
      })

      // ── Orbs (ysort) ──────────────────────────────────────────
      const orbContainers: PIXI.Container[] = []
      for (let i=0; i<ORBS.length; i++) {
        const h = ORBS[i]
        const tColorHex = parseInt(TONE_COLORS[h.tone].hex.replace('#','0x'), 16)
        const baseY = h.wy
        const orb = new PIXI.Container()
        orb.x = h.wx; orb.y = baseY
        orb.eventMode = 'static'; orb.cursor = 'pointer'

        const glow = new PIXI.Graphics()
        glow.circle(0, 0, 40).fill({ color: tColorHex, alpha: 0.15 })

        const lanternSpr = tileSprite(353, 393, 58, 140)
        lanternSpr.anchor.set(0.5, 0.5)
        lanternSpr.scale.set(0.58)

        const charText = new PIXI.Text({ text: h.hanzi, style: { fontSize: 22, fill: '#FFF5D5', fontFamily: '"Noto Serif SC",serif', fontWeight: '700' } })
        charText.anchor.set(0.5); charText.y = -62

        const pinText = new PIXI.Text({ text: h.pinyin, style: { fontSize: 9, fill: '#FFE8B0', fontFamily: 'Georgia,serif' } })
        pinText.anchor.set(0.5, 0); pinText.y = -44; pinText.alpha = 0.9

        const star = new PIXI.Text({ text:'★', style:{ fontSize:14, fill:'#C9A84C' } })
        star.anchor.set(0.5); star.x = 22; star.y = -70; star.visible = false

        orb.addChild(glow, lanternSpr, charText, pinText, star)
        orb.on('pointerover', () => { orb.scale.set(1.1) })
        orb.on('pointerout',  () => { orb.scale.set(1.0) })
        orb.on('pointerdown', () => openLearningRef.current(h))

        const phase = (i / ORBS.length) * Math.PI * 2
        let orbT = phase
        app.ticker.add((tk) => {
          orbT += tk.deltaTime * 0.022
          orb.y = baseY + Math.sin(orbT) * 7
          glow.alpha = 0.08 + Math.abs(Math.sin(orbT * 0.6)) * 0.1
          star.visible = masteredRef.current.has(h.hanzi)
        })
        ysortLay.addChild(orb)
        orbContainers.push(orb)
      }

      // ── Dragon ambient creature (partLay) ────────────────────
      // xiao_long_paper_dragon_float.png: 128×32, 4 frames of 32×32
      const dragonFrames = [0,1,2,3].map(col =>
        new PIXI.Texture({ source: dragonTex.source, frame: new PIXI.Rectangle(col * 32, 0, 32, 32) })
      )
      const dragonSpr = new PIXI.AnimatedSprite(dragonFrames)
      dragonSpr.anchor.set(0.5, 0.5)
      dragonSpr.scale.set(3.8)
      dragonSpr.animationSpeed = 0.09
      dragonSpr.play()
      // Dragon lives in skyLay (viewport-fixed, draws behind all world content)
      dragonSpr.x = 700; dragonSpr.y = Math.round(H * 0.42)
      skyLay.addChild(dragonSpr)

      // ── Player (ysort) ────────────────────────────────────────
      const playerShadow = new PIXI.Graphics()
      playerShadow.ellipse(0, 0, 20, 7).fill({ color: 0x000000, alpha: 0.18 })

      const playerFrames = {
        down:  mkFrames(playerWalkTex, 0),
        left:  mkFrames(playerWalkTex, 1),
        right: mkFrames(playerWalkTex, 2),
        up:    mkFrames(playerWalkTex, 3),
      }
      const playerSpr = new PIXI.AnimatedSprite(playerFrames.down)
      playerSpr.anchor.set(0.5, 1.0)
      playerSpr.scale.set(2.5)
      playerSpr.animationSpeed = 0.12
      playerSpr.play()

      const player = new PIXI.Container()
      player.addChild(playerSpr)
      player.x = 210; player.y = GY
      playerShadow.x = 210; playerShadow.y = GY + 5
      ysortLay.addChild(playerShadow, player)
      let playerDir: keyof typeof playerFrames = 'down'

      // ── Falling leaves (partLay) ───────────────────────────────
      interface Leaf { g: PIXI.Graphics; x: number; y: number; vx: number; vy: number; rot: number; alpha: number; color: number }
      const leafColors = [K.cherry, K.cherryB, K.leaf, K.leafL, K.grassL]
      const leaves: Leaf[] = []
      for (let i=0;i<40;i++) {
        const lg = new PIXI.Graphics()
        const lc = leafColors[i % leafColors.length]
        lg.ellipse(0, 0, 6, 3).fill({ color: lc, alpha: 0.7 })
        const lx = Math.random() * WW, ly = 580 + Math.random() * 200
        lg.x = lx; lg.y = ly
        partLay.addChild(lg)
        leaves.push({ g:lg, x:lx, y:ly, vx:(Math.random()-0.5)*0.8, vy:0.4+Math.random()*0.6, rot:Math.random()*Math.PI*2, alpha:0.5+Math.random()*0.4, color:lc })
      }

      // ── Smoke emitters (partLay) ───────────────────────────────
      interface Smoke { g: PIXI.Graphics; ox: number; oy: number; life: number; max: number; phase: number }
      const smokeEmitters = [
        { ox:185, oy:GY-240 }, { ox:1155, oy:GY-200 }, { ox:1440, oy:GY-60 },
        { ox:2375, oy:GY-260 }, { ox:2495, oy:GY-55 },
      ]
      const smokes: Smoke[] = []
      smokeEmitters.forEach((em) => {
        for (let i=0;i<5;i++) {
          const sg = new PIXI.Graphics()
          const life = Math.random() * 80
          sg.circle(0, 0, 8+Math.random()*6).fill({ color: 0xDDDDE0, alpha: 0.18 })
          sg.x = em.ox + (Math.random()-0.5)*8
          sg.y = em.oy - life * 1.2
          sg.alpha = Math.max(0, 0.3 - life/80*0.3)
          sg.scale.set(0.5 + life/80*0.8)
          partLay.addChild(sg)
          smokes.push({ g:sg, ox:em.ox, oy:em.oy, life, max:80+Math.random()*40, phase:Math.random()*Math.PI*2 })
        }
      })

      // ── Birds (partLay) ────────────────────────────────────────
      interface Bird { g: PIXI.Graphics; x: number; y: number; vx: number; vy: number; flap: number }
      const birds: Bird[] = []
      for (let i=0;i<6;i++) {
        const bg2 = new PIXI.Graphics()
        bg2.poly([-8,0, 0,-4, 8,0]).fill({ color: 0x333344, alpha: 0.6 })
        bg2.x = Math.random()*WW; bg2.y = 200+Math.random()*150
        partLay.addChild(bg2)
        birds.push({ g:bg2, x:bg2.x, y:bg2.y, vx:1+Math.random()*1.5, vy:(Math.random()-0.5)*0.3, flap:Math.random()*Math.PI*2 })
      }

      // ── Water shimmer (partLay) ────────────────────────────────
      const waterGfx: PIXI.Graphics[] = []
      const waterAreas = [
        { x:724,  y:604,    w:58,  h:296 },
        { x:1508, y:GY-2,   w:104, h:64  },
        { x:1916, y:GY-117, w:50,  h:30  },
      ]
      waterAreas.forEach(() => {
        const wg2 = new PIXI.Graphics(); partLay.addChild(wg2); waterGfx.push(wg2)
      })

      // ── Camera ────────────────────────────────────────────────
      let camX = 0, camY = 0
      let dragonWX = 700
      const targetCam = { x:0, y:0 }

      // ── Main ticker ────────────────────────────────────────────
      let t = 0
      app.ticker.add((tk) => {
        t += tk.deltaTime
        const spd = 2.8 * tk.deltaTime

        // Player movement
        const mx = (keys['ArrowLeft']||keys['a']||keys['A'])?-1:(keys['ArrowRight']||keys['d']||keys['D'])?1:0
        const my = (keys['ArrowUp']||keys['w']||keys['W'])?-1:(keys['ArrowDown']||keys['s']||keys['S'])?1:0
        const moving = mx !== 0 || my !== 0
        if (moving) {
          player.x += mx * spd; player.y += my * spd
          const newDir: keyof typeof playerFrames =
            (Math.abs(my) >= Math.abs(mx)) ? (my > 0 ? 'down' : 'up') : (mx > 0 ? 'right' : 'left')
          if (newDir !== playerDir) {
            playerDir = newDir
            playerSpr.textures = playerFrames[playerDir]
            playerSpr.gotoAndPlay(0)
          }
          if (!playerSpr.playing) playerSpr.play()
        } else {
          playerSpr.stop()
          playerSpr.currentFrame = 0
        }
        player.x = Math.max(16, Math.min(WW - 16, player.x))
        player.y = Math.max(520, Math.min(WH - 16, player.y))
        playerShadow.x = player.x + 4
        playerShadow.y = player.y + 5

        // Y-sort: every frame, sort ysortLay children by foot Y position
        // Higher Y = lower on screen = closer to camera = renders in front
        ysortLay.children.sort((a, b) => a.y - b.y)

        // Camera smooth follow
        targetCam.x = player.x - W / 2
        targetCam.y = player.y - H / 2 - 60
        camX += (targetCam.x - camX) * 0.1
        camY += (targetCam.y - camY) * 0.1
        camX = Math.max(0, Math.min(WW - W, camX))
        camY = Math.max(0, Math.min(WH - H, camY))
        world.x = -Math.round(camX)
        world.y = -Math.round(camY)

        // Dual-rate parallax (skyLay/mtnLay are on app.stage, not inside world)
        // sky at 12% of camera speed, mountains at 6%
        skyLay.x = -Math.round(camX * 0.12)
        mtnLay.x = -Math.round(camX * 0.06)

        // NPC float
        npc.y = GY + Math.sin(t * 0.02) * 3

        // Walking NPCs
        walkers.forEach((w) => {
          w.t += tk.deltaTime
          w.cont.x += w.dir * w.spd * tk.deltaTime
          const newDir = w.cont.x > w.max ? -1 : w.cont.x < w.min ? 1 : w.dir
          if (newDir !== w.dir) {
            w.dir = newDir
            w.spr.textures = w.dir > 0 ? w.rightFrames : w.leftFrames
            w.spr.gotoAndPlay(0)
          }
          w.cont.y = GY + Math.abs(Math.sin(w.t * 0.15)) * 3
        })

        // Falling leaves
        leaves.forEach((lf) => {
          lf.x += lf.vx + Math.sin(t * 0.02 + lf.rot) * 0.4
          lf.y += lf.vy
          lf.rot += 0.04
          lf.g.x = lf.x; lf.g.y = lf.y; lf.g.rotation = lf.rot
          if (lf.y > WH) { lf.y = 560 + Math.random() * 100; lf.x = Math.random() * WW }
        })

        // Smoke
        smokes.forEach((s) => {
          s.life += tk.deltaTime * 0.5
          if (s.life > s.max) { s.life = 0; s.g.x = s.ox + (Math.random()-0.5)*10; s.g.y = s.oy }
          s.g.x += Math.sin(t*0.03 + s.phase) * 0.2
          s.g.y = s.oy - s.life * 1.4
          s.g.alpha = Math.max(0, 0.28 - (s.life/s.max) * 0.28)
          s.g.scale.set(0.4 + (s.life/s.max) * 0.9)
        })

        // Dragon ambient flight — slowly crosses the world, loops
        dragonWX += 0.55 * tk.deltaTime
        if (dragonWX > WW + 160) dragonWX = -160
        dragonSpr.x = dragonWX
        dragonSpr.y = Math.round(H * 0.42) + Math.sin(t * 0.016) * 16

        // Birds
        birds.forEach((b) => {
          b.flap += 0.18
          b.x += b.vx
          b.y += Math.sin(b.flap * 2) * 0.5 + b.vy
          if (b.x > WW + 50) { b.x = -50; b.y = 180 + Math.random() * 160 }
          b.g.x = b.x; b.g.y = b.y; b.g.clear()
          const wingDip = Math.sin(b.flap) * 5
          b.g.poly([-8, wingDip, 0, 0, 8, wingDip]).fill({ color: 0x2A2A3A, alpha: 0.55 })
        })

        // Water shimmer
        waterAreas.forEach((wa, idx) => {
          const wg2 = waterGfx[idx]; wg2.clear()
          for (let i=0;i<4;i++) {
            const wy2 = wa.y + wa.h*(0.2+i*0.2) + Math.sin(t*0.06 + i*0.8) * 3
            wg2.rect(wa.x + wa.w*0.06, wy2, wa.w*0.88, 2).fill({ color: K.wL, alpha: 0.25+Math.sin(t*0.08+i)*0.12 })
          }
        })
      })

      const onKeyDown = (e: KeyboardEvent) => {
        keys[e.key] = true
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault()
      }
      const onKeyUp = (e: KeyboardEvent) => { keys[e.key] = false }
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)

    init()

    return () => {
      destroyed = true
      window.removeEventListener('keydown', onKeyDown)
      try { app?.destroy(true) } catch (_) { /* ignore */ }
    }
  }, [])

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#1A2030] overflow-hidden">
      <div ref={containerRef} />

      {npcText && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4">
          <div
            className="bg-matsuri-ink/92 border border-matsuri-gold/40 rounded-lg p-4 cursor-pointer shadow-2xl"
            onClick={() => setNpcText(null)}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-matsuri-gold" />
              <span className="text-matsuri-gold font-display text-xs tracking-widest uppercase">Sifu Liang</span>
            </div>
            <p className="text-matsuri-paper text-sm leading-relaxed font-body">{npcText}</p>
            <p className="text-matsuri-paper/25 text-[10px] mt-2 text-right">Clique para continuar</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div className="bg-matsuri-ink/55 backdrop-blur-sm rounded-full px-5 py-1.5">
          <p className="text-[9px] text-matsuri-paper/40 tracking-widest uppercase">
            WASD / ↑↓←→ explorar · Clique nos orbes de Hanzi · 👤🎒🌳 painéis
          </p>
        </div>
      </div>
    </div>
  )
}
