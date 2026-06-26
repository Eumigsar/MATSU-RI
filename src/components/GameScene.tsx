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
// Drawing helpers
// ─────────────────────────────────────────────────────────────────

function drawGrass(g: PIXI.Graphics, x: number, y: number, w: number, h: number) {
  g.rect(x, y, w, h).fill(K.grass)
  for (let i = 0; i < Math.floor(w * h / 1400); i++) {
    g.ellipse(x + rng(i,1)*w, y + rng(i,2)*h, 22 + rng(i,3)*30, 9 + rng(i,4)*12).fill({ color: K.grassD, alpha: 0.38 })
  }
  for (let i = 0; i < Math.floor(w * h / 2200); i++) {
    g.ellipse(x + rng(i+80,1)*w, y + rng(i+80,2)*h, 14 + rng(i+80,3)*18, 6 + rng(i+80,4)*8).fill({ color: K.grassL, alpha: 0.28 })
  }
}

function drawStoneTile(g: PIXI.Graphics, x: number, y: number, w: number, h: number) {
  g.rect(x, y, w, h).fill(K.stone)
  const tw = 50, th = 34
  for (let row = 0; row * th < h + th; row++) {
    for (let col = 0; col * tw < w + tw; col++) {
      const ox = row % 2 === 0 ? 0 : tw / 2
      const tx = x + col * tw - ox, ty = y + row * th
      if (tx + tw > x && tx < x + w) {
        const l = Math.max(tx, x), r = Math.min(tx + tw - 2, x + w)
        if (r > l) {
          g.rect(l + 1, ty + 1, r - l - 1, th - 2).fill({ color: K.stoneL, alpha: 0.55 })
          g.rect(l + 1, ty + 1, r - l - 1, 2).fill({ color: 0xFFFFFF, alpha: 0.08 })
        }
      }
    }
  }
}

function drawCobble(g: PIXI.Graphics, x: number, y: number, w: number, h: number) {
  g.rect(x, y, w, h).fill(K.cobble)
  for (let i = 0; i < Math.floor(w * h / 380); i++) {
    const cx = x + rng(i,7)*w, cy = y + rng(i,8)*h
    const cr = 9 + rng(i,9)*11
    g.ellipse(cx, cy, cr, cr * 0.62).fill({ color: i%3===0?K.stoneD:K.cobbleL, alpha: 0.45 })
  }
}

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

function drawRock(g: PIXI.Graphics, x: number, y: number, s: number = 1) {
  g.ellipse(x+8*s, y+4*s, 22*s, 14*s).fill({ color: 0x000000, alpha: 0.1 })
  g.ellipse(x, y, 26*s, 17*s).fill(K.stoneD)
  g.ellipse(x-10*s, y-7*s, 18*s, 12*s).fill(K.stone)
  g.ellipse(x+8*s, y-5*s, 14*s, 10*s).fill(K.stoneL)
  g.ellipse(x-4*s, y-11*s, 7*s, 4*s).fill({ color: 0xFFFFFF, alpha: 0.12 })
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
    g.rect(x+i*18, y-38, 10, 5).fill({ color: 0x000000, alpha: 0.25 })
  }
}

function drawBridge(g: PIXI.Graphics, x: number, y: number, w: number) {
  for (let i = 0; i < Math.floor(w/12); i++) g.rect(x+i*12, y-12, 10, 14).fill(K.wood)
  g.rect(x, y-12, w, 14).stroke({ color: K.woodD, width: 1 })
  g.rect(x, y-28, w, 5).fill(K.woodD)
  g.rect(x, y+2, w, 5).fill(K.woodD)
  for (let i = 0; i*22 < w; i++) g.rect(x+i*22, y-28, 4, 32).fill(K.woodL)
}

function drawLantern(cont: PIXI.Container, x: number, y: number) {
  const g = new PIXI.Graphics()
  g.moveTo(x, y).lineTo(x, y+9).stroke({ color: K.woodD, width: 2 })
  g.ellipse(x, y+22, 18, 18).fill({ color: K.lanG, alpha: 0.1 })
  g.rect(x-8, y+9, 16, 26).fill(K.lanR)
  for (let i=1;i<4;i++) g.rect(x-8+16*i/4-0.5, y+11, 1, 22).fill({ color: 0x880000, alpha: 0.45 })
  g.rect(x-10, y+7, 20, 5).fill(K.gold)
  g.rect(x-10, y+32, 20, 5).fill(K.gold)
  g.rect(x-7, y+11, 14, 22).fill({ color: K.lanG, alpha: 0.22 })
  for (let i=0;i<3;i++) g.moveTo(x-5+i*5,y+37).lineTo(x-5+i*5,y+46).stroke({ color: K.gold, width:1 })
  cont.addChild(g)
}

function drawTree(cont: PIXI.Container, cx: number, cy: number, type: 'cherry'|'pine'|'oak'|'plum', s: number=1) {
  const g = new PIXI.Graphics()
  const tw = 10*s, th = 55*s
  g.ellipse(cx+10*s, cy+6*s, 28*s, 9*s).fill({ color:0x000000, alpha:0.1 })
  g.rect(cx-tw/2, cy-th, tw, th).fill(K.bark)
  g.rect(cx, cy-th, tw*0.3, th).fill({ color: K.woodD, alpha: 0.4 })
  if (type==='cherry') {
    const r=36*s
    g.circle(cx, cy-th-r*0.75, r*1.08).fill(K.cherryD)
    g.circle(cx-r*0.5, cy-th-r*0.48, r*0.88).fill(K.cherry)
    g.circle(cx+r*0.48, cy-th-r*0.52, r*0.82).fill(K.cherry)
    g.circle(cx, cy-th-r*0.38, r*0.88).fill(K.cherryB)
    for (let i=0;i<14;i++) {
      const a=(i/14)*Math.PI*2, br=r*(0.6+rng(i,20)*0.35)
      g.ellipse(cx+Math.cos(a)*br*0.78, cy-th-r*0.55+Math.sin(a)*br*0.55, 4+rng(i,21)*4, 3+rng(i,22)*2).fill({ color:0xFFEEF5, alpha:0.55 })
    }
  } else if (type==='pine') {
    const r=28*s
    g.poly([cx, cy-th-r*2.1, cx-r*0.65, cy-th-r*1.1, cx+r*0.65, cy-th-r*1.1]).fill(K.pineL)
    g.poly([cx, cy-th-r*1.45, cx-r*0.9, cy-th-r*0.45, cx+r*0.9, cy-th-r*0.45]).fill(K.pine)
    g.poly([cx, cy-th-r*0.85, cx-r*1.18, cy-th+r*0.12, cx+r*1.18, cy-th+r*0.12]).fill(K.pineL)
    g.poly([cx-r*0.3, cy-th-r*0.5, cx+r*0.3, cy-th-r*0.5, cx+r*1.18, cy-th+r*0.12, cx+r*0.5, cy-th+r*0.12]).fill({ color:0x000000, alpha:0.12 })
  } else if (type==='oak') {
    const r=38*s
    g.circle(cx, cy-th-r*0.82, r).fill(K.leafD)
    g.circle(cx-r*0.5, cy-th-r*0.52, r*0.82).fill(K.leaf)
    g.circle(cx+r*0.42, cy-th-r*0.6, r*0.78).fill(K.leaf)
    g.circle(cx, cy-th-r*1.05, r*0.68).fill(K.leafL)
  } else {
    const r=32*s
    g.circle(cx, cy-th-r*0.7, r*0.95).fill(K.leafD)
    g.circle(cx-r*0.42, cy-th-r*0.45, r*0.82).fill(0xC860A0)
    g.circle(cx+r*0.38, cy-th-r*0.5, r*0.75).fill(0xE080B8)
    g.circle(cx, cy-th-r*0.3, r*0.78).fill(0xFFAACC)
  }
  cont.addChild(g)
}

