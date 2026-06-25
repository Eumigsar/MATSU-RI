import { Flame, Star, Scroll, BookOpen } from 'lucide-react'
import { useGameStore } from '../stores/gameStore'

const TOTAL_MVP_HANZI = 5

export function HUD() {
  const { character, masteredHanzi } = useGameStore()

  if (!character) return null

  const xpToNextLevel = character.level * 200
  const xpProgress = Math.min((character.xp % xpToNextLevel) / xpToNextLevel, 1)
  const qiPercent = character.qi / 100
  const masteredCount = masteredHanzi.size

  return (
    <>
      {/* Top-left: Player stats */}
      <div className="fixed top-4 left-4 z-40 flex flex-col gap-2 pointer-events-none">
        <div className="bg-matsuri-ink/80 backdrop-blur-sm rounded-lg px-4 py-3 text-matsuri-paper min-w-48">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-matsuri-imperial flex items-center justify-center text-xs font-display font-bold">
              {character.level}
            </div>
            <span className="font-display text-sm tracking-wide">{character.name}</span>
          </div>

          {/* QI bar */}
          <div className="mb-1.5">
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1">
                <Flame size={10} className="text-matsuri-imperial" />
                <span className="text-[10px] text-matsuri-paper/60 uppercase tracking-widest">Qi</span>
              </div>
              <span className="text-[10px] text-matsuri-paper/60">{character.qi}/100</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-matsuri-imperial rounded-full transition-all duration-700"
                style={{ width: `${qiPercent * 100}%` }}
              />
            </div>
          </div>

          {/* XP bar */}
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1">
                <Star size={10} className="text-matsuri-gold" />
                <span className="text-[10px] text-matsuri-paper/60 uppercase tracking-widest">Exp</span>
              </div>
              <span className="text-[10px] text-matsuri-paper/60">{character.xp}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-matsuri-gold rounded-full transition-all duration-700"
                style={{ width: `${xpProgress * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Top-right: Mission */}
      <div className="fixed top-4 right-4 z-40 pointer-events-none">
        <div className="bg-matsuri-ink/80 backdrop-blur-sm rounded-lg px-4 py-3 text-matsuri-paper min-w-52">
          <div className="flex items-center gap-2 mb-2">
            <Scroll size={12} className="text-matsuri-gold" />
            <span className="text-[10px] uppercase tracking-widest text-matsuri-gold font-display">
              Missão Ativa
            </span>
          </div>
          <p className="text-xs font-body text-matsuri-paper/90 mb-2 leading-snug">
            O Pergaminho dos Números Perdidos
          </p>
          <div className="border-t border-white/10 pt-2">
            <div className="flex items-center gap-2">
              <BookOpen size={10} className="text-matsuri-jade" />
              <span className="text-[10px] text-matsuri-paper/60">
                Hanzi cultivados:
              </span>
              <span className="text-[10px] text-matsuri-jade font-bold ml-auto">
                {masteredCount}/{TOTAL_MVP_HANZI}
              </span>
            </div>
            <div className="h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-matsuri-jade rounded-full transition-all duration-700"
                style={{ width: `${(masteredCount / TOTAL_MVP_HANZI) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Controls hint */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <div className="bg-matsuri-ink/60 backdrop-blur-sm rounded-full px-4 py-1.5">
          <p className="text-[10px] text-matsuri-paper/50 tracking-widest uppercase">
            WASD / ↑↓←→ para mover · Clique nos orbes para treinar
          </p>
        </div>
      </div>
    </>
  )
}
