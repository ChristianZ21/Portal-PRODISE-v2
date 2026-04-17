'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [mounted, setMounted]   = useState(false)
  const { login, user }         = useAuth()
  const router                  = useRouter()
  const userRef                 = useRef(null)

  useEffect(() => {
    setMounted(true)
    setTimeout(() => userRef.current?.focus(), 400)
  }, [])

  useEffect(() => {
    if (user) router.push('/servicios')
  }, [user, router])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Ingresa usuario y contraseña')
      return
    }
    setLoading(true)
    setError('')
    const result = await login(username.trim(), password)
    if (!result.success) {
      setError(result.error || 'Credenciales incorrectas')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', background: '#060608',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>

      {/* ── Fondo: foto de planta ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: 'url(/fondo_planta.jpg)',
        backgroundSize: 'cover', backgroundPosition: '85% 20%',
        filter: 'brightness(0.28) saturate(0.7)',
      }} />

      {/* ── Vignette overlay ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(6,6,8,0.75) 100%)',
      }} />

      {/* ── Línea de acento superior ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2, zIndex: 10,
        background: 'linear-gradient(90deg, transparent 0%, #E67E22 30%, #E67E22 70%, transparent 100%)',
        opacity: 0.6,
      }} />

      {/* ── Card principal ── */}
      <div style={{
        position: 'relative', zIndex: 5,
        width: '100%', maxWidth: 380,
        margin: '0 20px',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>

        {/* Logo PRODISE — integrado, difuminado con glow */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          marginBottom: 32,
        }}>
          {/* Halo de luz detrás del logo */}
          <div style={{
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* Glow difuso */}
            <div style={{
              position: 'absolute',
              width: 200, height: 60,
              background: 'radial-gradient(ellipse, rgba(230,126,34,0.18) 0%, transparent 70%)',
              filter: 'blur(16px)',
              transform: 'scaleY(0.6)',
            }} />
            {/* Logo con múltiples capas para integración */}
            <div style={{ position: 'relative' }}>
              <img
                src="/logo_prodise.png"
                alt="PRODISE"
                style={{
                  height: 52,
                  objectFit: 'contain',
                  mixBlendMode: 'lighten',
                  filter: 'brightness(0.92) drop-shadow(0 0 18px rgba(230,126,34,0.35)) drop-shadow(0 0 40px rgba(230,126,34,0.15))',
                  display: 'block',
                }}
              />
            </div>
          </div>

          {/* Separador con línea sutil */}
          <div style={{
            width: 80, height: 1, marginTop: 16,
            background: 'linear-gradient(90deg, transparent, rgba(230,126,34,0.3), transparent)',
          }} />

          <div style={{
            fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.25)',
            fontWeight: 600, marginTop: 10, textTransform: 'uppercase',
          }}>
            Portal Operativo
          </div>
        </div>

        {/* Formulario */}
        <div style={{
          background: 'rgba(12,12,16,0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14,
          padding: '28px 28px 24px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(230,126,34,0.04) inset',
        }}>

          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#E8E8E8', marginBottom: 4 }}>
              Iniciar sesión
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
              Ingresa con tus credenciales PRODISE
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Usuario */}
            <div>
              <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                USUARIO
              </label>
              <input
                ref={userRef}
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                placeholder="Tu nombre de usuario"
                autoComplete="username"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, padding: '11px 14px',
                  color: '#E8E8E8', fontSize: 13,
                  fontFamily: 'Inter, sans-serif',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#E67E22'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                CONTRASEÑA
              </label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, padding: '11px 14px',
                  color: '#E8E8E8', fontSize: 13,
                  fontFamily: 'Inter, sans-serif',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#E67E22'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                fontSize: 12, color: '#E8A09A', padding: '9px 12px',
                background: 'rgba(192,57,43,0.08)',
                border: '1px solid rgba(192,57,43,0.15)',
                borderRadius: 7,
              }}>
                {error}
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                width: '100%', padding: '13px',
                background: loading ? 'rgba(230,126,34,0.4)' : '#E67E22',
                border: 'none', borderRadius: 8,
                color: 'white', fontSize: 13, fontWeight: 700,
                fontFamily: 'Inter, sans-serif',
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: 0.3,
                transition: 'opacity 0.2s, transform 0.1s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={e => { if (!loading) e.target.style.opacity = '0.9' }}
              onMouseLeave={e => { e.target.style.opacity = '1' }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 14, height: 14,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'loginSpin 0.7s linear infinite',
                  }} />
                  Autenticando...
                </>
              ) : 'Ingresar al portal'}
            </button>
          </form>
        </div>

        {/* Indicadores de clientes */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 20,
          marginTop: 22, opacity: 0.25,
        }}>
          {['MARCOBRE', 'HUDBAY', 'LAS BAMBAS'].map(c => (
            <div key={c} style={{ fontSize: 8, letterSpacing: 1.5, color: 'white', fontWeight: 600 }}>{c}</div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute', bottom: 18, left: 0, right: 0, zIndex: 5,
        textAlign: 'center', fontSize: 10,
        color: 'rgba(255,255,255,0.18)', letterSpacing: 0.3,
      }}>
        PRODISE Ingeniería &amp; Servicios © 2026 · Desarrollado por CJP y GM
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes loginSpin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  )
}