function drawBamboo(cont: PIXI.Container, cx: number, cy: number, count: number=5, h: number=190) {
  const g = new PIXI.Graphics()
  for (let i=0;i<count;i++) {
    const ox=(i-count/2)*16+rng(i,30)*14-7
    const sh=h+rng(i,31)*50-25
    const sx=cx+ox
    g.rect(sx-4, cy-sh, 8, sh).fill(K.bamb)
    g.rect(sx-4, cy-sh, 3, sh).fill({ color:K.bambL, alpha:0.6 })
    for (let n=0;n<7;n++) {
      const ny=cy-sh+(n+1)*(sh/8)
      g.rect(sx-5, ny-2, 10, 4).fill(K.bambN)
      if (n>2 && rng(i*10+n,32)>0.38) {
        const la=rng(i*10+n,33)*0.9-0.45
        g.poly([sx,ny, sx+Math.cos(la)*28,ny+Math.sin(la)*11, sx+Math.cos(la+0.35)*22,ny+Math.sin(la+0.35)*8]).fill({ color:K.bambL, alpha:0.82 })
      }
    }
    for (let l=0;l<3+Math.floor(rng(i,34)*3);l++) {
      const la=(l/(3+Math.floor(rng(i,34)*3)))*Math.PI-0.5
      g.poly([sx,cy-sh, sx+Math.cos(la)*32,cy-sh-13, sx+Math.cos(la+0.4)*24,cy-sh-8]).fill(K.bambL)
    }
  }
  cont.addChild(g)
}

function drawBuilding(cont: PIXI.Container, bx: number, by: number, bw: number, bh: number, opts: {
  sign?: string, wallColor?: number, roofColor?: number,
  cols?: number, style?: string, door?: boolean
} = {}) {
  const { sign, wallColor=K.wall, roofColor=K.roof, cols=3, door=true } = opts
  const g = new PIXI.Graphics()

  // Shadow
  g.ellipse(bx+bw/2+18, by+10, bw*0.55, 14).fill({ color:0x000000, alpha:0.12 })
  // Foundation
  g.rect(bx-8, by-bh, bw+16, 14).fill(K.stoneD)
  g.rect(bx-6, by-bh+2, bw+12, 10).fill(K.stoneL)
  // Walls
  g.rect(bx, by-bh+14, bw, bh-14).fill(wallColor)
  g.rect(bx, by-bh+14, 10, bh-14).fill({ color:0x000000, alpha:0.07 })
  g.rect(bx+bw-8, by-bh+14, 8, bh-14).fill({ color:0x000000, alpha:0.05 })
  g.rect(bx, by-bh+14, bw, 2).fill({ color:0xFFFFFF, alpha:0.12 })
  // Columns
  for (let i=0;i<cols;i++) {
    // column x unused — colX below handles positioning
    const colX = bx + (bw/(cols-1))*i - 5
    g.rect(colX, by-bh+14, 10, bh-14).fill(K.colR)
    g.rect(colX, by-bh+14, 3, bh-14).fill({ color:0xFF4444, alpha:0.18 })
  }
  // Door
  if (door) {
    const dw=bw*0.22, dh=bh*0.52, dx=bx+bw/2-dw/2, dy=by-dh
    g.rect(dx, dy, dw, dh).fill(K.woodD)
    g.rect(dx+2, dy+2, dw/2-3, dh-4).fill(K.wood)
    g.rect(dx+dw/2+1, dy+2, dw/2-3, dh-4).fill(K.wood)
    g.rect(dx, dy, dw, 8).fill(K.beam)
    g.circle(dx+dw*0.3, by-dh*0.45, 4).fill(K.gold)
    g.circle(dx+dw*0.7, by-dh*0.45, 4).fill(K.gold)
  }
  // Windows
  if (bw > 100) {
    for (const wx of [bx+bw*0.08, bx+bw*0.76]) {
      const winW=bw*0.14, winH=bh*0.27, wy=by-bh*0.72
      g.rect(wx, wy, winW, winH).fill(K.woodD)
      g.rect(wx+2, wy+winH/2-1, winW-4, 2).fill(K.wood)
      g.rect(wx+winW/2-1, wy+2, 2, winH-4).fill(K.wood)
    }
  }
  cont.addChild(g)

  // Roof layer
  const rf = new PIXI.Graphics()
  const oh=bw*0.2, rh=bh*0.55, rx=bx-oh, rw=bw+oh*2, ry=by-bh
  rf.poly([rx+rw*0.07, ry+rh, rx+rw*0.28, ry+rh*0.12, rx+rw/2, ry, rx+rw*0.72, ry+rh*0.12, rx+rw*0.93, ry+rh]).fill(roofColor)
  rf.poly([rx+rw*0.07, ry+rh, rx+rw*0.28, ry+rh*0.12, rx+rw/2, ry, rx+rw*0.22, ry+rh*0.4]).fill({ color:0xFFFFFF, alpha:0.04 })
  for (let i=1;i<9;i++) {
    const tx=rx+rw*(i/9)
    rf.moveTo(tx, ry+2).lineTo(tx<rx+rw/2?rx+rw*0.07:rx+rw*0.93, ry+rh-4).stroke({ color:0x000000, width:0.5, alpha:0.25 })
  }
  rf.rect(rx+rw*0.07-3, ry+rh-6, rw*0.86+6, 7).fill(K.roofE)
  rf.rect(rx+rw*0.25, ry-8, rw*0.5, 10).fill(K.roofL)
  rf.circle(rx+rw*0.25-2, ry-3, 5).fill(K.goldL)
  rf.circle(rx+rw*0.75+2, ry-3, 5).fill(K.goldL)
  rf.poly([rx+rw*0.07-3, ry+rh-6, rx-16, ry+rh-20, rx+rw*0.1, ry+rh]).fill(roofColor)
  rf.poly([rx+rw*0.93+3, ry+rh-6, rx+rw+16, ry+rh-20, rx+rw*0.9, ry+rh]).fill(roofColor)
  if (sign) {
    const sw=Math.min(bw*0.62, 130), sh=26
    const sx=bx+bw/2-sw/2
    rf.rect(sx, ry+4, sw, sh).fill(K.redD)
    rf.rect(sx+2, ry+6, sw-4, sh-4).fill(K.red)
    const t=new PIXI.Text({ text:sign, style:{ fontSize:13, fill:'#F0D050', fontFamily:'"Noto Serif SC",serif', fontWeight:'700' } })
    t.anchor.set(0.5,0.5); t.x=bx+bw/2; t.y=ry+sh/2+4
    cont.addChild(t)
  }
  cont.addChild(rf)
}

