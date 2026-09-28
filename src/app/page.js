'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
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
  const cardRef   = useRef(null)

  useEffect(() => {
    if (user) { router.push('/servicios'); return }
    userRef.current?.focus()
  }, [user, router])

  useEffect(() => { if (user) router.push('/servicios') }, [user, router])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) { setError('Completa usuario y contraseña'); return }
    setLoading(true); setError('')
    const result = await login(username.trim(), password)
    if (!result.success) {
      sacudir(cardRef.current)
      setError(result.error || 'Credenciales incorrectas')
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-dvh bg-canvas text-label lg:grid-cols-[minmax(0,1.15fr)_minmax(440px,1fr)]">

      {/* Fotografía de planta: solo en pantallas anchas */}
      {/* Fotografía de planta: franja superior en móvil, mitad izquierda en escritorio */}
      <div aria-hidden="true" className="login-foto relative h-56 overflow-hidden sm:h-72 lg:h-auto">
        <img src={MARCA.fondoLogin} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: '85% 20%' }} />
      </div>

      <main id="contenido" className="relative -mt-10 flex flex-col px-6 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-12 lg:mt-0 lg:px-16 lg:pt-16">
        <div className="enter my-auto w-full max-w-[360px]">
          <Logo height={44} />

          <div ref={cardRef}>
            <h1 className="mt-12 text-large font-bold">Inicia sesión</h1>
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

        <footer className="mt-16 text-caption text-label-3">
          {MARCA.razonSocial} © {MARCA.anio} · Desarrollado por {MARCA.creditos}
        </footer>
      </main>

    </div>
  )
}

// Sacudida horizontal al fallar el acceso (como el login de macOS).
// Web Animations: interrumpible y sin dependencias; se omite con movimiento reducido.
function sacudir(el) {
  if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  el.animate(
    [{ transform: 'translateX(0)' }, { transform: 'translateX(-10px)' }, { transform: 'translateX(8px)' },
     { transform: 'translateX(-6px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }],
    { duration: 420, easing: 'ease-out' }
  )
}

function Spinner() {
  return <span aria-hidden="true" style={{ width: 16, height: 16, border: '2px solid color-mix(in srgb, var(--on-accent) 35%, transparent)', borderTopColor: 'var(--on-accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
}
