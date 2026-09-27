'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import gsap from 'gsap'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login, user }         = useAuth()
  const router                  = useRouter()
  const userRef                 = useRef(null)
  const logoRef   = useRef(null)
  const cardRef   = useRef(null)
  const bgRef     = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (user) { router.push('/servicios'); return }
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.fromTo(bgRef.current,    { opacity: 0 }, { opacity: 1, duration: 1.2 })
      .fromTo(logoRef.current,  { opacity: 0, y: -28, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.75, ease: 'back.out(1.4)' }, 0.3)
      .fromTo(cardRef.current,  { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6 }, 0.55)
      .fromTo(bottomRef.current,{ opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.85)
    setTimeout(() => userRef.current?.focus(), 800)
  }, [user, router])

  useEffect(() => { if (user) router.push('/servicios') }, [user, router])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) { setError('Completa usuario y contraseña'); return }
    gsap.to(cardRef.current, { scale: 0.99, duration: 0.1 })
    setLoading(true); setError('')
    const result = await login(username.trim(), password)
    gsap.to(cardRef.current, { scale: 1, duration: 0.15 })
    if (!result.success) {
      gsap.fromTo(cardRef.current, { x: 0 }, { x: 8, duration: 0.06, repeat: 5, yoyo: true, onComplete: () => gsap.set(cardRef.current, { x: 0 }) })
      setError(result.error || 'Credenciales incorrectas')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', background: 'var(--bg)', fontFamily: 'inherit' }}>

      {/* Fondo */}
      <div ref={bgRef} style={{ position: 'absolute', inset: 0, opacity: 0, backgroundImage: 'url(/fondo_planta.jpg)', backgroundSize: 'cover', backgroundPosition: '85% 20%', filter: 'brightness(0.28) saturate(0.55)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 38%, transparent 10%, rgba(14,15,19,0.88) 100%)' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 70%, transparent) 35%, color-mix(in srgb, var(--accent) 70%, transparent) 65%, transparent)', zIndex: 10 }} />

      <div style={{ position: 'relative', zIndex: 5, width: '100%', maxWidth: 360, margin: '0 20px' }}>

        {/* ── LOGO con bordes difuminados ────────────────────────
            Técnica: caja blanca con border-radius generoso y
            box-shadow con blur alto + gradiente radial para
            que los bordes se "pierdan" en el fondo oscuro.
        ─────────────────────────────────────────────────────── */}
        <div ref={logoRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24, opacity: 0 }}>

          {/* Glow ambiental naranja detrás */}
          <div style={{ position: 'absolute', width: 300, height: 120, background: 'radial-gradient(ellipse, color-mix(in srgb, var(--accent) 10%, transparent) 0%, transparent 70%)', filter: 'blur(22px)', pointerEvents: 'none' }} />

          {/* Contenedor del logo con bordes difuminados */}
          <div style={{
            position: 'relative',
            background: 'color-mix(in srgb, var(--ink) 94%, transparent)',
            borderRadius: 18,
            padding: '14px 28px 12px',
            /* El truco: box-shadow con gran spread y blur crea
               el efecto de que los bordes se disuelven */
            boxShadow: `
              0 0 0 1px color-mix(in srgb, var(--ink) 15%, transparent),
              0 0 18px 8px color-mix(in srgb, var(--ink) 8%, transparent),
              0 0 40px 16px color-mix(in srgb, var(--ink) 4%, transparent),
              0 0 70px 28px color-mix(in srgb, var(--ink) 1.5%, transparent),
              0 8px 32px rgba(0,0,0,0.5)
            `,
          }}>
            {/* Pseudo-difuminado con gradiente en los bordes */}
            <div style={{
              position: 'absolute', inset: -1, borderRadius: 18,
              background: 'radial-gradient(ellipse at center, transparent 60%, rgba(14,15,19,0.7) 100%)',
              pointerEvents: 'none',
            }} />
            <img
              src="/logo_prodise.png"
              alt="PRODISE"
              style={{
                height: 72, objectFit: 'contain', display: 'block', position: 'relative',
                filter: 'drop-shadow(0 1px 6px color-mix(in srgb, var(--accent) 20%, transparent))',
              }}
            />
          </div>

          <div style={{ width: 36, height: 1, marginTop: 16, background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 35%, transparent), transparent)' }} />
          <div style={{ fontSize: 9, letterSpacing: 3.5, color: 'var(--text3)', fontWeight: 600, marginTop: 9, textTransform: 'uppercase' }}>
            Portal Operativo
          </div>
        </div>

        {/* Formulario */}
        <div ref={cardRef} style={{ background: 'rgba(10,10,16,0.92)', backdropFilter: 'blur(20px)', border: '1px solid color-mix(in srgb, var(--ink) 6%, transparent)', borderRadius: 14, padding: '24px 24px 20px', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', opacity: 0 }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>Iniciar sesión</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Accede con tus credenciales PRODISE</div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <div>
              <label style={lbl}>USUARIO</label>
              <input ref={userRef} type="text" value={username} autoComplete="username"
                onChange={e => { setUsername(e.target.value.toUpperCase()); setError('') }}
                placeholder="Nombre de usuario"
                style={inp}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.background = 'color-mix(in srgb, var(--accent) 4%, transparent)' }}
                onBlur={e => { e.target.style.borderColor = 'color-mix(in srgb, var(--ink) 7%, transparent)'; e.target.style.background = 'color-mix(in srgb, var(--ink) 4.5%, transparent)' }}
              />
            </div>
            <div>
              <label style={lbl}>CONTRASEÑA</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={password} autoComplete="current-password"
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  style={{ ...inp, paddingRight: 56 }}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.background = 'color-mix(in srgb, var(--accent) 4%, transparent)' }}
                  onBlur={e => { e.target.style.borderColor = 'color-mix(in srgb, var(--ink) 7%, transparent)'; e.target.style.background = 'color-mix(in srgb, var(--ink) 4.5%, transparent)' }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                  {showPass ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            {error && <div style={{ fontSize: 12, color: 'var(--red)', padding: '8px 12px', background: 'color-mix(in srgb, var(--red) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--red) 14%, transparent)', borderRadius: 7 }}>{error}</div>}

            <button type="submit" disabled={loading}
              onMouseEnter={e => { if (!loading) gsap.to(e.currentTarget, { scale: 1.02, duration: 0.12 }) }}
              onMouseLeave={e => gsap.to(e.currentTarget, { scale: 1, duration: 0.12 })}
              style={{ marginTop: 6, width: '100%', padding: '12px', background: 'var(--accent)', border: 'none', borderRadius: 8, color: 'var(--on-accent)', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: 0.4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s' }}>
              {loading ? <><Spinner />Verificando...</> : 'Ingresar al portal'}
            </button>
          </form>
        </div>

        <div ref={bottomRef} style={{ opacity: 0 }}>
          <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text3)', marginTop: 16 }}>
            PROYECTOS DE INGENIERIA Y SERVICIOS S.C.R.L. © 2026 · CJP y GM
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: color-mix(in srgb, var(--ink) 20%, transparent) !important; }
      `}</style>
    </div>
  )
}

const lbl = { fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: 0.5, display: 'block', marginBottom: 5 }
const inp = { width: '100%', background: 'color-mix(in srgb, var(--ink) 4.5%, transparent)', border: '1px solid color-mix(in srgb, var(--ink) 7%, transparent)', borderRadius: 8, padding: '11px 14px', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.18s, background 0.18s' }

function Spinner() {
  return <div style={{ width: 13, height: 13, border: '2px solid color-mix(in srgb, var(--ink) 25%, transparent)', borderTopColor: 'var(--on-accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
}
