import { useState } from 'react'
import { X, Package } from 'lucide-react'
import { useGameStore } from '../stores/gameStore'
import { RARITY_COLOR, RARITY_LABEL, SLOT_LABEL, SLOT_ICON } from '../rpg/itemData'
import type { InventoryItem, EquipSlot } from '../rpg/itemData'

const SLOTS: EquipSlot[] = ['head', 'body', 'weapon', 'accessory']

export function InventoryPanel() {
  const { inventory, equipment, character, setPanel, equipItem, unequipItem, useConsumable } = useGameStore()
  const [selected, setSelected] = useState<InventoryItem | null>(null)

  if (!character) return null

  const unequipped  = inventory.filter((i) => !i.equipped)

  const canEquip = (inv: InventoryItem) =>
    inv.item.type === 'equipment' && (inv.item.req_level ?? 1) <= character.level

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-matsuri-ink/75 backdrop-blur-sm" onClick={() => setPanel(null)} />

      <div className="relative z-10 w-full max-w-2xl mx-4 bg-matsuri-paper rounded-lg shadow-2xl overflow-hidden border border-matsuri-stone/30 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-matsuri-ink text-matsuri-paper shrink-0">
          <div className="flex items-center gap-2">
            <Package size={14} />
            <span className="font-display text-sm tracking-wide">Inventário</span>
            <span className="text-matsuri-paper/40 text-xs">({unequipped.length} itens)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-matsuri-gold text-sm">💰 {character.yuan.toLocaleString()}</span>
            <button onClick={() => setPanel(null)} className="opacity-40 hover:opacity-100 transition-opacity">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Equipment slots */}
        <div className="px-4 py-3 bg-matsuri-ink/8 border-b border-matsuri-stone/15 shrink-0">
          <p className="text-[10px] text-matsuri-stone uppercase tracking-widest mb-2">Equipado</p>
          <div className="grid grid-cols-4 gap-2">
            {SLOTS.map((slot) => {
              const inv = equipment[slot]
              return (
                <button
                  key={slot}
                  onClick={() => inv ? setSelected(inv) : undefined}
                  className={`rounded border-2 p-2 text-center transition-colors ${inv ? 'border-matsuri-stone/40 bg-white hover:border-matsuri-imperial' : 'border-dashed border-matsuri-stone/20 bg-matsuri-stone/5'}`}
                >
                  <div className="text-xl mb-0.5">{inv ? inv.item.icon : SLOT_ICON[slot]}</div>
                  <div className="text-[9px] text-matsuri-stone truncate">
                    {inv ? inv.item.name_cn : SLOT_LABEL[slot]}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Inventory grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {unequipped.length === 0 ? (
              <div className="text-center py-8 text-matsuri-stone/40 text-sm">
                <p className="text-3xl mb-2">📦</p>
                <p>Inventário vazio</p>
                <p className="text-xs mt-1">Complete missões para ganhar itens</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {unequipped.map((inv) => (
                  <button
                    key={inv.inventoryId}
                    onClick={() => setSelected(inv === selected ? null : inv)}
                    className={`rounded border-2 p-2 text-center transition-all ${selected?.inventoryId === inv.inventoryId ? 'border-matsuri-imperial bg-matsuri-imperial/5' : 'border-matsuri-stone/20 bg-white hover:border-matsuri-stone/50'}`}
                  >
                    <div className="text-2xl mb-1">{inv.item.icon}</div>
                    <div className="text-[9px] text-matsuri-ink truncate leading-tight">{inv.item.name_cn}</div>
                    <div className="text-[8px] mt-0.5" style={{ color: RARITY_COLOR[inv.item.rarity] }}>
                      {RARITY_LABEL[inv.item.rarity]}
                    </div>
                    {inv.quantity > 1 && (
                      <div className="text-[9px] text-matsuri-stone">×{inv.quantity}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item detail */}
          {selected && (
            <div className="w-52 border-l border-matsuri-stone/15 p-4 bg-white/50 flex flex-col shrink-0">
              <div className="text-4xl text-center mb-2">{selected.item.icon}</div>
              <h3 className="font-semibold text-sm text-matsuri-ink text-center">{selected.item.name}</h3>
              <p className="font-hanzi text-matsuri-stone text-center text-xs mb-1">{selected.item.name_cn}</p>
              <p className="text-[10px] text-center mb-3" style={{ color: RARITY_COLOR[selected.item.rarity] }}>
                {RARITY_LABEL[selected.item.rarity]}
              </p>
              <p className="text-xs text-matsuri-stone/70 italic text-center mb-3 leading-snug">
                {selected.item.description}
              </p>

              {/* Stats */}
              {Object.keys(selected.item.stats).length > 0 && (
                <div className="bg-matsuri-stone/8 rounded p-2 mb-3">
                  {Object.entries(selected.item.stats).map(([k, v]) => v ? (
                    <div key={k} className="flex justify-between text-[10px] text-matsuri-ink">
                      <span className="capitalize">{k.replace('_', ' ')}</span>
                      <span className="text-matsuri-jade font-semibold">
                        {k === 'xp_bonus' ? `+${Math.round((v as number)*100)}%` : `+${v}`}
                      </span>
                    </div>
                  ) : null)}
                </div>
              )}

              <div className="text-[10px] text-matsuri-stone text-center mb-3">
                Nível requerido: {selected.item.req_level}
              </div>

              <div className="mt-auto flex flex-col gap-2">
                {selected.item.type === 'equipment' && !selected.equipped && canEquip(selected) && (
                  <button
                    onClick={() => { equipItem(selected); setSelected(null) }}
                    className="w-full bg-matsuri-imperial text-matsuri-paper py-1.5 rounded text-xs font-display tracking-wide hover:bg-matsuri-imperial/80 transition-colors"
                  >
                    Equipar
                  </button>
                )}
                {selected.equipped && (
                  <button
                    onClick={() => { if (selected.equippedSlot) unequipItem(selected.equippedSlot as EquipSlot); setSelected(null) }}
                    className="w-full border border-matsuri-stone/30 text-matsuri-stone py-1.5 rounded text-xs hover:border-matsuri-imperial hover:text-matsuri-imperial transition-colors"
                  >
                    Desequipar
                  </button>
                )}
                {selected.item.type === 'consumable' && (
                  <button
                    onClick={() => { useConsumable(selected); setSelected(null) }}
                    className="w-full bg-matsuri-jade text-white py-1.5 rounded text-xs font-display tracking-wide hover:bg-matsuri-jade/80 transition-colors"
                  >
                    Usar
                  </button>
                )}
                <div className="text-center text-[10px] text-matsuri-stone/50">
                  💰 {selected.item.yuan_value} Yuan
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
