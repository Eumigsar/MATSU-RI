import { useState } from 'react'
import { X, Lock, Unlock } from 'lucide-react'
import { useGameStore } from '../stores/gameStore'
import { ELEMENT_META, TALENTS_BY_ELEMENT } from '../rpg/talentData'
import type { ElementType, Talent } from '../rpg/talentData'

const ELEMENTS: ElementType[] = ['madeira', 'fogo', 'terra', 'metal', 'agua']

export function TalentTreePanel() {
  const { character, unlockedTalents, setPanel, unlockTalent } = useGameStore()
  const [hovered, setHovered] = useState<Talent | null>(null)

  if (!character) return null

  const canUnlock = (t: Talent) =>
    !unlockedTalents.has(t.id) &&
    character.talent_points >= t.cost &&
    character.level >= t.req_level &&
    (t.tier === 1 || unlockedTalents.has(TALENTS_BY_ELEMENT(t.element)[t.tier - 2]?.id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-matsuri-ink/80 backdrop-blur-sm" onClick={() => setPanel(null)} />

      <div className="relative z-10 w-full max-w-4xl mx-4 bg-[#0D1117] rounded-lg shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="font-display text-matsuri-paper text-sm tracking-widest uppercase">
              Árvore dos Cinco Elementos
            </h2>
            <p className="text-matsuri-paper/30 text-[10px] mt-0.5">五行天賦樹</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="font-bold text-matsuri-gold text-lg">{character.talent_points}</div>
              <div className="text-[9px] text-matsuri-paper/40 uppercase tracking-widest">Pontos</div>
            </div>
            <button onClick={() => setPanel(null)} className="text-matsuri-paper/40 hover:text-matsuri-paper transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-5 gap-4">
            {ELEMENTS.map((el) => {
              const meta   = ELEMENT_META[el]
              const tiers  = TALENTS_BY_ELEMENT(el)
              return (
                <div key={el} className="flex flex-col items-center gap-0">
                  {/* Element header */}
                  <div className="text-center mb-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-hanzi text-2xl mb-1 mx-auto border-2"
                      style={{ backgroundColor: meta.bg, borderColor: meta.color, color: meta.color }}
                    >
                      {meta.cn}
                    </div>
                    <p className="text-[10px] uppercase tracking-widest" style={{ color: meta.color }}>
                      {meta.label}
                    </p>
                  </div>

                  {/* Talent tiers */}
                  {tiers.map((talent, idx) => {
                    const unlocked  = unlockedTalents.has(talent.id)
                    const eligible  = canUnlock(talent)
                    const locked    = !unlocked && !eligible
                    const isHovered = hovered?.id === talent.id

                    return (
                      <div key={talent.id} className="flex flex-col items-center w-full">
                        {/* Connector line */}
                        {idx > 0 && (
                          <div
                            className="w-0.5 h-6"
                            style={{ backgroundColor: unlocked ? meta.color : 'rgba(255,255,255,0.1)' }}
                          />
                        )}

                        {/* Talent node */}
                        <button
                          className={`w-full rounded-lg border-2 p-2.5 text-center transition-all duration-200 ${
                            unlocked   ? 'border-opacity-100 shadow-lg' :
                            eligible   ? 'border-dashed animate-pulse' :
                            'border-white/10 opacity-40'
                          }`}
                          style={{
                            borderColor:      unlocked || eligible ? meta.color : undefined,
                            backgroundColor:  unlocked ? meta.bg : isHovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                            boxShadow:        unlocked ? `0 0 12px ${meta.color}40` : undefined,
                          }}
                          onMouseEnter={() => setHovered(talent)}
                          onMouseLeave={() => setHovered(null)}
                          onClick={() => eligible && unlockTalent(talent.id)}
                          disabled={locked || unlocked}
                        >
                          <div className="text-xl mb-1">{talent.icon}</div>
                          <div className="text-[9px] font-hanzi" style={{ color: unlocked ? meta.color : '#9CA3AF' }}>
                            {talent.name_cn}
                          </div>
                          <div className="text-[8px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            {talent.name}
                          </div>

                          {/* Status icon */}
                          <div className="mt-1.5 flex justify-center">
                            {unlocked ? (
                              <Unlock size={10} style={{ color: meta.color }} />
                            ) : eligible ? (
                              <span className="text-[9px]" style={{ color: meta.color }}>
                                {talent.cost} pt
                              </span>
                            ) : (
                              <Lock size={10} className="text-white/20" />
                            )}
                          </div>

                          {/* Level req */}
                          {!unlocked && talent.req_level > 1 && (
                            <div className="text-[8px] mt-0.5 text-white/20">
                              Nv.{talent.req_level}+
                            </div>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* Hover tooltip */}
        {hovered && (
          <div className="border-t border-white/10 px-6 py-3 bg-white/5">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{hovered.icon}</span>
              <div>
                <p className="font-hanzi text-sm text-matsuri-paper">
                  {hovered.name} <span className="text-matsuri-stone text-xs ml-1">{hovered.name_cn}</span>
                </p>
                <p className="text-xs text-matsuri-paper/60 mt-0.5">{hovered.description}</p>
                <div className="flex gap-3 mt-1">
                  <span className="text-[10px] text-matsuri-gold">Custo: {hovered.cost} ponto(s)</span>
                  <span className="text-[10px] text-matsuri-paper/30">Nível mínimo: {hovered.req_level}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
