import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabaseClient'
import { useGameStore } from './stores/gameStore'
import { AuthScreen } from './components/AuthScreen'
import { GameScene } from './components/GameScene'
import { HUD } from './components/HUD'
import { LearningModal } from './components/LearningModal'

const DEMO_CHARACTER = {
  id: 'demo-00000000-0000-0000-0000-000000000000',
  name: 'Aprendiz Viajante',
  level: 1,
  xp: 0,
  qi: 100,
  position_x: 450,
  position_y: 300,
  avatar: { color: 'red' },
}

export default function App() {
  const [session, setSession] = useState<Session | null | 'loading'>('loading')
  const [isDemo, setIsDemo] = useState(false)
  const { setCharacter, loadLearningProgress, activeLearning, character } = useGameStore()

  // Track auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // When session changes → load or create character
  useEffect(() => {
    if (!session || session === 'loading' || isDemo) return
    const userId = session.user.id

    const bootstrap = async () => {
      // Try to load existing character
      const { data: chars } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', userId)
        .limit(1)

      if (chars && chars.length > 0) {
        setCharacter(chars[0])
        await loadLearningProgress(chars[0].id)
      } else {
        // Create new character for this user
        const name =
          session.user.user_metadata?.username ||
          session.user.email?.split('@')[0] ||
          'Novo Discípulo'
        const { data: created } = await supabase
          .from('characters')
          .insert({ user_id: userId, name })
          .select()
          .single()
        if (created) setCharacter(created)
      }
    }

    bootstrap()
  }, [session, isDemo, setCharacter, loadLearningProgress])

  // Demo mode handler
  const handleDemo = () => {
    setIsDemo(true)
    setCharacter(DEMO_CHARACTER)
  }

  // Loading splash
  if (session === 'loading') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-matsuri-ink">
        <div className="text-center">
          <div className="font-hanzi text-5xl text-matsuri-imperial animate-pulse mb-4">祭</div>
          <p className="text-matsuri-paper/30 text-xs tracking-widest uppercase">Carregando...</p>
        </div>
      </div>
    )
  }

  // Auth screen (not logged in and not in demo)
  if (!session && !isDemo) {
    return <AuthScreen onDemo={handleDemo} />
  }

  // Game world
  return (
    <div className="w-full h-full relative">
      {character && <HUD />}
      <GameScene />
      {activeLearning && <LearningModal hanzi={activeLearning} />}
    </div>
  )
}
