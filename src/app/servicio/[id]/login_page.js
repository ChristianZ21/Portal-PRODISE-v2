'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import gsap from 'gsap'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login, user }         = useAuth()
  const router                  = useRouter()
  const userRef                 = useRef(null)

  // Refs para GSAP
  const bgRef      = useRef(null)
  const logoRef    = useRef(null)
  const dividerRef = useRef(null)
  const tagRef     = useRef(null)
  const cardRef    = useRef(null)
  const clientsRef = useRef(null)
  const footerRef  = useRef(null)
  const lineRef    = useRef(null)

  useEffect(() => {
    if (user) { router.push('/servicios'); return }

    // ── Secuencia de entrada GSAP ──────────────────────────────
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    // Línea superior aparece primero
    tl.fromTo(lineRef.current,
      { scaleX: 0, transformOrigin: 'center' },
      { scaleX: 1, duration: 0.8 }
    )
    // Fondo sube del negro
    .fromTo(bgRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 1.2 },
      '<'
    )
    // Logo cae desde arriba con rebote suave
    .fromTo(logoRef.current,
      { opacity: 0, y: -40, scale: 0.85 },
      { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'back.out(1.4)' },
      0.3
    )
    // Separador y tag aparecen
    .fromTo([dividerRef.current, tagRef.current],
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 },
      0.8
    )
    // Card sube desde abajo
    .fromTo(cardRef.current,
      { opacity: 0, y: 32, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power2.out' },
      0.7
    )
    // Clientes y footer
    .fromTo([clientsRef.current, footerRef.current],
      { opacity: 0 },
      { opacity: 1, duration: 0.6, stagger: 0.1 },
      1.1
    )

    setTimeout(() => userRef.current?.focus(), 900)
  }, [user, router])

  useEffect(() => {
    if (user) router.push('/servicios')
  }, [user, router])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) { setError('Completa usuario y contraseña'); return }

    // Animación de carga en el card
    gsap.to(cardRef.current, { scale: 0.99, duration: 0.15 })
    setLoading(true); setError('')

    const result = await login(username.trim(), password)
    gsap.to(cardRef.current, { scale: 1, duration: 0.15 })

    if (!result.success) {
      // Shake de error
      gsap.fromTo(cardRef.current,
        { x: 0 },
        { x: 10, duration: 0.07, repeat: 5, yoyo: true, ease: 'power1.inOut',
          onComplete: () => gsap.set(cardRef.current, { x: 0 }) }
      )
      setError(result.error || 'Credenciales incorrectas')
      setLoading(false)
    } else {
      // Fade out suave al entrar
      gsap.to([logoRef.current, cardRef.current, clientsRef.current], {
        opacity: 0, y: -20, duration: 0.4, stagger: 0.05, ease: 'power2.in'
      })
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', background: '#060608',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>

      {/* Fondo */}
      <div ref={bgRef} style={{
        position: 'absolute', inset: 0, opacity: 0,
        backgroundImage: 'url(/fondo_planta.jpg)',
        backgroundSize: 'cover', backgroundPosition: '85% 20%',
        filter: 'brightness(0.22) saturate(0.5)',
      }} />
      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, transparent 15%, rgba(6,6,8,0.88) 100%)' }} />
      {/* Línea acento */}
      <div ref={lineRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(230,126,34,0.75) 35%, rgba(230,126,34,0.75) 65%, transparent)', zIndex: 10, transformOrigin: 'center' }} />

      {/* Card central */}
      <div style={{ position: 'relative', zIndex: 5, width: '100%', maxWidth: 360, margin: '0 20px' }}>

        {/* ── LOGO con glow blanco difuminado ── */}
        <div ref={logoRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24, opacity: 0 }}>

          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '8px 4px' }}>

            {/* Halo blanco suave — da la sensación de luz ambiental */}
            <div style={{
              position: 'absolute',
              width: '130%', height: '180%',
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 45%, transparent 70%)',
              filter: 'blur(10px)',
              pointerEvents: 'none',
            }} />

            {/* Glow naranja cálido debajo */}
            <div style={{
              position: 'absolute',
              width: '160%', height: '220%',
              background: 'radial-gradient(ellipse at center, rgba(230,126,34,0.18) 0%, rgba(230,126,34,0.06) 50%, transparent 70%)',
              filter: 'blur(18px)',
              pointerEvents: 'none',
            }} />

            {/* Logo — PNG transparente flota sobre los halos */}
            <img
              src="/logo_prodise.png"
              alt="PRODISE"
              style={{
                height: 60,
                objectFit: 'contain',
                display: 'block',
                position: 'relative',
                zIndex: 1,
                filter: 'drop-shadow(0 2px 12px rgba(230,126,34,0.35)) drop-shadow(0 0 4px rgba(255,255,255,0.15))',
              }}
            />
          </div>

          {/* Separador */}
          <div ref={dividerRef} style={{ width: 44, height: 1, marginTop: 14, background: 'linear-gradient(90deg, transparent, rgba(230,126,34,0.4), transparent)', opacity: 0 }} />
          <div ref={tagRef} style={{ fontSize: 9, letterSpacing: 3.5, color: 'rgba(255,255,255,0.22)', fontWeight: 600, marginTop: 9, textTransform: 'uppercase', opacity: 0 }}>
            Portal Operativo
          </div>
        </div>

        {/* Formulario */}
        <div ref={cardRef} style={{
          background: 'rgba(10,10,14,0.9)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14,
          padding: '24px 24px 20px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          opacity: 0,
        }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#E8E8E8', marginBottom: 3 }}>Iniciar sesión</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>Accede con tus credenciales PRODISE</div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <Field label="USUARIO">
              <input
                ref={userRef} type="text" value={username} autoComplete="username"
                onChange={e => { setUsername(e.target.value); setError('') }}
                placeholder="Nombre de usuario"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#E67E22'; e.target.style.background = 'rgba(230,126,34,0.04)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; e.target.style.background = 'rgba(255,255,255,0.045)' }}
              />
            </Field>
            <Field label="CONTRASEÑA">
              <input
                type="password" value={password} autoComplete="current-password"
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#E67E22'; e.target.style.background = 'rgba(230,126,34,0.04)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; e.target.style.background = 'rgba(255,255,255,0.045)' }}
              />
            </Field>

            {error && (
              <div style={{ fontSize: 12, color: '#E8A09A', padding: '8px 12px', background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.14)', borderRadius: 7 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ marginTop: 6, width: '100%', padding: '12px', background: '#E67E22', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'Inter,sans-serif', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: 0.4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s' }}
              onMouseEnter={e => { if (!loading) gsap.to(e.currentTarget, { scale: 1.02, duration: 0.15 }) }}
              onMouseLeave={e => gsap.to(e.currentTarget, { scale: 1, duration: 0.15 })}
            >
              {loading ? <><Spinner />Verificando...</> : 'Ingresar al portal'}
            </button>
          </form>
        </div>

        {/* Clientes */}
        <div ref={clientsRef} style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 18, opacity: 0 }}>
          {['MARCOBRE', 'HUDBAY', 'LAS BAMBAS'].map(c => (
            <div key={c} style={{ fontSize: 8, letterSpacing: 2, color: 'rgba(255,255,255,0.18)', fontWeight: 600 }}>{c}</div>
          ))}
        </div>
      </div>

      <div ref={footerRef} style={{ position: 'absolute', bottom: 14, width: '100%', textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.15)', zIndex: 5, opacity: 0 }}>
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

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: 0.6, display: 'block', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

function Spinner() {
  return <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
}

const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 8, padding: '11px 14px', color: '#E8E8E8', fontSize: 13,
  fontFamily: 'Inter,sans-serif', outline: 'none', transition: 'border-color 0.18s, background 0.18s',
}
