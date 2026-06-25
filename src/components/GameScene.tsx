import { useEffect, useRef, useState } from 'react'
import * as PIXI from 'pixi.js'
import { useGameStore } from '../stores/gameStore'
import { TONE_COLORS } from '../types'
import type { HanziData } from '../types'

const W = 900
const H = 560

type OrbData = HanziData & { wx: number; wy: number }

const ORBS: OrbData[] = [
  { hanzi: '一', pinyin: 'yī',  pinyin_base: 'yi',  tone: 1, meaning_pt: 'um',     hsk_level: 1, stroke_count: 1, wx: 130, wy: 190, etymology: 'Um único traço horizontal — simples como o início de toda jornada no Caminho.' },
  { hanzi: '二', pinyin: 'èr',  pinyin_base: 'er',  tone: 2, meaning_pt: 'dois',   hsk_level: 1, stroke_count: 2, wx: 200, wy: 380, etymology: 'Dois traços paralelos: o Céu acima, a Terra abaixo — os dois pilares do cosmos.' },
  { hanzi: '三', pinyin: 'sān', pinyin_base: 'san', tone: 1, meaning_pt: 'três',   hsk_level: 1, stroke_count: 3, wx: 450, wy: 210, etymology: 'Três traços: Céu, Humanidade e Terra — a sagrada tríade do Tao.' },
  { hanzi: '四', pinyin: 'sì',  pinyin_base: 'si',  tone: 4, meaning_pt: 'quatro', hsk_level: 1, stroke_count: 5, wx: 760, wy: 175, etymology: 'Uma boca dentro de um quadrado: os quatro cantos do mundo mundano.' },
  { hanzi: '五', pinyin: 'wǔ',  pinyin_base: 'wu',  tone: 3, meaning_pt: 'cinco',  hsk_level: 1, stroke_count: 4, wx: 720, wy: 375, etymology: 'Os Cinco Elementos — Madeira, Fogo, Terra, Metal e Água — em equilíbrio.' },
]

const ZONES = [
  { x: 0,   w: 280, label: '練武場',   sublabel: 'Pátio de Treinamento', color: 0xE8D5A3, accent: 0xBF8C40 },
  { x: 280, w: 340, label: '少林石階', sublabel: 'Escadaria de Shaolin', color: 0xCFCBC3, accent: 0x7A6D60 },
  { x: 620, w: 280, label: '茶館',     sublabel: 'Casa de Chá',          color: 0xE8BBA3, accent: 0xAA5533 },
]

function hexFrom(cssHex: string): number {
  return parseInt(cssHex.replace('#', '0x'), 16)
}

