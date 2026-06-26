import { X, Plus, ChevronRight } from 'lucide-react'
import { useGameStore } from '../stores/gameStore'
import { STAT_META, calcDerived, xpProgressInLevel } from '../rpg/levelSystem'
import { calcEquipmentStats, SLOT_LABEL, SLOT_ICON, RARITY_COLOR } from '../rpg/itemData'
import type { StatKey } from '../rpg/levelSystem'
import type { EquipSlot } from '../rpg/itemData'

const SLOTS: EquipSlot[] = ['head', 'body', 'weapon', 'accessory']

export function CharacterPanel() {
  const { character, equipment, setPanel, allocateStat, unequipItem } = useGameStore()
  if (!character) return null

  const derived  = calcDerived(character)
  const eStats   = calcEquipmentStats(equipment)
  const progress = xpProgressInLevel(character.xp)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-matsuri-ink/75 backdrop-blur-sm" onClick={() => setPanel(null)} />

      <div className="relative z-10 w-full max-w-2xl mx-4 bg-matsuri-paper rounded-lg shadow-2xl overflow-hidden border border-matsuri-stone/30">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-matsuri-ink text-matsuri-paper">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-matsuri-imperial flex items-center justify-center font-display font-bold text-sm">
              {character.level}
            </div>
            <div>
              <p className="font-display text-sm tracking-wide">{character.name}</p>
              <p className="text-[10px] text-matsuri-paper/40 uppercase tracking-widest">Aprendiz · HSK 1</p>
            </div>
          </div>
          <button onClick={() => setPanel(null)} className="opacity-40 hover:opacity-100 transition-opacity">
            <X size={16} />
          </button>
        </div>

        {/* XP bar */}
        <div className="px-5 pt-3 pb-1 bg-matsuri-ink/5">
          <div className="flex justify-between text-[10px] text-matsuri-stone mb-1">
            <span className="uppercase tracking-widest">Experiência</span>
            <span>{progress.current.toLocaleString()} / {progress.needed.toLocaleString()} XP</span>
          </div>
          <div className="h-2 bg-matsuri-stone/20 rounded-full overflow-hidden">
            <div className="h-full bg-matsuri-gold rounded-full transition-all duration-700" style={{ width: `${progress.percent * 100}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-0 divide-x divide-matsuri-stone/15">
          {/* Left: Attributes */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-xs uppercase tracking-widest text-matsuri-stone">Atributos</h3>
              {character.stat_points > 0 && (
                <span className="bg-matsuri-imperial text-matsuri-paper text-[10px] px-2 py-0.5 rounded-full">
                  {character.stat_points} pts disponíveis
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              {(Object.keys(STAT_META) as StatKey[]).map((stat) => {
                const meta  = STAT_META[stat]
                const value = character[stat as keyof typeof character] as number
                const bonus = (eStats[stat as keyof typeof eStats] as number | undefined) ?? 0
                return (
                  <div key={stat} className="flex items-center gap-3">
                    <span className="text-lg w-7 text-center">{meta.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-hanzi text-sm text-matsuri-ink">{meta.cn} <span className="text-xs text-matsuri-stone">{meta.label}</span></span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-matsuri-ink text-sm">{value}</span>
                          {bonus > 0 && <span className="text-matsuri-jade text-xs">+{bonus}</span>}
                        </div>
                      </div>
                      <div className="h-1 bg-matsuri-stone/15 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-matsuri-imperial/70 rounded-full" style={{ width: `${Math.min(value / 50, 1) * 100}%` }} />
                      </div>
                    </div>
                    {character.stat_points > 0 && (
                      <button
                        onClick={() => allocateStat(stat)}
                        className="w-6 h-6 rounded-full bg-matsuri-imperial text-matsuri-paper flex items-center justify-center hover:bg-matsuri-imperial/80 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Derived stats */}
            <div className="mt-4 pt-3 border-t border-matsuri-stone/15 grid grid-cols-2 gap-2">
              {[
                { label: 'HP Máx',    value: derived.maxHp  + (eStats.max_hp ?? 0) },
                { label: 'Qi Máx',    value: derived.maxQi },
                { label: 'XP Bônus',  value: `+${Math.round((derived.xpMultiplier - 1 + (eStats.xp_bonus ?? 0)) * 100)}%` },
                { label: 'Crítico',   value: `${(derived.critChance * 100).toFixed(1)}%` },
              ].map((d) => (
                <div key={d.label} className="bg-matsuri-stone/8 rounded p-2 text-center">
                  <div className="text-[10px] text-matsuri-stone uppercase tracking-wide">{d.label}</div>
                  <div className="font-bold text-matsuri-ink text-sm">{d.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Equipment */}
          <div className="p-5">
            <h3 className="font-display text-xs uppercase tracking-widest text-matsuri-stone mb-3">Equipamentos</h3>

            <div className="flex flex-col gap-3">
              {SLOTS.map((slot) => {
                const inv = equipment[slot]
                return (
                  <div key={slot} className={`rounded border-2 p-2.5 flex items-center gap-3 ${inv ? 'border-matsuri-stone/30 bg-white' : 'border-dashed border-matsuri-stone/20 bg-matsuri-stone/5'}`}>
                    <span className="text-xl w-7 text-center">{inv ? inv.item.icon : SLOT_ICON[slot]}</span>
                    <div className="flex-1 min-w-0">
                      {inv ? (
                        <>
                          <p className="text-xs font-semibold text-matsuri-ink truncate">{inv.item.name}</p>
                          <p className="text-[10px]" style={{ color: RARITY_COLOR[inv.item.rarity] }}>{inv.item.name_cn}</p>
                        </>
                      ) : (
                        <p className="text-xs text-matsuri-stone/50 italic">{SLOT_LABEL[slot]} vazio</p>
                      )}
                    </div>
                    {inv ? (
                      <button onClick={() => unequipItem(slot)} className="text-[10px] text-matsuri-stone/50 hover:text-matsuri-imperial transition-colors">
                        Tirar
                      </button>
                    ) : (
                      <ChevronRight size={12} className="text-matsuri-stone/30" />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Equipment stat summary */}
            {Object.keys(eStats).length > 0 && (
              <div className="mt-4 pt-3 border-t border-matsuri-stone/15">
                <p className="text-[10px] text-matsuri-stone uppercase tracking-widest mb-2">Bônus totais do equipamento</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(eStats).map(([k, v]) => v ? (
                    <span key={k} className="text-[10px] bg-matsuri-jade/10 text-matsuri-jade border border-matsuri-jade/20 rounded-full px-2 py-0.5">
                      {k === 'xp_bonus' ? `+${Math.round((v as number)*100)}% XP` : `+${v} ${k}`}
                    </span>
                  ) : null)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer: Yuan */}
        <div className="px-5 py-3 bg-matsuri-ink/5 border-t border-matsuri-stone/15 flex items-center gap-2">
          <span className="text-matsuri-gold text-lg">💰</span>
          <span className="font-bold text-matsuri-ink">{character.yuan.toLocaleString()}</span>
          <span className="text-xs text-matsuri-stone">Yuan</span>
          <span className="ml-auto text-[10px] text-matsuri-stone/40">
            {character.talent_points > 0 && `${character.talent_points} ponto(s) de talento disponíveis`}
          </span>
        </div>
      </div>
    </div>
  )
}