function drawPaifang(cont: PIXI.Container, cx: number, cy: number, gw: number=160) {
  const g=new PIXI.Graphics(), ph=190, pw=22
  g.ellipse(cx, cy+10, gw/2+24, 13).fill({ color:0x000000, alpha:0.14 })
  g.rect(cx-gw/2, cy-ph, pw, ph).fill(K.colRD)
  g.rect(cx-gw/2, cy-ph, pw/3, ph).fill({ color:0xFF3333, alpha:0.18 })
  g.rect(cx+gw/2-pw, cy-ph, pw, ph).fill(K.colRD)
  g.rect(cx+gw/2-pw, cy-ph, pw/3, ph).fill({ color:0xFF3333, alpha:0.18 })
  g.rect(cx-gw/2-28, cy-ph*0.62, 14, ph*0.62).fill(K.colRD)
  g.rect(cx+gw/2+14, cy-ph*0.62, 14, ph*0.62).fill(K.colRD)
  // Beams
  g.rect(cx-gw/2-28, cy-ph*0.62-15, gw+70, 15).fill(K.beam)
  g.rect(cx-gw/2-28, cy-ph*0.48-12, gw+70, 12).fill(K.beam)
  // Upper roof
  const rw1=gw+90, rx1=cx-rw1/2, ry1=cy-ph*0.62-15-48
  g.poly([rx1+rw1*0.06,ry1+48, rx1+rw1/2,ry1, rx1+rw1*0.94,ry1+48, rx1+rw1,ry1+55, rx1,ry1+55]).fill(K.roof)
  g.rect(rx1+rw1*0.22,ry1-8,rw1*0.56,10).fill(K.roofL)
  g.poly([rx1,ry1+55, rx1-14,ry1+43, rx1+16,ry1+55]).fill(K.roofM)
  g.poly([rx1+rw1,ry1+55, rx1+rw1+14,ry1+43, rx1+rw1-16,ry1+55]).fill(K.roofM)
  g.rect(rx1-14,ry1+51,rw1+28,6).fill(K.roofE)
  // Lower roof
  const rw2=gw+140, rx2=cx-rw2/2, ry2=cy-ph*0.48-12-36
  g.poly([rx2+rw2*0.06,ry2+36, rx2+rw2/2,ry2, rx2+rw2*0.94,ry2+36, rx2+rw2,ry2+42, rx2,ry2+42]).fill(K.roofM)
  g.rect(rx2-18,ry2+38,rw2+36,5).fill(K.roofE)
  g.poly([rx2,ry2+42, rx2-16,ry2+32, rx2+14,ry2+42]).fill(K.roof)
  g.poly([rx2+rw2,ry2+42, rx2+rw2+16,ry2+32, rx2+rw2-14,ry2+42]).fill(K.roof)
  // Plaque
  g.rect(cx-48,ry1+4,96,28).fill(K.redD)
  g.rect(cx-46,ry1+6,92,24).fill(K.red)
  cont.addChild(g)
  const t=new PIXI.Text({ text:'學府門', style:{ fontSize:14, fill:'#E8C050', fontFamily:'"Noto Serif SC",serif', fontWeight:'700' } })
  t.anchor.set(0.5,0.5); t.x=cx; t.y=ry1+18; cont.addChild(t)
}

function drawSign(cont: PIXI.Container, x: number, y: number, text: string) {
  const g=new PIXI.Graphics()
  g.rect(x-2, y-80, 4, 80).fill(K.woodD)
  g.rect(x-28, y-76, 56, 38).fill(K.wood)
  g.rect(x-26, y-74, 52, 34).fill(K.woodL)
  cont.addChild(g)
  const t=new PIXI.Text({ text, style:{ fontSize:11, fill:'#2A1008', fontFamily:'"Noto Serif SC",serif', fontWeight:'700' } })
  t.anchor.set(0.5,0.5); t.x=x; t.y=y-57; cont.addChild(t)
}

// ─────────────────────────────────────────────────────────────────
// Zone builders
// ─────────────────────────────────────────────────────────────────

