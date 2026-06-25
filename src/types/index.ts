import type { StatKey } from '../rpg/levelSystem'
import type { Equipment, EquipSlot, InventoryItem, ItemStats } from '../rpg/itemData'
import type { ElementType } from '../rpg/talentData'

export type { StatKey, Equipment, EquipSlot, InventoryItem, ItemStats, ElementType }

export interface PlayerCharacter {
  id:            string
  name:          string
  level:         number
  xp:            number
  qi:            number
  max_hp:        number
  current_hp:    number
  yuan:          number
  strength:      number
  spirit:        number
  wisdom:        number
  agility:       number
  stat_points:   number
  talent_points: number
  position_x:    number
  position_y:    number
  avatar:        Record<string, unknown>
}

export interface HanziData {
  hanzi:       string
  pinyin:      string
  pinyin_base: string
  tone:        1 | 2 | 3 | 4 | 5
  meaning_pt:  string
  etymology:   string
  hsk_level:   number
  stroke_count: number
  audio_file?: string
}

export interface LearningRecord {
  hanzi:          string
  mastery_level:  number
  correct_count:  number
  incorrect_count: number
  next_review_at: string
}

export interface MissionReward {
  xp:     number
  yuan:   number
  items:  InventoryItem[]
  title:  string
  flavor: string
}

export type ActivePanel = 'character' | 'inventory' | 'talents' | null
export type GameMode    = 'auth' | 'world' | 'combat' | 'dialogue' | 'learning'
export type FeedbackState = 'idle' | 'correct' | 'wrong'

export interface ToneColor { hex: string; tw: string; label: string }
export const TONE_COLORS: Record<number, ToneColor> = {
  1: { hex: '#3B82F6', tw: 'text-tone-1', label: '第一聲 — Tom Nivelado' },
  2: { hex: '#00A86B', tw: 'text-tone-2', label: '第二聲 — Tom Ascendente' },
  3: { hex: '#9B59B6', tw: 'text-tone-3', label: '第三聲 — Tom Ondulante' },
  4: { hex: '#AA0000', tw: 'text-tone-4', label: '第四聲 — Tom Descendente' },
  5: { hex: '#888888', tw: 'text-gray-500', label: '輕聲 — Tom Neutro' },
}
