import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

interface Props {
  onDemo: () => void
}

export function AuthScreen({ onDemo }: Props) {
  const [mode, setMode]         = useState<'signin' | 'signup'>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState<string | null>(null)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null); setSuccess(null); setLoading(true)
    if (mode === 'signup') {
      const { error: err } = await supabase.auth.signUp({
        email, password,
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
    <div
      className="relative w-full h-full overflow-hidden flex items-center justify-center"
      style={{
        backgroundImage: 'url(/assets/bg-login.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundColor: '#EDE4D0',
      }}
    >
      {/* Subtle vignette so card pops against bright centre */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 65% at 50% 50%, transparent 25%, rgba(30,12,4,0.12) 100%)',
      }} />

      {/* ═══════════════════════════════════════════════════
          MAIN CARD
      ════════════════════════════════════════════════════ */}
      <div className="relative z-10 w-full max-w-sm mx-5"
        style={{ filter: 'drop-shadow(0 28px 72px rgba(20,8,2,0.28))' }}>

        <div className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(252,247,240,0.93)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid rgba(200,165,100,0.28)',
          }}>

          {/* ── Logo ─────────────────────────────────────── */}
          <div className="flex flex-col items-center pt-9 pb-5 px-8">
            {/* Enso + 祭 */}
            <div className="relative mb-3">
              <svg width="88" height="88" viewBox="0 0 92 92">
                <circle cx="46" cy="46" r="36" fill="none" stroke="#AA1010" strokeWidth="5.5"
                  strokeLinecap="round" strokeDasharray="196 30"
                  transform="rotate(-105 46 46)" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span style={{
                  fontFamily: '"Noto Serif SC", serif',
                  fontSize: '2.5rem', color: '#AA1010',
                  fontWeight: 700, lineHeight: 1,
                }}>祭</span>
              </div>
              {/* Wax seal */}
              <div className="absolute -right-1 -bottom-1 w-5 h-5 rounded-sm flex items-center justify-center"
                style={{ background: '#AA1010' }}>
                <span style={{ color: '#FFF0D8', fontSize: '0.38rem', fontFamily: 'serif', fontWeight: 700 }}>営</span>
              </div>
            </div>

            <h1 style={{
              fontFamily: '"Noto Serif SC", serif',
              letterSpacing: '0.38em', fontSize: '1.55rem',
              fontWeight: 700, color: '#1A0A04', marginBottom: 3,
            }}>MATSURI</h1>

            <p style={{
              letterSpacing: '0.18em', fontSize: '0.6rem',
              color: '#8A6040', fontWeight: 600, marginBottom: 8,
            }}>SEU CAMINHO. SUA LENDA.</p>

            {/* Ornamental divider */}
            <div className="flex items-center gap-2">
              <div className="h-px w-10" style={{ background: 'linear-gradient(to right, transparent, #C9A060)' }} />
              <svg width="14" height="14" viewBox="0 0 14 14">
                <polygon points="7,0 14,7 7,14 0,7" fill="#C9A060" opacity="0.8" />
                <polygon points="7,3 11,7 7,11 3,7" fill="rgba(252,247,240,0.93)" />
              </svg>
              <div className="h-px w-10" style={{ background: 'linear-gradient(to left, transparent, #C9A060)' }} />
            </div>
          </div>

          {/* ── Mode tabs ────────────────────────────────── */}
          <div className="flex mx-8 mb-5 rounded-lg overflow-hidden"
            style={{ border: '1px solid #E0CDB0' }}>
            {(['signin', 'signup'] as const).map((m) => (
              <button key={m}
                onClick={() => { setMode(m); setError(null) }}
                className="flex-1 py-2.5 text-sm font-semibold transition-all"
                style={{
                  fontFamily: '"Noto Serif SC", serif',
                  letterSpacing: '0.06em',
                  background: mode === m ? '#AA1010' : 'transparent',
                  color: mode === m ? '#FFF5E8' : '#8A6040',
                }}>
                {m === 'signin' ? 'Entrar' : 'Criar Conta'}
              </button>
            ))}
          </div>

          {/* ── Form ─────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="px-8 flex flex-col gap-3">

            {mode === 'signup' && (
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16"
                  viewBox="0 0 24 24" fill="none" stroke="#A08060" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nome de guerreiro"
                  className="w-full pl-9 pr-4 py-3 text-sm rounded-lg outline-none transition-all"
                  style={{ background: '#F8F0E4', border: '1.5px solid #D8C8A8', color: '#3A1A08', fontFamily: 'inherit' }}
                  onFocus={(e) => { e.target.style.borderColor = '#AA1010' }}
                  onBlur={(e)  => { e.target.style.borderColor = '#D8C8A8' }}
                />
              </div>
            )}

            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16"
                viewBox="0 0 24 24" fill="none" stroke="#A08060" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                className="w-full pl-9 pr-4 py-3 text-sm rounded-lg outline-none transition-all"
                style={{ background: '#F8F0E4', border: '1.5px solid #D8C8A8', color: '#3A1A08' }}
                onFocus={(e) => { e.target.style.borderColor = '#AA1010' }}
                onBlur={(e)  => { e.target.style.borderColor = '#D8C8A8' }}
              />
            </div>

            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16"
                viewBox="0 0 24 24" fill="none" stroke="#A08060" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input type={showPass ? 'text' : 'password'} required minLength={6}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                className="w-full pl-9 pr-10 py-3 text-sm rounded-lg outline-none transition-all"
                style={{ background: '#F8F0E4', border: '1.5px solid #D8C8A8', color: '#3A1A08' }}
                onFocus={(e) => { e.target.style.borderColor = '#AA1010' }}
                onBlur={(e)  => { e.target.style.borderColor = '#D8C8A8' }}
              />
              <button type="button" onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#A08060', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showPass
                    ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                    : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                  }
                </svg>
              </button>
            </div>

            {error   && <p className="text-xs px-3 py-2 rounded-lg"
              style={{ color:'#AA1010', background:'rgba(170,16,16,0.07)', border:'1px solid rgba(170,16,16,0.18)' }}>{error}</p>}
            {success && <p className="text-xs px-3 py-2 rounded-lg"
              style={{ color:'#1A7030', background:'rgba(26,112,48,0.07)', border:'1px solid rgba(26,112,48,0.18)' }}>{success}</p>}

            {/* ── ENTRAR button ─────────────────────────── */}
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-lg font-bold text-sm transition-all mt-1 relative overflow-hidden"
              style={{
                background: loading ? '#C06050' : '#AA1010',
                color: '#FFF5E8',
                fontFamily: '"Noto Serif SC", serif',
                letterSpacing: '0.32em',
                boxShadow: '0 5px 22px rgba(170,16,16,0.38), inset 0 1px 0 rgba(255,255,255,0.12)',
                border: 'none', cursor: loading ? 'wait' : 'pointer',
              }}>
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'repeating-linear-gradient(92deg, transparent 0px, transparent 18px, rgba(0,0,0,0.04) 18px, rgba(0,0,0,0.04) 19px)',
              }} />
              <span className="relative">
                {loading ? '···' : mode === 'signin' ? 'ENTRAR' : 'INICIAR JORNADA'}
              </span>
            </button>
          </form>

          {/* ── Footer ───────────────────────────────────── */}
          <div className="px-8 pt-4 pb-8 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: '#E0CDB0' }} />
              <span className="text-xs" style={{ color: '#B09070', letterSpacing: '0.12em' }}>OU</span>
              <div className="flex-1 h-px" style={{ background: '#E0CDB0' }} />
            </div>

            <button type="button"
              className="w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-3 transition-all"
              style={{ background: 'white', border: '1.5px solid #D8C8A8', color: '#3A2010', letterSpacing: '0.06em', cursor: 'pointer' }}
              onClick={() => alert('Login com Google — em breve!')}>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              CONTINUAR COM GOOGLE
            </button>

            <button onClick={onDemo}
              className="w-full py-2.5 rounded-lg text-sm transition-all"
              style={{
                border: '1.5px dashed #C8A060', color: '#7A5828',
                background: 'rgba(200,160,60,0.06)',
                fontFamily: '"Noto Serif SC", serif', letterSpacing: '0.06em',
                cursor: 'pointer',
              }}>
              ⚡ Modo Demo — Jogar sem conta
            </button>

            <button type="button" className="text-center text-xs mt-1 w-full"
              style={{ color: '#AA1010', textDecoration: 'underline', textUnderlineOffset: 3, background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => alert('Recuperação de senha — em breve!')}>
              Esqueceu sua senha?
            </button>
          </div>
        </div>

        <p className="text-center mt-4 text-xs" style={{ color: 'rgba(60,25,8,0.45)', letterSpacing: '0.1em' }}>
          O aprendizado é a única arma do herói.
        </p>
      </div>
    </div>
  )
}
