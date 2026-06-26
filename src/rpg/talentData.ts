export type ElementType = 'madeira' | 'fogo' | 'terra' | 'metal' | 'agua'

export interface TalentEffect {
  xp_bonus?:        number
  srs_reduction?:   number
  action_speed?:    number
  crit_chance?:     number
  boss_damage?:     number
  max_hp?:          number
  yuan_bonus?:      number
  inventory_slots?: number
  wisdom_pct?:      number
  rare_drop?:       number
  dmg_reduction?:   number
  wisdom_bonus?:    number
  rare_hanzi?:      number
  unlock_hsk2?:     boolean
}

export interface Talent {
  id:          number
  element:     ElementType
  name:        string
  name_cn:     string
  description: string
  req_level:   number
  tier:        1 | 2 | 3
  effect:      TalentEffect
  cost:        number
  icon:        string
}

export const ELEMENT_META: Record<ElementType, { label: string; cn: string; color: string; bg: string }> = {
  madeira: { label: 'Madeira', cn: '木', color: '#22C55E', bg: '#14532D' },
  fogo:    { label: 'Fogo',    cn: '火', color: '#EF4444', bg: '#7F1D1D' },
  terra:   { label: 'Terra',   cn: '土', color: '#EAB308', bg: '#713F12' },
  metal:   { label: 'Metal',   cn: '金', color: '#9CA3AF', bg: '#1F2937' },
  agua:    { label: 'Água',    cn: '水', color: '#3B82F6', bg: '#1E3A5F' },
}

export const TALENTS: Talent[] = [
  // 木 MADEIRA
  { id:1,  element:'madeira', name:'Raiz Profunda',      name_cn:'根深',   description:'+10% XP de Hanzi. Suas raízes no estudo ficam mais firmes.',                    req_level:1,  tier:1, effect:{ xp_bonus:0.10 },        cost:1, icon:'🌱' },
  { id:2,  element:'madeira', name:'Brotar do Qi',       name_cn:'發芽',   'description':'Revisões SRS com intervalo 20% menor. O Qi flui naturalmente.',               req_level:5,  tier:2, effect:{ srs_reduction:0.20 },   cost:2, icon:'🌿' },
  { id:3,  element:'madeira', name:'Grande Árvore',      name_cn:'參天木', description:'+25% XP permanente. Seu conhecimento alcança os céus.',                         req_level:15, tier:3, effect:{ xp_bonus:0.25 },        cost:3, icon:'🌳' },
  // 火 FOGO
  { id:4,  element:'fogo',    name:'Centelha Interior',  name_cn:'火花',   description:'+15% velocidade de ação em combate. O fogo interior despertou.',               req_level:1,  tier:1, effect:{ action_speed:0.15 },    cost:1, icon:'✨' },
  { id:5,  element:'fogo',    name:'Chama Dupla',        name_cn:'雙火',   description:'Crítico 15%: resposta correta dá XP dobrado.',                                 req_level:5,  tier:2, effect:{ crit_chance:0.15 },     cost:2, icon:'🔥' },
  { id:6,  element:'fogo',    name:'Inferno Sagrado',    name_cn:'聖火',   description:'+50% dano em Boss Fights. Chamas purificam a mente corrompida.',               req_level:15, tier:3, effect:{ boss_damage:0.50 },     cost:3, icon:'🌋' },
  // 土 TERRA
  { id:7,  element:'terra',   name:'Fundação Sólida',    name_cn:'根基',   description:'+30 HP máximo. Sua base é sólida como a terra.',                               req_level:1,  tier:1, effect:{ max_hp:30 },            cost:1, icon:'⛰️' },
  { id:8,  element:'terra',   name:'Abundância',         name_cn:'豐收',   description:'+20% Yuan ganho em todas as atividades.',                                      req_level:5,  tier:2, effect:{ yuan_bonus:0.20 },      cost:2, icon:'💰' },
  { id:9,  element:'terra',   name:'Plenitude',          name_cn:'圓滿',   description:'+15 slots de inventário. A terra contém todas as riquezas.',                   req_level:15, tier:3, effect:{ inventory_slots:15 },   cost:3, icon:'🏔️' },
  // 金 METAL
  { id:10, element:'metal',   name:'Afiação da Mente',   name_cn:'磨礪',   description:'+10% Sabedoria efetiva. Como metal afiado, sua mente corta dúvidas.',          req_level:1,  tier:1, effect:{ wisdom_pct:0.10 },      cost:1, icon:'⚔️' },
  { id:11, element:'metal',   name:'Forja do Guerreiro', name_cn:'鍛造',   description:'20% de chance de drop raro após cada batalha.',                                req_level:5,  tier:2, effect:{ rare_drop:0.20 },       cost:2, icon:'🔨' },
  { id:12, element:'metal',   name:'Armadura Imortal',   name_cn:'金剛甲', description:'-25% dano recebido. Pele de metal, mente de diamante.',                        req_level:15, tier:3, effect:{ dmg_reduction:0.25 },   cost:3, icon:'🛡️' },
  // 水 ÁGUA
  { id:13, element:'agua',    name:'Fluxo Natural',      name_cn:'自然流', description:'+15% Sabedoria base. A água encontra sempre seu caminho.',                     req_level:1,  tier:1, effect:{ wisdom_bonus:0.15 },    cost:1, icon:'💧' },
  { id:14, element:'agua',    name:'Corrente Profunda',  name_cn:'深流',   description:'+25% chance de encontrar Hanzi raros no mundo.',                               req_level:5,  tier:2, effect:{ rare_hanzi:0.25 },      cost:2, icon:'🌊' },
  { id:15, element:'agua',    name:'Oceano do Saber',    name_cn:'知識海', description:'Desbloqueia conteúdo HSK 2 antecipadamente. Você é o oceano.',                 req_level:15, tier:3, effect:{ unlock_hsk2:true },     cost:3, icon:'🌏' },
]

export const TALENTS_BY_ELEMENT = (el: ElementType) =>
  TALENTS.filter((t) => t.element === el).sort((a, b) => a.tier - b.tier)