function buildZone1Academy(ground: PIXI.Container, objs: PIXI.Container, fore: PIXI.Container) {
  const g = new PIXI.Graphics()
  drawGrass(g, 0, 580, 560, 320)
  drawStoneTile(g, 60, 660, 420, 200)
  g.rect(0, 820, 560, 80).fill(K.grassD)
  ground.addChild(g)

  const ow = new PIXI.Graphics()
  drawStoneWall(ow, 0, 640, 60, 50)
  drawStoneWall(ow, 0, 640, 16, 250)
  drawFence(ow, 470, 780, 70)
  objs.addChild(ow)

  drawBuilding(objs, 110, GY, 290, 240, { sign:'武德堂', cols:4, style:'hall', wallColor:0xF2EAD8 })
  drawBuilding(objs, 0, GY, 100, 170, { sign:'武館', cols:2, wallColor:K.wall })

  // Well
  const well=new PIXI.Graphics()
  well.ellipse(62, GY+10, 20, 13).fill({ color:0x000000, alpha:0.1 })
  well.ellipse(55, GY-8, 20, 13).fill(K.stoneD)
  well.ellipse(55, GY-10, 16, 10).fill(K.wD)
  well.rect(47, GY-35, 4, 28).fill(K.woodD); well.rect(59, GY-35, 4, 28).fill(K.woodD)
  well.rect(45, GY-37, 26, 5).fill(K.woodD)
  objs.addChild(well)

  // Training dummies
  const dum=new PIXI.Graphics()
  for (let i=0;i<3;i++) {
    const dx=195+i*80
    dum.rect(dx-4, GY-52, 8, 52).fill(K.woodD)
    dum.ellipse(dx, GY-55, 14, 14).fill(K.stone)
    dum.rect(dx-20, GY-46, 8, 28).fill(K.woodD)
    dum.rect(dx+12, GY-46, 8, 28).fill(K.woodD)
  }
  objs.addChild(dum)

  // Steps to main hall
  const steps=new PIXI.Graphics()
  steps.rect(215, GY-4, 155, 8).fill(K.stoneL)
  steps.rect(220, GY-10, 145, 8).fill(K.stone)
  steps.rect(225, GY-16, 135, 8).fill(K.stoneD)
  objs.addChild(steps)

  // Flowers and petals
  const fl=new PIXI.Graphics()
  for (let i=0;i<35;i++) {
    fl.ellipse(60+rng(i,50)*400, 680+rng(i,51)*120, 5+rng(i,52)*3, 3+rng(i,53)*2).fill({ color:K.cherryB, alpha:0.45 })
  }
  for (let i=0;i<18;i++) {
    const fx=70+rng(i+50,40)*380, fy=710+rng(i+50,41)*80
    const fc=i%3===0?0xFFD0E8:i%3===1?0xF0F080:0xFFEECC
    fl.circle(fx, fy, 4).fill(fc); fl.circle(fx, fy, 2).fill(0xFFFFFF)
  }
  ground.addChild(fl)

  // Trees
  drawTree(fore, 55, GY, 'cherry', 1.0)
  drawTree(objs, 40, GY-10, 'cherry', 0.72)
  drawTree(fore, 488, GY, 'cherry', 0.9)
  drawTree(fore, 514, GY-12, 'cherry', 0.68)

  // Lanterns
  drawLantern(objs, 140, 700); drawLantern(objs, 290, 700); drawLantern(objs, 440, 700)
  // Rope between lanterns
  const rope=new PIXI.Graphics()
  rope.moveTo(140, 706).quadraticCurveTo(215, 716, 290, 706).stroke({ color:K.woodD, width:1.5 })
  rope.moveTo(290, 706).quadraticCurveTo(365, 716, 440, 706).stroke({ color:K.woodD, width:1.5 })
  objs.addChild(rope)
}

function buildZone2Bamboo(ground: PIXI.Container, objs: PIXI.Container, fore: PIXI.Container) {
  const g=new PIXI.Graphics()
  drawGrass(g, 540, 580, 540, 320)
  drawDirt(g, 590, 680, 70, 200)
  drawDirt(g, 780, 660, 80, 220)
  drawDirt(g, 950, 670, 120, 210)
  // Stream bed
  g.rect(718, 600, 70, 300).fill(K.stoneD)
  drawWater(g, 724, 604, 58, 296)
  ground.addChild(g)

  // Dense bamboo clusters
  for (let i=0;i<8;i++) drawBamboo(objs, 550+i*18, GY, 4, 160+rng(i,60)*60)
  for (let i=0;i<6;i++) drawBamboo(objs, 640+i*22, GY-10, 5, 190+rng(i+10,60)*50)
  for (let i=0;i<7;i++) drawBamboo(fore, 580+i*20, GY, 3, 210+rng(i+20,60)*40)
  // Right side bamboo
  for (let i=0;i<9;i++) drawBamboo(objs, 800+i*19, GY, 4, 170+rng(i+30,60)*55)
  for (let i=0;i<8;i++) drawBamboo(fore, 830+i*18, GY, 3, 200+rng(i+40,60)*45)
  for (let i=0;i<6;i++) drawBamboo(objs, 990+i*20, GY, 5, 160+rng(i+50,60)*60)
  for (let i=0;i<5;i++) drawBamboo(fore, 1010+i*22, GY, 3, 190+rng(i+55,60)*50)

  // Bridge over stream
  const br=new PIXI.Graphics()
  drawBridge(br, 710, GY, 88)
  objs.addChild(br)

  // Rocks and moss
  const rk=new PIXI.Graphics()
  drawRock(rk, 660, GY-5, 0.9); drawRock(rk, 900, GY-8, 1.1)
  drawRock(rk, 980, GY-4, 0.7); drawRock(rk, 1050, GY-6, 0.85)
  objs.addChild(rk)

  // Stone bench in clearing
  const bench=new PIXI.Graphics()
  bench.rect(840, GY-24, 60, 10).fill(K.stoneL)
  bench.rect(843, GY-14, 8, 14).fill(K.stone); bench.rect(889, GY-14, 8, 14).fill(K.stone)
  objs.addChild(bench)

  // Sign
  drawSign(objs, 580, GY, '竹林徑')
  drawSign(objs, 760, GY, '清溪橋')
}

