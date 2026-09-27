'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import gsap from 'gsap'
import Logo from '@/components/Logo'
import Icon from '@/components/Icon'
import { MARCA } from '@/config/marca'

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
    <div className="grid min-h-dvh bg-canvas text-label lg:grid-cols-[minmax(0,1.15fr)_minmax(440px,1fr)]">

      {/* Fotografía de planta: solo en pantallas anchas */}
      <div ref={bgRef} aria-hidden="true" className="relative hidden overflow-hidden lg:block" style={{ opacity: 0 }}>
        <img src={MARCA.fondoLogin} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: '85% 20%' }} />
      </div>

      <main id="contenido" className="flex flex-col px-6 pt-16 pb-8 sm:px-12 lg:px-16">
        <div className="my-auto w-full max-w-[360px]">
          <div ref={logoRef} style={{ opacity: 0 }}>
            <Logo height={44} />
          </div>

          <div ref={cardRef} style={{ opacity: 0 }}>
            <h1 className="mt-12 text-title1 font-semibold">Inicia sesión</h1>
            <p className="mt-2 text-body text-label-2">Usa tu usuario y contraseña de {MARCA.nombre}.</p>

            <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="usuario" className="text-footnote font-medium text-label-2">Usuario</label>
                <input
                  id="usuario" ref={userRef} type="text" value={username} autoComplete="username"
                  autoCapitalize="characters" spellCheck={false}
                  aria-invalid={!!error} aria-describedby={error ? 'login-error' : undefined}
                  onChange={e => { setUsername(e.target.value.toUpperCase()); setError('') }}
                  placeholder="Tu usuario"
                  className="input"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="clave" className="text-footnote font-medium text-label-2">Contraseña</label>
                <div className="relative">
                  <input
                    id="clave" type={showPass ? 'text' : 'password'} value={password} autoComplete="current-password"
                    aria-invalid={!!error} aria-describedby={error ? 'login-error' : undefined}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    placeholder="Tu contraseña"
                    className="input"
                    style={{ paddingRight: 52 }}
                  />
                  <button
                    type="button" onClick={() => setShowPass(v => !v)}
                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPass}
                    className="absolute top-0 right-0 flex h-11 w-11 items-center justify-center rounded-md text-label-3 transition-colors hover:text-label"
                  >
                    <Icon name={showPass ? 'eyeOff' : 'eye'} size={20} />
                  </button>
                </div>
              </div>

              {error && (
                <div id="login-error" role="alert" className="alert alert-err flex items-start gap-2">
                  <Icon name="alert" size={18} style={{ marginTop: 1 }} />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn-primary mt-2" aria-busy={loading}>
                {loading ? <><Spinner />Verificando…</> : 'Ingresar'}
              </button>
            </form>
          </div>
        </div>

        <footer ref={bottomRef} className="mt-16 text-caption text-label-3" style={{ opacity: 0 }}>
          {MARCA.razonSocial} © {MARCA.anio} · Desarrollado por {MARCA.creditos}
        </footer>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function Spinner() {
  return <span aria-hidden="true" style={{ width: 16, height: 16, border: '2px solid color-mix(in srgb, var(--on-accent) 35%, transparent)', borderTopColor: 'var(--on-accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
}
