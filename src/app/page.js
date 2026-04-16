'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const { user, loading, login } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready && !loading && user) router.push('/servicios')
  }, [user, loading, ready, router])

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setBusy(true)
    const r = await login(username, password)
    if (r.ok) router.push('/servicios')
    else { setError(r.msg); setBusy(false) }
  }

  if (!ready) return null

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <p style={{ color: '#4A4E56', fontSize: 13 }}>Cargando...</p>
    </div>
  )

  if (user) return null

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'url(/fondo_planta.jpg)', backgroundSize: 'cover', backgroundPosition: '85% 20%' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(6,6,8,0.91) 0%, rgba(6,6,8,0.82) 50%, rgba(6,6,8,0.93) 100%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 20 }}>
        <div className="fade" style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <img src="/logo_prodise.png" alt="PRODISE" style={{ height: 90, objectFit: 'contain', margin: '0 auto 10px', display: 'block', mixBlendMode: 'lighten' }} />
            <p style={{ color: '#4A4E56', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>Control y evaluación de personal</p>
          </div>

          <div style={{ background: 'rgba(8,8,12,0.88)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '28px 24px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: '12%', width: '76%', height: 1, background: 'linear-gradient(90deg, transparent, #E67E22, transparent)', opacity: 0.4 }} />

            <form onSubmit={handleSubmit}>
              <label style={{ display: 'block', fontSize: 11, color: '#8B8F96', marginBottom: 4, fontWeight: 500 }}>Usuario</label>
              <input className="input" placeholder="Ingrese su usuario" value={username} onChange={e => setUsername(e.target.value)} autoFocus autoComplete="username" style={{ marginBottom: 14 }} />

              <label style={{ display: 'block', fontSize: 11, color: '#8B8F96', marginBottom: 4, fontWeight: 500 }}>Contraseña</label>
              <div style={{ position: 'relative', marginBottom: 22 }}>
                <input className="input" type={showPw ? 'text' : 'password'} placeholder="Ingrese su contraseña" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#4A4E56', cursor: 'pointer', fontSize: 12, fontFamily: 'Inter' }}>{showPw ? 'Ocultar' : 'Ver'}</button>
              </div>

              {error && <div className="alert alert-err" style={{ marginBottom: 14 }}>{error}</div>}
              <button className="btn btn-primary" type="submit" disabled={busy || !username || !password}>{busy ? 'Verificando...' : 'INGRESAR'}</button>
            </form>
          </div>

          <p style={{ textAlign: 'center', fontSize: 10, color: '#4A4E56', marginTop: 20, opacity: 0.6 }}>PRODISE Ingeniería &amp; Servicios © {new Date().getFullYear()} · Desarrollado por CJP y GM</p>
        </div>
      </div>
    </div>
  )
}
