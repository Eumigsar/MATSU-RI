import { useEffect, useRef, useState } from 'react'
import * as PIXI from 'pixi.js'
import { useGameStore } from '../stores/gameStore'
import { TONE_COLORS } from '../types'
import type { HanziData } from '../types'
import { W, H, WW, WH, GY, K } from '../world/constants'
import { RenderPipeline } from '../engine/RenderPipeline'
import { AtlasRegistry, OA } from '../engine/AtlasRegistry'
import { CharacterRenderer } from '../engine/CharacterRenderer'
import { AnimationController } from '../engine/AnimationController'
import type { Direction } from '../engine/AnimationController'
import { buildSky, buildMountains, buildWorld } from '../world/buildWorld'
import { moveInput, DEAD_ZONE, RUN_THRESHOLD, RUN_SPEED_MULT } from '../input/InputState'
import { MobileControls } from '../input/MobileControls'

// ─────────────────────────────────────────────────────────────────────────────
// GameScene — orchestrates PIXI app, loads assets, places entities.
// World content (zones, sky, mountains) lives in src/world/.
// Render layer management lives in src/engine/RenderPipeline.ts.
// ─────────────────────────────────────────────────────────────────────────────

type OrbData = HanziData & { wx: number; wy: number }

const ORBS: OrbData[] = [
  { hanzi: '一', pinyin: 'yī',  pinyin_base: 'yi',  tone: 1, meaning_pt: 'um',     hsk_level: 1, stroke_count: 1, wx: 350,  wy: 790,
    etymology: 'Um único traço horizontal — o início de toda jornada.' },
  { hanzi: '二', pinyin: 'èr',  pinyin_base: 'er',  tone: 2, meaning_pt: 'dois',   hsk_level: 1, stroke_count: 2, wx: 870,  wy: 750,
    etymology: 'Dois traços: Céu acima, Terra abaixo.' },
  { hanzi: '三', pinyin: 'sān', pinyin_base: 'san', tone: 1, meaning_pt: 'três',   hsk_level: 1, stroke_count: 3, wx: 1450, wy: 780,
    etymology: 'Três traços: Céu, Humanidade e Terra.' },
  { hanzi: '四', pinyin: 'sì',  pinyin_base: 'si',  tone: 4, meaning_pt: 'quatro', hsk_level: 1, stroke_count: 5, wx: 2080, wy: 680,
    etymology: 'Uma boca dentro de um quadrado: os quatro cantos do mundo.' },
  { hanzi: '五', pinyin: 'wǔ',  pinyin_base: 'wu',  tone: 3, meaning_pt: 'cinco',  hsk_level: 1, stroke_count: 4, wx: 2510, wy: 770,
    etymology: 'Os Cinco Elementos em equilíbrio.' },
]

