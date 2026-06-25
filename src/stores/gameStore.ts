import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'
import type { HanziData, PlayerCharacter, LearningRecord } from '../types'

interface GameState {
  character: PlayerCharacter | null
  masteredHanzi: Set<string>
  learningRecords: Map<string, LearningRecord>
  activeLearning: HanziData | null
  feedbackState: 'idle' | 'correct' | 'wrong'

  setCharacter: (c: PlayerCharacter) => void
  openLearning: (hanzi: HanziData) => void
  closeLearning: () => void
  submitAnswer: (hanzi: HanziData, wasCorrect: boolean) => Promise<void>
  loadLearningProgress: (characterId: string) => Promise<void>
}

export const useGameStore = create<GameState>((set, get) => ({
  character: null,
  masteredHanzi: new Set(),
  learningRecords: new Map(),
  activeLearning: null,
  feedbackState: 'idle',

  setCharacter: (character) => set({ character }),

  openLearning: (hanzi) => set({ activeLearning: hanzi, feedbackState: 'idle' }),

  closeLearning: () => set({ activeLearning: null, feedbackState: 'idle' }),

  submitAnswer: async (hanzi, wasCorrect) => {
    const { character, masteredHanzi, learningRecords } = get()
    if (!character) return

    set({ feedbackState: wasCorrect ? 'correct' : 'wrong' })

    const existing = learningRecords.get(hanzi.hanzi)
    const newCorrect = (existing?.correct_count ?? 0) + (wasCorrect ? 1 : 0)
    const newIncorrect = (existing?.incorrect_count ?? 0) + (wasCorrect ? 0 : 1)
    const newMastery = wasCorrect
      ? Math.min((existing?.mastery_level ?? 1) + 1, 5)
      : Math.max((existing?.mastery_level ?? 1) - 1, 1)

    // SM-2 simplified: next review in interval_days
    const interval = wasCorrect ? Math.max(1, (existing?.mastery_level ?? 1)) * 2 : 1
    const nextReview = new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString()

    await supabase.from('player_learning_stats').upsert({
      character_id: character.id,
      hanzi: hanzi.hanzi,
      correct_count: newCorrect,
      incorrect_count: newIncorrect,
      interval_days: interval,
      repetitions: (existing?.correct_count ?? 0) + newCorrect,
      next_review_at: nextReview,
      last_reviewed_at: new Date().toISOString(),
    }, { onConflict: 'character_id,hanzi' })

    if (wasCorrect) {
      const xpGain = 20 * newMastery
      await supabase
        .from('characters')
        .update({ xp: character.xp + xpGain, qi: Math.min(character.qi + 5, 100) })
        .eq('id', character.id)

      set((state) => ({
        character: state.character
          ? { ...state.character, xp: state.character.xp + xpGain }
          : null,
        masteredHanzi: newMastery >= 3
          ? new Set([...masteredHanzi, hanzi.hanzi])
          : masteredHanzi,
      }))
    } else {
      await supabase
        .from('characters')
        .update({ qi: Math.max(character.qi - 10, 0) })
        .eq('id', character.id)

      set((state) => ({
        character: state.character
          ? { ...state.character, qi: Math.max(state.character.qi - 10, 0) }
          : null,
      }))
    }

    setTimeout(() => {
      set({ activeLearning: null, feedbackState: 'idle' })
    }, wasCorrect ? 1200 : 800)
  },

  loadLearningProgress: async (characterId) => {
    const { data } = await supabase
      .from('player_learning_stats')
      .select('*')
      .eq('character_id', characterId)

    if (!data) return

    const records = new Map<string, LearningRecord>()
    const mastered = new Set<string>()
    for (const row of data) {
      records.set(row.hanzi, {
        hanzi: row.hanzi,
        mastery_level: row.mastery_level ?? 1,
        correct_count: row.correct_count,
        incorrect_count: row.incorrect_count,
        next_review_at: row.next_review_at,
      })
      if ((row.mastery_level ?? 1) >= 3) mastered.add(row.hanzi)
    }
    set({ learningRecords: records, masteredHanzi: mastered })
  },
}))
