export interface HanziData {
  hanzi: string
  pinyin: string
  pinyin_base: string
  tone: 1 | 2 | 3 | 4 | 5
  meaning_pt: string
  etymology: string
  hsk_level: number
  stroke_count: number
  audio_file?: string
}

export interface PlayerCharacter {
  id: string
  name: string
  level: number
  xp: number
  qi: number
  position_x: number
  position_y: number
  avatar: Record<string, unknown>
}

export interface LearningRecord {
  hanzi: string
  mastery_level: number
  correct_count: number
  incorrect_count: number
  next_review_at: string
}

export type GameMode = 'auth' | 'world' | 'combat' | 'dialogue' | 'learning'

export type ToneColor = {
  hex: string
  tw: string
  label: string
}

export const TONE_COLORS: Record<number, ToneColor> = {
  1: { hex: '#3B82F6', tw: 'text-tone-1', label: '第一聲 — Tom Nivelado' },
  2: { hex: '#00A86B', tw: 'text-tone-2', label: '第二聲 — Tom Ascendente' },
  3: { hex: '#9B59B6', tw: 'text-tone-3', label: '第三聲 — Tom Ondulante' },
  4: { hex: '#AA0000', tw: 'text-tone-4', label: '第四聲 — Tom Descendente' },
  5: { hex: '#888888', tw: 'text-gray-500', label: '輕聲 — Tom Neutro' },
}