function buildZone3Village(ground: PIXI.Container, objs: PIXI.Container, fore: PIXI.Container) {
  const g=new PIXI.Graphics()
  drawGrass(g, 1080, 580, 540, 320)
  drawCobble(g, 1120, 680, 460, 180)
  // Fish pond
  g.ellipse(1560, GY+30, 55, 38).fill(K.stoneD)
  drawWater(g, 1508, GY-2, 104, 64)
  g.ellipse(1560, GY+32, 50, 34).fill(K.wM)
  ground.addChild(g)

  // Tea house
  drawBuilding(objs, 1090, GY, 170, 200, { sign:'茶館', cols:3, wallColor:0xF0E4C8 })
  // Library
  drawBuilding(objs, 1280, GY-50, 140, 190, { sign:'書院', cols:3, wallColor:K.wall })
  // Market stalls
  const stalls=new PIXI.Graphics()
  for (let i=0;i<3;i++) {
    const sx=1440+i*65
    stalls.rect(sx, GY-60, 55, 60).fill(K.wood)
    stalls.rect(sx-4, GY-72, 63, 15).fill(i%2===0?K.red:K.colRD)
    stalls.rect(sx+6, GY-58, 42, 50).fill(K.wallS)
    // Goods on counter
    for (let j=0;j<4;j++) {
      const c=j%4===0?0xE03030:j%4===1?0xF0C040:j%4===2?0x40A040:0x8060E0
      stalls.circle(sx+10+j*10, GY-30, 5).fill(c)
    }
  }
  objs.addChild(stalls)
  // Stall signs
  drawSign(objs, 1457, GY, '藥材')
  drawSign(objs, 1522, GY, '茶葉')
  drawSign(objs, 1587, GY, '布匹')

  // Houses background
  const houses=new PIXI.Graphics()
  for (let i=0;i<4;i++) {
    const hx=1110+i*105, hw=88, hh=110
    houses.rect(hx, GY-200-hh, hw, hh).fill(K.wallS)
    for (let j=0;j<2;j++) houses.rect(hx+hw*j/1-(j>0?10:0), GY-200-hh, 10, hh).fill(K.colRD)
    const roh=hw*0.2, rrh=hh*0.5
    houses.poly([hx-roh, GY-200, hx+hw*0.3, GY-200-rrh, hx+hw-hw*0.3, GY-200-rrh, hx+hw+roh, GY-200]).fill(K.roofM)
  }
  ground.addChild(houses)

  // Pond details
  const pond=new PIXI.Graphics()
  for (let i=0;i<5;i++) {
    const lx=1515+rng(i,70)*90, ly=GY+5+rng(i,71)*40
    pond.ellipse(lx, ly, 12+rng(i,72)*8, 5+rng(i,73)*3).fill({ color:0x60C040, alpha:0.65 })
  }
  for (let i=0;i<3;i++) {
    pond.circle(1525+i*25, GY+25, 3).fill({ color:0xFF8030, alpha:0.8 })
  }
  ground.addChild(pond)

  // Trees
  drawTree(fore, 1086, GY, 'oak', 0.8)
  drawTree(fore, 1610, GY, 'cherry', 0.9)
  drawTree(objs, 1070, GY-12, 'cherry', 0.6)

  // Lanterns along street
  drawLantern(objs, 1170, 700); drawLantern(objs, 1320, 700)
  drawLantern(objs, 1470, 700); drawLantern(objs, 1600, 700)

  // Stone steps to library
  const libSteps=new PIXI.Graphics()
  libSteps.rect(1330, GY-54, 80, 8).fill(K.stoneL)
  libSteps.rect(1335, GY-60, 70, 8).fill(K.stone)
  objs.addChild(libSteps)
}

function buildZone4Mountain(ground: PIXI.Container, objs: PIXI.Container, fore: PIXI.Container) {
  const g=new PIXI.Graphics()
  // Rising terrain
  const terr=new PIXI.Graphics()
  terr.poly([1620,900, 1620,GY, 1680,GY-20, 1780,GY-60, 1900,GY-130, 2000,GY-160, 2100,GY-150, 2160,GY-80, 2160,900]).fill(K.grassD)
  g.addChild?.(terr)
  drawGrass(g, 1620, 580, 540, 320)
  // Rocky cliff edges
  drawStoneWall(g, 1620, GY-100, 540, 16)
  // Stone path winding up
  const path=new PIXI.Graphics()
  drawDirt(path, 1640, GY-15, 80, 120)
  drawDirt(path, 1720, GY-55, 80, 80)
  drawDirt(path, 1800, GY-105, 80, 70)
  drawDirt(path, 1880, GY-140, 120, 60)
  drawDirt(path, 2000, GY-160, 160, 50)
  g.addChild?.(path)
  ground.addChild(g)

  // Actual ground graphics
  const gr=new PIXI.Graphics()
  drawGrass(gr, 1620, 580, 540, 200)
  drawGrass(gr, 1620, 680, 540, 220)
  // Rocky patches
  gr.rect(1620, GY-120, 540, 20).fill(K.stone)
  gr.rect(1800, GY-150, 240, 25).fill(K.stoneD)
  gr.rect(2000, GY-170, 160, 20).fill(K.stone)
  ground.addChild(gr)

  // Stone steps
  const sts=new PIXI.Graphics()
  for (let i=0;i<12;i++) {
    const sx=1660+i*28, sy=GY-12-i*12
    sts.rect(sx, sy, 36, 10).fill(i%2===0?K.stoneL:K.stone)
    sts.rect(sx, sy, 36, 2).fill({ color:0xFFFFFF, alpha:0.08 })
  }
  objs.addChild(sts)

  // Waterfall
  const wf=new PIXI.Graphics()
  // Pool at bottom
  wf.ellipse(1940, GY-115, 50, 28).fill(K.wD)
  wf.ellipse(1940, GY-117, 44, 24).fill(K.wM)
  // Fall channel
  wf.rect(1930, GY-280, 22, 168).fill({ color:K.wL, alpha:0.7 })
  // Foam at top and bottom
  for (let i=0;i<8;i++) wf.ellipse(1924+i*4, GY-280, 5, 4).fill({ color:K.wF, alpha:0.6 })
  for (let i=0;i<10;i++) wf.ellipse(1916+i*5, GY-118, 7, 4).fill({ color:K.wF, alpha:0.55 })
  // Rocky sides
  drawRock(wf, 1905, GY-125, 1.1); drawRock(wf, 1968, GY-120, 0.9)
  objs.addChild(wf)

  // Pine trees along mountain
  drawTree(fore, 1640, GY, 'pine', 1.1)
  drawTree(objs, 1700, GY-50, 'pine', 0.9)
  drawTree(fore, 1820, GY-100, 'pine', 1.0)
  drawTree(objs, 2050, GY-160, 'pine', 1.2)
  drawTree(fore, 2120, GY-140, 'pine', 0.85)

  // Rocky outcrops
  const rk=new PIXI.Graphics()
  drawRock(rk, 1670, GY-8, 1.3); drawRock(rk, 1750, GY-65, 1.0)
  drawRock(rk, 1860, GY-138, 1.4); drawRock(rk, 2080, GY-175, 1.1)
  drawRock(rk, 2140, GY-92, 0.8)
  objs.addChild(rk)

  // Cave entrance
  const cave=new PIXI.Graphics()
  cave.ellipse(2130, GY-135, 32, 24).fill({ color:0x0A0808, alpha:0.9 })
  cave.ellipse(2128, GY-134, 28, 20).fill({ color:0x050505 })
  drawStoneWall(cave, 2100, GY-160, 70, 30)
  objs.addChild(cave)
  drawSign(objs, 2130, GY-160, '隱谷')
}

