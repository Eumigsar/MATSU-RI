export type ItemRarity  = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
export type ItemType    = 'equipment' | 'consumable' | 'quest'
export type EquipSlot   = 'head' | 'body' | 'weapon' | 'accessory'

export interface ItemStats {
  strength?:      number
  spirit?:        number
  wisdom?:        number
  agility?:       number
  max_hp?:        number
  xp_bonus?:      number  // multiplicador extra (0.05 = +5%)
  yuan_bonus?:    number
  heal_qi?:       number
  xp_multiplier?: number  // consumable: XP x2 por N segundos
  duration?:      number  // segundos
}

export interface Item {
  id:          number
  name:        string
  name_cn:     string
  type:        ItemType
  slot?:       EquipSlot
  rarity:      ItemRarity
  stats:       ItemStats
  description: string
  icon:        string
  yuan_value:  number
  req_level:   number
}

export interface InventoryItem {
  inventoryId: string
  item:        Item
  quantity:    number
  equipped:    boolean
  equippedSlot?: EquipSlot
}

export type Equipment = Partial<Record<EquipSlot, InventoryItem>>

// ── Cores de raridade ──────────────────────────────────────
export const RARITY_COLOR: Record<ItemRarity, string> = {
  common:    '#9CA3AF',
  uncommon:  '#22C55E',
  rare:      '#3B82F6',
  epic:      '#A855F7',
  legendary: '#F59E0B',
}

export const RARITY_LABEL: Record<ItemRarity, string> = {
  common:    'Comum',
  uncommon:  'Incomum',
  rare:      'Raro',
  epic:      'Épico',
  legendary: 'Lendário',
}

export const SLOT_LABEL: Record<EquipSlot, string> = {
  head:      'Cabeça',
  body:      'Corpo',
  weapon:    'Arma',
  accessory: 'Acessório',
}

export const SLOT_ICON: Record<EquipSlot, string> = {
  head:      '👑',
  body:      '👘',
  weapon:    '✍️',
  accessory: '💎',
}

// ── Catálogo local (espelho do banco) ──────────────────────
export const ITEM_CATALOG: Item[] = [
  { id:1,  name:'Faixa de Aprendiz',       name_cn:'學子頭巾', type:'equipment',  slot:'head',      rarity:'common',   stats:{wisdom:2},                          description:'A faixa branca do iniciado. Todo mestre começou assim.',               icon:'🎽', yuan_value:15,  req_level:1  },
  { id:2,  name:'Robe de Algodão',          name_cn:'棉布道袍', type:'equipment',  slot:'body',      rarity:'common',   stats:{max_hp:10},                          description:'Veste simples mas confortável para longas jornadas.',                  icon:'👘', yuan_value:20,  req_level:1  },
  { id:3,  name:'Pincel de Bambu',          name_cn:'竹筆',     type:'equipment',  slot:'weapon',    rarity:'common',   stats:{spirit:2, xp_bonus:0.05},           description:'+5% XP ao aprender Hanzi.',                                           icon:'✍️', yuan_value:25,  req_level:1  },
  { id:4,  name:'Amuleto de Jade',          name_cn:'玉符',     type:'equipment',  slot:'accessory', rarity:'common',   stats:{strength:1, wisdom:1, agility:1},   description:'Equilíbrio entre todos os atributos.',                                icon:'💎', yuan_value:30,  req_level:1  },
  { id:5,  name:'Tiara de Seda Dourada',    name_cn:'金絲抹額', type:'equipment',  slot:'head',      rarity:'uncommon', stats:{wisdom:5, spirit:2},                description:'Bordada com caracteres de sabedoria por monges do templo.',           icon:'👑', yuan_value:80,  req_level:5  },
  { id:6,  name:'Manto de Discípulo',       name_cn:'弟子道袍', type:'equipment',  slot:'body',      rarity:'uncommon', stats:{max_hp:25, spirit:3},               description:'O manto azul do discípulo confirmado.',                               icon:'🥋', yuan_value:90,  req_level:5  },
  { id:7,  name:'Pincel de Cedro Sagrado',  name_cn:'雪松神筆', type:'equipment',  slot:'weapon',    rarity:'uncommon', stats:{spirit:5, wisdom:3, xp_bonus:0.12}, description:'+12% XP ao escrever Hanzi.',                                          icon:'🖌️', yuan_value:110, req_level:5  },
  { id:8,  name:'Anel do Vento',            name_cn:'風戒指',   type:'equipment',  slot:'accessory', rarity:'uncommon', stats:{agility:5, strength:2},             description:'Concede a leveza do vento.',                                          icon:'💍', yuan_value:95,  req_level:5  },
  { id:9,  name:'Capacete do Letrado',      name_cn:'文冠',     type:'equipment',  slot:'head',      rarity:'rare',     stats:{wisdom:10, spirit:5},               description:'A coroa do guerreiro que domina a espada e o pincel.',                icon:'⛩️', yuan_value:300, req_level:15 },
  { id:10, name:'Armadura de Jade',         name_cn:'翡翠甲',   type:'equipment',  slot:'body',      rarity:'rare',     stats:{max_hp:60, strength:8, agility:4},  description:'Cada escama é um Hanzi gravado por um mestre.',                       icon:'🛡️', yuan_value:350, req_level:15 },
  { id:11, name:'Pincel do Imortal',        name_cn:'仙人筆',   type:'equipment',  slot:'weapon',    rarity:'epic',     stats:{spirit:12, wisdom:8, xp_bonus:0.25},description:'+25% XP. A lenda diz que traça Hanzi sozinho enquanto o mestre dorme.',icon:'🪄', yuan_value:800, req_level:30 },
  { id:12, name:'Chá de Ginseng',           name_cn:'人參茶',   type:'consumable', slot:undefined,   rarity:'common',   stats:{heal_qi:30},                        description:'Restaura 30 pontos de Qi.',                                           icon:'🍵', yuan_value:10,  req_level:1  },
  { id:13, name:'Pergaminho de Sabedoria',  name_cn:'智慧卷軸', type:'consumable', slot:undefined,   rarity:'uncommon', stats:{xp_multiplier:2, duration:300},     description:'+100% XP por 5 minutos.',                                             icon:'📜', yuan_value:50,  req_level:1  },
  { id:14, name:'Pedra de Afiação',         name_cn:'磨刀石',   type:'consumable', slot:undefined,   rarity:'common',   stats:{heal_qi:10},                        description:'Restaura 10 de Qi e foca a mente.',                                   icon:'🪨', yuan_value:8,   req_level:1  },
]

// Calcula stats totais do equipamento
export const calcEquipmentStats = (equipment: Equipment): ItemStats => {
  const total: ItemStats = {}
  for (const inv of Object.values(equipment)) {
    if (!inv) continue
    for (const [k, v] of Object.entries(inv.item.stats)) {
      const key = k as keyof ItemStats
      ;(total[key] as number) = ((total[key] as number) ?? 0) + (v as number)
    }
  }
  return total
}
