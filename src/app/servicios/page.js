'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import Icon from '@/components/Icon'
import Logo from '@/components/Logo'
import { MARCA } from '@/config/marca'

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
    <div className="flex min-h-dvh items-center justify-center bg-canvas" role="status" aria-label="Cargando">
      <span className="spinner" />
    </div>
  )

  // Agrupar por cliente
  const clientes = [...new Set(servicios.map(s => s.cliente))].filter(Boolean)

  const activos     = servicios.filter(s => s.estado === 'ACTIVO')
  const finalizados = servicios.filter(s => s.estado !== 'ACTIVO')

  const fecha = d => new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-label">

      {/* ── Barra de navegación translúcida ── */}
      <header className="nav-material sticky top-0 z-20">
        <div className="mx-auto flex h-14 w-full max-w-[1100px] items-center justify-between gap-4 px-4 sm:px-8">
          <Logo height={28} />
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden min-w-0 text-right sm:block">
              <div className="truncate text-footnote font-semibold">{user.nombre}</div>
              <div className="text-caption text-label-3">Nivel {user.nivel}</div>
            </div>
            <button onClick={() => { logout(); router.push('/') }} className="btn btn-ghost" style={{ minHeight: 44 }}>
              <Icon name="logout" size={18} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Contenido ── */}
      <main id="contenido" className="mx-auto w-full max-w-[1100px] flex-1 px-4 pt-10 pb-16 sm:px-8 sm:pt-14">

        <div className="mb-10">
          <h1 className="text-large font-bold">Frentes de trabajo</h1>
          <p className="mt-2 text-body text-label-2">Elige el servicio en el que vas a trabajar hoy.</p>
        </div>

        {cargando ? (
          <div role="status" aria-label="Cargando servicios" className="flex flex-col gap-3">
            {[0, 1, 2].map(i => <div key={i} className="skeleton h-[104px] rounded-lg" />)}
          </div>
        ) : (
          <>
            {/* Servicios activos */}
            {activos.length > 0 && (
              <section aria-labelledby="t-activos" className="mb-14">
                <h2 id="t-activos" className="mb-3 flex items-baseline gap-2 text-headline font-semibold">
                  En curso <span className="num text-footnote font-normal text-label-3">{activos.length}</span>
                </h2>
                <ul className="flex flex-col gap-3">
                  {activos.map(s => (
                    <TarjetaServicio key={s.id_servicio} s={s} activo={true} fecha={fecha} onClick={() => router.push(`/servicio/${s.id_servicio}`)} />
                  ))}
                </ul>
              </section>
            )}

            {/* Servicios finalizados */}
            {finalizados.length > 0 && (
              <section aria-labelledby="t-finalizados">
                <h2 id="t-finalizados" className="mb-3 flex items-baseline gap-2 text-headline font-semibold">
                  Finalizados <span className="num text-footnote font-normal text-label-3">{finalizados.length}</span>
                </h2>
                <ul className="overflow-hidden rounded-lg bg-surface">
                  {finalizados.map(s => (
                    <TarjetaServicio key={s.id_servicio} s={s} activo={false} fecha={fecha} onClick={() => {}} />
                  ))}
                </ul>
              </section>
            )}

            {servicios.length === 0 && (
              <div className="rounded-lg bg-surface px-6 py-14 text-center">
                <Icon name="folder" size={28} style={{ margin: '0 auto', color: 'var(--text3)' }} />
                <p className="mt-4 text-headline font-semibold">No tienes servicios asignados</p>
                <p className="mt-1 text-footnote text-label-3">Cuando tu coordinador te asigne a un frente, aparecerá aquí.</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Pie ── */}
      <footer className="border-t border-separator">
        <div className="mx-auto w-full max-w-[1100px] px-4 py-6 text-caption text-label-3 sm:px-8">
          {MARCA.razonSocial} © {MARCA.anio} · Desarrollado por {MARCA.creditos}
        </div>
      </footer>
    </div>
  )
}

function TarjetaServicio({ s, activo, onClick, fecha }) {
  const [hovered, setHovered] = useState(false)

  const rango = s.fecha_inicio && (
    <span className="num">
      {fecha(s.fecha_inicio)}
      {s.fecha_fin && ` – ${fecha(s.fecha_fin)}`}
    </span>
  )

  // Finalizados: fila compacta de una lista agrupada, sin acción
  if (!activo) return (
    <li
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-4 border-b border-separator px-4 py-3 last:border-b-0 sm:px-5"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-body font-medium text-label-2">{s.nombre_descriptivo}</div>
        <div className="mt-0.5 truncate text-footnote text-label-3">
          {s.cliente} · <span className="font-mono text-caption">{s.codigo_otp}</span>
        </div>
      </div>
      <div className="hidden shrink-0 text-right text-footnote text-label-3 sm:block">{rango}</div>
      <span className={`badge ${s.tipo === 'PDP' ? 'b-pdp' : 'b-pro'}`}>{s.tipo}</span>
    </li>
  )

  // Activos: fila amplia con miniatura; toda la fila es el control
  return (
    <li>
      <button
        type="button"
        onClick={activo ? onClick : undefined}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="svc-row group flex w-full items-center gap-4 rounded-lg bg-surface p-3 text-left sm:gap-5 sm:p-4"
      >
        <div className="relative h-[72px] w-[96px] shrink-0 overflow-hidden rounded-md bg-fill-2 sm:h-20 sm:w-32">
          {s.fondo_url
            ? <img src={s.fondo_url} alt="" className="h-full w-full object-cover" />
            : <Icon name="planta" size={28} style={{ position: 'absolute', inset: 0, margin: 'auto', color: 'var(--text3)' }} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`badge ${s.tipo === 'PDP' ? 'b-pdp' : 'b-pro'}`}>{s.tipo}</span>
            <span className="truncate text-footnote text-label-3">{s.cliente}</span>
          </div>
          <div className="mt-1.5 truncate text-headline font-semibold">{s.nombre_descriptivo}</div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-footnote text-label-3">
            <span className="font-mono text-caption leading-[18px]">{s.codigo_otp}</span>
            {rango}
          </div>
        </div>

        <span className={`hidden shrink-0 items-center gap-1 text-footnote font-semibold sm:flex ${hovered ? 'text-accent' : 'text-label-3'}`}>
          Ingresar
        </span>
        <Icon name="chevron" size={20} style={{ color: hovered ? 'var(--accent)' : 'var(--text3)' }} className="svc-chevron" />
      </button>
    </li>
  )
}
