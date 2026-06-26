import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabaseClient'
import { useGameStore } from './stores/gameStore'
import { AuthScreen }         from './components/AuthScreen'
import { GameScene }          from './components/GameScene'
import { HUD }                from './components/HUD'
import { LearningModal }      from './components/LearningModal'
import { CharacterPanel }     from './components/CharacterPanel'
import { InventoryPanel }     from './components/InventoryPanel'
import { TalentTreePanel }    from './components/TalentTreePanel'
import { MissionRewardModal } from './components/MissionRewardModal'

const DEMO_CHARACTER = {
  id:            'demo-00000000-0000-0000-0000-000000000000',
  name:          'Aprendiz Viajante',
  level:         1,
  xp:            0,
  qi:            100,
  max_hp:        100,
  current_hp:    100,
  yuan:          100,
  strength:      1,
  spirit:        1,
  wisdom:        1,
  agility:       1,
  stat_points:   0,
  talent_points: 0,
  position_x:    450,
  position_y:    300,
  avatar:        { color: 'red' },
}

export default function App() {
  const [session, setSession] = useState<Session | null | 'loading'>('loading')
  const [isDemo,  setIsDemo]  = useState(false)

  const {
    character,
    activeLearning,
    activePanel,
    pendingReward,
    levelUpAlert,
    setCharacter,
    loadAll,
    clearLevelUp,
  } = useGameStore()

  // ── Auth state ─────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  // ── Bootstrap character when session changes ───────────────
  useEffect(() => {
    if (!session || session === 'loading' || isDemo) return
    const userId = session.user.id

    const bootstrap = async () => {
      const { data: chars } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', userId)
        .limit(1)

      if (chars && chars.length > 0) {
        setCharacter(chars[0])
        await loadAll(chars[0].id)
      } else {
        const name =
          session.user.user_metadata?.username ||
          session.user.email?.split('@')[0] ||
          'Novo Discípulo'
        const { data: created } = await supabase
          .from('characters')
          .insert({ user_id: userId, name, yuan: 100 })
          .select()
          .single()
        if (created) setCharacter(created)
      }
    }
    bootstrap()
  }, [session, isDemo, setCharacter, loadAll])

  // ── Demo mode ──────────────────────────────────────────────
  const handleDemo = () => {
    setIsDemo(true)
    setCharacter(DEMO_CHARACTER)
  }

  // ── Loading splash ─────────────────────────────────────────
  if (session === 'loading') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-matsuri-ink">
        <div className="text-center">
          <div className="font-hanzi text-5xl text-matsuri-imperial animate-pulse mb-4">祭</div>
          <p className="text-matsuri-paper/30 text-xs tracking-widest uppercase">Carregando o mundo...</p>
        </div>
      </div>
    )
  }

  // ── Auth screen ────────────────────────────────────────────
  if (!session && !isDemo) return <AuthScreen onDemo={handleDemo} />

  // ── Game world ─────────────────────────────────────────────
  return (
    <div className="w-full h-full relative">
      {/* Base world (PixiJS) */}
      <GameScene />

      {/* React HUD overlay */}
      {character && <HUD />}

      {/* Level-up alert */}
      {levelUpAlert && (
        <div
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          onClick={clearLevelUp}
        >
          <div className="bg-matsuri-gold text-matsuri-ink font-display text-2xl px-8 py-4 rounded-2xl shadow-2xl animate-gold-burst text-center">
            <div className="text-4xl mb-1">⬆</div>
            <div className="tracking-widest">NÍVEL {levelUpAlert}!</div>
            <div className="text-sm font-body mt-1 opacity-70">+3 pontos de atributo</div>
          </div>
        </div>
      )}

      {/* Panels (mutually exclusive) */}
      {activePanel === 'character' && <CharacterPanel />}
      {activePanel === 'inventory' && <InventoryPanel />}
      {activePanel === 'talents'   && <TalentTreePanel />}

      {/* Modals */}
      {activeLearning  && <LearningModal hanzi={activeLearning} />}
      {pendingReward   && <MissionRewardModal />}
    </div>
  )
}
