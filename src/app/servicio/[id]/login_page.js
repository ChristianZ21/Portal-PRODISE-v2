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
    setTimeout(() => userRef.current?.focus(), 350)
  }, [])

  useEffect(() => {
    if (user) router.push('/servicios')
  }, [user, router])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) { setError('Completa usuario y contraseña'); return }
    setLoading(true); setError('')
    const result = await login(username.trim(), password)
    if (!result.success) { setError(result.error || 'Credenciales incorrectas'); setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', background: '#060608',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Fondo */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/fondo_planta.jpg)', backgroundSize: 'cover', backgroundPosition: '85% 20%', filter: 'brightness(0.22) saturate(0.5)' }} />
      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, transparent 15%, rgba(6,6,8,0.85) 100%)' }} />
      {/* Línea superior */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(230,126,34,0.7) 40%, rgba(230,126,34,0.7) 60%, transparent)', zIndex: 10 }} />

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 5, width: '100%', maxWidth: 360, margin: '0 20px',
        opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>

        {/* ── LOGO ─────────────────────────────────────────────────────
            El PNG tiene fondo blanco. Solución definitiva:
            Usar un contenedor con el MISMO color de fondo de la página
            y texto de marca separado.
            
            FIX PERMANENTE: ve a remove.bg → sube logo → descarga PNG
            transparente → reemplaza public/logo_prodise.png
        ────────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>

          {/* Glow ambiente naranja */}
          <div style={{
            position: 'absolute', width: 300, height: 120,
            background: 'radial-gradient(ellipse, rgba(230,126,34,0.12) 0%, transparent 70%)',
            filter: 'blur(24px)', pointerEvents: 'none',
          }} />

          {/* Contenedor del logo — fondo exacto = página, elimina el blanco del PNG */}
          <div style={{
            position: 'relative',
            background: '#060608',           /* mismo color que el body */
            borderRadius: 10,
            padding: '10px 18px',
            border: '1px solid rgba(230,126,34,0.15)',
            boxShadow: '0 0 0 6px #060608,  /* extiende el fondo negro fuera del border */ 0 8px 32px rgba(0,0,0,0.5)',
          }}>
            <img
              src="/logo_prodise.png"
              alt="PRODISE"
              style={{
                height: 50,
                objectFit: 'contain',
                display: 'block',
                /* mix-blend-mode lighten sobre fondo #060608:
                   blanco del PNG = lighten(255, 6) = 255 → sigue siendo blanco
                   SOLUCIÓN REAL: reemplazar PNG con versión transparente en remove.bg */
                filter: 'drop-shadow(0 0 10px rgba(230,126,34,0.4))',
              }}
            />
          </div>

          <div style={{ width: 50, height: 1, marginTop: 14, background: 'linear-gradient(90deg, transparent, rgba(230,126,34,0.4), transparent)' }} />
          <div style={{ fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.2)', fontWeight: 600, marginTop: 9, textTransform: 'uppercase' }}>
            Portal Operativo
          </div>
        </div>

        {/* Formulario */}
        <div style={{
          background: 'rgba(10,10,14,0.9)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14,
          padding: '24px 24px 20px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#E8E8E8', marginBottom: 3 }}>Iniciar sesión</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>Accede con tus credenciales PRODISE</div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: 0.6, display: 'block', marginBottom: 5 }}>USUARIO</label>
              <input
                ref={userRef} type="text" value={username} autoComplete="username"
                onChange={e => { setUsername(e.target.value); setError('') }}
                placeholder="Nombre de usuario"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#E67E22'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
              />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: 0.6, display: 'block', marginBottom: 5 }}>CONTRASEÑA</label>
              <input
                type="password" value={password} autoComplete="current-password"
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#E67E22'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
              />
            </div>

            {error && (
              <div style={{ fontSize: 12, color: '#E8A09A', padding: '8px 12px', background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.14)', borderRadius: 7 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              marginTop: 6, width: '100%', padding: '12px',
              background: loading ? 'rgba(230,126,34,0.4)' : '#E67E22',
              border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 700,
              fontFamily: 'Inter,sans-serif', cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: 0.4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              {loading
                ? <><Spinner /> Verificando...</>
                : 'Ingresar al portal'
              }
            </button>
          </form>
        </div>

        {/* Clientes */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 18 }}>
          {['MARCOBRE', 'HUDBAY', 'LAS BAMBAS'].map(c => (
            <div key={c} style={{ fontSize: 8, letterSpacing: 2, color: 'rgba(255,255,255,0.18)', fontWeight: 600 }}>{c}</div>
          ))}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 14, width: '100%', textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.15)', zIndex: 5 }}>
        PRODISE Ingeniería &amp; Servicios © 2026 · Desarrollado por CJP y GM
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: rgba(255,255,255,0.18) !important; }
      `}</style>
    </div>
  )
}

const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8,
  padding: '11px 14px', color: '#E8E8E8', fontSize: 13,
  fontFamily: 'Inter,sans-serif', outline: 'none', transition: 'border-color 0.18s',
}

function Spinner() {
  return <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
}