export function GameScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const openLearningRef = useRef(useGameStore.getState().openLearning)
  const masteredRef = useRef(useGameStore.getState().masteredHanzi)
  const [npcText, setNpcText] = useState<string | null>(null)

  // Keep refs in sync without triggering effect re-runs
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
    let player: PIXI.Graphics
    let playerShadow: PIXI.Graphics

    const init = async () => {
      app = new PIXI.Application()
      await app.init({ width: W, height: H, background: 0xF5F2E9, antialias: true })

      if (!containerRef.current || destroyed) return
      containerRef.current.appendChild(app.canvas as HTMLCanvasElement)

      // ── Background zones ──────────────────────────────────────────────
      for (const z of ZONES) {
        const bg = new PIXI.Graphics()
        bg.rect(z.x, 0, z.w, H).fill({ color: z.color, alpha: 0.95 })
        app.stage.addChild(bg)

        const cnLbl = new PIXI.Text({
          text: z.label,
          style: { fontSize: 20, fill: z.accent, fontFamily: '"Noto Serif SC", serif', fontWeight: '700' },
        })
        cnLbl.anchor.set(0.5, 0)
        cnLbl.x = z.x + z.w / 2
        cnLbl.y = 14
        app.stage.addChild(cnLbl)

        const ptLbl = new PIXI.Text({
          text: z.sublabel,
          style: { fontSize: 9, fill: z.accent, fontFamily: 'Georgia, serif' },
        })
        ptLbl.anchor.set(0.5, 0)
        ptLbl.x = z.x + z.w / 2
        ptLbl.y = 40
        ptLbl.alpha = 0.65
        app.stage.addChild(ptLbl)
      }

      // ── Zone dividers ─────────────────────────────────────────────────
      ;[280, 620].forEach((dx) => {
        const div = new PIXI.Graphics()
        div.rect(dx - 1, 0, 2, H).fill({ color: 0x8B6914, alpha: 0.35 })
        app.stage.addChild(div)
      })

      // ── Ground path ───────────────────────────────────────────────────
      const path = new PIXI.Graphics()
      path.rect(0, H - 70, W, 70).fill({ color: 0xC4A868, alpha: 0.22 })
      app.stage.addChild(path)

      // ── NPC: Sifu Liang ───────────────────────────────────────────────
      const npc = new PIXI.Container()
      npc.x = 450
      npc.y = 95
      npc.eventMode = 'static'
      npc.cursor = 'pointer'

      // Robe
      const robe = new PIXI.Graphics()
      robe.rect(-13, -26, 26, 52).fill({ color: 0x1A1A1A, alpha: 0.9 })
      robe.rect(-13, -26, 26, 52).stroke({ color: 0xC9A84C, width: 1.5 })
      npc.addChild(robe)

      // Head
      const head = new PIXI.Graphics()
      head.circle(0, -40, 15).fill({ color: 0xD4A574 })
      head.circle(0, -40, 15).stroke({ color: 0x8B6914, width: 1.5 })
      npc.addChild(head)

      // Name label
      const npcName = new PIXI.Text({
        text: 'Sifu Liang',
        style: { fontSize: 9, fill: '#C9A84C', fontFamily: 'Georgia, serif' },
      })
      npcName.anchor.set(0.5, 0)
      npcName.y = 32
      npc.addChild(npcName)

      // Hover glow
      const npcGlow = new PIXI.Graphics()
      npcGlow.circle(0, -10, 36).fill({ color: 0xC9A84C, alpha: 0 })
      npc.addChild(npcGlow)

      npc.on('pointerover', () => { npcGlow.alpha = 0.08 })
      npc.on('pointerout',  () => { npcGlow.alpha = 0 })
      npc.on('pointerdown', () => {
        setNpcText('Discípulo... os pergaminhos dos números aguardam. Encontre os cinco orbes de Hanzi espalhados por esta vila e grave seus segredos em seu coração. Apenas o cultivo verdadeiro desperta o Qi interior.')
      })
      app.stage.addChild(npc)

      // NPC float
      let npcT = 0
      app.ticker.add((tk) => {
        npcT += tk.deltaTime * 0.02
        npc.y = 95 + Math.sin(npcT) * 4
      })

      // ── Hanzi Orbs ────────────────────────────────────────────────────
      for (let i = 0; i < ORBS.length; i++) {
        const h = ORBS[i]
        const tColorHex = hexFrom(TONE_COLORS[h.tone].hex)
        const baseY = h.wy

        const orb = new PIXI.Container()
        orb.x = h.wx
        orb.y = baseY
        orb.eventMode = 'static'
        orb.cursor = 'pointer'

        // Outer glow ring
        const glow = new PIXI.Graphics()
        glow.circle(0, 0, 40).fill({ color: tColorHex, alpha: 0.12 })
        orb.addChild(glow)

        // Circle body
        const circle = new PIXI.Graphics()
        circle.circle(0, 0, 28).fill({ color: tColorHex, alpha: 0.88 })
        circle.circle(0, 0, 28).stroke({ color: 0xFFFFFF, width: 2, alpha: 0.55 })
        orb.addChild(circle)

        // Hanzi character
        const charText = new PIXI.Text({
          text: h.hanzi,
          style: { fontSize: 28, fill: '#FFFFFF', fontFamily: '"Noto Serif SC", serif', fontWeight: '700' },
        })
        charText.anchor.set(0.5)
        orb.addChild(charText)

        // Pinyin (below orb)
        const pinText = new PIXI.Text({
          text: h.pinyin,
          style: { fontSize: 10, fill: '#FFFFFF', fontFamily: 'Georgia, serif' },
        })
        pinText.anchor.set(0.5, 0)
        pinText.y = 33
        pinText.alpha = 0.75
        orb.addChild(pinText)

        // Mastery star (hidden initially)
        const star = new PIXI.Text({
          text: '★',
          style: { fontSize: 14, fill: '#C9A84C' },
        })
        star.anchor.set(0.5)
        star.x = 22
        star.y = -22
        star.visible = false
        orb.addChild(star)

        // Animate float + mastery check
        const phase = (i / ORBS.length) * Math.PI * 2
        let t = phase
        app.ticker.add((tk) => {
          t += tk.deltaTime * 0.024
          orb.y = baseY + Math.sin(t) * 7
          glow.alpha = 0.1 + Math.abs(Math.sin(t * 0.6)) * 0.1
          star.visible = masteredRef.current.has(h.hanzi)
        })

        orb.on('pointerover', () => { orb.scale.set(1.1) })
        orb.on('pointerout',  () => { orb.scale.set(1.0) })
        orb.on('pointerdown', () => { openLearningRef.current(h) })

        app.stage.addChild(orb)
      }

      // ── Player ────────────────────────────────────────────────────────
      playerShadow = new PIXI.Graphics()
      playerShadow.ellipse(0, 0, 14, 5).fill({ color: 0x000000, alpha: 0.15 })
      playerShadow.x = 450
      playerShadow.y = 318
      app.stage.addChild(playerShadow)

      player = new PIXI.Graphics()
      player.circle(0, 0, 13).fill({ color: 0xAA0000 })
      player.circle(0, 0, 13).stroke({ color: 0xFFFFFF, width: 2.5 })
      player.circle(0, -4, 4).fill({ color: 0xFFFFFF, alpha: 0.8 })
      player.x = 450
      player.y = 300
      app.stage.addChild(player)

      // ── Movement loop ─────────────────────────────────────────────────
      app.ticker.add((tk) => {
        const spd = 2.8 * tk.deltaTime
        if (keys['ArrowUp']    || keys['w'] || keys['W']) player.y -= spd
        if (keys['ArrowDown']  || keys['s'] || keys['S']) player.y += spd
        if (keys['ArrowLeft']  || keys['a'] || keys['A']) player.x -= spd
        if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x += spd
        player.x = Math.max(16, Math.min(W - 16, player.x))
        player.y = Math.max(16, Math.min(H - 16, player.y))
        playerShadow.x = player.x
        playerShadow.y = player.y + 15
      })
    }

    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => { keys[e.key] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    init()

    return () => {
      destroyed = true
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      try { app?.destroy(true) } catch (_) { /* ignore double-destroy */ }
    }
  }, [])

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#0D0D0D] overflow-hidden">
      <div ref={containerRef} />

      {/* NPC dialogue bubble */}
      {npcText && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4">
          <div
            className="bg-matsuri-ink/92 border border-matsuri-gold/40 rounded-lg p-4 cursor-pointer shadow-2xl"
            onClick={() => setNpcText(null)}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-matsuri-gold" />
              <span className="text-matsuri-gold font-display text-xs tracking-widest uppercase">
                Sifu Liang
              </span>
            </div>
            <p className="text-matsuri-paper text-sm leading-relaxed font-body">
              {npcText}
            </p>
            <p className="text-matsuri-paper/25 text-[10px] mt-2 text-right">
              Clique para continuar
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
