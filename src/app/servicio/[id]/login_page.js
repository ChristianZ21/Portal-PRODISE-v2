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
    if (!username.trim() || !password.trim()) { setError('Ingresa usuario y contraseña'); return }
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

      {/* Fondo planta */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: 'url(/fondo_planta.jpg)',
        backgroundSize: 'cover', backgroundPosition: '85% 20%',
        filter: 'brightness(0.25) saturate(0.6)',
      }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'radial-gradient(ellipse at center, transparent 20%, rgba(6,6,8,0.8) 100%)',
      }} />

      {/* Línea acento superior */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2, zIndex: 10,
        background: 'linear-gradient(90deg, transparent 0%, #E67E22 35%, #E67E22 65%, transparent 100%)',
        opacity: 0.55,
      }} />

      {/* Card principal */}
      <div style={{
        position: 'relative', zIndex: 5,
        width: '100%', maxWidth: 370, margin: '0 20px',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(18px)',
        transition: 'opacity 0.55s ease, transform 0.55s ease',
      }}>

        {/* ── LOGO ── 
            El PNG tiene fondo blanco. Técnica: caja negra + mixBlendMode:lighten
            El blanco del PNG se convierte en transparente al aplicar lighten sobre negro.
        */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Glow naranja detrás */}
            <div style={{
              position: 'absolute', width: 240, height: 80,
              background: 'radial-gradient(ellipse, rgba(230,126,34,0.22) 0%, transparent 65%)',
              filter: 'blur(18px)',
            }} />
            {/* Caja negra: neutraliza el fondo blanco del PNG bajo mixBlendMode:lighten */}
            <div style={{
              position: 'relative',
              background: '#060608',
              borderRadius: 6,
              padding: '2px 6px',
              boxShadow: '0 0 0 8px #060608',  /* extiende el negro para cubrir el halo blanco */
            }}>
              <img
                src="/logo_prodise.png"
                alt="PRODISE"
                style={{
                  height: 54, objectFit: 'contain', display: 'block',
                  mixBlendMode: 'lighten',
                  filter: 'drop-shadow(0 0 12px rgba(230,126,34,0.6)) drop-shadow(0 0 28px rgba(230,126,34,0.25))',
                }}
              />
            </div>
          </div>

          <div style={{
            width: 60, height: 1, marginTop: 18,
            background: 'linear-gradient(90deg, transparent, rgba(230,126,34,0.35), transparent)',
          }} />
          <div style={{ fontSize: 9, letterSpacing: 3.5, color: 'rgba(255,255,255,0.22)', fontWeight: 600, marginTop: 10, textTransform: 'uppercase' }}>
            Portal Operativo
          </div>
        </div>

        {/* Formulario */}
        <div style={{
          background: 'rgba(10,10,14,0.88)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 14,
          padding: '26px 26px 22px',
          boxShadow: '0 28px 64px rgba(0,0,0,0.65)',
        }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#E8E8E8', marginBottom: 3 }}>Iniciar sesión</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>Ingresa con tus credenciales PRODISE</div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <div>
              <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', fontWeight: 600, letterSpacing: 0.6, display: 'block', marginBottom: 5 }}>USUARIO</label>
              <input
                ref={userRef} type="text" value={username} autoComplete="username"
                onChange={e => { setUsername(e.target.value); setError('') }}
                placeholder="Nombre de usuario"
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '11px 14px', color: '#E8E8E8', fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#E67E22'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', fontWeight: 600, letterSpacing: 0.6, display: 'block', marginBottom: 5 }}>CONTRASEÑA</label>
              <input
                type="password" value={password} autoComplete="current-password"
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="••••••••"
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '11px 14px', color: '#E8E8E8', fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#E67E22'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>

            {error && (
              <div style={{ fontSize: 12, color: '#E8A09A', padding: '9px 12px', background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.15)', borderRadius: 7 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              marginTop: 4, width: '100%', padding: '12px',
              background: loading ? 'rgba(230,126,34,0.4)' : '#E67E22',
              border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 700,
              fontFamily: 'Inter,sans-serif', cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: 0.5, transition: 'opacity 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {loading ? (
                <><div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'loginSpin 0.7s linear infinite' }} />Autenticando...</>
              ) : 'Ingresar al portal'}
            </button>
          </form>
        </div>

        {/* Clientes */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 22, marginTop: 20, opacity: 0.2 }}>
          {['MARCOBRE', 'HUDBAY', 'LAS BAMBAS'].map(c => (
            <div key={c} style={{ fontSize: 8, letterSpacing: 2, color: 'white', fontWeight: 600 }}>{c}</div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, zIndex: 5, textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.16)', letterSpacing: 0.3 }}>
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