function buildZone5Temple(ground: PIXI.Container, objs: PIXI.Container, fore: PIXI.Container) {
  const g=new PIXI.Graphics()
  drawGrass(g, 2160, 580, 540, 320)
  drawStoneTile(g, 2200, 650, 460, 220)
  g.rect(2160, 820, 540, 80).fill(K.grassD)
  ground.addChild(g)

  // Grand paifang gate
  drawPaifang(objs, 2280, GY, 170)

  // Main temple (large)
  drawBuilding(objs, 2340, GY, 300, 260, { sign:'古刹', cols:5, style:'temple', wallColor:0xF5EDE0 })

  // Bell tower (side)
  drawBuilding(objs, 2210, GY-30, 80, 200, { sign:'鐘樓', cols:2, wallColor:K.wall })

  // Stone statues
  const stat=new PIXI.Graphics()
  for (const sx of [2236, 2640]) {
    stat.ellipse(sx, GY+8, 16, 10).fill({ color:0x000000, alpha:0.1 })
    stat.rect(sx-8, GY-70, 16, 70).fill(K.stoneD)
    stat.ellipse(sx, GY-72, 14, 14).fill(K.stone)
    stat.rect(sx-20, GY-60, 8, 30).fill(K.stoneD)
    stat.rect(sx+12, GY-60, 8, 30).fill(K.stoneD)
    stat.rect(sx-14, GY-30, 28, 8).fill(K.stoneL)
  }
  objs.addChild(stat)

  // Stone tablets with inscriptions
  const tab=new PIXI.Graphics()
  for (let i=0;i<3;i++) {
    const tx2=2310+i*80
    tab.rect(tx2-10, GY-90, 20, 90).fill(K.stoneD)
    tab.rect(tx2-8, GY-88, 16, 86).fill(K.stone)
  }
  objs.addChild(tab)
  const t1=new PIXI.Text({ text:'道', style:{ fontSize:18, fill:'#3A2010', fontFamily:'"Noto Serif SC",serif' } })
  t1.anchor.set(0.5,0.5); t1.x=2310; t1.y=GY-48; objs.addChild(t1)
  const t2=new PIXI.Text({ text:'德', style:{ fontSize:18, fill:'#3A2010', fontFamily:'"Noto Serif SC",serif' } })
  t2.anchor.set(0.5,0.5); t2.x=2390; t2.y=GY-48; objs.addChild(t2)
  const t3=new PIXI.Text({ text:'仁', style:{ fontSize:18, fill:'#3A2010', fontFamily:'"Noto Serif SC",serif' } })
  t3.anchor.set(0.5,0.5); t3.x=2470; t3.y=GY-48; objs.addChild(t3)

  // Ancient gnarled trees
  drawTree(fore, 2192, GY, 'oak', 1.2)
  drawTree(fore, 2660, GY, 'oak', 1.1)
  drawTree(objs, 2175, GY-10, 'plum', 0.75)

  // Temple steps
  const ts=new PIXI.Graphics()
  ts.rect(2380, GY-4, 160, 8).fill(K.stoneL)
  ts.rect(2385, GY-10, 150, 8).fill(K.stone)
  ts.rect(2390, GY-16, 140, 8).fill(K.stoneD)
  ts.rect(2395, GY-22, 130, 8).fill(K.stoneL)
  objs.addChild(ts)

  // Stone wall perimeter
  const tw=new PIXI.Graphics()
  drawStoneWall(tw, 2160, 640, 540, 42)
  objs.addChild(tw)

  // Incense burner
  const inc=new PIXI.Graphics()
  inc.rect(2479, GY-55, 22, 55).fill(K.stoneD)
  inc.rect(2468, GY-65, 44, 14).fill(K.stone)
  inc.rect(2465, GY-58, 50, 6).fill(K.stoneL)
  objs.addChild(inc)

  // Lanterns
  for (let i=0;i<5;i++) drawLantern(objs, 2230+i*100, GY-90)
}

