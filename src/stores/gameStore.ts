import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'
import { levelFromXp, calcDerived, STAT_POINTS_PER_LEVEL, TALENT_POINTS_PER_LEVEL } from '../rpg/levelSystem'
import { ITEM_CATALOG, calcEquipmentStats } from '../rpg/itemData'
import type { StatKey } from '../rpg/levelSystem'
import type { Equipment, InventoryItem, EquipSlot } from '../rpg/itemData'
import type { PlayerCharacter, HanziData, LearningRecord, MissionReward, ActivePanel, FeedbackState } from '../types'

const IS_DEMO = (id: string) => id.startsWith('demo-')

interface GameState {
  // ── Core ─────────────────────────────────────────────────
  character:      PlayerCharacter | null
  feedbackState:  FeedbackState
  activeLearning: HanziData | null
  masteredHanzi:  Set<string>
  learningRecords: Map<string, LearningRecord>

  // ── RPG ──────────────────────────────────────────────────
  equipment:      Equipment
  inventory:      InventoryItem[]
  unlockedTalents: Set<number>
  pendingReward:  MissionReward | null
  levelUpAlert:   number | null   // level number when leveled up
  activePanel:    ActivePanel
  xpMultiplierActive: number      // from consumables (1 = normal)

  // ── Actions ──────────────────────────────────────────────
  setCharacter:        (c: PlayerCharacter) => void
  openLearning:        (h: HanziData) => void
  closeLearning:       () => void
  submitAnswer:        (h: HanziData, correct: boolean) => Promise<void>
  allocateStat:        (stat: StatKey) => Promise<void>
  equipItem:           (inv: InventoryItem) => Promise<void>
  unequipItem:         (slot: EquipSlot) => Promise<void>
  useConsumable:       (inv: InventoryItem) => void
  unlockTalent:        (talentId: number) => Promise<void>
  addToInventory:      (itemId: number, quantity?: number) => Promise<void>
  setPanel:            (p: ActivePanel) => void
  clearReward:         () => void
  clearLevelUp:        () => void
  loadAll:             (characterId: string) => Promise<void>
  loadLearningProgress:(characterId: string) => Promise<void>
}

// ── XP gain per answer ────────────────────────────────────
const BASE_XP   = 20
const BASE_YUAN = 5

