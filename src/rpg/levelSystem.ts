// XP necessário para subir DO nível N para N+1
export const xpForLevel = (level: number): number =>
  Math.floor(level * level * 80)

// XP total acumulado para CHEGAR ao nível N
export const totalXpForLevel = (level: number): number => {
  let total = 0
  for (let i = 1; i < level; i++) total += xpForLevel(i)
  return total
}

// Nível atual baseado no XP total
export const levelFromXp = (totalXp: number): number => {
  let level = 1
  while (level < 100 && totalXp >= totalXpForLevel(level + 1)) level++
  return level
}

// Progresso dentro do nível atual
export const xpProgressInLevel = (totalXp: number) => {
  const level = levelFromXp(totalXp)
  if (level >= 100) return { current: 0, needed: 0, percent: 1 }
  const start = totalXpForLevel(level)
  const end   = totalXpForLevel(level + 1)
  const current = totalXp - start
  const needed  = end - start
  return { current, needed, percent: current / needed }
}

// Stats derivados dos atributos base
export const calcDerived = (char: {
  strength: number; spirit: number; wisdom: number; agility: number; level: number
}) => ({
  maxHp:         50 + char.strength * 10 + char.level * 5,
  maxQi:         50 + char.spirit   *  8 + char.level * 3,
  xpMultiplier:  1  + char.wisdom   * 0.02,
  critChance:    char.agility * 0.005,
  moveSpeed:     1  + char.agility  * 0.01,
  yuanBonus:     1  + char.strength * 0.01,
})

export const STAT_META = {
  strength: { label: 'Força',      cn: '力', icon: '⚔️', hint: '+10 HP · +1% Yuan por ponto'          },
  spirit:   { label: 'Espírito',   cn: '靈', icon: '🔮', hint: '+8 Qi máximo por ponto'                },
  wisdom:   { label: 'Sabedoria',  cn: '智', icon: '📚', hint: '+2% XP de Hanzi por ponto'             },
  agility:  { label: 'Agilidade',  cn: '敏', icon: '💨', hint: '+0.5% Crítico · +1% velocidade'        },
} as const

export type StatKey = keyof typeof STAT_META

// Pontos de stat ganhos por nível
export const STAT_POINTS_PER_LEVEL = 3
// Pontos de talento ganhos por nível
export const TALENT_POINTS_PER_LEVEL = 1
// Níveis que desbloqueiam talentos (tier 1=1, tier 2=5, tier 3=15)
export const TALENT_TIER_UNLOCK = [1, 5, 15]