function buildBackground(bgLayer: PIXI.Container) {
  const g=new PIXI.Graphics()
  // Sky gradient bands
  g.rect(0, 0, WW, 180).fill(K.skyT)
  g.rect(0, 100, WW, 120).fill({ color:K.skyM, alpha:0.6 })
  g.rect(0, 180, WW, 100).fill({ color:K.skyH, alpha:0.5 })

  // Clouds
  for (let i=0;i<14;i++) {
    const cx=rng(i,90)*WW, cy=30+rng(i,91)*100, cw=60+rng(i,92)*100
    g.ellipse(cx, cy, cw, 20+rng(i,93)*18).fill({ color:0xF0F5FA, alpha:0.55+rng(i,94)*0.25 })
    g.ellipse(cx-cw*0.25, cy-10, cw*0.5, 18+rng(i,95)*10).fill({ color:0xF8FBFF, alpha:0.45+rng(i,96)*0.2 })
    g.ellipse(cx+cw*0.2, cy-8, cw*0.45, 16+rng(i,97)*8).fill({ color:0xF0F5FA, alpha:0.4+rng(i,98)*0.2 })
  }

  // Far mountains (pale, hazy)
  for (let i=0;i<9;i++) {
    const mx=rng(i,80)*WW*1.2-WW*0.1, mh=120+rng(i,81)*100, mw=200+rng(i,82)*180
    g.poly([mx, 300, mx+mw/2, 300-mh, mx+mw, 300]).fill({ color:K.mtnF, alpha:0.35+rng(i,83)*0.15 })
  }
  // Mid mountains
  for (let i=0;i<7;i++) {
    const mx=rng(i+20,80)*WW*1.1-WW*0.05, mh=90+rng(i+20,81)*80, mw=170+rng(i+20,82)*140
    g.poly([mx, 360, mx+mw/2, 360-mh, mx+mw, 360]).fill({ color:K.mtnM, alpha:0.4+rng(i+20,83)*0.2 })
  }
  // Near forest hills
  for (let i=0;i<12;i++) {
    const hx=rng(i,70)*WW, hy=400+rng(i,71)*60, hw=100+rng(i,72)*120
    g.ellipse(hx, hy, hw, 55+rng(i,73)*40).fill({ color:K.hillF, alpha:0.5+rng(i,74)*0.25 })
  }
  // Ground base color all the way
  g.rect(0, 520, WW, 380).fill(K.grassD)

  bgLayer.addChild(g)
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

      // ── World container ────────────────────────────────────────
      const world = new PIXI.Container()
      app.stage.addChild(world)

      // ── Layers ────────────────────────────────────────────────
      const bgLayer   = new PIXI.Container()
      const groundLay = new PIXI.Container()
      const shadowLay = new PIXI.Container()
      const objLay    = new PIXI.Container()
      const charLay   = new PIXI.Container()
      const foreLayer = new PIXI.Container()
      const partLay   = new PIXI.Container()
      world.addChild(bgLayer, groundLay, shadowLay, objLay, charLay, foreLayer, partLay)

      // ── Build world ────────────────────────────────────────────
      buildBackground(bgLayer)
      buildZone1Academy(groundLay, objLay, foreLayer)
      buildZone2Bamboo(groundLay, objLay, foreLayer)
      buildZone3Village(groundLay, objLay, foreLayer)
      buildZone4Mountain(groundLay, objLay, foreLayer)
      buildZone5Temple(groundLay, objLay, foreLayer)

      // Zone transition signs
      drawSign(objLay, 540, GY, '竹林')
      drawSign(objLay, 1082, GY, '村落')
      drawSign(objLay, 1622, GY, '山道')
      drawSign(objLay, 2162, GY, '古刹')

      // ── NPC Sifu Liang ────────────────────────────────────────
      const npc = new PIXI.Container()
      npc.x = 290; npc.y = GY
      npc.eventMode = 'static'; npc.cursor = 'pointer'
      const npcG = new PIXI.Graphics()
      npcG.ellipse(8, 8, 16, 8).fill({ color:0x000000, alpha:0.1 })
      npcG.rect(-10, -50, 20, 50).fill(K.woodD)
      npcG.rect(-10, -50, 20, 50).stroke({ color:K.gold, width:1.5 })
      npcG.rect(-10, -50, 6, 50).fill({ color:K.goldD, alpha:0.3 })
      npcG.circle(0, -62, 13).fill(0xD4A574)
      npcG.circle(0, -62, 13).stroke({ color:K.bk, width:1.5 })
      npcG.rect(-2, -78, 4, 18).fill(K.woodD)
      npcG.rect(-5, -80, 10, 5).fill(K.woodD)
      const npcLbl = new PIXI.Text({ text:'師父 Liang', style:{ fontSize:9, fill:'#C9A84C', fontFamily:'Georgia,serif' } })
      npcLbl.anchor.set(0.5, 0); npcLbl.y = 4
      npc.addChild(npcG, npcLbl)
      npc.on('pointerover', () => { npcG.tint = 0xFFEECC })
      npc.on('pointerout',  () => { npcG.tint = 0xFFFFFF })
      npc.on('pointerdown', () => setNpcText('Discípulo... os pergaminhos dos números aguardam. Encontre os cinco orbes de Hanzi espalhados por este mundo — da Academia até o Templo Antigo. Apenas o cultivo verdadeiro desperta o Qi interior.'))
      charLay.addChild(npc)

      // ── Wandering NPCs ─────────────────────────────────────────
      interface WalkNPC { cont: PIXI.Container; dir: number; spd: number; min: number; max: number; t: number }
      const walkers: WalkNPC[] = []
      const npcColors = [0xC08040, 0x8080C0, 0xA04040, 0x40A060]
      const npcZones = [
        { x:1180, min:1140, max:1280 }, { x:1350, min:1280, max:1470 },
        { x:1420, min:1340, max:1560 }, { x:1500, min:1380, max:1580 },
      ]
      npcZones.forEach((z, i) => {
        const wc = new PIXI.Container()
        wc.x = z.x; wc.y = GY
        const wg = new PIXI.Graphics()
        wg.ellipse(5, 5, 10, 6).fill({ color:0x000000, alpha:0.08 })
        wg.rect(-6, -36, 12, 36).fill(npcColors[i % npcColors.length])
        wg.circle(0, -44, 9).fill(0xD4A574)
        charLay.addChild(wc)
        wc.addChild(wg)
        walkers.push({ cont:wc, dir:i%2===0?1:-1, spd:0.5+Math.random()*0.4, min:z.min, max:z.max, t:Math.random()*200 })
      })

      // ── Orbs ──────────────────────────────────────────────────
      const orbContainers: PIXI.Container[] = []
      for (let i=0; i<ORBS.length; i++) {
        const h = ORBS[i]
        const tColorHex = parseInt(TONE_COLORS[h.tone].hex.replace('#','0x'), 16)
        const baseY = h.wy
        const orb = new PIXI.Container()
        orb.x = h.wx; orb.y = baseY
        orb.eventMode = 'static'; orb.cursor = 'pointer'

        const glow = new PIXI.Graphics()
        glow.circle(0, 0, 44).fill({ color:tColorHex, alpha:0.1 })
        const circle = new PIXI.Graphics()
        circle.circle(0, 0, 28).fill({ color:tColorHex, alpha:0.88 })
        circle.circle(0, 0, 28).stroke({ color:0xFFFFFF, width:2, alpha:0.55 })
        circle.circle(-8, -10, 7).fill({ color:0xFFFFFF, alpha:0.25 })
        const charText = new PIXI.Text({ text:h.hanzi, style:{ fontSize:28, fill:'#FFFFFF', fontFamily:'"Noto Serif SC",serif', fontWeight:'700' } })
        charText.anchor.set(0.5)
        const pinText = new PIXI.Text({ text:h.pinyin, style:{ fontSize:9, fill:'#FFFFFF', fontFamily:'Georgia,serif' } })
        pinText.anchor.set(0.5, 0); pinText.y = 33; pinText.alpha = 0.75
        const star = new PIXI.Text({ text:'★', style:{ fontSize:14, fill:'#C9A84C' } })
        star.anchor.set(0.5); star.x = 22; star.y = -22; star.visible = false
        orb.addChild(glow, circle, charText, pinText, star)
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
        charLay.addChild(orb)
        orbContainers.push(orb)
      }

      // ── Player ────────────────────────────────────────────────
      const playerShadow = new PIXI.Graphics()
      playerShadow.ellipse(0, 0, 14, 5).fill({ color:0x000000, alpha:0.14 })
      const player = new PIXI.Graphics()
      player.circle(0, 0, 13).fill({ color:0xAA0000 })
      player.circle(0, 0, 13).stroke({ color:0xFFFFFF, width:2.5 })
      player.circle(-3, -5, 4).fill({ color:0xFFFFFF, alpha:0.7 })
      player.x = 210; player.y = GY
      playerShadow.x = 210; playerShadow.y = GY + 14
      charLay.addChild(playerShadow, player)

      // ── Falling leaves ────────────────────────────────────────
      interface Leaf { g: PIXI.Graphics; x: number; y: number; vx: number; vy: number; rot: number; alpha: number; color: number }
      const leafColors = [K.cherry, K.cherryB, K.leaf, K.leafL, K.grassL]
      const leaves: Leaf[] = []
      for (let i=0;i<40;i++) {
        const lg = new PIXI.Graphics()
        const lc = leafColors[i % leafColors.length]
        lg.ellipse(0, 0, 6, 3).fill({ color:lc, alpha:0.7 })
        const lx = Math.random() * WW, ly = 580 + Math.random() * 200
        lg.x = lx; lg.y = ly
        partLay.addChild(lg)
        leaves.push({ g:lg, x:lx, y:ly, vx:(Math.random()-0.5)*0.8, vy:0.4+Math.random()*0.6, rot:Math.random()*Math.PI*2, alpha:0.5+Math.random()*0.4, color:lc })
      }

      // ── Smoke emitters ────────────────────────────────────────
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
          sg.circle(0, 0, 8+Math.random()*6).fill({ color:0xDDDDE0, alpha:0.18 })
          sg.x = em.ox + (Math.random()-0.5)*8
          sg.y = em.oy - life * 1.2
          sg.alpha = Math.max(0, 0.3 - life/80*0.3)
          sg.scale.set(0.5 + life/80*0.8)
          partLay.addChild(sg)
          smokes.push({ g:sg, ox:em.ox, oy:em.oy, life, max:80+Math.random()*40, phase:Math.random()*Math.PI*2 })
        }
      })

      // ── Birds ─────────────────────────────────────────────────
      interface Bird { g: PIXI.Graphics; x: number; y: number; vx: number; vy: number; flap: number }
      const birds: Bird[] = []
      for (let i=0;i<6;i++) {
        const bg2 = new PIXI.Graphics()
        bg2.poly([-8,0, 0,-4, 8,0]).fill({ color:0x333344, alpha:0.6 })
        bg2.x = Math.random()*WW; bg2.y = 200+Math.random()*150
        partLay.addChild(bg2)
        birds.push({ g:bg2, x:bg2.x, y:bg2.y, vx:1+Math.random()*1.5, vy:(Math.random()-0.5)*0.3, flap:Math.random()*Math.PI*2 })
      }

      // ── Water animation objects ────────────────────────────────
      const waterGfx: PIXI.Graphics[] = []
      const waterAreas = [
        { x:724, y:604, w:58, h:296 },      // stream zone 2
        { x:1508, y:GY-2, w:104, h:64 },     // pond zone 3
        { x:1916, y:GY-117, w:50, h:30 },    // waterfall pool
      ]
      waterAreas.forEach((_wa) => {
        const wg2 = new PIXI.Graphics()
        partLay.addChild(wg2)
        waterGfx.push(wg2)
      })

      // ── Camera state ───────────────────────────────────────────
      let camX = 0, camY = 0
      const targetCam = { x:0, y:0 }

      // ── Main ticker ────────────────────────────────────────────
      let t = 0
      app.ticker.add((tk) => {
        t += tk.deltaTime
        const spd = 2.8 * tk.deltaTime

        // Player movement
        if (keys['ArrowUp']    || keys['w'] || keys['W']) player.y -= spd
        if (keys['ArrowDown']  || keys['s'] || keys['S']) player.y += spd
        if (keys['ArrowLeft']  || keys['a'] || keys['A']) player.x -= spd
        if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x += spd
        player.x = Math.max(16, Math.min(WW - 16, player.x))
        player.y = Math.max(520, Math.min(WH - 16, player.y))
        playerShadow.x = player.x + 4
        playerShadow.y = player.y + 14

        // Camera smooth follow
        targetCam.x = player.x - W / 2
        targetCam.y = player.y - H / 2 - 60
        camX += (targetCam.x - camX) * 0.1
        camY += (targetCam.y - camY) * 0.1
        camX = Math.max(0, Math.min(WW - W, camX))
        camY = Math.max(0, Math.min(WH - H, camY))
        world.x = -Math.round(camX)
        world.y = -Math.round(camY)

        // Parallax sky
        bgLayer.x = Math.round(camX * 0.12)

        // NPC float
        npc.y = GY + Math.sin(t * 0.02) * 3

        // Walking NPCs
        walkers.forEach((w) => {
          w.t += tk.deltaTime
          w.cont.x += w.dir * w.spd * tk.deltaTime
          if (w.cont.x > w.max) { w.dir = -1; w.cont.scale.x = -1 }
          if (w.cont.x < w.min) { w.dir = 1;  w.cont.scale.x = 1 }
          // Walking bob
          w.cont.y = GY + Math.abs(Math.sin(w.t * 0.15)) * 3
        })

        // Falling leaves
        leaves.forEach((lf) => {
          lf.x += lf.vx + Math.sin(t * 0.02 + lf.rot) * 0.4
          lf.y += lf.vy
          lf.rot += 0.04
          lf.g.x = lf.x
          lf.g.y = lf.y
          lf.g.rotation = lf.rot
          if (lf.y > WH) {
            lf.y = 560 + Math.random() * 100
            lf.x = Math.random() * WW
          }
        })

        // Smoke
        smokes.forEach((s) => {
          s.life += tk.deltaTime * 0.5
          if (s.life > s.max) {
            s.life = 0
            s.g.x = s.ox + (Math.random()-0.5)*10
            s.g.y = s.oy
          }
          s.g.x += Math.sin(t*0.03 + s.phase) * 0.2
          s.g.y = s.oy - s.life * 1.4
          s.g.alpha = Math.max(0, 0.28 - (s.life/s.max) * 0.28)
          s.g.scale.set(0.4 + (s.life/s.max) * 0.9)
        })

        // Birds
        birds.forEach((b) => {
          b.flap += 0.18
          b.x += b.vx
          b.y += Math.sin(b.flap * 2) * 0.5 + b.vy
          if (b.x > WW + 50) { b.x = -50; b.y = 180 + Math.random() * 160 }
          b.g.x = b.x; b.g.y = b.y
          b.g.clear()
          const wingDip = Math.sin(b.flap) * 5
          b.g.poly([-8, wingDip, 0, 0, 8, wingDip]).fill({ color:0x2A2A3A, alpha:0.55 })
        })

        // Water shimmer animation
        waterAreas.forEach((wa, idx) => {
          const wg2 = waterGfx[idx]
          wg2.clear()
          for (let i=0;i<4;i++) {
            const wy2 = wa.y + wa.h*(0.2+i*0.2) + Math.sin(t*0.06 + i*0.8) * 3
            wg2.rect(wa.x + wa.w*0.06, wy2, wa.w*0.88, 2).fill({ color:K.wL, alpha:0.25+Math.sin(t*0.08+i)*0.12 })
          }
        })
      })

      // ── Key handlers ───────────────────────────────────────────
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
