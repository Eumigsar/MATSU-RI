import * as PIXI from 'pixi.js'
import { GY, K, rng } from '../constants'
import { BA, NA, PA } from '../../engine/AtlasRegistry'
import { drawStoneWall, drawLantern } from '../drawHelpers'
import type { RenderCtx, ZoneLayers } from '../../engine/types'

// ─── Zone 1 — Martial Academy 武德堂 (x: 0–540) ──────────────────────────────
//
// Architectural hierarchy (west → east, primary walking path at y ≈ 770):
//
//   x:   0–55  Natural approach — bamboo stand, rocks. Outside the academy walls.
//   x:  55–165 Main Gate 正門 — GATE_SM flanked by guard posts and cherry trees.
//              Paired stone pillars. Lanterns with decorative rope. 2 approach steps.
//   x: 165–265 Entrance Courtyard 前庭 — open ceremonial stone floor.
//              Intentional negative space. Cherry petals. Paired lanterns.
//   x: 265–350 Training Square 習武場 — 3 dummies in formation. Well set back.
//              Open courtyard — the emptiness IS the training space.
//   x: 350–540 Main Hall compound — FAC_WIDE (dominant), plus inner buildings
//              layered in depth behind it (lower y = further back = set-back compound):
//                Library  (FAC_B1)   y=690 — behind training, above dummies
//                Tea House (FAC_B2)  y=668 — inner compound left
//                Dormitory (FAC_NARR) y=668 — inner compound right
//                Shrine   (FAC_MED2) y=626 — deepest sacred space, far northeast
//
// Scale rationale (player sprite = 32 px reference):
//   GATE_SM  0.63 → 147×145   ~4.5 player-heights — imposing gate
//   FAC_WIDE 0.88 → 289×120   ~3.7 player-heights — dominant main hall
//   Secondary 0.70–0.72        — smaller, hierarchy is visual
//   Props    0.50–0.62         — human-scale beside player

