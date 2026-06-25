import { Flame, Star, BookOpen, User, Package, Sparkles } from 'lucide-react'
import { useGameStore } from '../stores/gameStore'
import { xpProgressInLevel } from '../rpg/levelSystem'
import type { ActivePanel } from '../types'

const TOTAL_MVP_HANZI = 5

export function HUD() {
  const { character, masteredHanzi, setPanel, activePanel, xpMultiplierActive } = useGameStore()

  if (!character) return null

  const xpProg        = xpProgressInLevel(character.xp)
  const masteredCount = masteredHanzi.size
  const hasTalents    = character.talent_points > 0

  const togglePanel = (p: ActivePanel) => setPanel(activePanel === p ? null : p)

  return (
    <>
      {/* ── Top-left: Stats ─────────────────────────────── */}
      <div className="fixed top-4 left-4 z-40 flex flex-col gap-2 pointer-events-none">
        <div className="bg-matsuri-ink/85 backdrop-blur-sm rounded-lg px-4 py-3 text-matsuri-paper min-w-52">
          {/* Name + level */}
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-8 h-8 rounded-full bg-matsuri-imperial flex items-center justify-center text-xs font-display font-bold">
              {character.level}
            </div>
            <div>
              <p className="font-display text-xs tracking-wide leading-none">{character.name}</p>
              <p className="text-[9px] text-matsuri-paper/35 mt-0.5">Nível {character.level} · {character.stat_points > 0 ? <span className="text-matsuri-gold">{character.stat_points} pts livres!</span> : 'Aprendiz'}</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <span className="text-matsuri-gold text-xs">💰</span>
              <span className="text-xs text-matsuri-gold font-semibold">{character.yuan}</span>
            </div>
          </div>

          {/* QI bar */}
          <div className="mb-1.5">
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1">
                <Flame size={9} className="text-matsuri-imperial" />
                <span className="text-[9px] text-matsuri-paper/50 uppercase tracking-widest">Qi</span>
              </div>
              <span className="text-[9px] text-matsuri-paper/40">{character.qi}/100</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-matsuri-imperial rounded-full transition-all duration-700" style={{ width: `${character.qi}%` }} />
            </div>
          </div>

          {/* XP bar */}
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1">
                <Star size={9} className="text-matsuri-gold" />
                <span className="text-[9px] text-matsuri-paper/50 uppercase tracking-widest">Exp</span>
              </div>
              <span className="text-[9px] text-matsuri-paper/40">{xpProg.current}/{xpProg.needed}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-matsuri-gold rounded-full transition-all duration-700" style={{ width: `${xpProg.percent * 100}%` }} />
            </div>
          </div>

          {/* XP multiplier indicator */}
          {xpMultiplierActive > 1 && (
            <div className="mt-2 flex items-center gap-1 text-matsuri-jade">
              <Sparkles size={9} />
              <span className="text-[9px]">XP ×{xpMultiplierActive} ativo!</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Top-right: Mission ─────────────────────────── */}
      <div className="fixed top-4 right-4 z-40 pointer-events-none">
        <div className="bg-matsuri-ink/85 backdrop-blur-sm rounded-lg px-4 py-3 text-matsuri-paper min-w-52">
          <div className="flex items-center gap-1.5 mb-2">
            <BookOpen size={10} className="text-matsuri-gold" />
            <span className="text-[9px] uppercase tracking-widest text-matsuri-gold font-display">Missão Ativa</span>
          </div>
          <p className="text-xs font-body text-matsuri-paper/90 mb-2 leading-snug">
            O Pergaminho dos Números Perdidos
          </p>
          <div className="border-t border-white/10 pt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-matsuri-paper/50">Hanzi cultivados</span>
              <span className="text-[9px] text-matsuri-jade font-bold">{masteredCount}/{TOTAL_MVP_HANZI}</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-matsuri-jade rounded-full transition-all duration-700" style={{ width: `${(masteredCount / TOTAL_MVP_HANZI) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom-right: Action buttons ────────────────── */}
      <div className="fixed bottom-6 right-4 z-40 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={() => togglePanel('character')}
          className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all border-2 ${activePanel === 'character' ? 'bg-matsuri-imperial border-matsuri-gold' : 'bg-matsuri-ink/90 border-white/10 hover:border-matsuri-imperial'}`}
          title="Personagem"
        >
          <User size={16} className="text-matsuri-paper" />
          {character.stat_points > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-matsuri-gold text-matsuri-ink text-[8px] font-bold flex items-center justify-center">
              !
            </span>
          )}
        </button>

        <button
          onClick={() => togglePanel('inventory')}
          className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all border-2 ${activePanel === 'inventory' ? 'bg-matsuri-imperial border-matsuri-gold' : 'bg-matsuri-ink/90 border-white/10 hover:border-matsuri-imperial'}`}
          title="Inventário"
        >
          <Package size={16} className="text-matsuri-paper" />
        </button>

        <button
          onClick={() => togglePanel('talents')}
          className={`relative w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all border-2 ${activePanel === 'talents' ? 'bg-matsuri-imperial border-matsuri-gold' : 'bg-matsuri-ink/90 border-white/10 hover:border-matsuri-imperial'}`}
          title="Talentos"
        >
          <span className="text-base">🌳</span>
          {hasTalents && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-matsuri-gold text-matsuri-ink text-[8px] font-bold flex items-center justify-center">
              {character.talent_points}
            </span>
          )}
        </button>
      </div>

      {/* ── Bottom center: Controls hint ─────────────────── */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <div className="bg-matsuri-ink/60 backdrop-blur-sm rounded-full px-4 py-1.5">
          <p className="text-[9px] text-matsuri-paper/40 tracking-widest uppercase">
            WASD / ↑↓←→ mover · Clique nos orbes · 👤🎒🌳 painéis
          </p>
        </div>
      </div>
    </>
  )
}