export function GameScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const openLearningRef = useRef(useGameStore.getState().openLearning)
  const masteredRef    = useRef(useGameStore.getState().masteredHanzi)
  const [npcText, setNpcText] = useState<string | null>(null)

  useEffect(() => {
    return useGameStore.subscribe((s) => {
      openLearningRef.current = s.openLearning
      masteredRef.current     = s.masteredHanzi
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

      // ── Atlas loading ──────────────────────────────────────────
      const registry = new AtlasRegistry()
      await registry.load()
      const ctx = registry.buildCtx()

      const charRenderer = await CharacterRenderer.load()
      const dragonTex = await AtlasRegistry.loadWalkTex('/assets/characters/xiao_long_paper_dragon_float.png')

      // ── Render pipeline ────────────────────────────────────────
      const pipeline = new RenderPipeline(app.stage)
      const { sky: skyLay, ysort: ysortLay, particles: partLay } = pipeline.layers

      // ── Build world ────────────────────────────────────────────
      buildSky(skyLay, ctx)
      buildMountains(pipeline.layers.mountains)
      buildWorld(pipeline.layers, ctx)

      // ── NPC Sifu Liang ─────────────────────────────────────────
      const npc = new PIXI.Container()
      npc.x = 290; npc.y = GY
      npc.eventMode = 'static'; npc.cursor = 'pointer'
      charRenderer.render(npc, 'r0_c1', 'idle', 'down', 0, 0, 0)
      const npcLbl = new PIXI.Text({ text: '師父 Liang', style: { fontSize: 9, fill: '#C9A84C', fontFamily: 'Georgia,serif' } })
      npcLbl.anchor.set(0.5, 0); npcLbl.y = 4
      npc.addChild(npcLbl)
      npc.on('pointerdown', () => setNpcText('Discípulo... os pergaminhos dos números aguardam. Encontre os cinco orbes de Hanzi espalhados por este mundo — da Academia até o Templo Antigo. Apenas o cultivo verdadeiro desperta o Qi interior.'))
      ysortLay.addChild(npc)

      // ── Wandering NPCs ─────────────────────────────────────────
      const WALKER_IDS = ['r0_c2', 'r0_c3', 'r0_c4', 'r0_c5', 'r1_c0', 'r1_c1']
      interface WalkNPC {
        cont: PIXI.Container; dir: number; spd: number; min: number; max: number; t: number
        ctrl: AnimationController; charId: string
      }
      const walkers: WalkNPC[] = []
      const npcZones = [
        { x: 230,  min: 130,  max: 420  },
        { x: 1180, min: 1140, max: 1280 },
        { x: 1350, min: 1280, max: 1470 },
        { x: 1420, min: 1340, max: 1560 },
        { x: 1500, min: 1380, max: 1580 },
        { x: 2380, min: 2290, max: 2530 },
      ]
      npcZones.forEach((z, i) => {
        const wc = new PIXI.Container()
        wc.x = z.x; wc.y = GY
        const charId = WALKER_IDS[i % WALKER_IDS.length]
        const ctrl = new AnimationController(charRenderer.getAnimations(charId))
        const initDir: Direction = i % 2 === 0 ? 'right' : 'left'
        ctrl.setState('walk', initDir)
        ysortLay.addChild(wc)
        walkers.push({ cont: wc, dir: i % 2 === 0 ? 1 : -1, spd: 0.5 + Math.random() * 0.4, min: z.min, max: z.max, t: Math.random() * 200, ctrl, charId })
      })

      // ── Orbs ───────────────────────────────────────────────────
      for (let i = 0; i < ORBS.length; i++) {
        const h = ORBS[i]
        const tColorHex = parseInt(TONE_COLORS[h.tone].hex.replace('#', '0x'), 16)
        const baseY = h.wy
        const orb = new PIXI.Container()
        orb.x = h.wx; orb.y = baseY
        orb.eventMode = 'static'; orb.cursor = 'pointer'

        const glow = new PIXI.Graphics()
        glow.circle(0, 0, 40).fill({ color: tColorHex, alpha: 0.15 })

        const lanternSpr = ctx.tsp(353, 393, 58, 140)
        lanternSpr.anchor.set(0.5, 0.5)
        lanternSpr.scale.set(0.58)

        const charText = new PIXI.Text({ text: h.hanzi, style: { fontSize: 22, fill: '#FFF5D5', fontFamily: '"Noto Serif SC",serif', fontWeight: '700' } })
        charText.anchor.set(0.5); charText.y = -62

        const pinText = new PIXI.Text({ text: h.pinyin, style: { fontSize: 9, fill: '#FFE8B0', fontFamily: 'Georgia,serif' } })
        pinText.anchor.set(0.5, 0); pinText.y = -44; pinText.alpha = 0.9

        const star = new PIXI.Text({ text: '★', style: { fontSize: 14, fill: '#C9A84C' } })
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
      }

      // ── Dragon (viewport-fixed, behind world) ──────────────────
      const dragonFrames = [0, 1, 2, 3].map(col =>
        new PIXI.Texture({ source: dragonTex.source, frame: new PIXI.Rectangle(col * 32, 0, 32, 32) })
      )
      const dragonSpr = new PIXI.AnimatedSprite(dragonFrames)
      dragonSpr.anchor.set(0.5, 0.5); dragonSpr.scale.set(3.8); dragonSpr.animationSpeed = 0.09; dragonSpr.play()
      dragonSpr.x = 700; dragonSpr.y = Math.round(H * 0.42)
      skyLay.addChild(dragonSpr)

      // ── Player ─────────────────────────────────────────────────
      const playerShadow = new PIXI.Graphics()
      playerShadow.ellipse(0, 0, 20, 7).fill({ color: 0x000000, alpha: 0.18 })

      let playerX = 210, playerY = GY
      playerShadow.x = 210; playerShadow.y = GY + 5
      ysortLay.addChild(playerShadow)
      const playerCtrl = new AnimationController(charRenderer.getAnimations('r0_c0'))

      // ── Falling leaves ─────────────────────────────────────────
      interface Leaf { g: PIXI.Sprite; x: number; y: number; vx: number; vy: number; rot: number }
      const leafAtlasCoords = [OA.PETAL_HEAP, OA.GOLD_HEAP]
      const leaves: Leaf[] = []
      for (let i = 0; i < 40; i++) {
        const coord = leafAtlasCoords[i % leafAtlasCoords.length]
        const lg = ctx.osp(coord[0], coord[1], coord[2], coord[3])
        lg.anchor.set(0.5, 0.5)
        lg.scale.set(0.055 + Math.random() * 0.025)
        lg.alpha = 0.55 + Math.random() * 0.30
        const lx = Math.random() * WW, ly = 580 + Math.random() * 200
        lg.x = lx; lg.y = ly
        partLay.addChild(lg)
        leaves.push({ g: lg, x: lx, y: ly, vx: (Math.random() - 0.5) * 0.8, vy: 0.4 + Math.random() * 0.6, rot: Math.random() * Math.PI * 2 })
      }

      // ── Smoke emitters ─────────────────────────────────────────
      interface Smoke { g: PIXI.Graphics; ox: number; oy: number; life: number; max: number; phase: number }
      const smokeEmitters = [
        { ox: 185,  oy: GY - 240 }, { ox: 1155, oy: GY - 200 }, { ox: 1440, oy: GY - 60 },
        { ox: 2375, oy: GY - 260 }, { ox: 2495, oy: GY - 55  },
      ]
      const smokes: Smoke[] = []
      smokeEmitters.forEach((em) => {
        for (let i = 0; i < 5; i++) {
          const sg = new PIXI.Graphics()
          const life = Math.random() * 80
          sg.circle(0, 0, 8 + Math.random() * 6).fill({ color: 0xDDDDE0, alpha: 0.18 })
          sg.x = em.ox + (Math.random() - 0.5) * 8
          sg.y = em.oy - life * 1.2
          sg.alpha = Math.max(0, 0.3 - life / 80 * 0.3)
          sg.scale.set(0.5 + life / 80 * 0.8)
          partLay.addChild(sg)
          smokes.push({ g: sg, ox: em.ox, oy: em.oy, life, max: 80 + Math.random() * 40, phase: Math.random() * Math.PI * 2 })
        }
      })

      // ── Birds ──────────────────────────────────────────────────
      interface Bird { g: PIXI.Graphics; x: number; y: number; vx: number; vy: number; flap: number }
      const birds: Bird[] = []
      for (let i = 0; i < 6; i++) {
        const bg2 = new PIXI.Graphics()
        bg2.poly([-8, 0, 0, -4, 8, 0]).fill({ color: 0x333344, alpha: 0.6 })
        bg2.x = Math.random() * WW; bg2.y = 200 + Math.random() * 150
        partLay.addChild(bg2)
        birds.push({ g: bg2, x: bg2.x, y: bg2.y, vx: 1 + Math.random() * 1.5, vy: (Math.random() - 0.5) * 0.3, flap: Math.random() * Math.PI * 2 })
      }

      // ── Water shimmer ──────────────────────────────────────────
      const waterGfx: PIXI.Graphics[] = []
      const waterAreas = [
        { x: 724,  y: 604,      w: 58,  h: 296 },
        { x: 1508, y: GY - 2,   w: 104, h: 64  },
        { x: 1916, y: GY - 117, w: 50,  h: 30  },
      ]
      waterAreas.forEach(() => {
        const wg2 = new PIXI.Graphics(); partLay.addChild(wg2); waterGfx.push(wg2)
      })

      // ── Camera state ────────────────────────────────────────────
      let camX = 0, camY = 0
      let dragonWX = 700
      const targetCam = { x: 0, y: 0 }

      // ── Main ticker ────────────────────────────────────────────
      let t = 0
      app.ticker.add((tk) => {
        t += tk.deltaTime
        const spd = 2.8 * tk.deltaTime

        // ── Input resolution: joystick takes priority over keyboard ──────────
        let mx: number, my: number, speedMult: number

        if (moveInput.magnitude > DEAD_ZONE) {
          // Analog joystick — variable speed; past RUN_THRESHOLD = running
          mx        = moveInput.dx
          my        = moveInput.dy
          speedMult = moveInput.magnitude >= RUN_THRESHOLD
            ? RUN_SPEED_MULT
            : moveInput.magnitude  // walk proportional to push distance
        } else {
          // Digital keyboard — always full speed
          const kx = (keys['ArrowLeft'] || keys['a'] || keys['A']) ? -1 : (keys['ArrowRight'] || keys['d'] || keys['D']) ? 1 : 0
          const ky = (keys['ArrowUp']   || keys['w'] || keys['W']) ? -1 : (keys['ArrowDown']  || keys['s'] || keys['S']) ? 1 : 0
          mx = kx; my = ky
          speedMult = (kx !== 0 || ky !== 0) ? 1.0 : 0
        }

        // Player movement — controller auto-switches idle ↔ walk ↔ run
        const moving = speedMult > 0
        if (moving) {
          playerX += mx * spd * speedMult
          playerY += my * spd * speedMult
          const dir: Direction = (Math.abs(my) >= Math.abs(mx)) ? (my > 0 ? 'down' : 'up') : (mx > 0 ? 'right' : 'left')
          playerCtrl.setState(speedMult >= RUN_SPEED_MULT ? 'run' : 'walk', dir)
        } else {
          playerCtrl.setState('idle')
        }
        playerCtrl.update(tk.deltaTime)
        playerX = Math.max(16, Math.min(WW - 16, playerX))
        playerY = Math.max(520, Math.min(WH - 16, playerY))
        playerShadow.x = playerX + 4
        playerShadow.y = playerY + 5
        charRenderer.render(ysortLay, 'r0_c0', playerCtrl.animation, playerCtrl.direction, playerCtrl.frameIndex, playerX, playerY)

        // Camera smooth follow
        targetCam.x = playerX - W / 2
        targetCam.y = playerY - H / 2 - 60
        camX += (targetCam.x - camX) * 0.1
        camY += (targetCam.y - camY) * 0.1
        camX = Math.max(0, Math.min(WW - W, camX))
        camY = Math.max(0, Math.min(WH - H, camY))

        // World scroll + parallax + Y-sort (all in one pipeline call)
        pipeline.update(camX, camY)

        // NPC float
        npc.y = GY + Math.sin(t * 0.02) * 3

        // Walking NPCs
        walkers.forEach((w) => {
          w.t += tk.deltaTime
          w.cont.x += w.dir * w.spd * tk.deltaTime
          const newDir = w.cont.x > w.max ? -1 : w.cont.x < w.min ? 1 : w.dir
          if (newDir !== w.dir) w.dir = newDir
          const wDir: Direction = w.dir > 0 ? 'right' : 'left'
          w.ctrl.setState('walk', wDir)
          w.ctrl.update(tk.deltaTime)
          w.cont.y = GY + Math.abs(Math.sin(w.t * 0.15)) * 3
          charRenderer.render(w.cont, w.charId, w.ctrl.animation, w.ctrl.direction, w.ctrl.frameIndex, 0, 0)
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
          if (s.life > s.max) { s.life = 0; s.g.x = s.ox + (Math.random() - 0.5) * 10; s.g.y = s.oy }
          s.g.x += Math.sin(t * 0.03 + s.phase) * 0.2
          s.g.y = s.oy - s.life * 1.4
          s.g.alpha = Math.max(0, 0.28 - (s.life / s.max) * 0.28)
          s.g.scale.set(0.4 + (s.life / s.max) * 0.9)
        })

        // Dragon ambient flight — loops across full world width
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
          for (let i = 0; i < 4; i++) {
            const wy2 = wa.y + wa.h * (0.2 + i * 0.2) + Math.sin(t * 0.06 + i * 0.8) * 3
            wg2.rect(wa.x + wa.w * 0.06, wy2, wa.w * 0.88, 2).fill({ color: K.wL, alpha: 0.25 + Math.sin(t * 0.08 + i) * 0.12 })
          }
        })
      })

      const onKeyDown = (e: KeyboardEvent) => {
        keys[e.key] = true
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault()
      }
      const onKeyUp = (e: KeyboardEvent) => { keys[e.key] = false }
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault()
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
    <div
      className="relative w-full h-full flex items-center justify-center bg-[#1A2030] overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      <div ref={containerRef} />

      {/* Mobile virtual joystick + action buttons */}
      <MobileControls />

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