export function buildZone1Academy(layers: ZoneLayers, ctx: RenderCtx): void {
  const { ground, infra, ysort } = layers

  // ══════════════════════════════════════════════════════════════════
  // GROUND — layered terrain surfaces
  // Each tile added after the previous paints on top of it.
  // ══════════════════════════════════════════════════════════════════

  // Base dark grass (entire zone)
  const gBase = ctx.gt(0, 0, 540, 410); gBase.x = 0;   gBase.y = 490; ground.addChild(gBase)
  // Lighter grass in the upper/north region (above the compound)
  const gUp   = ctx.gt(1, 0, 540, 180); gUp.x = 0;     gUp.y = 490;   ground.addChild(gUp)
  // Stone courtyard — spans entrance through training square to main hall
  const gCrt  = ctx.gt(5, 1, 430, 230); gCrt.x = 55;   gCrt.y = 600;  ground.addChild(gCrt)
  // Marble inner compound — library, tea house, dormitory zone
  const gMrb  = ctx.gt(3, 1, 185, 175); gMrb.x = 290;  gMrb.y = 555;  ground.addChild(gMrb)
  // Garden earth — eastern bonsai + shrine section
  const gGrd  = ctx.gt(4, 0, 110, 210); gGrd.x = 430;  gGrd.y = 590;  ground.addChild(gGrd)

  // ── Stone paths (drawn over tiles — paths are on top of terrain) ──
  const pathG = new PIXI.Graphics()

  // Primary E-W spine — 34 px wide cobblestone at y=752, player walks the center
  pathG.rect(55, 752, 480, 34).fill(K.cobble)
  // Subtle alternating joints for a hand-laid stone feel
  for (let i = 0; i < 16; i++) {
    pathG.rect(55 + i * 30, 752, 28, 34)
         .fill({ color: i % 2 === 0 ? K.cobble : K.cobbleL, alpha: 0.50 })
  }
  // North branch — connects main spine to inner compound (library / tea / shrine)
  pathG.rect(388, 622, 26, 130).fill(K.cobble)
  // Garden spur — leads east into bonsai meditation area
  pathG.rect(448, 634, 22, 118).fill(K.cobble)

  ground.addChild(pathG)

  // ── Cherry blossom petals scattered on the courtyard ─────────────
  // Concentrated in entrance courtyard + training square. Not random — they
  // accumulate where foot traffic stops and the trees overhang.
  const petals = new PIXI.Graphics()
  for (let i = 0; i < 28; i++) {
    const px = 110 + rng(i, 10) * 268
    const py = 630 + rng(i, 11) * 140
    petals.ellipse(px, py, 4 + rng(i, 12) * 3, 2 + rng(i, 13) * 2)
          .fill({ color: K.cherryB, alpha: 0.55 })
  }
  ground.addChild(petals)

  // ══════════════════════════════════════════════════════════════════
  // INFRASTRUCTURE — perimeter walls, steps, lanterns, signs
  // ══════════════════════════════════════════════════════════════════

  const walls = new PIXI.Graphics()
  // North boundary wall — seals the compound from the wild mountains
  drawStoneWall(walls, 0,   500, 540, 44)
  // West side wall — closes the bamboo approach; stone masonry finish
  drawStoneWall(walls, 0,   544,  44, 225)
  // Gate pillars — stone bases rising from the perimeter wall to gate level.
  // Left pillar: x 56–100, centre x=78. Right pillar: x 148–192, centre x=170.
  // Gate sprite (x=124) centres on the 48-px gap between them.
  drawStoneWall(walls, 56,  544,  44, 215)
  drawStoneWall(walls, 148, 544,  44, 215)
  infra.addChild(walls)

  // Steps — descend toward the viewer, 3 risers at main hall (ceremonial)
  const steps = new PIXI.Graphics()
  // Gate approach: 2 modest steps, centred under gate at x=124
  steps.rect(89, GY - 5,  70, 5).fill(K.stoneL)
  steps.rect(93, GY - 11, 62, 5).fill(K.stone)
  // Main hall: 3 wide ceremonial steps spanning the full entrance
  steps.rect(376, GY - 5,  112, 5).fill(K.stoneL)
  steps.rect(380, GY - 12, 104, 6).fill(K.stone)
  steps.rect(384, GY - 19,  96, 7).fill(K.stoneD)
  infra.addChild(steps)

  // Lanterns — always in paired sets, marking architectural transitions.
  // Each pair flanks a threshold the player crosses.
  drawLantern(infra,  78, 720)   // gate — left (aligned to pillar centre x=78)
  drawLantern(infra, 170, 720)   // gate — right (aligned to pillar centre x=170)
  drawLantern(infra, 148, 696)   // training square — west boundary
  drawLantern(infra, 268, 696)   // training square — east boundary
  drawLantern(infra, 378, 703)   // main hall entrance — left
  drawLantern(infra, 490, 703)   // main hall entrance — right

  // Decorative ropes linking gate and training lanterns
  const ropes = new PIXI.Graphics()
  ropes.moveTo( 78, 726).quadraticCurveTo(124, 737, 170, 726).stroke({ color: K.woodD, width: 1.5 })
  ropes.moveTo(148, 702).quadraticCurveTo(208, 712, 268, 702).stroke({ color: K.woodD, width: 1.5 })
  infra.addChild(ropes)

  // Building name signs — placed in infra so they render above the stone walls
  // but their Y positions sit above the building tops (no overlap with ysort sprites)
  const mkSign = (text: string, x: number, y: number) => {
    const sg = new PIXI.Graphics()
    sg.rect(x - 30, y,     60, 22).fill(K.redD)
    sg.rect(x - 27, y + 2, 54, 18).fill(K.red)
    infra.addChild(sg)
    const t = new PIXI.Text({ text, style: {
      fontSize: 11, fill: '#F0D050',
      fontFamily: '"Noto Serif SC", serif', fontWeight: '700',
    }})
    t.anchor.set(0.5, 0.5); t.x = x; t.y = y + 11
    infra.addChild(t)
  }
  mkSign('正門',   124, GY - 180)   // above gate (gate top ≈ GY−145)
  mkSign('武德堂', 432, GY - 160)   // above main hall (hall top ≈ GY−120)

  // ══════════════════════════════════════════════════════════════════
  // Y-SORTED OBJECTS
  //
  // All sprites: anchor.set(0.5, 1) — foot/base centred at (x, y).
  // Y-sort ticks each frame: higher y = closer to viewer.
  // Within the same y value, insertion order determines depth
  // (earlier = further back, later = in front).
  //
  // Addition order is intentional — see depth notes per group.
  // ══════════════════════════════════════════════════════════════════

  // ── Bamboo stand (x: 0–55) — natural west border ─────────────────
  // Three overlapping clusters at staggered y, creating a believable
  // bamboo grove. Not aligned — organic grouping.
  const bA = ctx.nsp(...NA.BAMB_SM);  bA.anchor.set(0.5, 1);  bA.x =  8; bA.y = 614; bA.scale.set(0.50); ysort.addChild(bA)
  const bB = ctx.nsp(...NA.BAMB_MID); bB.anchor.set(0.5, 1);  bB.x = 26; bB.y = 636; bB.scale.set(0.58); ysort.addChild(bB)
  const bC = ctx.nsp(...NA.BAMB_SM);  bC.anchor.set(0.5, 1);  bC.x = 48; bC.y = 658; bC.scale.set(0.52); ysort.addChild(bC)

  // ── Background trees — north boundary (lowest y = furthest back) ──
  // These trees create the sense of a forested north wall without stone.
  // They appear behind everything at y < 610, well above player level.
  const cBg1 = ctx.nsp(...NA.CHERRY_1); cBg1.anchor.set(0.5, 1); cBg1.x = 188; cBg1.y = 598; cBg1.scale.set(0.54); ysort.addChild(cBg1)
  const cBg2 = ctx.nsp(...NA.CHERRY_3); cBg2.anchor.set(0.5, 1); cBg2.x = 284; cBg2.y = 608; cBg2.scale.set(0.48); ysort.addChild(cBg2)

  // ── Rock formations (approach, left side) ─────────────────────────
  const rA = ctx.nsp(...NA.ROCK_MED); rA.anchor.set(0.5, 1); rA.x = 32; rA.y = 692; rA.scale.set(0.38); ysort.addChild(rA)
  const rB = ctx.nsp(...NA.ROCK_SM);  rB.anchor.set(0.5, 1); rB.x = 54; rB.y = 668; rB.scale.set(0.32); ysort.addChild(rB)

  // ── Inner compound buildings (set back: y < GY) ───────────────────
  // Ordered from deepest (lowest y) to shallowest so y-sort places them
  // correctly behind the primary buildings at y = GY.

  // Library 藏書閣 — y=690, appears visible above the training dummies
  const lib   = ctx.bsp(...BA.FAC_B1);   lib.anchor.set(0.5, 1);   lib.x = 228; lib.y = 690;   lib.scale.set(0.72);  ysort.addChild(lib)
  // Tea House 茶室 — inner compound, left of main hall
  const tea   = ctx.bsp(...BA.FAC_B2);   tea.anchor.set(0.5, 1);   tea.x = 386; tea.y = 668;   tea.scale.set(0.70);  ysort.addChild(tea)
  // Dormitory 寢室 — inner compound, right of main hall
  const dorm  = ctx.bsp(...BA.FAC_NARR); dorm.anchor.set(0.5, 1);  dorm.x = 490; dorm.y = 668; dorm.scale.set(0.72); ysort.addChild(dorm)
  // Shrine 靈祠 — farthest back, deepest sacred space. Players who explore
  // north-east will find it beyond the dormitory.
  const shrine = ctx.bsp(...BA.FAC_MED2); shrine.anchor.set(0.5, 1); shrine.x = 530; shrine.y = 626; shrine.scale.set(0.58); ysort.addChild(shrine)

  // ── Cherry trees flanking the gate (y=742–748, behind gate at y=770) ─
  // Set back slightly so the gate appears to stand in front of them.
  // Creates a framing arch of blossom around the entrance.
  // Left tree x=40 — just outside the west pillar. Right x=192 — outside east pillar.
  const cGateL = ctx.nsp(...NA.CHERRY_2); cGateL.anchor.set(0.5, 1); cGateL.x =  40; cGateL.y = 748; cGateL.scale.set(0.56); ysort.addChild(cGateL)
  const cGateR = ctx.nsp(...NA.CHERRY_3); cGateR.anchor.set(0.5, 1); cGateR.x = 198; cGateR.y = 742; cGateR.scale.set(0.50); ysort.addChild(cGateR)

  // ── Primary buildings (y = GY = 770) — main walking line ─────────
  // Guard posts: centred over their stone pillars (left x=78, right x=170).
  // Added BEFORE gate so gate renders on top in the overlap zone.
  const gL  = ctx.bsp(...BA.FAC_MED2); gL.anchor.set(0.5, 1);  gL.x =  78; gL.y = GY; gL.scale.set(0.65);  ysort.addChild(gL)
  const gR  = ctx.bsp(...BA.FAC_MED2); gR.anchor.set(0.5, 1);  gR.x = 170; gR.y = GY; gR.scale.set(0.65);  ysort.addChild(gR)
  // Main Gate 正門 — centred on the gap between pillars (x=124).
  const gate = ctx.bsp(...BA.GATE_SM);  gate.anchor.set(0.5, 1); gate.x = 124; gate.y = GY; gate.scale.set(0.63); ysort.addChild(gate)
  // Main Hall 武德堂 — dominant building, visual anchor of Zone 1
  const hall = ctx.bsp(...BA.FAC_WIDE); hall.anchor.set(0.5, 1); hall.x = 432; hall.y = GY; hall.scale.set(0.88); ysort.addChild(hall)

  // ── Well (back of training area) ──────────────────────────────────
  // Set back at y=720 — appears behind the dummies. Functional prop,
  // not decoration: students drink water between training sessions.
  const well = ctx.psp(...PA.WELL); well.anchor.set(0.5, 1); well.x = 170; well.y = 720; well.scale.set(0.52); ysort.addChild(well)

  // ── Training dummies — three in deliberate formation ──────────────
  // Evenly spaced 38 px apart at y=GY. The gap between them is intentional:
  // a student steps between the dummies to attack each in sequence.
  const d1 = ctx.psp(...PA.DUMMY_1); d1.anchor.set(0.5, 1); d1.x = 178; d1.y = GY; d1.scale.set(0.60); ysort.addChild(d1)
  const d2 = ctx.psp(...PA.DUMMY_2); d2.anchor.set(0.5, 1); d2.x = 216; d2.y = GY; d2.scale.set(0.60); ysort.addChild(d2)
  const d3 = ctx.psp(...PA.DUMMY_3); d3.anchor.set(0.5, 1); d3.x = 254; d3.y = GY; d3.scale.set(0.60); ysort.addChild(d3)

  // ── Stone lanterns flanking main hall entrance ────────────────────
  // Placed at y=GY and added after the hall: they render in front of
  // the hall's lower facade, appearing to stand on the steps.
  const slanL = ctx.psp(...PA.STONE_LAN); slanL.anchor.set(0.5, 1); slanL.x = 382; slanL.y = GY; slanL.scale.set(0.50); ysort.addChild(slanL)
  const slanR = ctx.psp(...PA.STONE_LAN); slanR.anchor.set(0.5, 1); slanR.x = 484; slanR.y = GY; slanR.scale.set(0.50); ysort.addChild(slanR)

  // ── Bonsai meditation garden (east section) ───────────────────────
  // Three bonsais in a composed group — not symmetrical, not scattered.
  // The arrangement reads as a curated garden, not random placement.
  const bn1 = ctx.nsp(...NA.BONSAI_1); bn1.anchor.set(0.5, 1); bn1.x = 455; bn1.y = 752; bn1.scale.set(0.44); ysort.addChild(bn1)
  const bn2 = ctx.nsp(...NA.BONSAI_4); bn2.anchor.set(0.5, 1); bn2.x = 500; bn2.y = 760; bn2.scale.set(0.42); ysort.addChild(bn2)
  const bn3 = ctx.nsp(...NA.BONSAI_2); bn3.anchor.set(0.5, 1); bn3.x = 516; bn3.y = 748; bn3.scale.set(0.45); ysort.addChild(bn3)

  // East cherry — final marker before Zone 2 bamboo forest begins
  const cEast = ctx.nsp(...NA.CHERRY_2); cEast.anchor.set(0.5, 1); cEast.x = 530; cEast.y = 756; cEast.scale.set(0.52); ysort.addChild(cEast)
}
