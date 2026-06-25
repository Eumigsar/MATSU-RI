import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

interface Props {
  onDemo: () => void
}

export function AuthScreen({ onDemo }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (mode === 'signup') {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: username || email.split('@')[0] } },
      })
      if (err) setError(err.message)
      else setSuccess('Confira seu e-mail para confirmar o acesso.')
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) setError(err.message)
    }

    setLoading(false)
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-matsuri-ink">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            #C9A84C 0px, #C9A84C 1px,
            transparent 1px, transparent 40px
          )`,
        }}
      />

      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="font-hanzi text-6xl text-matsuri-imperial mb-2">祭</div>
          <h1 className="font-display text-2xl text-matsuri-paper tracking-widest uppercase mb-1">
            Matsuri
          </h1>
          <p className="text-matsuri-paper/40 text-xs tracking-widest uppercase">
            Escola de Mandarim · RPG
          </p>
        </div>

        {/* Card */}
        <div className="bg-matsuri-paper rounded-lg shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-matsuri-stone/20">
            <button
              className={`flex-1 py-3 text-sm font-display tracking-wide transition-colors ${
                mode === 'signin'
                  ? 'bg-matsuri-imperial text-matsuri-paper'
                  : 'text-matsuri-stone hover:bg-matsuri-stone/5'
              }`}
              onClick={() => { setMode('signin'); setError(null); }}
            >
              Entrar
            </button>
            <button
              className={`flex-1 py-3 text-sm font-display tracking-wide transition-colors ${
                mode === 'signup'
                  ? 'bg-matsuri-imperial text-matsuri-paper'
                  : 'text-matsuri-stone hover:bg-matsuri-stone/5'
              }`}
              onClick={() => { setMode('signup'); setError(null); }}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs text-matsuri-stone uppercase tracking-wider mb-1">
                  Nome de Guerreiro
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu nome no mundo de Matsuri"
                  className="w-full border border-matsuri-stone/30 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-matsuri-imperial transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-matsuri-stone uppercase tracking-wider mb-1">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full border border-matsuri-stone/30 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-matsuri-imperial transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-matsuri-stone uppercase tracking-wider mb-1">
                Senha
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-matsuri-stone/30 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-matsuri-imperial transition-colors"
              />
            </div>

            {error && (
              <p className="text-matsuri-imperial text-xs bg-matsuri-imperial/5 border border-matsuri-imperial/20 rounded p-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-matsuri-jade text-xs bg-matsuri-jade/5 border border-matsuri-jade/20 rounded p-2">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-matsuri-imperial text-matsuri-paper py-3 rounded font-display tracking-wider text-sm hover:bg-matsuri-imperial/80 transition-colors disabled:opacity-50"
            >
              {loading ? '...' : mode === 'signin' ? 'Entrar no Mundo' : 'Iniciar Jornada'}
            </button>
          </form>

          {/* Demo divider */}
          <div className="px-6 pb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-matsuri-stone/20" />
              <span className="text-xs text-matsuri-stone/40">ou</span>
              <div className="flex-1 h-px bg-matsuri-stone/20" />
            </div>
            <button
              onClick={onDemo}
              className="w-full border-2 border-matsuri-stone/30 text-matsuri-stone py-2.5 rounded font-display tracking-wide text-sm hover:border-matsuri-jade hover:text-matsuri-jade transition-colors"
            >
              ⚡ Modo Demo — Jogar sem conta
            </button>
          </div>
        </div>

        <p className="text-center text-matsuri-paper/20 text-xs mt-4">
          O aprendizado é a única arma do herói.
        </p>
      </div>
    </div>
  )
}