export const useGameStore = create<GameState>((set, get) => ({
  character:           null,
  feedbackState:       'idle',
  activeLearning:      null,
  masteredHanzi:       new Set(),
  learningRecords:     new Map(),
  equipment:           {},
  inventory:           [],
  unlockedTalents:     new Set(),
  pendingReward:       null,
  levelUpAlert:        null,
  activePanel:         null,
  xpMultiplierActive:  1,

  setCharacter: (character) => set({ character }),
  setPanel:     (activePanel) => set({ activePanel }),
  clearReward:  () => set({ pendingReward: null }),
  clearLevelUp: () => set({ levelUpAlert: null }),

  openLearning: (h) => set({ activeLearning: h, feedbackState: 'idle' }),
  closeLearning: () => set({ activeLearning: null, feedbackState: 'idle' }),

  // ── Submit answer ─────────────────────────────────────────
  submitAnswer: async (hanzi, correct) => {
    const { character, masteredHanzi, learningRecords, unlockedTalents, xpMultiplierActive } = get()
    if (!character) return

    set({ feedbackState: correct ? 'correct' : 'wrong' })

    const existing = learningRecords.get(hanzi.hanzi)
    const newMastery = correct
      ? Math.min((existing?.mastery_level ?? 1) + 1, 5)
      : Math.max((existing?.mastery_level ?? 1) - 1, 1)

    // ── Compute XP & Yuan with bonuses ─────────────────────
    const hasCrit = [...unlockedTalents].some((id) => [5].includes(id)) // Chama Dupla
    const critRoll = hasCrit && Math.random() < 0.15
    const xpMult = xpMultiplierActive * (critRoll ? 2 : 1)

    const equip = get().equipment
    const eStats = calcEquipmentStats(equip)
    const xpBonus = (eStats.xp_bonus ?? 0)
    const derived = calcDerived(character)

    const xpGain   = correct ? Math.round(BASE_XP * newMastery * derived.xpMultiplier * (1 + xpBonus) * xpMult) : 0
    const yuanGain = correct ? Math.round(BASE_YUAN * newMastery * derived.yuanBonus) : 0
    const qiChange = correct ? 5 : -10

    const newXp   = character.xp + xpGain
    const newYuan = character.yuan + yuanGain
    const newQi   = Math.max(0, Math.min(character.qi + qiChange, 100))
    const oldLevel = character.level
    const newLevel = levelFromXp(newXp)

    // ── Update character local ──────────────────────────────
    const extraStatPts   = (newLevel - oldLevel) * STAT_POINTS_PER_LEVEL
    const extraTalentPts = (newLevel - oldLevel) * TALENT_POINTS_PER_LEVEL

    set((s) => ({
      character: s.character ? {
        ...s.character,
        xp:            newXp,
        level:         newLevel,
        yuan:          newYuan,
        qi:            newQi,
        stat_points:   s.character.stat_points + extraStatPts,
        talent_points: s.character.talent_points + extraTalentPts,
      } : null,
      masteredHanzi: correct && newMastery >= 3
        ? new Set([...masteredHanzi, hanzi.hanzi])
        : masteredHanzi,
      learningRecords: new Map([...learningRecords, [hanzi.hanzi, {
        hanzi:          hanzi.hanzi,
        mastery_level:  newMastery,
        correct_count:  (existing?.correct_count ?? 0) + (correct ? 1 : 0),
        incorrect_count:(existing?.incorrect_count ?? 0) + (correct ? 0 : 1),
        next_review_at: new Date().toISOString(),
      }]]),
      levelUpAlert: newLevel > oldLevel ? newLevel : null,
    }))

    // ── Check mission completion ────────────────────────────
    const updatedMastered = get().masteredHanzi
    if (updatedMastered.size >= 5 && !get().pendingReward) {
      // Give starter equipment as reward
      const starterItem = ITEM_CATALOG.find((i) => i.id === 3)! // Pincel de Bambu
      set({
        pendingReward: {
          xp:     200,
          yuan:   150,
          items:  [{ inventoryId: `reward-${Date.now()}`, item: starterItem, quantity: 1, equipped: false }],
          title:  'O Pergaminho dos Números Perdidos',
          flavor: 'Você decifrou os cinco números sagrados. O Sifu Liang sorri com orgulho.',
        },
      })
    }

    // ── Persist to Supabase (skip demo) ───────────────────
    if (!IS_DEMO(character.id)) {
      await Promise.all([
        supabase.from('characters').update({
          xp: newXp, level: newLevel, yuan: newYuan, qi: newQi,
          stat_points:   character.stat_points + extraStatPts,
          talent_points: character.talent_points + extraTalentPts,
        }).eq('id', character.id),

        supabase.from('player_learning_stats').upsert({
          character_id:    character.id,
          hanzi:           hanzi.hanzi,
          correct_count:   (existing?.correct_count ?? 0) + (correct ? 1 : 0),
          incorrect_count: (existing?.incorrect_count ?? 0) + (correct ? 0 : 1),
          interval_days:   correct ? Math.max(1, newMastery) * 2 : 1,
          next_review_at:  new Date(Date.now() + (correct ? newMastery * 2 : 1) * 86400000).toISOString(),
          last_reviewed_at: new Date().toISOString(),
        }, { onConflict: 'character_id,hanzi' }),
      ])
    }

    setTimeout(() => set({ activeLearning: null, feedbackState: 'idle' }), correct ? 1200 : 800)
  },

  // ── Allocate stat point ───────────────────────────────────
  allocateStat: async (stat) => {
    const { character } = get()
    if (!character || character.stat_points < 1) return
    const updated = {
      ...character,
      [stat]:      character[stat as keyof PlayerCharacter] as number + 1,
      stat_points: character.stat_points - 1,
    }
    set({ character: updated })
    if (!IS_DEMO(character.id)) {
      await supabase.from('characters').update({ [stat]: updated[stat as keyof PlayerCharacter], stat_points: updated.stat_points }).eq('id', character.id)
    }
  },

  // ── Equip item ───────────────────────────────────────────
  equipItem: async (inv) => {
    const { character, equipment } = get()
    if (!inv.item.slot || !character) return
    const slot = inv.item.slot as EquipSlot
    const prev = equipment[slot]

    set((s) => ({
      equipment: { ...s.equipment, [slot]: { ...inv, equipped: true, equippedSlot: slot } },
      inventory: s.inventory.map((i) => {
        if (i.inventoryId === inv.inventoryId) return { ...i, equipped: true, equippedSlot: slot }
        if (prev && i.inventoryId === prev.inventoryId) return { ...i, equipped: false, equippedSlot: undefined }
        return i
      }),
    }))

    if (!IS_DEMO(character.id)) {
      if (prev) await supabase.from('player_inventory').update({ equipped: false, equipped_slot: null }).eq('id', prev.inventoryId)
      await supabase.from('player_inventory').update({ equipped: true, equipped_slot: slot }).eq('id', inv.inventoryId)
    }
  },

  // ── Unequip item ─────────────────────────────────────────
  unequipItem: async (slot) => {
    const { character, equipment } = get()
    const inv = equipment[slot]
    if (!inv || !character) return
    set((s) => ({
      equipment: { ...s.equipment, [slot]: undefined },
      inventory: s.inventory.map((i) => i.inventoryId === inv.inventoryId ? { ...i, equipped: false, equippedSlot: undefined } : i),
    }))
    if (!IS_DEMO(character.id)) {
      await supabase.from('player_inventory').update({ equipped: false, equipped_slot: null }).eq('id', inv.inventoryId)
    }
  },

  // ── Use consumable ───────────────────────────────────────
  useConsumable: (inv) => {
    const { character } = get()
    if (!character) return
    const s = inv.item.stats
    if (s.heal_qi) {
      set((st) => ({ character: st.character ? { ...st.character, qi: Math.min(st.character.qi + (s.heal_qi ?? 0), 100) } : null }))
    }
    if (s.xp_multiplier && s.duration) {
      set({ xpMultiplierActive: s.xp_multiplier })
      setTimeout(() => set({ xpMultiplierActive: 1 }), s.duration * 1000)
    }
    set((st) => ({ inventory: st.inventory.filter((i) => i.inventoryId !== inv.inventoryId) }))
  },

  // ── Unlock talent ─────────────────────────────────────────
  unlockTalent: async (talentId) => {
    const { character } = get()
    if (!character || character.talent_points < 1) return
    set((s) => ({
      unlockedTalents: new Set([...s.unlockedTalents, talentId]),
      character: s.character ? { ...s.character, talent_points: s.character.talent_points - 1 } : null,
    }))
    if (!IS_DEMO(character.id)) {
      await Promise.all([
        supabase.from('player_talents').insert({ character_id: character.id, talent_id: talentId }),
        supabase.from('characters').update({ talent_points: character.talent_points - 1 }).eq('id', character.id),
      ])
    }
  },

  // ── Add item to inventory ─────────────────────────────────
  addToInventory: async (itemId, quantity = 1) => {
    const { character } = get()
    if (!character) return
    const item = ITEM_CATALOG.find((i) => i.id === itemId)
    if (!item) return
    const inventoryId = `local-${Date.now()}-${itemId}`
    const inv: InventoryItem = { inventoryId, item, quantity, equipped: false }
    set((s) => ({ inventory: [...s.inventory, inv] }))
    if (!IS_DEMO(character.id)) {
      const { data } = await supabase.from('player_inventory').insert({ character_id: character.id, item_id: itemId, quantity }).select().single()
      if (data) {
        set((s) => ({ inventory: s.inventory.map((i) => i.inventoryId === inventoryId ? { ...i, inventoryId: data.id } : i) }))
      }
    }
  },

  // ── Load everything from Supabase ─────────────────────────
  loadAll: async (characterId) => {
    await Promise.all([
      get().loadLearningProgress(characterId),
      // inventory
      (async () => {
        const { data } = await supabase.from('player_inventory').select('*, items(*)').eq('character_id', characterId)
        if (!data) return
        const invItems: InventoryItem[] = data.map((row) => {
          const catalogItem = ITEM_CATALOG.find((i) => i.id === row.item_id) ?? row.items
          return { inventoryId: row.id, item: catalogItem, quantity: row.quantity, equipped: row.equipped, equippedSlot: row.equipped_slot }
        })
        const equipment: Equipment = {}
        for (const inv of invItems) {
          if (inv.equipped && inv.equippedSlot) equipment[inv.equippedSlot as EquipSlot] = inv
        }
        set({ inventory: invItems, equipment })
      })(),
      // talents
      (async () => {
        const { data } = await supabase.from('player_talents').select('talent_id').eq('character_id', characterId)
        if (data) set({ unlockedTalents: new Set(data.map((r) => r.talent_id)) })
      })(),
    ])
  },

  loadLearningProgress: async (characterId) => {
    const { data } = await supabase.from('player_learning_stats').select('*').eq('character_id', characterId)
    if (!data) return
    const records = new Map<string, LearningRecord>()
    const mastered = new Set<string>()
    for (const row of data) {
      records.set(row.hanzi, { hanzi: row.hanzi, mastery_level: row.mastery_level ?? 1, correct_count: row.correct_count, incorrect_count: row.incorrect_count, next_review_at: row.next_review_at })
      if ((row.mastery_level ?? 1) >= 3) mastered.add(row.hanzi)
    }
    set({ learningRecords: records, masteredHanzi: mastered })
  },
}))
