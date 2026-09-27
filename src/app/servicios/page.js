'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

export default function ServiciosPage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [servicios, setServicios] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => { if (!loading && !user) router.push('/') }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    supabase
      .from('servicios')
      .select('*')
      .order('estado', { ascending: false }) // ACTIVO primero
      .order('fecha_inicio', { ascending: false })
      .then(({ data }) => { setServicios(data || []); setCargando(false) })
  }, [user])

  if (loading || !user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: 16, height: 16, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  // Agrupar por cliente
  const clientes = [...new Set(servicios.map(s => s.cliente))].filter(Boolean)

  const activos     = servicios.filter(s => s.estado === 'ACTIVO')
  const finalizados = servicios.filter(s => s.estado !== 'ACTIVO')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'inherit', color: 'var(--text)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header con logo PRODISE ── */}
      <header style={{ padding: '14px 28px', borderBottom: '1px solid color-mix(in srgb, var(--ink) 5%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(10px)' }}>
        <div style={{ background: 'white', borderRadius: 7, padding: '5px 14px', display: 'inline-flex', alignItems: 'center' }}>
          <img src="/logo_prodise.png" alt="PRODISE" style={{ height: 32, objectFit: 'contain', display: 'block' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{user.nombre}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>Nivel {user.nivel}</div>
          </div>
          <button onClick={() => { logout(); router.push('/') }} style={{ padding: '6px 14px', background: 'color-mix(in srgb, var(--ink) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--ink) 8%, transparent)', borderRadius: 7, color: 'var(--text2)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* ── Contenido ── */}
      <div style={{ flex: 1, padding: '32px 28px', maxWidth: 1100, width: '100%', margin: '0 auto' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Frentes de Trabajo</h1>
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>Selecciona un servicio para ingresar</p>
        </div>

        {cargando ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '40px 0' }}>
            <div style={{ width: 14, height: 14, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: 'var(--text3)', fontSize: 13 }}>Cargando servicios...</span>
          </div>
        ) : (
          <>
            {/* Servicios activos */}
            {activos.length > 0 && (
              <div style={{ marginBottom: 36 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {activos.map(s => (
                    <TarjetaServicio key={s.id_servicio} s={s} activo={true} onClick={() => router.push(`/servicio/${s.id_servicio}`)} />
                  ))}
                </div>
              </div>
            )}

            {/* Servicios finalizados */}
            {finalizados.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: 1 }}>FINALIZADOS</div>
                  <div style={{ flex: 1, height: 1, background: 'color-mix(in srgb, var(--ink) 6%, transparent)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                  {finalizados.map(s => (
                    <TarjetaServicio key={s.id_servicio} s={s} activo={false} onClick={() => {}} />
                  ))}
                </div>
              </div>
            )}

            {servicios.length === 0 && (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>
                No hay servicios disponibles
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <footer style={{ padding: '16px 28px', borderTop: '1px solid color-mix(in srgb, var(--ink) 4%, transparent)', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: 0.3 }}>
          PROYECTOS DE INGENIERIA Y SERVICIOS S.C.R.L. © 2026 · Desarrollado por CJP y GM
        </div>
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (max-width: 600px) {
          .svc-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

function TarjetaServicio({ s, activo, onClick }) {
  const [hovered, setHovered] = useState(false)

  const bgStyle = s.fondo_url ? {
    backgroundImage: `url(${s.fondo_url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } : {}

  return (
    <div
      onClick={activo ? onClick : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: 14,
        border: `1px solid ${activo ? (hovered ? 'color-mix(in srgb, var(--accent) 40%, transparent)' : 'color-mix(in srgb, var(--ink) 8%, transparent)') : 'color-mix(in srgb, var(--ink) 4%, transparent)'}`,
        background: activo ? 'color-mix(in srgb, var(--ink) 3%, transparent)' : 'color-mix(in srgb, var(--ink) 1.5%, transparent)',
        cursor: activo ? 'pointer' : 'default',
        opacity: activo ? 1 : 0.5,
        transition: 'all 0.2s',
        transform: activo && hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: activo && hovered ? '0 8px 30px rgba(0,0,0,0.4)' : 'none',
        minHeight: 180,
        ...bgStyle,
      }}
    >
      {/* Overlay sobre el fondo */}
      {s.fondo_url && (
        <div style={{ position: 'absolute', inset: 0, background: activo ? 'rgba(6,6,8,0.72)' : 'rgba(6,6,8,0.85)', borderRadius: 14 }} />
      )}

      {/* Contenido */}
      <div style={{ position: 'relative', zIndex: 1, padding: '20px 20px 18px' }}>

        {/* Tipo + cliente */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 5, letterSpacing: 0.4,
            background: s.tipo === 'PDP' ? 'color-mix(in srgb, var(--accent2) 12%, transparent)' : 'var(--fill)',
            color: s.tipo === 'PDP' ? 'var(--accent2)' : 'var(--text2)',
            border: `1px solid ${s.tipo === 'PDP' ? 'color-mix(in srgb, var(--accent2) 20%, transparent)' : 'var(--border)'}`,
          }}>{s.tipo}</span>
          <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: 0.5 }}>
            {s.cliente}
          </span>
        </div>

        {/* Nombre del servicio */}
        <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, marginBottom: 6, color: activo ? 'var(--text)' : 'color-mix(in srgb, var(--ink) 50%, transparent)' }}>
          {s.nombre_descriptivo}
        </div>

        {/* OTP */}
        <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
          {s.codigo_otp}
        </div>

        {/* Fechas si existen */}
        {s.fecha_inicio && (
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 16 }}>
            {new Date(s.fecha_inicio).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
            {s.fecha_fin && ` → ${new Date(s.fecha_fin).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}`}
          </div>
        )}

        {/* Botón ingresar */}
        {activo && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 700, color: hovered ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 70%, transparent)',
            transition: 'color 0.2s',
          }}>
            Ingresar {hovered ? '→' : '›'}
          </div>
        )}
        {!activo && (
          <div style={{ fontSize: 10, color: 'var(--text3)', fontStyle: 'italic' }}>
            Servicio finalizado
          </div>
        )}
      </div>
    </div>
  )
}
