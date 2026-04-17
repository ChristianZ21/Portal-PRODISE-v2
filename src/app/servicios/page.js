'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '@/lib/supabase'

export default function ServiciosPage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [servicios, setServicios] = useState([])
  const [myServices, setMyServices] = useState(new Set())
  const [cargando, setCargando] = useState(true)

  useEffect(() => { if (!loading && !user) router.push('/') }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    async function load() {
      const [{ data: svcs }, { data: asigs }] = await Promise.all([
        supabase.from('servicios').select('*').order('estado').order('tipo'),
        supabase.from('asignaciones').select('id_servicio').eq('dni_trabajador', user.dni)
      ])
      setServicios(svcs || [])
      setMyServices(new Set((asigs || []).map(a => a.id_servicio)))
      setCargando(false)
    }
    load()
  }, [user])

  if (loading || !user) return null

  const activos = servicios.filter(s => s.estado === 'ACTIVO')
  const inactivos = servicios.filter(s => s.estado !== 'ACTIVO')

  const byClient = {}
  activos.forEach(s => {
    const c = s.cliente || 'OTROS'
    if (!byClient[c]) byClient[c] = []
    byClient[c].push(s)
  })

  function enter(s) {
    if (!myServices.has(s.id_servicio) && user.nivel > 1) return
    supabase.from('audit_log').insert({ username: user.username, accion: 'INGRESO_SERVICIO', tabla_afectada: 'servicios', registro_id: String(s.id_servicio) })
    router.push(`/servicio/${s.id_servicio}`)
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: 'url(/fondo_planta.jpg)', backgroundSize: 'cover', backgroundPosition: 'right center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(6,6,8,0.96) 0%, rgba(6,6,8,0.93) 100%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 24px', borderBottom: '1px solid var(--border)', background: 'rgba(6,6,8,0.7)', backdropFilter: 'blur(10px)' }}>
          <img src="/logo_prodise.png" alt="PRODISE" style={{ height: 36, objectFit: 'contain', mixBlendMode: 'lighten' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{user.nombre}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>Nivel {user.nivel}</div>
            </div>
            <button className="btn btn-ghost" onClick={logout}>Salir</button>
          </div>
        </header>

        <main style={{ maxWidth: 1060, margin: '0 auto', padding: '32px 20px 60px' }}>
          <div className="fade">
            <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.3 }}>Frentes de Trabajo</h1>
            <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 3, marginBottom: 32 }}>Selecciona un servicio para ingresar</p>
          </div>

          {cargando ? (
            <p style={{ color: 'var(--text3)', padding: '40px 0' }}>Cargando...</p>
          ) : (
            <>
              {Object.entries(byClient).map(([cliente, servs]) => (
                <section key={cliente} style={{ marginBottom: 36 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    {servs[0]?.logo_url && <img src={servs[0].logo_url} alt="" style={{ height: 20, objectFit: 'contain', background: 'rgba(255,255,255,0.9)', padding: '2px 6px', borderRadius: 3 }} />}
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1 }}>{cliente}</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                    {servs.map(s => {
                      const isMine = myServices.has(s.id_servicio) || user.nivel <= 1
                      return (
                        <div key={s.id_servicio} onClick={() => enter(s)} style={{
                          padding: '22px 18px', textAlign: 'center', borderRadius: 12, cursor: isMine ? 'pointer' : 'default',
                          border: '1px solid var(--border)', background: 'var(--card)', position: 'relative', overflow: 'hidden',
                          opacity: isMine ? 1 : 0.35, filter: isMine ? 'none' : 'grayscale(0.5)',
                          transition: 'all 0.25s',
                        }}
                          onMouseEnter={e => { if (isMine) { e.currentTarget.style.borderColor = 'var(--border-h)'; e.currentTarget.style.transform = 'translateY(-2px)' } }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
                        >
                          {!isMine && (
                            <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, color: 'var(--text3)', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: 4 }}>
                              No participa en este servicio
                            </div>
                          )}
                          <div style={{ position: 'absolute', top: 0, left: '20%', width: '60%', height: 1, background: s.tipo === 'PDP' ? 'var(--accent2)' : '#B07CC6', opacity: 0.3 }} />
                          {s.logo_url ? (
                            <div style={{ width: 48, height: 48, margin: '0 auto 12px', borderRadius: 8, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6 }}>
                              <img src={s.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                          ) : <div style={{ height: 48, marginBottom: 12 }} />}
                          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, marginBottom: 8 }}>{s.nombre_descriptivo}</div>
                          <span className={`badge ${s.tipo === 'PDP' ? 'b-pdp' : 'b-pro'}`}>{s.tipo}</span>
                          <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 6, fontFamily: 'monospace' }}>{s.codigo_otp}</div>
                          {isMine && <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>Ingresar →</div>}
                        </div>
                      )
                    })}
                  </div>
                </section>
              ))}

              {inactivos.length > 0 && (
                <section style={{ marginTop: 36 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Finalizados</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                    {inactivos.map(s => (
                      <div key={s.id_servicio} style={{ background: 'var(--card)', border: '1px dashed rgba(255,255,255,0.03)', borderRadius: 10, padding: '16px 12px', textAlign: 'center', opacity: 0.2 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>{s.nombre_descriptivo}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
