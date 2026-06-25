import { useState } from 'react'
import { Scroll, Star, Coins } from 'lucide-react'
import { useGameStore } from '../stores/gameStore'
import { RARITY_COLOR } from '../rpg/itemData'

export function MissionRewardModal() {
  const { pendingReward, clearReward, addToInventory } = useGameStore()
  const [claimed, setClaimed] = useState(false)

  if (!pendingReward) return null

  const handleClaim = async () => {
    setClaimed(true)
    for (const inv of pendingReward.items) {
      await addToInventory(inv.item.id)
    }
    setTimeout(() => {
      clearReward()
      setClaimed(false)
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-matsuri-ink/85 backdrop-blur-md" />

      {/* Gold particles (CSS only) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-matsuri-gold animate-float opacity-60"
            style={{
              left:             `${10 + i * 7}%`,
              top:              `${20 + (i % 3) * 20}%`,
              animationDelay:   `${i * 0.2}s`,
              animationDuration:`${2 + (i % 3)}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-2xl bg-matsuri-gold/20 blur-xl scale-105" />

        <div className="relative bg-matsuri-ink border-2 border-matsuri-gold/50 rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="text-center pt-8 pb-4 px-6">
            <div className="w-16 h-16 rounded-full bg-matsuri-gold/20 border-2 border-matsuri-gold flex items-center justify-center mx-auto mb-3">
              <Scroll size={28} className="text-matsuri-gold" />
            </div>
            <h2 className="font-display text-matsuri-gold text-xl tracking-widest uppercase mb-1">
              Missão Concluída
            </h2>
            <p className="font-hanzi text-matsuri-paper/60 text-sm">{pendingReward.title}</p>
          </div>

          {/* Flavor text */}
          <div className="mx-6 mb-4 bg-white/5 border border-white/10 rounded-lg p-3">
            <p className="text-matsuri-paper/70 text-xs italic text-center leading-relaxed">
              "{pendingReward.flavor}"
            </p>
          </div>

          {/* Rewards */}
          <div className="px-6 pb-4">
            <p className="text-[10px] text-matsuri-paper/30 uppercase tracking-widest mb-3 text-center">
              Recompensas
            </p>

            <div className="flex justify-center gap-4 mb-4">
              {/* XP */}
              <div className="flex items-center gap-1.5 bg-matsuri-gold/10 border border-matsuri-gold/30 rounded-full px-4 py-2">
                <Star size={14} className="text-matsuri-gold" />
                <span className="text-matsuri-gold font-bold">+{pendingReward.xp} XP</span>
              </div>
              {/* Yuan */}
              <div className="flex items-center gap-1.5 bg-matsuri-jade/10 border border-matsuri-jade/30 rounded-full px-4 py-2">
                <Coins size={14} className="text-matsuri-jade" />
                <span className="text-matsuri-jade font-bold">+{pendingReward.yuan} Yuan</span>
              </div>
            </div>

            {/* Items */}
            {pendingReward.items.length > 0 && (
              <div className="flex flex-col gap-2 mb-4">
                {pendingReward.items.map((inv) => (
                  <div
                    key={inv.inventoryId}
                    className="flex items-center gap-3 bg-white/5 border rounded-lg p-3"
                    style={{ borderColor: RARITY_COLOR[inv.item.rarity] + '40' }}
                  >
                    <span className="text-2xl">{inv.item.icon}</span>
                    <div>
                      <p className="text-matsuri-paper text-sm font-semibold">{inv.item.name}</p>
                      <p className="text-[10px]" style={{ color: RARITY_COLOR[inv.item.rarity] }}>
                        {inv.item.name_cn} · {inv.item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Claim button */}
          <div className="px-6 pb-6">
            <button
              onClick={handleClaim}
              disabled={claimed}
              className="w-full bg-matsuri-gold text-matsuri-ink py-3 rounded-lg font-display tracking-widest uppercase text-sm hover:bg-matsuri-gold/80 transition-all disabled:opacity-50"
            >
              {claimed ? '✓ Recebido!' : 'Coletar Recompensas'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
