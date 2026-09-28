'use client'
import { Fragment, useState, useEffect, use, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '@/lib/supabase'
import Icon, { Medalla } from '@/components/Icon'
import Logo from '@/components/Logo'
import { Deslizador, Contador, BarraScroll, GestoCajon } from '@/components/Vivo'
import { md5 } from '@/lib/md5'

const NAV_ICON = { evaluar: 'evaluar', historial: 'historial', bitacora: 'bitacora', dashboard: 'dashboard', ranking: 'ranking', perfiles: 'perfiles', buscador: 'buscador', predictor: 'predictor', admin: 'admin' }
// Clasificación de las secciones: se muestra en el menú y sobre cada título
const NAV_GRUPO = { evaluar: 'Trabajo diario', historial: 'Trabajo diario', bitacora: 'Trabajo diario', dashboard: 'Análisis', ranking: 'Análisis', perfiles: 'Análisis', buscador: 'Análisis', predictor: 'Análisis', admin: 'Administración' }
function Antetitulo({ sec }) {
  return <p className="page-eyebrow"><Icon name={NAV_ICON[sec]} size={15} strokeWidth={2} />{NAV_GRUPO[sec]}</p>
}
function Glifo({ icono }) {
  return <span className="ico-tile" aria-hidden="true"><Icon name={icono} size={16} /></span>
}

export default function ServicioPage({ params }) {
  const { id } = use(params)
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [svc, setSvc] = useState(null)
  const [sec, setSec] = useState('evaluar')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [asigCheck, setAsigCheck] = useState(null) // null=cargando, true=ok, false=no participa

  useEffect(() => { if (!loading && !user) router.push('/') }, [user, loading, router])
  useEffect(() => {
    if (!user) return
    supabase.from('servicios').select('*').eq('id_servicio', id).single().then(({ data }) => setSvc(data))
  }, [user, id])

  // Verificar si el nivel 3 está asignado a este servicio
  useEffect(() => {
    if (!user || !svc) return
    if (user.nivel <= 2) { setAsigCheck(true); return } // N1 y N2 siempre tienen acceso
    if (!user.dni) { setAsigCheck(false); return }
    supabase.from('asignaciones')
      .select('id_asignacion')
      .eq('id_servicio', id)
      .eq('dni_trabajador', user.dni)
      .eq('estado', 'ACTIVO')
      .limit(1)
      .then(({ data }) => setAsigCheck(data && data.length > 0))
  }, [user, svc, id])

  if (loading || !user || !svc || asigCheck === null) return (
    <div role="status" aria-label="Cargando" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh', background: 'var(--bg)' }}>
      <span className="spinner" />
    </div>
  )

  // Nivel 3 no asignado — bloqueo con mensaje
  if (asigCheck === false) return (
    <main id="contenido" style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--fill)', color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="lock" size={26} />
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 24 }}>No participas en este servicio</h1>
      <p style={{ fontSize: 15, color: 'var(--text2)', maxWidth: 360, marginTop: 8 }}>
        No estás asignado a <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{svc.nombre_descriptivo}</strong>. Si crees que es un error, avisa a tu coordinador o planner.
      </p>
      <button className="btn btn-ghost" onClick={() => router.push('/servicios')} style={{ marginTop: 32, minHeight: 44, fontSize: 15 }}>
        <Icon name="back" size={18} /> Volver a mis servicios
      </button>
    </main>
  )

  const n = user.nivel
  
  // Lógica de Permisos Visuales
  const nav = [
    { id: 'evaluar',   icon: '📝', label: 'Evaluar' },
    { id: 'historial', icon: '📂', label: 'Historial' },
    { id: 'bitacora',  icon: '📋', label: 'Bitácora' },
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'ranking',   icon: '🏆', label: 'Ranking' },
    { id: 'perfiles',  icon: '👤', label: 'Perfiles 360°' },
    { id: 'buscador',  icon: '🔍', label: 'Buscador' },
    { id: 'predictor', icon: '🔮', label: 'Predictor' },
    { id: 'admin',     icon: '⚙️', label: 'Admin' },
  ].map(x => {
    let allowed = false;
    if (n === 1) {
      allowed = true; // Nivel 1: Dios (Todo)
    } else if (n === 2) {
      allowed = (x.id !== 'predictor' && x.id !== 'admin'); // Nivel 2: Todo menos Predictor y Admin
    } else {
      allowed = (x.id === 'evaluar' || x.id === 'ranking'); // Nivel 3: Solo Evaluar y Ranking
    }
    return { ...x, disabled: !allowed };
  });

  const actual = nav.find(x => x.id === sec)
  // Pestañas inferiores en móvil: las secciones de uso diario permitidas + "Más"
  const TABS = ['evaluar', 'dashboard', 'ranking', 'perfiles']
  const tabs = nav.filter(x => TABS.includes(x.id) && !x.disabled)
  const enTab = tabs.some(x => x.id === sec)

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', position: 'relative', background: 'var(--bg)' }}>
      {/* Velo del menú en móvil */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="sidebar-scrim" aria-hidden="true" />
      )}

      <GestoCajon abierto={sidebarOpen} onCerrar={() => setSidebarOpen(false)} />

      {/* ── Barra lateral ── */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`} aria-label="Secciones del servicio">
        <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Logo height={28} />
          <button onClick={() => setSidebarOpen(false)} className="close-sidebar-btn icon-btn" aria-label="Cerrar menú">
            <Icon name="close" size={20} />
          </button>
        </div>

        <div style={{ padding: '4px 16px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Servicio</div>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3, marginTop: 4, letterSpacing: '-0.01em' }}>{svc.nombre_descriptivo}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <span className={`badge ${svc.tipo === 'PDP' ? 'b-pdp' : 'b-pro'}`}>{svc.tipo}</span>
            {svc.codigo_otp && <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{svc.codigo_otp}</span>}
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0 8px', overflowY: 'auto' }}>
          <ul className="nav-list" style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Deslizador />
            {nav.map((x, i) => (
              <Fragment key={x.id}>
              {NAV_GRUPO[x.id] !== NAV_GRUPO[nav[i - 1]?.id] && <li className="nav-group" aria-hidden="true">{NAV_GRUPO[x.id]}</li>}
              <li>
                <button
                  onClick={() => { if (!x.disabled) { setSec(x.id); setSidebarOpen(false) } }}
                  className={`nav-item ${sec === x.id ? 'is-active' : ''}`}
                  aria-current={sec === x.id ? 'page' : undefined}
                  aria-disabled={x.disabled || undefined}
                  title={x.disabled ? 'Tu nivel de acceso no incluye esta sección' : undefined}
                >
                  <span className="nav-tile"><Icon name={NAV_ICON[x.id]} size={18} /></span>
                  <span style={{ flex: 1 }}>{x.label}</span>
                  {x.disabled && <Icon name="lock" size={14} style={{ color: 'var(--text3)' }} />}
                </button>
              </li>
              </Fragment>
            ))}
          </ul>
        </nav>

        <div style={{ padding: 8, borderTop: '1px solid var(--separator)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 8px 12px' }}>
            <Avatar nombre={user.nombre} size={36} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.nombre}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Nivel {n}</div>
            </div>
          </div>
          <button className="nav-item" onClick={() => router.push('/servicios')}>
            <Icon name="swap" size={20} /><span>Cambiar servicio</span>
          </button>
          <button className="nav-item" onClick={() => { logout(); router.push('/') }}>
            <Icon name="logout" size={20} /><span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ── Contenido ── */}
      <main id="contenido" className="app-main" style={{ flex: 1, padding: '32px 40px 56px', background: 'var(--bg)', overflowY: 'auto', height: '100dvh', position: 'relative' }}>
        {/* Barra superior: solo en móvil (vía CSS) */}
        <div className="hamburger-btn mobile-bar nav-material">
          <BarraScroll contenedor="#contenido" dep={sec} />
          <button onClick={() => setSidebarOpen(true)} className="icon-btn" aria-label="Abrir menú" aria-expanded={sidebarOpen}>
            <Icon name="menu" size={22} />
          </button>
          <div className="nav-title" style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>{actual?.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{svc.nombre_descriptivo}</div>
          </div>
        </div>
        <div key={sec} className="section-enter" style={{ maxWidth: 1240, margin: '0 auto' }}>
        {sec === 'evaluar'   && <Evaluar    svc={svc} user={user} />}
        {sec === 'historial' && <Historial  svc={svc} user={user} />}
        {sec === 'dashboard' && <Dashboard  svc={svc} user={user} />}
        {sec === 'admin'     && <AdminPanel svc={svc} user={user} />}
        {sec === 'ranking'   && <Ranking svc={svc} user={user} />}
        {sec === 'perfiles'  && <Perfiles svc={svc} user={user} />}
        {sec === 'buscador'  && <Buscador svc={svc} user={user} />}
        {sec === 'predictor' && <Predictor svc={svc} user={user} />}
        {sec === 'bitacora'  && <Bitacora svc={svc} user={user} />}
        </div>
      </main>

      {/* ── Barra de pestañas: solo en móvil (vía CSS) ── */}
      <nav className="tab-bar nav-material" aria-label="Secciones principales">
        <div className="tab-bar-inner">
          <Deslizador />
          {tabs.map(x => (
            <button key={x.id} onClick={() => { setSec(x.id); setSidebarOpen(false) }} className={`tab-item ${sec === x.id ? 'is-active' : ''}`} aria-current={sec === x.id ? 'page' : undefined}>
              <Icon name={NAV_ICON[x.id]} size={24} strokeWidth={sec === x.id ? 2 : 1.75} />
              <span>{x.id === 'perfiles' ? 'Perfiles' : x.label}</span>
            </button>
          ))}
          <button onClick={() => setSidebarOpen(true)} className={`tab-item ${!enTab ? 'is-active' : ''}`} aria-label="Más secciones" aria-expanded={sidebarOpen}>
            <Icon name="menu" size={24} strokeWidth={!enTab ? 2 : 1.75} />
            <span>{!enTab && actual ? actual.label.replace(' 360°', '') : 'Más'}</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

/* =========================================
   EVALUAR
   ========================================= */
function Evaluar({ svc, user }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [sel, setSel] = useState(null)
  const [pregs, setPregs] = useState([])
  const [resp, setResp] = useState({})
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data: asigs } = await supabase.from('asignaciones').select('*').eq('id_servicio', svc.id_servicio).eq('estado', 'ACTIVO')
    if (!asigs?.length) { setList([]); setLoading(false); return }

    const me = asigs.find(a => a.dni_trabajador === user.dni)
    let filtered = asigs.filter(a => a.dni_trabajador !== user.dni)

    if (me && user.nivel >= 3) {
      const mg = me.id_grupo.split(',').map(g => g.trim())
      filtered = filtered.filter(a => {
        if (a.turno !== me.turno) return false
        if (mg.includes('MASTER')) return true
        const sg = String(a.id_grupo).split(',').map(g => g.trim())
        return mg.some(g => sg.includes(g))
      })
    }

    const { data: hist } = await supabase.from('historial_evaluaciones').select('id_asignacion').eq('id_servicio', svc.id_servicio).eq('dni_evaluador', user.dni)
    const done = new Set((hist || []).map(h => h.id_asignacion))
    filtered = filtered.filter(a => !done.has(a.id_asignacion))

    const dnis = filtered.map(a => a.dni_trabajador)
    const cids = [...new Set(filtered.map(a => a.id_cargo_actual))]

    const [{ data: workers }, { data: cargos }] = await Promise.all([
      supabase.from('trabajadores').select('dni, nombres_completos, url_foto').in('dni', dnis.length ? dnis : ['']),
      supabase.from('catalogo_cargos').select('id_cargo, nombre_oficial').in('id_cargo', cids.length ? cids : [0]),
    ])
    const wm = Object.fromEntries((workers || []).map(w => [w.dni, w]))
    const cm = Object.fromEntries((cargos || []).map(c => [c.id_cargo, c.nombre_oficial]))

    setList(filtered.map(a => ({ ...a, nombre: wm[a.dni_trabajador]?.nombres_completos || a.dni_trabajador, foto: wm[a.dni_trabajador]?.url_foto, cargo_nombre: cm[a.id_cargo_actual] || 'SIN CARGO' })))
    setLoading(false)
  }

  async function pick(p) {
    setSel(p); setResp({}); setComment(''); setMsg('')
    const { data } = await supabase.from('banco_preguntas_4x4').select('*').eq('id_cargo', p.id_cargo_actual).eq('tipo_servicio', svc.tipo).order('id_preg')
    setPregs(data || [])
  }

  async function save() {
    if (Object.keys(resp).length < pregs.length) return alert('Completa todas las dimensiones')
    if (comment.trim().length < 20) return alert('Mínimo 20 caracteres en observaciones')
    setSaving(true)
    let score = 0
    pregs.forEach((p, i) => { score += (resp[i] || 1) * parseFloat(p.peso) })
    const prom = Math.round(score * 100) / 100

    const { error } = await supabase.from('historial_evaluaciones').insert({
      id_asignacion: sel.id_asignacion, id_servicio: svc.id_servicio, dni_evaluador: user.dni,
      cargo_momento: sel.cargo_nombre, turno_momento: sel.turno, grupo_momento: String(sel.id_grupo),
      nota_1: resp[0] || 1, nota_2: resp[1] || 1, nota_3: resp[2] || 1, nota_4: resp[3] || 1,
      promedio: prom, comentarios: comment.trim(),
    })
    if (error) { alert('Error: ' + error.message); setSaving(false); return }
    await supabase.from('audit_log').insert({ username: user.username, accion: 'EVALUACION', registro_id: String(sel.id_asignacion), detalle: `Nota: ${prom} | ${sel.nombre}` })
    setMsg(`Evaluación guardada — Nota: ${prom}`)
    setSaving(false); setSel(null); load()
  }

  function getInitials(name) {
    const parts = name.split(' ')
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]) : name.substring(0, 2)
  }

  if (loading) return <p style={{ color: 'var(--text3)', fontSize: 13 }}>Cargando personal...</p>

  return (
    <div>
      <Antetitulo sec="evaluar" /><h2 className="page-title">Evaluar personal</h2>
      <p className="page-sub" style={{ marginBottom: 24 }}>{svc.nombre_descriptivo}</p>
      {msg && <div className="alert alert-ok" role="status" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="check" size={18} />{msg}</div>}
      {!sel ? (
        list.length === 0 ? (
          <div className="card-static empty-state">
            <Icon name="check" size={28} style={{ color: 'var(--green)' }} />
            <p style={{ fontWeight: 600, fontSize: 17, marginTop: 16 }}>Todo evaluado</p>
            <p style={{ color: 'var(--text2)', fontSize: 15, marginTop: 4 }}>No hay personal pendiente de evaluación.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
              <div className="search-field" style={{ flex: '1 1 280px', maxWidth: 400 }}>
                <Icon name="buscador" size={18} />
                <input className="input" type="search" aria-label="Buscar por nombre" placeholder="Buscar por nombre" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <p style={{ fontSize: 13, color: 'var(--text3)' }}><span className="num" style={{ color: 'var(--text)', fontWeight: 600 }}>{list.length}</span> pendientes</p>
            </div>
            <ul className="card-static grouped-list">
              {list.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase())).map(p => (
                <li key={p.id_asignacion}>
                  <button type="button" onClick={() => pick(p)} className="card list-row">
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600, color: 'var(--accent)', flexShrink: 0, overflow: 'hidden' }}>
                      {p.foto ? <img src={p.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(p.nombre)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nombre}</div>
                      <div className="num" style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{p.cargo_nombre} <span style={{ color: 'var(--text3)' }}>· Grupo {p.id_grupo} · Turno {p.turno}</span></div>
                    </div>
                    <Icon name="chevron" size={18} style={{ color: 'var(--text3)' }} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )
      ) : (
        <div className="fade" style={{ maxWidth: 760 }}>
          <button className="btn btn-ghost" onClick={() => { setSel(null); setPregs([]) }} style={{ marginBottom: 24 }}><Icon name="back" size={18} />Volver a la lista</button>
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 600, color: 'var(--accent)', flexShrink: 0, overflow: 'hidden' }}>
              {sel.foto
                ? <img src={sel.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display='none' }} />
                : getInitials(sel.nombre)
              }
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{sel.nombre}</div>
              <div style={{ color: 'var(--text2)', fontSize: 15, marginTop: 4 }}>{sel.cargo_nombre} · Grupo {sel.id_grupo} · Turno {sel.turno}</div>
            </div>
          </div>
          {pregs.length === 0 ? (
            <div className="alert alert-err">No hay kit de preguntas para {sel.cargo_nombre} en {svc.tipo}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {pregs.map((p, i) => (
                <fieldset key={p.id_preg} style={{ border: 0 }}>
                  <legend style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                    <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>{i + 1}. {p.dimension}</span>
                    <span className="num" style={{ fontSize: 13, color: 'var(--text3)' }}>Peso {(parseFloat(p.peso) * 100).toFixed(0)} %</span>
                  </legend>
                  <div className="card-static grouped-list">
                    {[p.nivel_1, p.nivel_2, p.nivel_3, p.nivel_4].map((niv, ni) => (
                      <label key={ni} className={`choice-row ${resp[i] === ni + 1 ? 'is-selected' : ''}`}>
                        <input type="radio" name={`q${i}`} checked={resp[i] === ni + 1} onChange={() => setResp({ ...resp, [i]: ni + 1 })} className="choice-radio" />
                        <div style={{ minWidth: 0 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: resp[i] === ni + 1 ? 'var(--accent)' : 'var(--text3)' }}>Nivel {ni + 1}</span>
                          <div style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.45, marginTop: 2 }}>{niv}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              <div>
                <label htmlFor="eval-obs" style={{ fontSize: 17, fontWeight: 600, display: 'block', marginBottom: 12 }}>Observaciones</label>
                <textarea id="eval-obs" className="input" placeholder="Describe el desempeño del trabajador (mínimo 20 caracteres)" value={comment} onChange={e => setComment(e.target.value)} rows={4} style={{ resize: 'vertical', background: 'var(--surface)' }} />
                <div className="num" style={{ fontSize: 13, marginTop: 8, color: comment.length >= 20 ? 'var(--green)' : 'var(--text3)' }}>{comment.length}/20 caracteres mínimos</div>
              </div>
              <div className="save-bar">
                <div className="num" style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.35 }}>
                  <div><strong style={{ color: 'var(--text)', fontWeight: 600 }}>{Object.keys(resp).length}/{pregs.length}</strong> dimensiones</div>
                  <div style={{ color: comment.trim().length >= 20 ? 'var(--green)' : 'var(--text3)' }}>{comment.trim().length >= 20 ? 'Observación lista' : 'Falta la observación'}</div>
                </div>
                <div className="save-progress" aria-hidden="true"><span style={{ transform: `scaleX(${(Object.keys(resp).length + (comment.trim().length >= 20 ? 1 : 0)) / (pregs.length + 1)})` }} /></div>
                <button className="btn btn-primary" onClick={save} disabled={saving} style={{ width: 'auto', minWidth: 200 }}>{saving ? 'Guardando…' : 'Guardar evaluación'}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* =========================================
   HISTORIAL
   ========================================= */
function Historial({ svc, user }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const { data: evals } = await supabase.from('historial_evaluaciones').select('*').eq('id_servicio', svc.id_servicio).order('fecha_hora', { ascending: false })
      if (!evals?.length) { setData([]); setLoading(false); return }

      const asigIds = [...new Set(evals.map(e => e.id_asignacion))]
      const evalDnis = [...new Set(evals.map(e => e.dni_evaluador))]

      const [{ data: asigs }] = await Promise.all([
        supabase.from('asignaciones').select('id_asignacion, dni_trabajador').in('id_asignacion', asigIds),
      ])

      const asigMap = Object.fromEntries((asigs || []).map(a => [a.id_asignacion, a.dni_trabajador]))
      const trabDnis = [...new Set([...evalDnis, ...(asigs || []).map(a => a.dni_trabajador)])]
      const { data: allWorkers } = await supabase.from('trabajadores').select('dni, nombres_completos').in('dni', trabDnis)
      const nm = Object.fromEntries((allWorkers || []).map(w => [w.dni, w.nombres_completos]))

      setData(evals.map(e => ({ ...e, dni_trabajador: asigMap[e.id_asignacion], nombre_trabajador: nm[asigMap[e.id_asignacion]] || 'Desconocido', nombre_evaluador: nm[e.dni_evaluador] || e.dni_evaluador })))
      setLoading(false)
    }
    load()
  }, [svc])

  if (loading) return <p style={{ color: 'var(--text3)', fontSize: 13 }}>Cargando...</p>

  const filtered = data.filter(h => {
    if (!search) return true
    const q = search.toLowerCase()
    return h.nombre_trabajador.toLowerCase().includes(q) || h.nombre_evaluador.toLowerCase().includes(q) || h.cargo_momento.toLowerCase().includes(q)
  })

  return (
    <div>
      <Antetitulo sec="historial" /><h2 className="page-title">Historial de evaluaciones</h2>
      <p className="page-sub" style={{ marginBottom: 24 }}>{svc.nombre_descriptivo} · {data.length} evaluaciones</p>

      {data.length > 0 && (
        <div className="search-field" style={{ maxWidth: 480, marginBottom: 24 }}>
          <Icon name="buscador" size={18} />
          <input className="input" type="search" aria-label="Buscar evaluaciones" placeholder="Buscar por trabajador, evaluador o cargo" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      )}

      {data.length === 0 ? (
        <div className="card-static empty-state">
          <Icon name="historial" size={28} style={{ color: 'var(--text3)' }} />
          <p style={{ fontWeight: 600, fontSize: 17, marginTop: 16 }}>Aún no hay evaluaciones</p>
          <p style={{ color: 'var(--text2)', fontSize: 15, marginTop: 4 }}>Las evaluaciones guardadas en este servicio aparecerán aquí.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-static empty-state" style={{ padding: '40px 24px' }}>
          <p style={{ color: 'var(--text2)', fontSize: 15 }}>Sin resultados para “{search}”</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(h => (
            <article key={h.id_eval} className="card-static" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.015em' }}>{h.nombre_trabajador}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{h.cargo_momento} · Grupo {h.grupo_momento} · Turno {h.turno_momento}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="num" style={{ fontSize: 28, lineHeight: 1, fontWeight: 700, letterSpacing: '-0.02em', color: h.promedio >= 3.5 ? 'var(--green)' : h.promedio >= 2.0 ? 'var(--yellow)' : 'var(--red)' }}>{h.promedio}</div>
                  <div className="num" style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6 }}>{new Date(h.fecha_hora).toLocaleDateString('es-PE')}</div>
                </div>
              </div>
              <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, margin: '16px 0', padding: '12px 0', boxShadow: 'inset 0 0.5px 0 var(--separator), inset 0 -0.5px 0 var(--separator)' }}>
                {[{ l: 'Seguridad', v: h.nota_1 }, { l: 'Calidad', v: h.nota_2 }, { l: 'Actitud', v: h.nota_3 }, { l: 'Precisión', v: h.nota_4 }].map((d, i) => (
                  <div key={i}>
                    <dt style={{ fontSize: 13, color: 'var(--text3)' }}>{d.l}</dt>
                    <dd className="num" style={{ fontSize: 17, fontWeight: 600, marginTop: 2, color: d.v >= 3.5 ? 'var(--green)' : d.v >= 2.0 ? 'var(--yellow)' : 'var(--red)' }}>{d.v}</dd>
                  </div>
                ))}
              </dl>
              <blockquote style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.5, maxWidth: '68ch' }}>
                {h.comentarios}
              </blockquote>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 8 }}>Evaluado por <span style={{ color: 'var(--text2)', fontWeight: 500 }}>{h.nombre_evaluador}</span></div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

/* =========================================
   DASHBOARD
   ========================================= */
function Dashboard({ svc, user }) {
  const [loading, setLoading] = useState(true)
  const [kpi, setKpi] = useState(null)
  const [byGrupo, setByGrupo] = useState([])
  const [byCargo, setByCargo] = useState([])
  const [byDim, setByDim] = useState([])
  const [recent, setRecent] = useState([])
  const [alertas, setAlertas] = useState([])
  const [dashTab, setDashTab] = useState('resumen') // 'resumen' | 'alertas'
  const [actividades, setActividades] = useState([])

  useEffect(() => { loadAll() }, [svc])

  async function loadAll() {
    setLoading(true)
    const sid = svc.id_servicio

    const { data: asigs } = await supabase
      .from('asignaciones')
      .select('id_asignacion, dni_trabajador, id_grupo, turno, id_cargo_actual')
      .eq('id_servicio', sid)
      .eq('estado', 'ACTIVO')

    if (!asigs?.length) { setLoading(false); return }

    const { data: evals } = await supabase
      .from('historial_evaluaciones')
      .select('id_asignacion, promedio, nota_1, nota_2, nota_3, nota_4, dni_evaluador, fecha_hora')
      .eq('id_servicio', sid)

    const { data: acts } = await supabase
      .from('actividades_criticas')
      .select('*, catalogo_competencias(nombre)')
      .eq('id_servicio', sid)
      .order('fecha_inicio', { ascending: false })
      .limit(5)
    
    const parsedActs = (acts || []).map(a => {
        let meta = {}
        try { meta = JSON.parse(a.checklist_generado) } catch(e) { meta = { url_foto: '', id_grupo: '' } }
        return { ...a, meta }
    })
    setActividades(parsedActs)

    const cids = [...new Set(asigs.map(a => a.id_cargo_actual))]
    const { data: cargos } = await supabase
      .from('catalogo_cargos')
      .select('id_cargo, nombre_oficial')
      .in('id_cargo', cids.length ? cids : [0])
    const cargoMap = Object.fromEntries((cargos || []).map(c => [c.id_cargo, c.nombre_oficial]))

    const dnis = asigs.map(a => a.dni_trabajador)
    const { data: trabajadores } = await supabase
      .from('trabajadores')
      .select('dni, nombres_completos, url_foto')
      .in('dni', dnis)
    const trabMap = Object.fromEntries((trabajadores || []).map(t => [t.dni, t]))

    const total = asigs.length
    const evalSet = new Set((evals || []).map(e => e.id_asignacion))
    const evaluados = asigs.filter(a => evalSet.has(a.id_asignacion)).length
    const pctEval = total > 0 ? Math.round((evaluados / total) * 100) : 0
    const promedios = (evals || []).map(e => parseFloat(e.promedio))
    const avgGeneral = promedios.length ? (promedios.reduce((a, b) => a + b, 0) / promedios.length).toFixed(2) : null

    let topScorer = null
    if (evals?.length) {
      const best = evals.reduce((a, b) => parseFloat(a.promedio) > parseFloat(b.promedio) ? a : b)
      const bestAsig = asigs.find(a => a.id_asignacion === best.id_asignacion)
      if (bestAsig) {
        const t = trabMap[bestAsig.dni_trabajador]
        topScorer = { nombre: t?.nombres_completos || bestAsig.dni_trabajador, foto: t?.url_foto, nota: best.promedio, cargo: cargoMap[bestAsig.id_cargo_actual] || '' }
      }
    }

    const sinEval = asigs
      .filter(a => !evalSet.has(a.id_asignacion))
      .map(a => ({ ...a, nombre: trabMap[a.dni_trabajador]?.nombres_completos || a.dni_trabajador, cargo: cargoMap[a.id_cargo_actual] || '' }))

    const notasBajas = (evals || [])
      .filter(e => parseFloat(e.promedio) < 2.0)
      .map(e => {
        const asig = asigs.find(a => a.id_asignacion === e.id_asignacion)
        if (!asig) return null
        const t = trabMap[asig.dni_trabajador]
        return { tipo: 'baja', nombre: t?.nombres_completos || asig.dni_trabajador, nota: e.promedio, cargo: cargoMap[asig.id_cargo_actual] || '' }
      })
      .filter(Boolean)

    setAlertas([
      ...notasBajas.map(a => ({ ...a, msg: `Nota crítica: ${a.nota}` })),
      ...(pctEval < 50 ? [{ tipo: 'pendiente', msg: `Solo ${pctEval}% del personal ha sido evaluado` }] : []),
    ])

    setKpi({ total, evaluados, pctEval, avgGeneral, topScorer, sinEval: sinEval.length })

    const grupos = [...new Set(asigs.flatMap(a => String(a.id_grupo).split(',').map(g => g.trim())))]
      .filter(g => g !== 'MASTER')
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

    const grupoData = grupos.map(g => {
      const miembros = asigs.filter(a => String(a.id_grupo).split(',').map(x => x.trim()).includes(g))
      const evalsMiembros = (evals || []).filter(e => miembros.some(m => m.id_asignacion === e.id_asignacion))
      const prom = evalsMiembros.length ? (evalsMiembros.reduce((a, b) => a + parseFloat(b.promedio), 0) / evalsMiembros.length).toFixed(2) : null
      const pct = miembros.length > 0 ? Math.round((evalsMiembros.length / miembros.length) * 100) : 0
      return { grupo: g, total: miembros.length, evaluados: evalsMiembros.length, pct, promedio: prom }
    })
    setByGrupo(grupoData)

    const cargoData = cids.map(cid => {
      const miembros = asigs.filter(a => a.id_cargo_actual === cid)
      const evalsMiembros = (evals || []).filter(e => miembros.some(m => m.id_asignacion === e.id_asignacion))
      const prom = evalsMiembros.length ? (evalsMiembros.reduce((a, b) => a + parseFloat(b.promedio), 0) / evalsMiembros.length).toFixed(2) : null
      return { cargo: cargoMap[cid] || `Cargo ${cid}`, total: miembros.length, evaluados: evalsMiembros.length, promedio: prom }
    }).filter(c => c.total > 0).sort((a, b) => (b.promedio || 0) - (a.promedio || 0))
    setByCargo(cargoData)

    if (evals?.length) {
      const dims = ['Seguridad', 'Calidad', 'Actitud', 'Precisión']
      const fields = ['nota_1', 'nota_2', 'nota_3', 'nota_4']
      const dimData = dims.map((d, i) => {
        const vals = evals.map(e => parseFloat(e[fields[i]])).filter(v => !isNaN(v))
        const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : null
        return { dim: d, avg }
      })
      setByDim(dimData)
    }

    const recentEvals = (evals || [])
      .sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora))
      .slice(0, 6)
      .map(e => {
        const asig = asigs.find(a => a.id_asignacion === e.id_asignacion)
        if (!asig) return null
        const t = trabMap[asig.dni_trabajador]
        return {
          nombre: t?.nombres_completos || asig.dni_trabajador,
          foto: t?.url_foto,
          cargo: cargoMap[asig.id_cargo_actual] || '',
          nota: e.promedio,
          fecha: e.fecha_hora,
        }
      })
      .filter(Boolean)
    setRecent(recentEvals)

    setLoading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '40px 0' }}>
      <div style={{ width: 16, height: 16, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: 'var(--text3)', fontSize: 13 }}>Calculando dashboard...</span>
    </div>
  )

  if (!kpi) return (
    <div className="card-static" style={{ padding: '40px 20px', textAlign: 'center' }}>
      <p style={{ color: 'var(--text3)', fontSize: 13 }}>No hay datos suficientes para mostrar el dashboard.</p>
    </div>
  )

  const scoreColor = (v) => {
    const n = parseFloat(v)
    if (isNaN(n)) return 'var(--text3)'
    return n >= 3.5 ? 'var(--green)' : n >= 2.0 ? 'var(--yellow)' : 'var(--red)'
  }

  return (
    <div className="fade">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <Antetitulo sec="dashboard" /><h2 className="page-title">Dashboard</h2>
          <p className="page-sub">{svc.nombre_descriptivo}</p>
        </div>
        <button className="btn btn-ghost" onClick={loadAll}><Icon name="refresh" size={18} />Actualizar</button>
      </div>

      {/* Pestañas: control segmentado */}
      <div className="segmented" role="tablist" aria-label="Vista del dashboard" style={{ marginBottom: 24 }}>
          <Deslizador />
        {[
          { id: 'resumen', label: 'Resumen' },
          { id: 'alertas', label: `Alertas ${alertas.length > 0 ? `(${alertas.length})` : ''}`, badge: alertas.length > 0 },
        ].map(t => (
          <button key={t.id} role="tab" aria-selected={dashTab === t.id} onClick={() => setDashTab(t.id)} className={`segmented-item ${dashTab === t.id ? 'is-active' : ''}`}>
            {t.id === 'alertas' && alertas.length > 0 && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} />}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Alertas */}
      {dashTab === 'alertas' && (
        <div className="fade">
          {alertas.length === 0 ? (
            <div className="card-static empty-state">
              <Icon name="check" size={28} style={{ color: 'var(--green)' }} />
              <p style={{ fontSize: 17, fontWeight: 600, marginTop: 16 }}>Sin alertas activas</p>
              <p style={{ color: 'var(--text2)', fontSize: 15, marginTop: 4 }}>Todos los indicadores están dentro de los rangos normales.</p>
            </div>
          ) : (
            <ul className="card-static grouped-list">
              {alertas.map((a, i) => (
                <li key={i} style={{ padding: '14px 16px', fontSize: 15, display: 'flex', alignItems: 'flex-start', gap: 12, color: 'var(--text)' }}>
                  <Icon name={a.tipo === 'baja' ? 'alert' : 'info'} size={20} style={{ color: a.tipo === 'baja' ? 'var(--red)' : 'var(--yellow)', marginTop: 1 }} />
                  <div style={{ flex: 1, lineHeight: 1.45 }}>
                    {a.tipo === 'baja'
                      ? <><strong style={{ fontWeight: 600 }}>{a.nombre}</strong> <span style={{ color: 'var(--text2)' }}>· {a.cargo}</span> <span style={{ color: 'var(--red)', fontWeight: 500 }}>· {a.msg}</span></>
                      : a.msg
                    }
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {dashTab === 'resumen' && <>

      <div className="card-static" style={{ padding: '4px 0 20px', marginBottom: 16 }}>
      <div className="kpi-grid kpi-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <KpiCard icono="users" label="Personal total" value={kpi.total} sub="asignados al servicio" color="var(--accent2)" />
        <KpiCard icono="check" label="Evaluados" value={`${kpi.evaluados}/${kpi.total}`} sub={`${kpi.pctEval}% completado`} color={kpi.pctEval >= 80 ? 'var(--green)' : kpi.pctEval >= 50 ? 'var(--yellow)' : 'var(--red)'} />
        <KpiCard icono="star" label="Nota promedio" value={kpi.avgGeneral ?? '—'} sub="de 1 a 4" color={scoreColor(kpi.avgGeneral)} />
        <KpiCard icono="clock" label="Sin evaluar" value={kpi.sinEval} sub="pendientes" color={kpi.sinEval === 0 ? 'var(--green)' : 'var(--yellow)'} />
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Progreso de evaluación</span>
          <span className="num" style={{ fontSize: 13, fontWeight: 600, color: kpi.pctEval >= 80 ? 'var(--green)' : kpi.pctEval >= 50 ? 'var(--yellow)' : 'var(--red)' }}>{kpi.pctEval} %</span>
        </div>
        <div style={{ height: 8, background: 'var(--fill)', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${kpi.pctEval}%`, borderRadius: 6, transition: 'width var(--dur-spring) var(--spring)',
            background: 'var(--brand)',
          }} />
        </div>
      </div>
      </div>

      {/* ── GRID PRINCIPAL: dimensiones + cargo + grupos ── */}
      <div className="dash-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Columna 1: Promedio por dimensión */}
        {byDim.length > 0 && (
          <div className="card-static" style={{ padding: '20px' }}>
            <div className="group-title" style={{ marginBottom: 16 }}><Glifo icono="radar" />Por dimensión</div>
            {byDim.map(d => (
              <div key={d.dim} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>{d.dim}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(d.avg), fontVariantNumeric: 'tabular-nums' }}>{d.avg ?? '—'}</span>
                </div>
                <div style={{ height: 5, background: 'var(--fill)', borderRadius: 3, overflow: 'hidden' }}>
                  <div className="meter-fill" style={{ height: '100%', borderRadius: 3, width: `${d.avg ? (parseFloat(d.avg) / 4) * 100 : 0}%`, background: scoreColor(d.avg), transition: 'width var(--dur-spring) var(--spring)' }} />
                </div>
              </div>
            ))}
            {/* Nota promedio por cargo — debajo de dimensiones */}
            {byCargo.length > 0 && (
              <>
                <div style={{ height: 1, background: 'var(--separator)', margin: '20px 0' }} />
                <div className="group-title" style={{ marginBottom: 16 }}><Glifo icono="helmet" />Por cargo</div>
                {byCargo.slice(0, 8).map((cargo, i) => (
                  <div key={cargo.cargo} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>{cargo.cargo}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: cargo.promedio ? scoreColor(cargo.promedio) : 'var(--text3)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                        {cargo.promedio ?? '—'}
                      </span>
                    </div>
                    <div style={{ height: 4, background: 'var(--fill)', borderRadius: 2, overflow: 'hidden' }}>
                      <div className="meter-fill" style={{ height: '100%', borderRadius: 2, width: cargo.promedio ? `${(parseFloat(cargo.promedio) / 4) * 100}%` : '0%', background: cargo.promedio ? scoreColor(cargo.promedio) : 'transparent', transition: 'width var(--dur-spring) var(--spring)' }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{cargo.evaluados} eval.</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Columna 2 & 3: Estado por grupo — expandido */}
        {byGrupo.length > 0 && (
          <div className="card-static dash-col-span2" style={{ padding: '20px', gridColumn: 'span 2', alignSelf: 'start' }}>
            <div className="group-title" style={{ marginBottom: 16 }}><Glifo icono="grid" />Estado por grupo</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px 24px' }}>
              {byGrupo.map(g => (
                <div key={g.grupo}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: g.promedio ? 600 : 400 }}>Grupo {g.grupo}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="num" style={{ fontSize: 13, color: 'var(--text3)' }}>{g.evaluados}/{g.total}</span>
                      {g.promedio && <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(g.promedio), fontVariantNumeric: 'tabular-nums' }}>{g.promedio}</span>}
                    </div>
                  </div>
                  <div style={{ height: 5, background: 'var(--fill)', borderRadius: 3, overflow: 'hidden' }}>
                    <div className="meter-fill" style={{ height: '100%', borderRadius: 3, width: `${g.pct}%`, background: 'var(--brand)', opacity: g.pct >= 50 ? 1 : 0.55, transition: 'width var(--dur-spring) var(--spring)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {actividades.length > 0 && (
        <div className="card-static" style={{ padding: '20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
            <span className="group-title"><Glifo icono="activity" />Trabajos y actividades recientes</span>
            <span style={{ fontSize: 13, color: 'var(--text3)' }}>Vinculados a cuadrillas</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px 24px' }}>
            {actividades.map(a => (
              <div key={a.id_actividad} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {a.meta?.url_foto ? (
                  <img src={a.meta.url_foto} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: 8, background: 'var(--fill)', color: 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="wrench" size={24} /></div>
                )}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.nombre_actividad}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{a.catalogo_competencias?.nombre}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--text3)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                    <span>Grupo {a.meta?.id_grupo || 'Gral'}</span>
                    <span>Prog: {a.duracion_programada || '-'}h</span>
                    <span>Real: {a.duracion_horas || '-'}h</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ÚLTIMAS EVALUACIONES + TOP SCORER ── */}
      <div className="dash-bottom-grid" style={{ display: 'grid', gridTemplateColumns: kpi.topScorer ? '1fr 280px' : '1fr', gap: 16, marginBottom: 16 }}>
        {recent.length > 0 && (
          <div className="card-static" style={{ padding: '20px' }}>
            <div className="group-title" style={{ marginBottom: 16 }}><Glifo icono="evaluar" />Últimas evaluaciones</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px 24px' }}>
              {recent.slice(0, 8).map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar nombre={r.nombre} foto={r.foto} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.nombre}</div>
                    <div style={{ fontSize: 13, color: 'var(--text3)' }}>{r.cargo}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 600, color: scoreColor(r.nota), fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{r.nota}</div>
                    <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{new Date(r.fecha).toLocaleDateString('es-PE', {day: '2-digit', month: 'short'})}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {kpi.topScorer && (
          <div className="card-static" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16, alignSelf: 'start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Medalla pos={1} size={24} />
              <span className="group-title"><Glifo icono="star" />Mejor nota</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar nombre={kpi.topScorer.nombre} foto={kpi.topScorer.foto} size={48} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{kpi.topScorer.nombre}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{kpi.topScorer.cargo}</div>
              </div>
            </div>
            <div className="num" style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--green)', lineHeight: 1 }}><Contador valor={kpi.topScorer.nota} /></div>
          </div>
        )}
      </div>

      </>
      }
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function KpiCard({ label, value, sub, color, icono }) {
  return (
    <div className="kpi-cell">
      <div style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 6 }}>{icono && <Icon name={icono} size={15} style={{ color: 'var(--text3)' }} />}{label}</div>
      <div className="num" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', color: color === 'var(--accent2)' ? 'var(--text)' : color, lineHeight: 1.1, marginTop: 8 }}><Contador valor={value} /></div>
      <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{sub}</div>
    </div>
  )
}

function Avatar({ nombre, foto, size = 36 }) {
  const initials = nombre ? nombre.split(' ').slice(0, 2).map(p => p[0]).join('') : '?'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
      background: 'var(--brand-soft)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.36), fontWeight: 600, color: 'var(--accent)', letterSpacing: 0,
    }}>
      {foto ? <img src={foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
    </div>
  )
}

/* =========================================
   PANEL DE ADMINISTRACIÓN (Nuevo Centro de Comando)
   ========================================= */
function AdminPanel({ svc, user }) {
  const [tab, setTab] = useState('resumen')

  const tabs = [
    { id: 'resumen',      label: 'Resumen' },
    { id: 'personal',     label: 'Editar personal' },
    { id: 'carga',        label: 'Carga masiva' },
    { id: 'competencias', label: 'Competencias' },
    { id: 'bitacora',     label: 'Bitácora' },
    { id: 'evaluadores',  label: 'Análisis de evaluadores' },
    { id: 'usuarios',     label: 'Usuarios' },
    { id: 'gestion',      label: 'Asignaciones' },
    { id: 'servicios',    label: 'Servicios' },
  ]

  return (
    <div>
      <Antetitulo sec="admin" /><h2 className="page-title">Panel de administración</h2>
      <p className="page-sub" style={{ marginBottom: 24 }}>Control central para {svc.nombre_descriptivo}</p>

      <div className="segmented" role="tablist" aria-label="Secciones de administración" style={{ marginBottom: 32, WebkitOverflowScrolling: 'touch' }}>
          <Deslizador />
        {tabs.map(t => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`segmented-item ${tab === t.id ? 'is-active' : ''}`} style={{ flexShrink: 0 }}>{t.label}</button>
        ))}
      </div>
      {tab === 'resumen'      && <AdminResumen svc={svc} />}
      {tab === 'personal'     && <AdminPersonal svc={svc} />}
      {tab === 'carga'        && <AdminCarga svc={svc} user={user} />}
      {tab === 'competencias' && <AdminCompetencias />}
      {tab === 'bitacora'     && <AdminBitacoraEditor svc={svc} user={user} />}
      {tab === 'evaluadores'  && <AdminEvaluadores svc={svc} />}
      {tab === 'usuarios'     && <AdminUsuarios user={user} />}
      {tab === 'gestion'      && <AdminGestion svc={svc} />}
      {tab === 'servicios'    && <AdminServicios user={user} currentSvcId={svc.id_servicio} />}
    </div>
  )
}

/* --- TAB 1: Resumen General --- */
function AdminResumen({ svc }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: asigs } = await supabase.from('asignaciones').select('id_grupo, turno, id_cargo_actual').eq('id_servicio', svc.id_servicio).eq('estado', 'ACTIVO')
      if (!asigs) { setLoading(false); return }

      const cids = [...new Set(asigs.map(a => a.id_cargo_actual))]
      const { data: catCargos } = await supabase.from('catalogo_cargos').select('id_cargo, nombre_oficial').in('id_cargo', cids.length ? cids : [0])
      const cMap = Object.fromEntries((catCargos||[]).map(c => [c.id_cargo, c.nombre_oficial]))

      const cargosCount = {}; const turnosCount = { 'A': 0, 'B': 0 }
      asigs.forEach(a => {
         const cName = cMap[a.id_cargo_actual] || `Cargo ${a.id_cargo_actual}`
         cargosCount[cName] = (cargosCount[cName] || 0) + 1
         if(a.turno === 'A') turnosCount.A++
         if(a.turno === 'B') turnosCount.B++
      })

      const sortedCargos = Object.entries(cargosCount).sort((a,b) => b[1] - a[1])
      
      setStats({ total: asigs.length, cargos: sortedCargos, turnos: turnosCount })
      setLoading(false)
    }
    load()
  }, [svc])

  if (loading) return <p style={{ color: 'var(--text3)', fontSize: 13 }}>Calculando estadísticas globales...</p>
  if (!stats) return <p style={{ color: 'var(--text3)', fontSize: 13 }}>No hay datos registrados aún.</p>

  return (
    <div className="fade">
      <div className="card-static kpi-strip num" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 16 }}>
        <div className="kpi-cell">
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>Técnicos en el servicio</div>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, marginTop: 8 }}><Contador valor={stats.total} /></div>
        </div>
        <div className="kpi-cell">
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>Turno A</div>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, marginTop: 8 }}><Contador valor={stats.turnos.A} /></div>
        </div>
        <div className="kpi-cell">
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>Turno B</div>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, marginTop: 8 }}><Contador valor={stats.turnos.B} /></div>
        </div>
      </div>
      <div className="card-static" style={{ padding: '20px' }}>
         <h3 className="card-title"><Glifo icono="helmet" />Personal por especialidad</h3>
         <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', columnGap: 32 }}>
            {stats.cargos.map(([nombre, cant]) => (
               <li key={nombre} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', boxShadow: 'inset 0 -0.5px 0 var(--separator)' }}>
                 <span style={{ fontSize: 15 }}>{nombre}</span>
                 <span className="num" style={{ fontSize: 15, fontWeight: 600, color: 'var(--text2)' }}>{cant}</span>
               </li>
            ))}
         </ul>
      </div>
    </div>
  )
}

/* --- TAB 2: Carga de Personal (La herramienta Excel optimizada) --- */
function AdminCarga({ svc, user }) {
  const [step, setStep] = useState(1)
  const [rows, setRows] = useState([])
  const [errors, setErrors] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [cargos, setCargos] = useState([])
  const [importMode, setImportMode] = useState('valid')
  const [textoPegado, setTextoPegado] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    supabase.from('catalogo_cargos').select('id_cargo, nombre_oficial').order('nombre_oficial').then(({ data }) => setCargos(data || []))
  }, [])

  function downloadTemplate() {
    const headers = 'DNI,NOMBRES_COMPLETOS,CARGO,TURNO,ID_GRUPO'
    const ejemplo = `12345678,"GARCIA FLORES JUAN CARLOS",MECANICO,A,1\n87654321,"QUISPE MAMANI PEDRO",SOLDADOR,B,MASTER`
    const blob = new Blob([headers + '\n' + ejemplo], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `Plantilla_Personal_${svc.nombre_descriptivo.replace(/\s/g, '_')}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setMsg(''); setErrors([]); setRows([]); setStats(null); setStep(1)

    const ext = file.name.split('.').pop().toLowerCase()
    if (ext === 'csv') {
      const reader = new FileReader()
      reader.onload = (ev) => parseCSV(ev.target.result)
      reader.readAsText(file, 'UTF-8')
    } else if (ext === 'xlsx' || ext === 'xls') {
      setMsg('Para archivos de Excel (.xlsx), por favor usa el recuadro de la izquierda para "Pegar desde Excel" directamente.')
    } else {
      setMsg('Formato no soportado. Usa CSV o pega directamente desde Excel.')
    }
    e.target.value = ''
  }

  function procesarPegadoExcel() {
    if (!textoPegado.trim()) return;
    setMsg(''); setErrors([]); setRows([]); setStats(null);
    
    const lineas = textoPegado.trim().split('\n');
    if (lineas.length < 2) {
      setMsg('El formato parece incorrecto. Asegúrate de copiar las 5 columnas INCLUYENDO los encabezados.');
      return;
    }
    const parsedRows = lineas.map(l => l.split('\t').map(c => c.trim().replace(/^"|"$/g, '')));
    parseRows(parsedRows);
  }

  function parseCSV(text) {
    const lines = []
    let current = []; let field = ''; let inQuotes = false
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    for (let i = 0; i < normalized.length; i++) {
      const ch = normalized[i]
      if (ch === '"') {
        if (inQuotes && normalized[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        current.push(field.trim()); field = ''
      } else if (ch === '\n' && !inQuotes) {
        current.push(field.trim()); lines.push(current); current = []; field = ''
      } else {
        field += ch
      }
    }
    if (field || current.length) { current.push(field.trim()); lines.push(current) }

    parseRows(lines.filter(l => l.some(c => c)))
  }

  function parseRows(rows) {
    if (rows.length < 2) { setMsg('El archivo está vacío o no tiene filas de datos.'); return }

    const header = rows[0].map(h => h.toUpperCase().replace(/[^A-Z_]/g, ''))
    const iDni   = header.findIndex(h => h.includes('DNI'))
    const iNom   = header.findIndex(h => h.includes('NOMBRE'))
    const iCargo = header.findIndex(h => h.includes('CARGO')) 
    const iTurno = header.findIndex(h => h.includes('TURNO'))
    const iGrupo = header.findIndex(h => h.includes('GRUPO'))

    if ([iDni, iNom, iCargo, iTurno, iGrupo].some(i => i === -1)) {
      setMsg('No se encontraron las columnas requeridas: DNI, NOMBRES_COMPLETOS, CARGO, TURNO, ID_GRUPO. Verifica tus encabezados.')
      return
    }

    const parsed = []; const errs = []

    rows.slice(1).forEach((r, idx) => {
      if (r.every(c => !c)) return
      const rowNum = idx + 2
      const dni     = r[iDni] ? String(r[iDni]).trim() : ''
      const nombre  = r[iNom] ? String(r[iNom]).trim() : ''
      const cargoStr = r[iCargo] ? String(r[iCargo]).trim().toUpperCase() : ''
      const turno   = r[iTurno] ? String(r[iTurno]).trim().toUpperCase() : ''
      const grupo   = r[iGrupo] ? String(r[iGrupo]).trim().toUpperCase() : ''

      const rowErrors = []
      if (!/^\d{8}$/.test(dni)) rowErrors.push('DNI debe tener 8 dígitos numéricos')
      if (!nombre || nombre.length < 3) rowErrors.push('Nombre inválido')
      
      const cargoObj = cargos.find(c => c.nombre_oficial.toUpperCase() === cargoStr || String(c.id_cargo) === cargoStr)
      if (!cargoObj) rowErrors.push(`El cargo "${cargoStr}" no se reconoce en el catálogo`)
      
      if (!['A', 'B'].includes(turno)) rowErrors.push('TURNO debe ser A o B')
      if (!grupo) rowErrors.push('GRUPO no puede estar vacío')

      if (rowErrors.length) {
        errs.push({ fila: rowNum, dni, nombre, errores: rowErrors })
      } else {
        parsed.push({ dni, nombre, id_cargo: cargoObj.id_cargo, turno, grupo, cargoNombre: cargoObj.nombre_oficial })
      }
    })

    setRows(parsed)
    setErrors(errs)
    setStats({ total: parsed.length + errs.length, validos: parsed.length, errores: errs.length })
    setStep(2)
  }

  async function ejecutarCarga() {
    if (errors.length > 0) return alert('Debes corregir los errores antes de importar.')
    const toInsert = rows
    if (!toInsert.length) { setMsg('No hay registros válidos para importar.'); return }

    setLoading(true)
    let exitosos = 0; const erroresCarga = []

    for (const r of toInsert) {
      try {
        const { error: e1 } = await supabase.from('trabajadores').upsert({
          dni: r.dni,
          nombres_completos: r.nombre,
          cargo_max_id: r.id_cargo,
        }, { onConflict: 'dni' })
        if (e1) throw e1

        const { error: e2 } = await supabase.from('asignaciones').upsert({
          dni_trabajador: r.dni,
          id_servicio: svc.id_servicio,
          id_cargo_actual: r.id_cargo,
          turno: r.turno,
          id_grupo: r.grupo,
          estado: 'ACTIVO',
        }, { onConflict: 'dni_trabajador,id_servicio' })
        if (e2) throw e2

        exitosos++
      } catch (err) {
        erroresCarga.push({ dni: r.dni, nombre: r.nombre, error: err.message || 'Error desconocido' })
      }
    }

    await supabase.from('cargas_masivas').insert({
      archivo_nombre: `Carga_${svc.nombre_descriptivo}_${new Date().toISOString().slice(0, 10)}`,
      id_servicio: svc.id_servicio,
      registros_total: toInsert.length,
      registros_exitosos: exitosos,
      registros_error: erroresCarga.length,
      detalle_errores: erroresCarga.length ? JSON.stringify(erroresCarga) : null,
      username: user.username,
    })

    await supabase.from('audit_log').insert({
      username: user.username,
      accion: 'CARGA_MASIVA',
      tabla_afectada: 'asignaciones',
      registro_id: String(svc.id_servicio),
      detalle: `${exitosos} registros exitosos, ${erroresCarga.length} errores`,
    })

    setStats(prev => ({ ...prev, exitosos, erroresCarga }))
    setLoading(false)
    setStep(3)
  }

  function reset() {
    setStep(1); setRows([]); setErrors([]); setStats(null); setMsg(''); setTextoPegado('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="fade">
      {step === 1 && (
        <>
          <div className="card-static" style={{ padding: '16px 18px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span className="card-title" style={{ marginBottom: 0 }}><Glifo icono="file" />Formato de columnas requerido</span>
              <button className="btn btn-ghost" onClick={downloadTemplate} style={{ margin: 0, width: 'auto' }}><Icon name="download" size={16} />Descargar plantilla Excel/CSV</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {[
                { col: 'DNI', req: true, desc: '8 dígitos numéricos' },
                { col: 'NOMBRES_COMPLETOS', req: true, desc: 'APELLIDOS NOMBRES' },
                { col: 'CARGO', req: true, desc: 'Revisa la lista de abajo' },
                { col: 'TURNO', req: true, desc: 'Letra A o B' },
                { col: 'ID_GRUPO', req: true, desc: 'Número o MASTER' },
              ].map(c => (
                <div key={c.col} style={{ padding: '10px 12px', background: 'var(--fill)', borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text)', marginBottom: 4 }}>{c.col}</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.4 }}>{c.desc}</div>
                </div>
              ))}
            </div>
            
            {cargos.length > 0 && (
              <div style={{ marginTop: 16, padding: '12px', background: 'var(--fill)', borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>Cargos permitidos (copia y pega el nombre exacto):</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {cargos.map(c => (
                    <span key={c.id_cargo} style={{ padding: '4px 10px', background: 'var(--surface)', borderRadius: 6, fontSize: 13, color: 'var(--text)', userSelect: 'all' }}>
                      {c.nombre_oficial}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {msg && <div className="alert alert-err" style={{ marginBottom: 14 }}>{msg}</div>}

          <div style={{ display: 'flex', gap: 20, alignItems: 'stretch' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Opción A · Pegar desde Excel <span style={{ fontWeight: 400, color: 'var(--text3)' }}>(recomendado)</span></div>
              <textarea 
                className="input" 
                value={textoPegado} 
                onChange={e => setTextoPegado(e.target.value)} 
                placeholder="Selecciona tus 5 columnas en Excel (incluyendo los encabezados), cópialas y presiona aquí Ctrl + V..."
                style={{ flex: 1, minHeight: 160, resize: 'none', fontVariantNumeric: 'tabular-nums', fontSize: 13, whiteSpace: 'pre', border: '1.5px dashed var(--border-h)', background: 'var(--surface)' }}
              />
              <button className="btn btn-primary" onClick={procesarPegadoExcel} disabled={!textoPegado} style={{ marginTop: 12 }}>Procesar datos pegados</button>
            </div>
            <div style={{ width: 1, background: 'var(--border)', margin: '10px 0' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Opción B · Subir archivo CSV</div>
              <div onClick={() => fileRef.current?.click()} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)', borderRadius: 12, padding: '20px', textAlign: 'center', cursor: 'pointer', transition: 'border-color var(--dur-quick) ease-out', background: 'var(--fill)', minHeight: 160 }} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { const dt = new DataTransfer(); dt.items.add(f); fileRef.current.files = dt.files; handleFile({ target: fileRef.current }) } }}>
                <Icon name="upload" size={32} style={{ margin: '0 auto 12px', color: 'var(--text3)' }} />
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Arrastra tu CSV aquí</div>
                <div style={{ fontSize: 13, color: 'var(--text3)' }}>o haz click para buscar</div>
              </div>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }} />
            </div>
          </div>
        </>
      )}

      {step === 2 && stats && (
        <div className="fade">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
            <div className="card-static" style={{ padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent2)' }}>{stats.total}</div>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 3 }}>Filas leídas</div>
            </div>
            <div className="card-static" style={{ padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{stats.validos}</div>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 3 }}>Válidos</div>
            </div>
            <div className="card-static" style={{ padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: stats.errores > 0 ? 'var(--red)' : 'var(--green)' }}>{stats.errores}</div>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 3 }}>Con errores</div>
            </div>
          </div>

          {errors.length > 0 ? (
            <div className="card-static" style={{ padding: '16px 20px', marginBottom: 14, border: '1px solid var(--red)', background: 'color-mix(in srgb, var(--red) 5%, transparent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--red)', marginBottom: 8 }}><Icon name="alert" size={18} />Carga bloqueada por errores</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>El archivo contiene datos inválidos o cargos que no existen en el catálogo. <strong>Debes corregir tu archivo Excel y volver a pegarlo.</strong> No se permite la subida parcial.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                {errors.map((e, i) => (
                  <div key={i} style={{ fontSize: 13, padding: '7px 10px', background: 'color-mix(in srgb, var(--red) 5%, transparent)', borderRadius: 6 }}>
                    <span style={{ fontWeight: 600 }}>Fila {e.fila}</span> — {e.dni} {e.nombre && `· ${e.nombre}`}
                    <div style={{ color: 'var(--red)', marginTop: 2 }}>{e.errores.join(' · ')}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : rows.length > 0 && (
            <div className="card-static" style={{ padding: '14px 18px', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--green)' }}><Icon name="check" size={18} />Datos listos para importar <span style={{ fontWeight: 400, color: 'var(--text3)' }}>· vista previa de 5 filas</span></div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['DNI', 'Nombres', 'Cargo', 'Turno', 'Grupo'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--text3)', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--fill)' }}>
                        <td style={{ padding: '5px 8px', fontFamily: 'var(--font-mono)' }}>{r.dni}</td>
                        <td style={{ padding: '5px 8px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.nombre}</td>
                        <td style={{ padding: '5px 8px', color: 'var(--accent)' }}>{r.cargoNombre}</td>
                        <td style={{ padding: '5px 8px' }}>{r.turno}</td>
                        <td style={{ padding: '5px 8px' }}>{r.grupo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 5 && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>...y {rows.length - 5} más</div>}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={reset} style={{ flex: 1, minHeight: 44 }}><Icon name="back" size={16} />{errors.length > 0 ? 'Volver y corregir' : 'Cancelar'}</button>
            {errors.length === 0 && rows.length > 0 && (
              <button className="btn btn-primary" onClick={ejecutarCarga} disabled={loading} style={{ flex: 2 }}>
                {loading ? 'Importando...' : `Confirmar e importar ${rows.length} trabajadores`}
              </button>
            )}
          </div>
        </div>
      )}

      {step === 3 && stats && (
        <div className="fade" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Icon name={stats.erroresCarga?.length === 0 ? 'check' : 'alert'} size={36} style={{ margin: '0 auto 16px', color: stats.erroresCarga?.length === 0 ? 'var(--green)' : 'var(--yellow)' }} />
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Carga completada</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>
            <strong style={{ color: 'var(--green)' }}>{stats.exitosos}</strong> trabajadores importados exitosamente
            {stats.erroresCarga?.length > 0 && <> · <strong style={{ color: 'var(--red)' }}>{stats.erroresCarga.length}</strong> errores</>}
          </div>
          {stats.erroresCarga?.length > 0 && (
            <div style={{ marginBottom: 20, textAlign: 'left', maxWidth: 500, margin: '0 auto 20px' }}>
              {stats.erroresCarga.map((e, i) => (
                <div key={i} style={{ fontSize: 13, padding: '6px 10px', marginBottom: 4, background: 'color-mix(in srgb, var(--red) 7%, transparent)', borderRadius: 6, color: 'var(--red)' }}>
                  {e.dni} — {e.nombre}: {e.error}
                </div>
              ))}
            </div>
          )}
          <button className="btn btn-primary" onClick={reset} style={{ maxWidth: 260 }}>Nueva carga</button>
        </div>
      )}
    </div>
  )
}

function HistorialCargas({ svc }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('cargas_masivas').select('*').eq('id_servicio', svc.id_servicio)
      .order('fecha_hora', { ascending: false }).limit(20)
      .then(({ data }) => { setData(data || []); setLoading(false) })
  }, [svc])

  if (loading) return <p style={{ color: 'var(--text3)', fontSize: 13 }}>Cargando...</p>

  if (!data.length) return (
    <div className="card-static" style={{ padding: '36px 20px', textAlign: 'center' }}>
      <p style={{ color: 'var(--text3)', fontSize: 13 }}>No hay cargas registradas para este servicio</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {data.map(c => (
        <div key={c.id} className="card-static" style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{c.archivo_nombre}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
              {c.username} · {new Date(c.fecha_hora).toLocaleString('es-PE')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="badge b-ok">{c.registros_exitosos} ok</span>
            {c.registros_error > 0 && <span className="badge b-err">{c.registros_error} err</span>}
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{c.registros_total} total</span>
          </div>
        </div>
      ))}
    </div>
  )
}

/* =========================================
   RANKING 70/30
   ========================================= */
function Ranking({ svc, user }) {
  const [loading, setLoading]           = useState(true)
  const [cargos, setCargos]             = useState([])
  const [cargoSelPodio, setCargoSelPodio] = useState('TODOS')
  const [rowsByGrupo, setRowsByGrupo]   = useState([])
  const [rowsServicio, setRowsServicio] = useState([])
  const [pesos, setPesos]               = useState({ actual: 0.70, historico: 0.30 })
  const [turnoFiltro, setTurnoFiltro]   = useState('TODOS')
  const [grupoFiltro, setGrupoFiltro]   = useState('TODOS')
  const [grupos, setGrupos]             = useState([])
  const [allData, setAllData]           = useState(null)
  const [usar7030, setUsar7030]         = useState(false)
  const [modoRanking, setModoRanking]   = useState('actual') // 'actual' | 'formula'
  const [verPodioServicio, setVerPodioServicio] = useState(false)

  useEffect(() => { loadAll() }, [svc])
  useEffect(() => { if (allData) { calcTabla(); calcRankingServicio() } }, [turnoFiltro, grupoFiltro, cargoSelPodio, allData, usar7030])
  useEffect(() => { if (allData) calcPodioCargo() }, [cargoSelPodio, allData, usar7030])

  const avg    = arr => arr.reduce((a, b) => a + b, 0) / arr.length
  const round2 = n   => Math.round(n * 100) / 100
  const scoreColor = v => { if (!v && v !== 0) return 'var(--text3)'; return v >= 3.5 ? 'var(--green)' : v >= 2.0 ? 'var(--yellow)' : 'var(--red)' }
  const medalColor = p => p === 1 ? 'var(--gold)' : p === 2 ? 'var(--silver)' : 'var(--bronze)'

  const [podioCargo, setPodioCargo] = useState([])

  async function loadAll() {
    setLoading(true)
    const sid = svc.id_servicio
    const { data: cfg } = await supabase.from('config_sistema').select('clave, valor').in('clave', ['formula_peso_actual', 'formula_peso_historico'])
    const cfgMap = Object.fromEntries((cfg || []).map(c => [c.clave, parseFloat(c.valor)]))
    const pesoActual = cfgMap['formula_peso_actual'] ?? 0.70
    const pesoHist   = cfgMap['formula_peso_historico'] ?? 0.30
    setPesos({ actual: pesoActual, historico: pesoHist })

    const { data: asigs } = await supabase.from('asignaciones').select('id_asignacion, dni_trabajador, id_cargo_actual, turno, id_grupo').eq('id_servicio', sid).eq('estado', 'ACTIVO')
    if (!asigs?.length) { setLoading(false); return }

    const cids = [...new Set(asigs.map(a => a.id_cargo_actual))]
    const { data: catCargos } = await supabase.from('catalogo_cargos').select('id_cargo, nombre_oficial').in('id_cargo', cids)
    const cargoMap = Object.fromEntries((catCargos || []).map(c => [c.id_cargo, c.nombre_oficial]))

    const { data: evalsActual } = await supabase.from('historial_evaluaciones').select('id_asignacion, promedio').eq('id_servicio', sid).in('id_asignacion', asigs.map(a => a.id_asignacion))

    const dnis = [...new Set(asigs.map(a => a.dni_trabajador))]
    const { data: asigsTodas } = await supabase.from('asignaciones').select('id_asignacion, dni_trabajador').in('dni_trabajador', dnis).neq('id_servicio', sid)
    const asigHistDniMap = Object.fromEntries((asigsTodas || []).map(a => [a.id_asignacion, a.dni_trabajador]))
    let evalsHist = []
    if ((asigsTodas || []).length) {
      const { data } = await supabase.from('historial_evaluaciones').select('id_asignacion, promedio').in('id_asignacion', asigsTodas.map(a => a.id_asignacion))
      evalsHist = data || []
    }

    const { data: trabajadores } = await supabase.from('trabajadores').select('dni, nombres_completos, url_foto').in('dni', dnis)
    const trabMap = Object.fromEntries((trabajadores || []).map(t => [t.dni, t]))

    const evalActualMap = {}
    for (const e of (evalsActual || [])) { if (!evalActualMap[e.id_asignacion]) evalActualMap[e.id_asignacion] = []; evalActualMap[e.id_asignacion].push(parseFloat(e.promedio)) }
    const evalHistMap = {}
    for (const e of evalsHist) { const dni = asigHistDniMap[e.id_asignacion]; if (!dni) continue; if (!evalHistMap[dni]) evalHistMap[dni] = []; evalHistMap[dni].push(parseFloat(e.promedio)) }

    const dataset = asigs.map(a => {
      const promsActual = evalActualMap[a.id_asignacion] || []
      const promsHist   = evalHistMap[a.dni_trabajador]  || []
      const notaActual  = promsActual.length ? round2(avg(promsActual)) : null
      const notaHist    = promsHist.length   ? round2(avg(promsHist))   : null
      const t = trabMap[a.dni_trabajador] || {}
      return { ...a, nombre: t.nombres_completos || a.dni_trabajador, foto: t.url_foto || null, cargoNombre: cargoMap[a.id_cargo_actual] || `Cargo ${a.id_cargo_actual}`, notaActual, notaHist, evaluado: notaActual !== null }
    })

    const gruposUniq = [...new Set(asigs.flatMap(a => String(a.id_grupo).split(',').map(g => g.trim())))].filter(g => g && g !== 'MASTER').sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    setGrupos(gruposUniq)

    const cargoConEval = [...new Set(dataset.filter(d => d.evaluado).map(d => d.id_cargo_actual))]
    const cargosList = cids.map(cid => ({ id: cid, nombre: cargoMap[cid] || `Cargo ${cid}`, tieneEvals: cargoConEval.includes(cid) })).sort((a, b) => (b.tieneEvals ? 1 : 0) - (a.tieneEvals ? 1 : 0) || a.nombre.localeCompare(b.nombre))
    
    setCargos(cargosList)
    setAllData({ dataset, pesoActual, pesoHist })
    setCargoSelPodio('TODOS')
    setLoading(false)
  }

  function getNota(r, usarF) {
    if (r.notaActual === null) return null
    if (!usarF || r.notaHist === null) return r.notaActual
    return round2((r.notaActual * pesos.actual) + (r.notaHist * pesos.historico))
  }

  function sortArr(arr) {
    return [...arr].sort((a, b) => { if (a.evaluado && !b.evaluado) return -1; if (!a.evaluado && b.evaluado) return 1; return (getNota(b, usar7030) ?? 0) - (getNota(a, usar7030) ?? 0) })
  }

  function calcTabla() {
    if (!allData) return
    let cids = [...new Set(allData.dataset.map(d => d.id_cargo_actual))]
    
    if (cargoSelPodio !== 'TODOS') {
      cids = [cargoSelPodio]
    }

    const grupos = cids.map(cid => {
      let members = allData.dataset.filter(d => d.id_cargo_actual === cid && d.evaluado)
      if (turnoFiltro !== 'TODOS') members = members.filter(d => d.turno === turnoFiltro)
      if (grupoFiltro !== 'TODOS') members = members.filter(d => String(d.id_grupo).split(',').map(g => g.trim()).includes(grupoFiltro))
      const sorted = sortArr(members).map((r, i) => ({ ...r, posicion: i + 1, notaFinal: getNota(r, usar7030) }))
      return { cargoId: cid, cargoNombre: members[0]?.cargoNombre || `Cargo ${cid}`, rows: sorted }
    }).filter(g => g.rows.length > 0).sort((a, b) => a.cargoNombre.localeCompare(b.cargoNombre))
    setRowsByGrupo(grupos)
  }

  function calcPodioCargo() {
    if (!allData || cargoSelPodio === 'TODOS') {
      setPodioCargo([])
      return
    }
    const members = allData.dataset.filter(d => d.id_cargo_actual === cargoSelPodio && d.evaluado)
    const sorted = sortArr(members).slice(0, 3).map((r, i) => ({ ...r, posicion: i + 1, notaFinal: getNota(r, usar7030) }))
    setPodioCargo(sorted)
  }

  function calcRankingServicio() {
    if (!allData) return
    const sorted = sortArr(allData.dataset.filter(d => d.evaluado)).slice(0, 10).map((r, i) => ({ ...r, posicion: i + 1, notaFinal: getNota(r, usar7030) }))
    setRowsServicio(sorted)
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '40px 0' }}><div style={{ width: 16, height: 16, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><span style={{ color: 'var(--text3)', fontSize: 13 }}>Calculando ranking...</span></div>
  if (!cargos.length) return <div className="card-static" style={{ padding: '40px 20px', textAlign: 'center' }}><p style={{ color: 'var(--text3)', fontSize: 13 }}>No hay personal asignado.</p></div>

  const totalEval = rowsByGrupo.reduce((a, g) => a + g.rows.length, 0)

  return (
    <div className="fade">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Antetitulo sec="ranking" /><h2 className="page-title">Ranking por cargo</h2>
          <p className="page-sub">{svc.nombre_descriptivo}</p>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div className="segmented" role="radiogroup" aria-label="Modo de ranking">
          <Deslizador />
              {/* Modo: Solo este servicio */}
              <button role="radio" aria-checked={modoRanking === 'actual'} onClick={() => { setModoRanking('actual'); setUsar7030(false) }} className={`segmented-item ${modoRanking === 'actual' ? 'is-active' : ''}`}>
                Solo este servicio
              </button>
              {/* Modo: Fórmula 70/30 */}
              <button role="radio" aria-checked={modoRanking === 'formula'} onClick={() => { setModoRanking('formula'); setUsar7030(true) }} className={`segmented-item ${modoRanking === 'formula' ? 'is-active' : ''}`}>
                Fórmula 70/30
              </button>
            </div>
            <div className="num" style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6, paddingLeft: 4 }}>
              {modoRanking === 'actual' ? 'Sin historial previo' : `${(pesos.actual*100).toFixed(0)} % actual + ${(pesos.historico*100).toFixed(0)} % histórico`}
            </div>
          </div>
          {/* Podio del servicio */}
          <ToggleSwitch on={verPodioServicio} onChange={setVerPodioServicio} color="var(--accent2)"
            label="Podio del servicio" sub="Top 3 general" />
        </div>
      </div>

      {verPodioServicio && rowsServicio.slice(0,3).length >= 2 && (
        <div style={{ marginBottom: 24 }} className="fade">
          <SectionLabel text={`Podio general · ${svc.nombre_descriptivo}`} />
          <Podio items={rowsServicio.slice(0,3)} medalColor={medalColor} scoreColor={scoreColor} svcId={svc.id_servicio} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 2, minWidth: 200 }}>
          <label htmlFor="rk-cargo" className="field-label">Cargo</label>
          <select id="rk-cargo" className="input" value={cargoSelPodio} onChange={e => setCargoSelPodio(e.target.value === 'TODOS' ? 'TODOS' : parseInt(e.target.value))}
            >
            <option value="TODOS">Mostrar todos los cargos</option>
            {cargos.map(c => <option key={c.id} value={c.id}>{c.nombre}{!c.tieneEvals ? ' (sin eval.)' : ''}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 140 }}>
          <label htmlFor="rk-turno" className="field-label">Turno</label>
          <select id="rk-turno" className="input" value={turnoFiltro} onChange={e => setTurnoFiltro(e.target.value)}>
            <option value="TODOS">Todos</option>
            <option value="A">Turno A</option>
            <option value="B">Turno B</option>
          </select>
        </div>
        {grupos.length > 0 && (
          <div style={{ minWidth: 140 }}>
            <label htmlFor="rk-grupo" className="field-label">Grupo</label>
            <select id="rk-grupo" className="input" value={grupoFiltro} onChange={e => setGrupoFiltro(e.target.value)}>
              <option value="TODOS">Todos</option>
              {grupos.map(g => <option key={g} value={g}>Grupo {g}</option>)}
            </select>
          </div>
        )}
      </div>

      {podioCargo.length >= 2 && (
        <div style={{ marginBottom: 24 }}>
          <SectionLabel text={`Podio · ${cargos.find(c => c.id === cargoSelPodio)?.nombre || ''}`} />
          <Podio items={podioCargo} medalColor={medalColor} scoreColor={scoreColor} svcId={svc.id_servicio} />
        </div>
      )}

      {rowsByGrupo.length === 0 ? (
        <div className="card-static empty-state"><p style={{ color: 'var(--text2)', fontSize: 15 }}>No hay evaluaciones con los filtros aplicados.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {rowsByGrupo.map(grupo => (
            <section key={grupo.cargoId}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 8, padding: '0 4px' }}>
                <h3 className="group-title"><Glifo icono="helmet" />{grupo.cargoNombre}</h3>
                <div className="num" style={{ fontSize: 13, color: 'var(--text3)' }}>{grupo.rows.length} evaluados</div>
              </div>
              <div className="card-static" style={{ overflow: 'hidden', overflowX: 'auto' }}>
                <div className="rank-header-desktop" style={{ display: 'grid', gridTemplateColumns: '32px 1fr 88px 80px 96px', gap: 8, padding: '10px 16px', boxShadow: 'inset 0 -0.5px 0 var(--separator)', fontSize: 13, color: 'var(--text3)', fontWeight: 500 }}>
                  <div style={{ textAlign: 'center' }}>#</div><div>Trabajador</div>
                  <div className="num" style={{ textAlign: 'right' }}>{modoRanking === 'actual' ? 'Nota' : `Actual ${(pesos.actual*100).toFixed(0)} %`}</div>
                  <div className="num" style={{ textAlign: 'right', visibility: modoRanking === 'formula' ? 'visible' : 'hidden' }}>Hist. {(pesos.historico*100).toFixed(0)} %</div>
                  <div style={{ textAlign: 'right' }}>Final</div>
                </div>
                {grupo.rows.map((r, i) => (
                  <div key={r.id_asignacion} style={{ boxShadow: i > 0 ? 'inset 0 0.5px 0 var(--separator)' : 'none' }}>
                    <div className="rank-row-content" style={{ display: 'grid', gridTemplateColumns: '32px 1fr 88px 80px 96px', gap: 8, padding: '12px 16px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>
                        {r.posicion <= 3 ? <Medalla pos={r.posicion} size={26} /> : r.posicion}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        <Avatar nombre={r.nombre} foto={r.foto} size={36} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{r.nombre}</div>
                          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>Grupo {r.id_grupo} · Turno {r.turno}</div>
                        </div>
                      </div>
                      <div className="num" style={{ textAlign: 'right', fontSize: 15, fontWeight: 500, color: scoreColor(r.notaActual) }}>{r.notaActual}</div>
                      <div className="num" style={{ textAlign: 'right', fontSize: 15, color: usar7030 ? 'var(--text2)' : 'var(--text3)', visibility: usar7030 ? 'visible' : 'hidden' }}>{usar7030 ? (r.notaHist ?? '—') : '—'}</div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <span style={{ fontSize: 17, fontWeight: 700, color: scoreColor(r.notaFinal), fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{r.notaFinal}</span>
                        <div style={{ width: 64, height: 4, background: 'var(--fill-2)', borderRadius: 2, overflow: 'hidden' }}>
                          <div className="meter-fill" style={{ height: '100%', borderRadius: 2, width: `${(r.notaFinal / 4) * 100}%`, background: scoreColor(r.notaFinal), transition: 'width var(--dur-spring) var(--spring)' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="num" style={{ marginTop: 24, padding: '0 4px', display: 'flex', alignItems: 'center', gap: '8px 20px', flexWrap: 'wrap', fontSize: 13, color: 'var(--text2)' }}>
        <span style={{ color: 'var(--text3)' }}>{totalEval} evaluados</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />≥ 3.5 óptimo
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--yellow)' }} />≥ 2.0 aceptable
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)' }} />{'< 2.0 riesgo'}
        </span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function ToggleSwitch({ on, onChange, color, label, sub }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(v => !v)} className="switch-row">
      <span className={`switch ${on ? 'is-on' : ''}`} aria-hidden="true"><span className="switch-knob" /></span>
      <span style={{ textAlign: 'left' }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{label}</span>
        <span style={{ display: 'block', fontSize: 13, color: 'var(--text3)' }}>{sub}</span>
      </span>
    </button>
  )
}

function SectionLabel({ text, color }) {
  return <h3 className="group-title" style={{ marginBottom: 16, padding: '0 4px' }}><Glifo icono="trophy" />{text}</h3>
}

function Podio({ items, medalColor, scoreColor, svcId }) {
  const [victorias, setVictorias] = useState({})

  useEffect(() => {
    if (!items?.length) return
    async function checkV() {
      const dnis = items.filter(Boolean).map(p => p.dni_trabajador || p.dni).filter(Boolean)
      if (!dnis.length) return
      const { data: asigs } = await supabase.from('asignaciones').select('id_asignacion, dni_trabajador').in('dni_trabajador', dnis)
      if (!asigs?.length) return
      const asigMap = Object.fromEntries(asigs.map(a => [a.id_asignacion, a.dni_trabajador]))
      const { data: hist } = await supabase.from('historial_evaluaciones').select('id_asignacion, id_servicio, promedio').in('id_asignacion', asigs.map(a => a.id_asignacion)).neq('id_servicio', svcId)
      if (!hist?.length) return
      const porSvc = {}
      hist.forEach(e => {
        const k = e.id_servicio; const d = asigMap[e.id_asignacion]; const p = parseFloat(e.promedio)
        if (!porSvc[k] || p > porSvc[k].p) porSvc[k] = { d, p }
      })
      const cnt = {}
      Object.values(porSvc).forEach(({ d }) => { cnt[d] = (cnt[d] || 0) + 1 })
      setVictorias(cnt)
    }
    checkV()
  }, [items, svcId])

  const orden = [items[1], items[0], items[2]].filter(Boolean)
  
  const podioH = pos => pos === 1 ? 'auto' : 'auto'
  const podioFlex = pos => pos === 1 ? 1.25 : 1

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, justifyContent: 'center' }}>
      {orden.map((p, vi) => {
        const pos = vi === 0 ? 2 : vi === 1 ? 1 : 3
        const isFirst = pos === 1
        const dni = p.dni_trabajador || p.dni
        const v = victorias[dni] || 0
        const leyenda = v >= 4 ? 'Leyenda PRODISE' : v >= 3 ? 'Tricampeón' : v === 2 ? '2× campeón' : v === 1 ? 'Campeón previo' : (isFirst && p.notaFinal >= 3.5) ? 'Debut' : null
        const leyendaIcon = v >= 4 ? 'star' : v >= 3 ? 'flame' : v === 2 ? 'repeat' : v === 1 ? 'trophy' : 'spark'
        const cercanoPrimero = pos === 2 && items[0] && Math.abs((p.notaFinal||0)-(items[0].notaFinal||0)) <= 0.1

        return (
          <div key={p.id_asignacion} className="card-static" style={{
            flex: podioFlex(pos), minWidth: 0, position: 'relative', textAlign: 'center',
            padding: isFirst ? '24px 16px 20px' : '20px 12px 16px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            boxShadow: isFirst ? 'inset 0 0 0 1.5px color-mix(in srgb, var(--gold) 45%, transparent)' : 'none',
          }}>

            {/* Victorias históricas */}
            {v > 0 && (
              <div className="num" style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 2, fontSize: 13, fontWeight: 600, color: 'var(--gold)' }} title={`${v} podios previos`}>
                <Icon name="trophy" size={16} />×{v}
              </div>
            )}

            <Medalla pos={pos} size={isFirst ? 32 : 26} />

            {/* Avatar */}
            <div style={{ marginTop: 6 }}><Avatar nombre={p.nombre} foto={p.foto} size={isFirst ? 72 : 56} /></div>

            {/* Nombre completo (2 líneas max) */}
            <div style={{ fontSize: isFirst ? 15 : 13, fontWeight: 600, lineHeight: 1.3, maxWidth: '100%', wordBreak: 'break-word', marginTop: 4 }}>
              {p.nombre}
            </div>

            {/* Cargo */}
            {p.cargoNombre && (
              <div style={{ fontSize: 13, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                {p.cargoNombre}
              </div>
            )}

            {/* Grupo y turno */}
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Grupo {p.id_grupo} · Turno {p.turno}</div>

            {/* Nota */}
            <div style={{
              fontSize: isFirst ? 34 : 28, fontWeight: 700, letterSpacing: '-0.03em', color: scoreColor(p.notaFinal),
              lineHeight: 1, fontVariantNumeric: 'tabular-nums',
              marginTop: 8,
            }}><Contador valor={p.notaFinal} /></div>

            {/* Leyenda dinámica */}
            {leyenda && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: isFirst ? 'var(--gold)' : 'var(--text2)', fontWeight: 600, marginTop: 4 }}>
                <Icon name={leyendaIcon} size={16} />{leyenda}
              </div>
            )}
            {cercanoPrimero && (
              <div className="num" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text3)' }}><Icon name="target" size={14} />−{Math.abs((p.notaFinal||0)-(items[0].notaFinal||0)).toFixed(2)} del 1.º</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Perfiles({ svc, user }) {
  const [search, setSearch]       = useState('')
  const [todos, setTodos]         = useState([])
  const [sel, setSel]             = useState(null)
  const [perfil, setPerfil]       = useState(null)
  const [loadingPerfil, setLoadingPerfil] = useState(false)
  const [aiResumen, setAiResumen] = useState('')
  const [loadingAi, setLoadingAi] = useState(false)
  const [loadingLista, setLoadingLista] = useState(true)

  useEffect(() => { loadLista() }, [svc])

  useEffect(() => {
    if (perfil && sel && !aiResumen) {
      generarResumenIA();
    }
  }, [perfil]);

  const sc  = v => { if (!v && v !== 0) return 'var(--text3)'; return v >= 3.5 ? 'var(--green)' : v >= 2.0 ? 'var(--yellow)' : 'var(--red)' }
  const r2  = n  => Math.round(n * 100) / 100
  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null

  async function loadLista() {
    setLoadingLista(true)
    const { data: asigs } = await supabase.from('asignaciones').select('id_asignacion, dni_trabajador, id_cargo_actual, turno, id_grupo').eq('id_servicio', svc.id_servicio).eq('estado', 'ACTIVO')
    if (!asigs?.length) { setTodos([]); setLoadingLista(false); return }
    
    const dnis = [...new Set(asigs.map(a => a.dni_trabajador))]
    const cids = [...new Set(asigs.map(a => a.id_cargo_actual))]
    
    const [{ data: tr }, { data: cc }, { data: ev }] = await Promise.all([
      supabase.from('trabajadores').select('dni, nombres_completos, url_foto').in('dni', dnis),
      supabase.from('catalogo_cargos').select('id_cargo, nombre_oficial').in('id_cargo', cids),
      supabase.from('historial_evaluaciones').select('id_asignacion, promedio').eq('id_servicio', svc.id_servicio),
    ])
    
    const tm = Object.fromEntries((tr || []).map(t => [t.dni, t]))
    const cm = Object.fromEntries((cc || []).map(c => [c.id_cargo, c.nombre_oficial]))
    const em = {}; for (const e of (ev || [])) { if (!em[e.id_asignacion]) em[e.id_asignacion] = []; em[e.id_asignacion].push(parseFloat(e.promedio)) }
    
    setTodos(asigs.map(a => { 
      const t = tm[a.dni_trabajador] || {}
      const ps = em[a.id_asignacion] || []
      const prom = ps.length ? r2(avg(ps)) : null
      return { ...a, nombre: t.nombres_completos || a.dni_trabajador, foto: t.url_foto || null, cargoNombre: cm[a.id_cargo_actual] || '', promedio: prom, evaluado: prom !== null } 
    }).sort((a, b) => a.nombre.localeCompare(b.nombre)))
    
    setLoadingLista(false)
  }

  async function seleccionar(item) {
    setSel(item); setPerfil(null); setAiResumen(''); setLoadingPerfil(true)
    const sid = svc.id_servicio; const dni = item.dni_trabajador
    
    const [{ data: trab }, { data: habs }, { data: comps }, { data: asigsTodas }] = await Promise.all([
      supabase.from('trabajadores').select('*').eq('dni', dni).single(),
      supabase.from('habilidades_extra').select('id_cargo, estado, fecha_certificacion').eq('dni_trabajador', dni),
      supabase.from('competencias_trabajador').select('id_competencia, nivel_dominio, veces_ejecutado, observaciones').eq('dni_trabajador', dni),
      supabase.from('asignaciones').select('id_asignacion, id_servicio, id_cargo_actual, turno').eq('dni_trabajador', dni),
    ])

    const asigActual = asigsTodas?.find(a => a.id_servicio === sid)
    let evalsActual = []
    if (asigActual) {
      const { data } = await supabase.from('historial_evaluaciones')
        .select('*, trabajadores!dni_evaluador(nombres_completos)')
        .eq('id_asignacion', asigActual.id_asignacion)
        .order('fecha_hora', { ascending: true })
      evalsActual = data || []
    }

    const asigIds = (asigsTodas || []).map(a => a.id_asignacion)
    let evalsAll = []
    if (asigIds.length) { 
      const { data } = await supabase.from('historial_evaluaciones')
        .select('id_asignacion, promedio, id_servicio, fecha_hora, nota_1, nota_2, nota_3, nota_4')
        .in('id_asignacion', asigIds)
        .order('fecha_hora', { ascending: true })
      evalsAll = data || [] 
    }

    const habCids = (habs || []).map(h => h.id_cargo)
    let habCM = {}
    if (habCids.length) { 
      const { data } = await supabase.from('catalogo_cargos').select('id_cargo, nombre_oficial').in('id_cargo', habCids)
      habCM = Object.fromEntries((data || []).map(c => [c.id_cargo, c.nombre_oficial])) 
    }

    const compIds = (comps || []).map(c => c.id_competencia)
    let compCat = {}
    if (compIds.length) { 
      const { data } = await supabase.from('catalogo_competencias').select('id_competencia, nombre, categoria').in('id_competencia', compIds)
      compCat = Object.fromEntries((data || []).map(c => [c.id_competencia, c])) 
    }

    const { data: asigCargoSvc } = await supabase.from('asignaciones').select('id_asignacion').eq('id_servicio', sid).eq('id_cargo_actual', item.id_cargo_actual)
    const asigCargoSvcIds = (asigCargoSvc || []).map(a => a.id_asignacion)
    
    let promedioCargoServicio = null
    let cargoServicioDims = null
    if (asigCargoSvcIds.length) { 
      const { data: evC } = await supabase.from('historial_evaluaciones').select('nota_1, nota_2, nota_3, nota_4, promedio').in('id_asignacion', asigCargoSvcIds)
      if (evC?.length) {
        promedioCargoServicio = r2(avg(evC.map(e => parseFloat(e.promedio))))
        cargoServicioDims = {
          d1: r2(avg(evC.map(e => e.nota_1))),
          d2: r2(avg(evC.map(e => e.nota_2))),
          d3: r2(avg(evC.map(e => e.nota_3))),
          d4: r2(avg(evC.map(e => e.nota_4)))
        }
      }
    }

    const { data: asigCargoGlob } = await supabase.from('asignaciones').select('id_asignacion').eq('id_cargo_actual', item.id_cargo_actual)
    const asigCargoGlobIds = (asigCargoGlob || []).map(a => a.id_asignacion)
    
    let promedioCargoGlobal = null
    if (asigCargoGlobIds.length) {
      const { data: evCG } = await supabase.from('historial_evaluaciones').select('promedio').in('id_asignacion', asigCargoGlobIds)
      if (evCG?.length) {
        promedioCargoGlobal = r2(avg(evCG.map(e => parseFloat(e.promedio))))
      }
    }

    const svcIds = [...new Set(evalsAll.map(e => e.id_servicio))]
    let svcNom = {}
    if (svcIds.length) { 
      const { data } = await supabase.from('servicios').select('id_servicio, nombre_descriptivo, tipo').in('id_servicio', svcIds)
      svcNom = Object.fromEntries((data || []).map(s => [s.id_servicio, s])) 
    }

    const dims = evalsActual.length ? { 
      d1: r2(avg(evalsActual.map(e => e.nota_1))), 
      d2: r2(avg(evalsActual.map(e => e.nota_2))), 
      d3: r2(avg(evalsActual.map(e => e.nota_3))), 
      d4: r2(avg(evalsActual.map(e => e.nota_4))) 
    } : null

    const trayectoria = svcIds.map(svId => { 
      const evs = evalsAll.filter(e => e.id_servicio === svId)
      const p = evs.length ? r2(avg(evs.map(e => parseFloat(e.promedio)))) : null
      return { svId, nombre: svcNom[svId]?.nombre_descriptivo || '', tipo: svcNom[svId]?.tipo || '', promedio: p, esActual: svId === sid } 
    }).filter(t => t.promedio !== null).sort((a, b) => a.svId - b.svId)
    
    const notaActual = evalsActual.length ? r2(avg(evalsActual.map(e => parseFloat(e.promedio)))) : null
    const notaHist   = evalsAll.length   ? r2(avg(evalsAll.map(e => parseFloat(e.promedio))))    : null
    
    let tendencia = null
    if (evalsActual.length > 1) {
      const ultima = parseFloat(evalsActual[evalsActual.length - 1].promedio)
      const penultima = parseFloat(evalsActual[evalsActual.length - 2].promedio)
      tendencia = r2(ultima - penultima)
    }

    const comentarios = evalsActual.filter(e => e.comentarios?.trim()).map(e => e.comentarios.trim())

    setPerfil({ trab, evalsActual, trayectoria, dims, cargoServicioDims, notaActual, notaHist, promedioCargoServicio, promedioCargoGlobal, tendencia, comentarios,
      habilidades: (habs || []).map(h => ({ ...h, cargoNombre: habCM[h.id_cargo] || '' })),
      competencias: (comps || []).map(c => ({ ...c, ...(compCat[c.id_competencia] || {}) })).sort((a,b) => b.nivel_dominio - a.nivel_dominio),
    })
    setLoadingPerfil(false)
  }

  async function generarResumenIA() {
    if (!perfil || !sel) return;
    setLoadingAi(true);
    setAiResumen('');
    
    await new Promise(resolve => setTimeout(resolve, 800));

    const { evalsActual, notaActual, notaHist, dims, tendencia, promedioCargoServicio, promedioCargoGlobal } = perfil;
    
    if (evalsActual.length === 0) {
      setAiResumen("No hay evaluaciones suficientes en este servicio para dar una opinión detallada.");
      setLoadingAi(false);
      return;
    }

    let texto = "";

    if (notaActual >= 3.8) texto += "Es un elemento excepcional y un pilar fundamental para el equipo. ";
    else if (notaActual >= 3.5) texto += "Es un profesional muy sólido, altamente confiable y autónomo. ";
    else if (notaActual >= 3.2) texto += "Es un buen trabajador que cumple de manera consistente con lo que se le pide. ";
    else if (notaActual >= 2.9) texto += "Muestra un desempeño aceptable, aunque todavía tiene margen para pulir algunos detalles. ";
    else if (notaActual >= 1.6) texto += "Su rendimiento está al límite de lo esperado; requiere acompañamiento constante. ";
    else texto += "Actualmente presenta deficiencias serias que están impactando la operación. ";

    if (dims) {
      const labels = { d1: 'Seguridad', d2: 'Calidad Técnica', d3: 'Actitud', d4: 'Precisión' };
      const valores = Object.entries(dims).map(([k, v]) => ({ nombre: labels[k], val: v })).sort((a, b) => b.val - a.val);
      
      const fuerte = valores[0];
      const debil = valores[3];

      if (fuerte.val >= 3.0) {
        texto += `Destaca especialmente por su excelente [${fuerte.nombre}], lo cual aporta mucho valor al turno. `;
      }
      if (debil.val < 3.0 && fuerte.nombre !== debil.nombre) {
        texto += `Sin embargo, debe tener más cuidado y mejorar su [${debil.nombre}] para evitar complicaciones en campo. `;
      }
    }

    let delta = null;
    if (tendencia !== null) delta = tendencia;
    else if (notaHist !== null) delta = notaActual - notaHist;

    if (delta !== null) {
      if (delta >= 0.5) texto += "Últimamente ha dado un salto de calidad notable, mejorando muchísimo. ";
      else if (delta >= 0.2) texto += "Viene en una racha muy positiva, superándose a sí mismo paso a paso. ";
      else if (delta > 0.0) texto += "Muestra una ligera pero constante tendencia a mejorar, lo cual es muy buena señal. ";
      else if (delta === 0.0) texto += "Su nivel se mantiene constante, rindiendo parejo sin altibajos ni sorpresas. ";
      else if (delta > -0.2) texto += "Ha bajado un poquito su ritmo habitual, valdría la pena ver si necesita algún apoyo. ";
      else if (delta > -0.5) texto += "Presenta un bajón de rendimiento reciente que llama bastante la atención. ";
      else texto += "Su caída reciente en el rendimiento es preocupante y necesita una revisión urgente. ";
    }

    if (promedioCargoServicio !== null) {
      const deltaCargoSvc = notaActual - promedioCargoServicio;
      if (deltaCargoSvc >= 0.4) texto += `Rinde muy por encima del promedio de los demás ${sel.cargoNombre}s en este servicio. `;
      else if (deltaCargoSvc <= -0.4) texto += `Actualmente se está quedando atrás en comparación con los demás ${sel.cargoNombre}s aquí. `;
    }

    if (promedioCargoGlobal !== null && promedioCargoServicio !== null) {
      const deltaGlobal = notaActual - promedioCargoGlobal;
      if (deltaGlobal >= 0.3) texto += "A nivel global, es uno de los mejores perfiles históricos en su puesto. ";
    }

    if (notaActual >= 3.5 && (delta === null || delta >= 0)) {
      texto += "Altamente recomendable para liderar tareas críticas, considerar para futuras promociones o un ajuste salarial.";
    } else if (notaActual >= 3.0) {
      texto += "Es un recurso valioso. Se sugiere mantenerlo en el pool principal y darle nuevos retos para que siga creciendo.";
    } else if (notaActual >= 2.5) {
      texto += "Se sugiere programar una charla breve de feedback para alinear expectativas y darle seguimiento de cerca.";
    } else {
      texto += "No es recomendable para tareas críticas en este momento. Requiere capacitación o reevaluar su continuidad.";
    }

    setAiResumen(texto.trim());
    setLoadingAi(false);
  }

  if (!sel) {
    const filtrados = todos.filter(t => t.nombre.toLowerCase().includes(search.toLowerCase()) || t.cargoNombre.toLowerCase().includes(search.toLowerCase()))
    return (
      <div className="fade">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div><Antetitulo sec="perfiles" /><h2 className="page-title">Perfiles analíticos 360°</h2><p className="page-sub">{svc.nombre_descriptivo}</p></div>
          <div className="search-field" style={{ flex: '0 1 320px' }}>
            <Icon name="buscador" size={18} />
            <input className="input" type="search" aria-label="Buscar por nombre o cargo" placeholder="Buscar por nombre o cargo" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        {loadingLista ? <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text2)', fontSize: 15, padding: '24px 0' }}><span className="spinner" />Cargando directorio…</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {filtrados.map(t => (
              <button type="button" key={t.id_asignacion} onClick={() => seleccionar(t)} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', color: 'var(--text)' }}>
                <Avatar nombre={t.nombre} foto={t.foto} size={44} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.nombre}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.cargoNombre}</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>Grupo {t.id_grupo} · Turno {t.turno}</div>
                </div>
                {t.evaluado ? <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: sc(t.promedio), flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{t.promedio}</div> : <div style={{ fontSize: 13, color: 'var(--text3)' }} title="Sin evaluar">S/E</div>}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button className="btn btn-ghost" onClick={() => { setSel(null); setPerfil(null); setAiResumen('') }}><Icon name="back" size={18} />Directorio</button>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>Informe analítico de rendimiento</div>
      </div>

      {loadingPerfil ? (
        <div role="status" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '64px 0' }}>
          <span className="spinner" />
          <span style={{ color: 'var(--text2)', fontSize: 15 }}>Extrayendo telemetría del trabajador…</span>
        </div>
      ) : perfil && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div>
            {/* Encabezado: avatar + nombre + cargo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <Avatar nombre={sel.nombre} foto={sel.foto} size={72} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 className="page-title" style={{ wordBreak: 'break-word' }}>{sel.nombre}</h2>
                <div style={{ fontSize: 15, color: 'var(--text2)', marginTop: 4 }}>{sel.cargoNombre}</div>
                <div className="num" style={{ display: 'flex', gap: 16, marginTop: 4, fontSize: 13, color: 'var(--text3)', flexWrap: 'wrap' }}>
                  <span>DNI <span style={{ fontFamily: 'var(--font-mono)' }}>{sel.dni}</span></span>
                  <span>Grupo {sel.id_grupo} · Turno {sel.turno}</span>
                </div>
              </div>
            </div>
            {/* Indicadores */}
            <div className="card-static kpi-grid kpi-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {[
                { label: 'Nota actual', val: perfil.notaActual, sub: `${perfil.evalsActual.length} evaluaciones`, color: sc(perfil.notaActual) },
                { label: 'Promedio del cargo aquí', val: perfil.promedioCargoServicio, sub: 'Mismo cargo, este servicio', color: 'var(--text)' },
                { label: 'Promedio del cargo global', val: perfil.promedioCargoGlobal, sub: 'Todo PRODISE', color: 'var(--text)' },
                { label: 'Tendencia', val: perfil.tendencia !== null ? `${perfil.tendencia > 0 ? '+' : ''}${perfil.tendencia}` : '—', sub: 'Última vs anterior', color: perfil.tendencia > 0 ? 'var(--green)' : perfil.tendencia < 0 ? 'var(--red)' : 'var(--text3)' },
              ].map(k => (
                <div key={k.label} className="kpi-cell">
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>{k.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', color: k.color, lineHeight: 1.1, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}><Contador valor={k.val ?? '—'} /></div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{k.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.4fr 1fr', gap: 16 }} className="perfil-grid">

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div className="card-static" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 className="card-title" style={{ width: '100%' }}><Glifo icono="radar" />Análisis dimensional vs cargo</h3>
                {perfil.dims ? (
                  <>
                    <RadarSVG dims={perfil.dims} grupoDims={perfil.cargoServicioDims} size={180} color={sc(perfil.notaActual)} />
                    <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 13, color: 'var(--text2)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, background: sc(perfil.notaActual), opacity: 0.6, borderRadius: 3 }} /> Trabajador</span>
                      {perfil.cargoServicioDims && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, background: 'color-mix(in srgb, var(--accent2) 30%, transparent)', border: '1px dashed var(--accent2)', borderRadius: 3 }} /> Promedio del cargo</span>}
                    </div>
                  </>
                ) : <div style={{ padding: '40px 0', fontSize: 13, color: 'var(--text3)' }}>Requiere evaluación para generar radar</div>}
              </div>

              <div className="card-static" style={{ padding: '20px' }}>
                 <h3 className="card-title"><Glifo icono="delta" />Desglose de varianza (Δ)</h3>
                 {perfil.dims ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {Object.entries({ 'Seguridad': 'd1', 'Calidad técnica': 'd2', 'Actitud': 'd3', 'Precisión': 'd4' }).map(([label, key]) => {
                      const miNota = perfil.dims[key]
                      const notaCargo = perfil.cargoServicioDims ? perfil.cargoServicioDims[key] : miNota
                      const deltaCargo = perfil.cargoServicioDims ? r2(miNota - notaCargo) : null
                      
                      const pctMe = ((miNota - 1) / 3) * 100;
                      const pctCargo = ((notaCargo - 1) / 3) * 100;
                      const minPct = Math.min(pctMe, pctCargo);
                      const widthPct = Math.abs(pctMe - pctCargo);
                      const isPositive = miNota >= notaCargo;

                      return (
                        <div key={key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              {deltaCargo !== null && <span style={{ fontSize: 13, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: deltaCargo >= 0 ? 'var(--green)' : 'var(--red)' }}>{deltaCargo >= 0 ? `+${deltaCargo}` : deltaCargo} vs cargo</span>}
                              <span style={{ fontSize: 15, fontWeight: 700, color: sc(miNota), fontVariantNumeric: 'tabular-nums' }}>{miNota.toFixed(2)}</span>
                            </div>
                          </div>
                          
                          <div style={{ height: 16, position: 'relative', background: 'var(--fill)', borderRadius: 8, marginTop: 6 }}>
                             <div style={{ position: 'absolute', left: '33.3%', top: 0, bottom: 0, borderLeft: '1px dashed var(--fill)' }} />
                             <div style={{ position: 'absolute', left: '66.6%', top: 0, bottom: 0, borderLeft: '1px dashed var(--fill)' }} />
                             
                             {widthPct > 0 && (
                               <div style={{ position: 'absolute', left: `${minPct}%`, width: `${widthPct}%`, top: 5, bottom: 5, background: isPositive ? 'color-mix(in srgb, var(--green) 35%, transparent)' : 'color-mix(in srgb, var(--red) 35%, transparent)', borderRadius: 2 }} />
                             )}
                             
                             <div style={{ position: 'absolute', left: `${pctCargo}%`, top: -3, bottom: -3, width: 2, background: 'var(--text3)', transform: 'translateX(-50%)', zIndex: 2 }} title="Promedio Cargo" />
                             <div style={{ position: 'absolute', left: `${pctMe}%`, top: 2, bottom: 2, width: 8, background: sc(miNota), borderRadius: 6, transform: 'translateX(-50%)', zIndex: 3, boxShadow: '0 0 0 2px var(--surface)' }} title="Nota Trabajador" />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>
                            <span>Nivel 1</span><span>Nivel 4</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                 ) : <div style={{ fontSize: 13, color: 'var(--text3)' }}>Sin datos.</div>}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card-static" style={{ padding: '20px' }}>
                <h3 className="card-title"><Glifo icono="trend" />Línea de tiempo de rendimiento</h3>
                {perfil.trayectoria.length > 0
                  ? <TrayectoriaSVG data={perfil.trayectoria} scoreColor={sc} />
                  : <div style={{ padding: '32px 0', fontSize: 15, color: 'var(--text2)', textAlign: 'center' }}>Aún no hay historial suficiente para trazar la curva de rendimiento.</div>}
              </div>

              <div className="card-static" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 className="card-title"><Glifo icono="wrench" />Competencias <span className="num" style={{ color: 'var(--text3)', fontWeight: 400 }}>{perfil.competencias.length}</span></h3>
                
                {perfil.competencias.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px 88px', gap: 12, fontSize: 13, color: 'var(--text3)', paddingBottom: 8, boxShadow: 'inset 0 -0.5px 0 var(--separator)' }}>
                      <div>Competencia</div><div style={{ textAlign: 'center' }}>Dominio</div><div style={{ textAlign: 'right' }}>Experiencia</div>
                    </div>
                    {perfil.competencias.map((c, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 64px 88px', gap: 12, alignItems: 'center', padding: '8px 0', boxShadow: 'inset 0 -0.5px 0 var(--separator)' }}>
                        <div style={{ fontSize: 15, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.nombre}>{c.nombre || `Cód: ${c.id_competencia}`}</div>
                        <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                          {[1,2,3,4,5].map(s => <div key={s} style={{ width: 8, height: 8, borderRadius: '50%', background: s <= (c.nivel_dominio || 0) ? 'var(--accent)' : 'var(--fill-2)' }} />)}
                        </div>
                        <div style={{ textAlign: 'right', fontSize: 13, fontVariantNumeric: 'tabular-nums', color: c.veces_ejecutado > 5 ? 'var(--green)' : 'var(--text2)' }}>
                          {c.veces_ejecutado || 0} ejec.
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'var(--text2)', textAlign: 'center', padding: '24px 0' }}>No tiene competencias registradas en la matriz.</div>}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <section className="card-static" aria-live="polite" aria-busy={loadingAi} style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                  <h3 className="card-title" style={{ marginBottom: 0 }}><Glifo icono="spark" />Diagnóstico IA</h3>
                  <div style={{ fontSize: 13, fontWeight: 500, color: loadingAi ? 'var(--text2)' : 'var(--green)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {loadingAi ? <><span className="spinner" style={{ width: 14, height: 14 }} />Sintetizando…</> : <><Icon name="check" size={16} />Listo</>}
                  </div>
                </div>
                {loadingAi ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
                    <div className="skeleton" style={{ height: 12, borderRadius: 6 }} />
                    <div className="skeleton" style={{ height: 12, borderRadius: 6, width: '92%' }} />
                    <div className="skeleton" style={{ height: 12, borderRadius: 6, width: '78%' }} />
                    <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 8 }}>El sistema está cruzando variables de rendimiento…</p>
                  </div>
                ) : aiResumen ? (
                  <>
                    <p style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.55 }}>
                      {aiResumen}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 12 }}>Síntesis automática a partir de las evaluaciones registradas.</p>
                  </>
                ) : null}
              </section>

              {perfil.habilidades.length > 0 && (
                <div className="card-static" style={{ padding: '20px' }}>
                  <h3 className="card-title"><Glifo icono="layers" />Polivalencia</h3>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {perfil.habilidades.map((h, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0', boxShadow: i > 0 ? 'inset 0 0.5px 0 var(--separator)' : 'none' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 500 }}>{h.cargoNombre}</div>
                          {h.fecha_certificacion && <div className="num" style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>Certificado el {new Date(h.fecha_certificacion).toLocaleDateString('es-PE')}</div>}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap', background: h.estado === 'VIGENTE' ? 'color-mix(in srgb, var(--green) 15%, transparent)' : 'color-mix(in srgb, var(--yellow) 15%, transparent)', color: h.estado === 'VIGENTE' ? 'var(--green)' : 'var(--yellow)' }}>
                          {h.estado}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card-static" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 className="card-title"><Glifo icono="quote" />Observaciones</h3>
                <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 }}>
                  {perfil.comentarios?.length > 0 ? perfil.comentarios.map((c, i) => (
                    <blockquote key={i} style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.5, padding: '10px 0', boxShadow: i > 0 ? 'inset 0 0.5px 0 var(--separator)' : 'none' }}>
                      “{c}”
                    </blockquote>
                  )) : <div style={{ fontSize: 15, color: 'var(--text2)' }}>No hay comentarios en las evaluaciones de este servicio.</div>}
                </div>
              </div>

            </div>
          </div>

        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function RadarSVG({ dims, grupoDims, size = 200, color }) {
  if (!dims) return null
  const center = size / 2
  const maxRadius = (size / 2) - 44
  
  const getPoint = (val, angleDeg) => {
    const r = (val / 4) * maxRadius
    const a = (angleDeg - 90) * (Math.PI / 180)
    return { x: center + r * Math.cos(a), y: center + r * Math.sin(a) }
  }

  const axes = [
    { key: 'd1', label: 'Seguridad', angle: 0 },
    { key: 'd2', label: 'Calidad', angle: 90 },
    { key: 'd3', label: 'Actitud', angle: 180 },
    { key: 'd4', label: 'Precisión', angle: 270 }
  ]

  const rings = [1, 2, 3, 4].map(val => axes.map(a => getPoint(val, a.angle)))
  const userPts = axes.map(a => getPoint(dims[a.key] || 0, a.angle))
  const userPoly = userPts.map(p => `${p.x},${p.y}`).join(' ')

  let grupoPoly = ''
  if (grupoDims) {
    const grpPts = axes.map(a => getPoint(grupoDims[a.key] || 0, a.angle))
    grupoPoly = grpPts.map(p => `${p.x},${p.y}`).join(' ')
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: size, height: 'auto', display: 'block', overflow: 'visible' }}>
      {rings.map((ring, i) => (
        <polygon key={i} points={ring.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="var(--fill)" strokeWidth="1" />
      ))}
      {axes.map((a, i) => {
        const p = getPoint(4, a.angle)
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="var(--fill-2)" strokeWidth="1" />
      })}

      {grupoPoly && (
        <polygon points={grupoPoly} fill="color-mix(in srgb, var(--accent2) 20%, transparent)" stroke="color-mix(in srgb, var(--accent2) 60%, transparent)" strokeWidth="1.5" strokeDasharray="4,4" />
      )}

      <polygon points={userPoly} fill={`color-mix(in srgb, ${color} 27%, transparent)`} stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {userPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} />)}

      {axes.map((a, i) => {
        const p = getPoint(a.angle === 0 || a.angle === 180 ? 4.7 : 4.25, a.angle)
        return (
          <text key={i} x={p.x + (a.angle === 90 ? 6 : a.angle === 270 ? -6 : 0)} y={p.y + (a.angle === 180 ? 6 : 0)} textAnchor={a.angle === 90 ? 'start' : a.angle === 270 ? 'end' : 'middle'} alignmentBaseline="middle" fontSize="11" fontWeight="500" fill="var(--text2)">
            {a.label}
          </text>
        )
      })}
    </svg>
  )
}

function TrayectoriaSVG({ data, scoreColor }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  if (!data?.length) return null;

  const W = 360, H = 160, P = { t: 20, b: 24, l: 24, r: 12 };
  const iW = W - P.l - P.r, iH = H - P.t - P.b;
  const toX = i => P.l + (data.length > 1 ? (i / (data.length - 1)) * iW : iW / 2);
  const toY = v => P.t + iH - ((v - 1) / 3) * iH;
  const pts = data.map((d, i) => `${toX(i)},${toY(d.promedio)}`).join(' ');
  const col = scoreColor(data.find(d => d.esActual)?.promedio);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={col} stopOpacity="0.18" />
            <stop offset="100%" stopColor={col} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {[1, 2, 3, 4].map(v => (
          <g key={v}>
            <line x1={P.l} y1={toY(v)} x2={W - P.r} y2={toY(v)} stroke={v === 3 ? 'color-mix(in srgb, var(--green) 20%, transparent)' : 'var(--fill)'} strokeWidth="1" strokeDasharray={v === 3 ? '4,4' : undefined} />
            <text x={P.l - 6} y={toY(v)} textAnchor="end" alignmentBaseline="middle" fontSize="10" fill="var(--text3)" style={{ fontVariantNumeric: 'tabular-nums' }}>{v}.0</text>
          </g>
        ))}

        {data.length > 1 && <polygon points={`${P.l},${toY(1)} ${pts} ${toX(data.length - 1)},${toY(1)}`} fill="url(#areaGrad)" />}
        {data.length > 1 && <polyline points={pts} fill="none" stroke={col} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}

        {data.map((d, i) => {
          const cx = toX(i);
          const cy = toY(d.promedio);
          const isHovered = hoverIdx === i;

          return (
            <g key={i} 
               onMouseEnter={() => setHoverIdx(i)} 
               onMouseLeave={() => setHoverIdx(null)}
               style={{ cursor: 'crosshair', transition: 'r var(--dur-quick) ease-out, fill var(--dur-quick) ease-out' }}>
              
              {isHovered && <line x1={cx} y1={P.t} x2={cx} y2={H - P.b} stroke="color-mix(in srgb, var(--ink) 20%, transparent)" strokeWidth="1" strokeDasharray="3,3" />}
              <circle cx={cx} cy={cy} r="15" fill="transparent" />
              <circle cx={cx} cy={cy} r={isHovered ? 6 : (d.esActual ? 5 : 3.5)} fill={isHovered ? 'var(--surface)' : (d.esActual ? col : 'var(--bg)')} stroke={col} strokeWidth={d.esActual && !isHovered ? 0 : 2} style={{ transition: 'r var(--dur-quick) ease-out, fill var(--dur-quick) ease-out' }} />
              
              <text x={cx} y={H - 6} textAnchor="middle" fontSize="10" fill={isHovered || d.esActual ? 'var(--text)' : 'var(--text3)'} fontWeight={d.esActual ? '700' : '500'}>
                Svc {d.svId}
              </text>
            </g>
          );
        })}
      </svg>

      {hoverIdx !== null && (
        <div style={{
          position: 'absolute',
          left: (toX(hoverIdx) / W) * 100 > 70 ? `calc(${(toX(hoverIdx) / W) * 100}% - 180px)` : (toX(hoverIdx) / W) * 100 < 30 ? `calc(${(toX(hoverIdx) / W) * 100}% + 15px)` : `calc(${(toX(hoverIdx) / W) * 100}% - 85px)`,
          top: `calc(${(toY(data[hoverIdx].promedio) / H) * 100}% - 85px)`,
          width: 170,
          background: 'var(--surface)',
          borderRadius: 10,
          padding: '10px 12px',
          boxShadow: 'var(--shadow-float)',
          pointerEvents: 'none',
          zIndex: 10,
          display: 'flex', flexDirection: 'column', gap: 6
        }}>
          <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>{data[hoverIdx].tipo}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, wordWrap: 'break-word' }}>{data[hoverIdx].nombre}</div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4, paddingTop: 8, boxShadow: 'inset 0 0.5px 0 var(--separator)' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: scoreColor(data[hoverIdx].promedio), lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {data[hoverIdx].promedio.toFixed(2)}
            </div>
            {hoverIdx > 0 && (
              <div className="num" style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 13, fontWeight: 600, color: data[hoverIdx].promedio >= data[hoverIdx-1].promedio ? 'var(--green)' : 'var(--red)' }}>
                <Icon name={data[hoverIdx].promedio >= data[hoverIdx-1].promedio ? 'up' : 'down'} size={14} strokeWidth={2.25} />
                {Math.abs(data[hoverIdx].promedio - data[hoverIdx-1].promedio).toFixed(2)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* =========================================
   BUSCADOR DE TALENTO
   ========================================= */
function Buscador({ svc, user }) {
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroComp, setFiltroComp] = useState('TODAS')
  const [catComps, setCatComps] = useState([])
  const [resultados, setResultados] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('catalogo_competencias').select('id_competencia, nombre').order('nombre').then(({ data }) => setCatComps(data || []))
  }, [])

  useEffect(() => { buscar() }, [filtroTexto, filtroComp])

  async function buscar() {
    setLoading(true)
    const { data: trabs } = await supabase.from('trabajadores').select('dni, nombres_completos, url_foto')
    const { data: comps } = await supabase.from('competencias_trabajador').select('dni_trabajador, id_competencia, nivel_dominio, veces_ejecutado, catalogo_competencias(nombre)')
    const { data: habs } = await supabase.from('habilidades_extra').select('dni_trabajador, estado, catalogo_cargos(nombre_oficial)')

    let filtrados = trabs || []
    if (filtroTexto) {
      const q = filtroTexto.toLowerCase()
      filtrados = filtrados.filter(t => t.nombres_completos.toLowerCase().includes(q) || t.dni.includes(q))
    }

    filtrados = filtrados.map(t => {
      const misComps = comps?.filter(c => c.dni_trabajador === t.dni) || []
      const misHabs = habs?.filter(h => h.dni_trabajador === t.dni) || []
      return { ...t, competencias: misComps, habilidades: misHabs }
    })

    if (filtroComp !== 'TODAS') {
      filtrados = filtrados.filter(t => t.competencias.some(c => String(c.id_competencia) === String(filtroComp)))
      filtrados.sort((a, b) => {
        const domA = a.competencias.find(c => String(c.id_competencia) === String(filtroComp))?.nivel_dominio || 0
        const domB = b.competencias.find(c => String(c.id_competencia) === String(filtroComp))?.nivel_dominio || 0
        return domB - domA
      })
    } else {
      filtrados.sort((a, b) => a.nombres_completos.localeCompare(b.nombres_completos))
    }

    setResultados(filtrados)
    setLoading(false)
  }

  const renderEstrellas = (nivel) => (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => <div key={s} style={{ width: 10, height: 10, borderRadius: '50%', background: s <= (nivel || 0) ? 'var(--accent)' : 'var(--fill-2)' }} />)}
    </div>
  )

  return (
    <div className="fade">
      <div style={{ marginBottom: 24 }}>
        <Antetitulo sec="buscador" /><h2 className="page-title">Buscador de talento</h2>
        <p className="page-sub">Filtra al personal histórico por sus habilidades técnicas.</p>
      </div>

      <div style={{ marginBottom: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 250 }}>
          <label htmlFor="bt-texto" className="field-label">Nombre o DNI</label>
          <div className="search-field">
            <Icon name="buscador" size={18} />
            <input id="bt-texto" className="input" type="search" placeholder="Nombre, apellido o DNI" value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)} style={{ background: 'var(--surface)' }} />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 250 }}>
          <label htmlFor="bt-comp" className="field-label">Competencia técnica</label>
          <select id="bt-comp" className="input" style={{ background: 'var(--surface)' }} value={filtroComp} onChange={e => setFiltroComp(e.target.value)}>
            <option value="TODAS">Todas las competencias</option>
            {catComps.map(c => <option key={c.id_competencia} value={c.id_competencia}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text2)', fontSize: 15 }}><span className="spinner" />Buscando talento…</div>
      ) : resultados.length === 0 ? (
        <div className="card-static empty-state">
          <Icon name="buscador" size={28} style={{ color: 'var(--text3)' }} />
          <p style={{ color: 'var(--text2)', fontSize: 15, marginTop: 16 }}>No se encontraron técnicos con esos criterios.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {resultados.map(r => (
            <div key={r.dni} className="card-static" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar nombre={r.nombres_completos} foto={r.url_foto} size={44} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.nombres_completos}</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>DNI <span style={{ fontFamily: 'var(--font-mono)' }}>{r.dni}</span></div>
                </div>
              </div>

              {r.habilidades.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {r.habilidades.map((h, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, padding: '4px 10px', borderRadius: 8, background: 'var(--fill)', color: 'var(--text)' }}>
                      <Icon name="star" size={14} style={{ color: 'var(--text3)' }} />{h.catalogo_cargos?.nombre_oficial}
                    </span>
                  ))}
                </div>
              )}

              {r.competencias.length > 0 ? (
                <div style={{ paddingTop: 12, boxShadow: 'inset 0 0.5px 0 var(--separator)' }}>
                  <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8 }}>Competencias técnicas · <span className="num">{r.competencias.length}</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {r.competencias.slice(0, 3).map(c => (
                      <div key={c.id_competencia} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 15, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{c.catalogo_competencias?.nombre}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="num" style={{ fontSize: 13, color: 'var(--text3)' }}>{c.veces_ejecutado}×</span>
                          {renderEstrellas(c.nivel_dominio)}
                        </div>
                      </div>
                    ))}
                    {r.competencias.length > 3 && <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>+{r.competencias.length - 3} competencias más</div>}
                  </div>
                </div>
              ) : <div style={{ fontSize: 13, color: 'var(--text3)', paddingTop: 12, boxShadow: 'inset 0 0.5px 0 var(--separator)' }}>Sin competencias técnicas registradas</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* =========================================
   PREDICTOR DE CUADRILLAS (Factor Química)
   ========================================= */
function Predictor({ svc, user }) {
  const [personal, setPersonal] = useState([])
  const [afinidades, setAfinidades] = useState([])
  const [seleccionados, setSeleccionados] = useState([])
  const [loading, setLoading] = useState(true)

  const [filtroTexto, setFiltroTexto] = useState('')
  const [dnisPegados, setDnisPegados] = useState('')
  const [modoIzq, setModoIzq] = useState('lista')

  useEffect(() => { load() }, [svc])

  async function load() {
    setLoading(true)
    const sid = svc.id_servicio

    const { data: asigs } = await supabase.from('asignaciones').select('id_asignacion, dni_trabajador, id_cargo_actual, id_grupo, turno').eq('id_servicio', sid).eq('estado', 'ACTIVO')
    if (!asigs?.length) { setPersonal([]); setLoading(false); return }

    const dnis = asigs.map(a => a.dni_trabajador)
    
    const [{ data: trabs }, { data: evals }, { data: afins }, { data: cargos }] = await Promise.all([
      supabase.from('trabajadores').select('dni, nombres_completos, url_foto').in('dni', dnis),
      supabase.from('historial_evaluaciones').select('id_asignacion, promedio').eq('id_servicio', sid),
      supabase.from('afinidad_pares').select('*').or(`dni_1.in.(${dnis.map(d=>`"${d}"`).join(',')}),dni_2.in.(${dnis.map(d=>`"${d}"`).join(',')})`),
      supabase.from('catalogo_cargos').select('id_cargo, nombre_oficial')
    ])

    const tm = Object.fromEntries((trabs || []).map(t => [t.dni, t]))
    const cm = Object.fromEntries((cargos || []).map(c => [c.id_cargo, c.nombre_oficial]))
    
    const asigIdToDni = Object.fromEntries(asigs.map(a => [a.id_asignacion, a.dni_trabajador]))
    const evalDniMap = {}
    for (const e of evals || []) {
      const d = asigIdToDni[e.id_asignacion]
      if (!d) continue
      if (!evalDniMap[d]) evalDniMap[d] = []
      evalDniMap[d].push(parseFloat(e.promedio))
    }

    const arr = asigs.map(a => {
      const t = tm[a.dni_trabajador] || {}
      const evs = evalDniMap[a.dni_trabajador] || []
      const prom = evs.length ? (evs.reduce((sum, v) => sum + v, 0) / evs.length) : null
      return {
        dni: a.dni_trabajador, nombre: t.nombres_completos || a.dni_trabajador, foto: t.url_foto,
        cargo: cm[a.id_cargo_actual] || '?', grupo: a.id_grupo, turno: a.turno, promedio: prom
      }
    }).sort((a, b) => a.nombre.localeCompare(b.nombre))

    setPersonal(arr)
    setAfinidades(afins || [])
    setLoading(false)
  }

  function toggleTrabajador(dni) {
    if (seleccionados.includes(dni)) setSeleccionados(seleccionados.filter(d => d !== dni))
    else setSeleccionados([...seleccionados, dni])
  }

  function procesarDnisPegados() {
    const extraidos = dnisPegados.match(/\d{8}/g) || []
    const unicos = [...new Set(extraidos)]
    const validos = unicos.filter(d => personal.some(p => p.dni === d))
    const nuevos = validos.filter(d => !seleccionados.includes(d))
    
    if (nuevos.length > 0) {
      setSeleccionados(prev => [...prev, ...nuevos])
    }
    setDnisPegados('')
    setModoIzq('lista')
  }

  const dnisExtraidosRaw = dnisPegados.match(/\d{8}/g) || []
  const dnisExtraidosUnicos = [...new Set(dnisExtraidosRaw)]
  const previewDnis = dnisExtraidosUnicos.map(d => {
    const p = personal.find(x => x.dni === d)
    return { dni: d, existe: !!p, nombre: p ? p.nombre : 'No en servicio' }
  })

  const cuadrilla = personal.filter(p => seleccionados.includes(p.dni))
  const personalFiltrado = personal.filter(p => 
    p.nombre.toLowerCase().includes(filtroTexto.toLowerCase()) || 
    p.dni.includes(filtroTexto) ||
    p.cargo.toLowerCase().includes(filtroTexto.toLowerCase())
  )
  
  const promediosValidos = cuadrilla.filter(p => p.promedio !== null).map(p => p.promedio)
  const baseScore = promediosValidos.length ? (promediosValidos.reduce((a,b)=>a+b,0) / promediosValidos.length) : 0

  let multiplicadorQuimica = 0
  const advertencias = []
  const bonos = []

  for (let i = 0; i < cuadrilla.length; i++) {
    for (let j = i + 1; j < cuadrilla.length; j++) {
      const p1 = cuadrilla[i]; const p2 = cuadrilla[j];
      const relacion = afinidades.find(a => 
        (a.dni_1 === p1.dni && a.dni_2 === p2.dni) || (a.dni_1 === p2.dni && a.dni_2 === p1.dni)
      )
      
      if (relacion) {
        if (relacion.nivel_afinidad === 'CONFLICTO') { multiplicadorQuimica -= 0.30; advertencias.push(`${p1.nombre.split(' ')[0]} y ${p2.nombre.split(' ')[0]} tienen historial de conflicto.`) }
        if (relacion.nivel_afinidad === 'INCOMPATIBLE') { multiplicadorQuimica -= 0.15; advertencias.push(`Baja sinergia entre ${p1.nombre.split(' ')[0]} y ${p2.nombre.split(' ')[0]}.`) }
        if (relacion.nivel_afinidad === 'ALTA') { multiplicadorQuimica += 0.15; bonos.push(`Excelente dupla: ${p1.nombre.split(' ')[0]} + ${p2.nombre.split(' ')[0]}.`) }
      }
    }
  }

  let scoreFinal = baseScore > 0 ? baseScore + multiplicadorQuimica : 0
  if (scoreFinal > 4.0) scoreFinal = 4.0
  if (scoreFinal < 1.0 && baseScore > 0) scoreFinal = 1.0

  const sc = v => { if (!v) return 'var(--text3)'; return v >= 3.5 ? 'var(--green)' : v >= 2.0 ? 'var(--yellow)' : 'var(--red)' }

  return (
    <div className="fade predictor-layout" style={{ display: 'flex', gap: 16, height: 'calc(100dvh - 88px)' }}>
      
      <div className="card-static predictor-side" style={{ width: 340, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 20px 16px', boxShadow: 'inset 0 -0.5px 0 var(--separator)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <Antetitulo sec="predictor" /><h2 className="page-title">Armar cuadrilla</h2>
              <div className="num" style={{ fontSize: 15, color: 'var(--text2)', marginTop: 4 }}>
                {seleccionados.length} seleccionados
              </div>
            </div>
            {seleccionados.length > 0 && (
              <button className="btn btn-ghost" onClick={() => setSeleccionados([])}>Limpiar</button>
            )}
          </div>

          <div className="segmented" role="tablist" style={{ display: 'flex', marginTop: 16 }}>
          <Deslizador />
            <button role="tab" aria-selected={modoIzq === 'lista'} onClick={() => setModoIzq('lista')} className={`segmented-item ${modoIzq === 'lista' ? 'is-active' : ''}`} style={{ flex: 1 }}>Buscador</button>
            <button role="tab" aria-selected={modoIzq === 'masiva'} onClick={() => setModoIzq('masiva')} className={`segmented-item ${modoIzq === 'masiva' ? 'is-active' : ''}`} style={{ flex: 1 }}>Pegar DNI</button>
          </div>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {loading ? <div role="status" style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><span className="spinner" /></div> : 
           modoIzq === 'lista' ? (
             <>
               <div className="search-field" style={{ marginBottom: 8 }}>
                 <Icon name="buscador" size={18} />
                 <input className="input" type="search" aria-label="Buscar personal" placeholder="Nombre, DNI o cargo" value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)} />
               </div>
               {personalFiltrado.length === 0 && <div style={{ fontSize: 15, color: 'var(--text2)', textAlign: 'center', padding: '24px 0' }}>No hay coincidencias.</div>}
               {personalFiltrado.map(p => {
                 const sel = seleccionados.includes(p.dni)
                 return (
                   <button type="button" key={p.dni} onClick={() => toggleTrabajador(p.dni)} aria-pressed={sel} className="pick-row" style={{ background: sel ? 'var(--accent-soft)' : undefined }}>
                     <span className={`check-box ${sel ? 'is-on' : ''}`} aria-hidden="true">
                       {sel && <Icon name="check" size={14} strokeWidth={2.5} />}
                     </span>
                     <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                       <div style={{ fontSize: 15, fontWeight: sel ? 600 : 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nombre}</div>
                       <div style={{ fontSize: 13, color: 'var(--text3)' }}>{p.cargo}</div>
                     </div>
                     <div className="num" style={{ fontSize: 15, fontWeight: 600, color: sc(p.promedio) }}>{p.promedio ? p.promedio.toFixed(2) : '—'}</div>
                   </button>
                 )
               })}
             </>
           ) : (
             <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
               <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.45 }}>Copia la columna desde tu Excel, haz clic en el recuadro y presiona <kbd style={{ fontFamily: 'inherit', fontWeight: 600 }}>Ctrl + V</kbd>.</div>
               
               {!dnisPegados ? (
                 <textarea className="input" value={dnisPegados} onChange={e => setDnisPegados(e.target.value)} placeholder="Haz clic aquí y presiona Ctrl + V" aria-label="Lista de DNI" style={{ flex: 1, resize: 'none', fontSize: 15, fontWeight: 500, textAlign: 'center', border: '1.5px dashed var(--border-h)', background: 'var(--fill)', borderRadius: 12, paddingTop: '40%', cursor: 'text', color: 'var(--text)' }} />
               ) : (
                 <div className="fade" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span className="num" style={{ fontSize: 13, color: 'var(--text2)' }}>{dnisExtraidosUnicos.length} DNI detectados</span>
                     <button className="btn btn-ghost" onClick={() => setDnisPegados('')}>Limpiar</button>
                   </div>
                   <div style={{ flex: 1, overflowY: 'auto', borderRadius: 10, background: 'var(--fill)' }}>
                     <table className="data-table" style={{ fontSize: 13 }}>
                       <thead><tr><th>DNI</th><th>Estado</th></tr></thead>
                       <tbody>
                         {previewDnis.map((item, i) => (<tr key={i}><td style={{ fontFamily: 'var(--font-mono)', color: item.existe ? 'var(--text)' : 'var(--text3)' }}>{item.dni}</td><td style={{ color: item.existe ? 'var(--green)' : 'var(--red)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{item.existe ? item.nombre : 'No asignado'}</td></tr>))}
                         {previewDnis.length === 0 && <tr><td colSpan="2" style={{ padding: '16px', textAlign: 'center', color: 'var(--text3)' }}>Sin números válidos.</td></tr>}
                       </tbody>
                     </table>
                   </div>
                 </div>
               )}
               <button className="btn btn-primary" onClick={procesarDnisPegados} disabled={!dnisPegados || dnisExtraidosUnicos.length === 0}>Incluir a la cuadrilla</button>
             </div>
           )
          }
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {seleccionados.length < 2 ? (
           <div className="card-static empty-state" style={{ flex: 1, justifyContent: 'center' }}>
             <Icon name="users" size={32} style={{ color: 'var(--text3)' }} />
             <div style={{ fontSize: 17, fontWeight: 600, marginTop: 16 }}>Elige a la cuadrilla</div>
             <div style={{ fontSize: 15, color: 'var(--text2)', marginTop: 4, maxWidth: 380 }}>Selecciona al menos 2 personas para predecir su rendimiento conjunto y ver su red de afinidad.</div>
           </div>
        ) : (
          <>
            <div className="card-static" style={{ padding: '20px 24px' }}>
              <h3 className="card-title"><Glifo icono="target" />Proyección de rendimiento grupal</h3>
              
              <div className="num" style={{ display: 'flex', alignItems: 'flex-end', gap: '16px 32px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>Promedio técnico base</div>
                  <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, color: sc(baseScore) }}>{baseScore.toFixed(2)}</div>
                </div>
                <div style={{ fontSize: 22, color: 'var(--text3)', lineHeight: 1 }}>{multiplicadorQuimica >= 0 ? '+' : '−'}</div>
                
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>Factor química (afinidad)</div>
                  <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, color: multiplicadorQuimica > 0 ? 'var(--green)' : multiplicadorQuimica < 0 ? 'var(--red)' : 'var(--text3)' }}>
                    {Math.abs(multiplicadorQuimica).toFixed(2)}
                  </div>
                </div>
                <div style={{ fontSize: 22, color: 'var(--text3)', lineHeight: 1 }}>=</div>
                
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>Proyección final</div>
                  <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em', color: sc(scoreFinal), lineHeight: 1 }}><Contador valor={scoreFinal.toFixed(2)} duracion={600} /></div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, flex: 1 }}>
              <div className="card-static" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <h3 className="card-title"><Glifo icono="link" />Mapa de afinidad</h3>
                <div style={{ flex: 1, position: 'relative', background: 'var(--fill)', borderRadius: 10, minHeight: 220 }}>
                  <RedAfinidadSVG cuadrilla={cuadrilla} afinidades={afinidades} />
                </div>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12, fontSize: 13, color: 'var(--text2)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 16, height: 3, borderRadius: 2, background: 'var(--green)' }}/> Sinergia alta</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 16, height: 3, borderRadius: 2, background: 'var(--red)' }}/> Conflicto</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="card-static" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 className="card-title"><Glifo icono="alert" />Advertencias de conflicto</h3>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {advertencias.length === 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, color: 'var(--text2)' }}><Icon name="check" size={18} style={{ color: 'var(--green)' }} />No se detectaron conflictos históricos.</div>
                    ) : (
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {advertencias.map((adv, i) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 15, color: 'var(--text)', lineHeight: 1.4 }}><Icon name="alert" size={18} style={{ color: 'var(--red)', marginTop: 1 }} />{adv}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="card-static" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 className="card-title"><Glifo icono="users" />Sinergias detectadas</h3>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {bonos.length === 0 ? (
                      <div style={{ fontSize: 15, color: 'var(--text2)' }}>No hay sinergias excepcionales registradas.</div>
                    ) : (
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {bonos.map((bono, i) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 15, color: 'var(--text)', lineHeight: 1.4 }}><Icon name="star" size={18} style={{ color: 'var(--green)', marginTop: 1 }} />{bono}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function RedAfinidadSVG({ cuadrilla, afinidades }) {
  const W = 400, H = 280, R = 100
  const cx = W / 2, cy = H / 2
  
  const nodes = cuadrilla.map((p, i) => {
    const angle = (i / cuadrilla.length) * Math.PI * 2 - Math.PI / 2
    return { ...p, x: cx + Math.cos(angle) * R, y: cy + Math.sin(angle) * R }
  })

  const edges = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
       const p1 = nodes[i]; const p2 = nodes[j]
       const rel = afinidades.find(a => (a.dni_1 === p1.dni && a.dni_2 === p2.dni) || (a.dni_1 === p2.dni && a.dni_2 === p1.dni))
       if (rel && rel.nivel_afinidad !== 'NEUTRAL') {
         edges.push({
           p1, p2, tipo: rel.nivel_afinidad,
           color: (rel.nivel_afinidad === 'ALTA' || rel.nivel_afinidad === 'BUENA') ? 'var(--green)' : 'var(--red)'
         })
       }
    }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', display: 'block' }}>
      {edges.map((e, i) => (
         <line key={i} x1={e.p1.x} y1={e.p1.y} x2={e.p2.x} y2={e.p2.y} 
               stroke={e.color} strokeWidth={e.tipo==='ALTA'||e.tipo==='CONFLICTO'? 3 : 1} 
               strokeDasharray={e.tipo==='INCOMPATIBLE'?'5,5':''} opacity="0.6" />
      ))}
      {nodes.map((n) => (
        <g key={n.dni}>
           <circle cx={n.x} cy={n.y} r="18" fill="var(--surface)" stroke="var(--border-h)" strokeWidth="1.5" />
           <text x={n.x} y={n.y+4} textAnchor="middle" fontSize="11" fill="var(--text2)" fontWeight="600">
             {n.nombre.substring(0,2).toUpperCase()}
           </text>
           <text x={n.x} y={n.y+28} textAnchor="middle" fontSize="10" fill="var(--text)" fontWeight="600">{n.nombre.split(' ')[0]}</text>
           <text x={n.x} y={n.y+41} textAnchor="middle" fontSize="10" fill="var(--text3)">{n.cargo.substring(0, 15)}</text>
        </g>
      ))}
    </svg>
  )
}

/* =========================================
   GESTIÓN DE USUARIOS
   ========================================= */


const NIVELES = [
  { n: 1, label: 'Admin', desc: 'Acceso total: todos los módulos, servicios y usuarios.' },
  { n: 2, label: 'Planner / Coordinador', desc: 'Dashboard, Ranking, Perfiles, Buscador, Historial y Bitácora.' },
  { n: 3, label: 'Supervisor', desc: 'Solo Evaluar y ver el Ranking de sus servicios.' },
]

function fuerzaClave(p) {
  if (!p) return null
  let puntos = 0
  if (p.length >= 8) puntos++
  if (p.length >= 12) puntos++
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) puntos++
  if (/\d/.test(p)) puntos++
  if (/[^A-Za-z0-9]/.test(p)) puntos++
  if (p.length < 6) return { nivel: 0, texto: 'Muy corta', color: 'var(--red)' }
  if (puntos <= 2) return { nivel: 1, texto: 'Débil', color: 'var(--yellow)' }
  if (puntos <= 3) return { nivel: 2, texto: 'Aceptable', color: 'var(--yellow)' }
  return { nivel: 3, texto: 'Fuerte', color: 'var(--green)' }
}

function AdminUsuarios({ user: currentUser }) {
  const [usuarios, setUsuarios]   = useState([])
  const [trabajadores, setTrab]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [editando, setEditando]   = useState(null)   // usuario en edición
  const [msg, setMsg]             = useState('')
  const [guardando, setGuardando] = useState(false)
  const [busquedaDni, setBusquedaDni] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [cambiarClave, setCambiarClave] = useState(false)   // en edición: mostrar campo de contraseña
  const [verClave, setVerClave]   = useState(true)
  const [credenciales, setCredenciales] = useState(null)    // { username, password, nuevo } tras guardar
  const [copiado, setCopiado]     = useState(false)
  const [filtro, setFiltro]       = useState('')
  const [filtroNivel, setFiltroNivel] = useState(0)          // 0 = todos

  // Form state
  const [form, setForm] = useState({
    username: '', password: '', dni_asociado: '', nivel_acceso: 2, estado: 'ACTIVO'
  })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: usrs, error: e1 }, { data: trabs }] = await Promise.all([
      supabase.from('usuarios_sistema').select('*').order('username'),
      supabase.from('trabajadores').select('dni, nombres_completos').order('nombres_completos'),
    ])
    if (e1) setMsg('No se pudo leer la lista de usuarios: ' + e1.message)
    setUsuarios(usrs || [])
    setTrab(trabs || [])
    setLoading(false)
  }

  function nombreDeTrabajador(dni) {
    return trabajadores.find(t => t.dni === dni)?.nombres_completos || null
  }

  function trabajadoresFiltrados() {
    if (!busquedaDni) return trabajadores.slice(0, 6)
    const q = busquedaDni.toLowerCase()
    return trabajadores.filter(t =>
      t.nombres_completos.toLowerCase().includes(q) || t.dni.includes(q)
    ).slice(0, 6)
  }

  function generarClave() {
    // Sin caracteres que se confunden (0/O, 1/l/I) para dictarla sin errores
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    const nums = '23456789'
    const base = Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    return base + Array.from({ length: 3 }, () => nums[Math.floor(Math.random() * nums.length)]).join('')
  }

  function abrirNuevo() {
    setForm({ username: '', password: generarClave(), dni_asociado: '', nivel_acceso: 2, estado: 'ACTIVO' })
    setEditando(null); setBusquedaDni(''); setMsg(''); setCambiarClave(true); setVerClave(true); setCredenciales(null); setShowForm(true)
  }

  function abrirEditar(u, soloClave = false) {
    setForm({ username: u.username, password: soloClave ? generarClave() : '', dni_asociado: u.dni_asociado || '', nivel_acceso: u.nivel_acceso, estado: u.estado })
    setEditando(u); setBusquedaDni(''); setMsg(''); setCambiarClave(soloClave); setVerClave(true); setCredenciales(null); setShowForm(true)
  }

  function cerrarForm() {
    setShowForm(false); setCredenciales(null); setMsg('')
  }

  function validar() {
    const u = form.username.trim().toUpperCase()
    if (!u) return 'Escribe un nombre de usuario.'
    if (!/^[A-Z0-9._-]+$/.test(u)) return 'El usuario solo puede tener letras, números, punto, guion o guion bajo (sin espacios ni tildes).'
    if (u.length < 3) return 'El usuario debe tener al menos 3 caracteres.'
    if (!editando && usuarios.some(x => x.username === u)) return `Ya existe un usuario ${u}.`
    if ((!editando || cambiarClave) && form.password.trim().length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
    if (editando && editando.username === currentUser.username && form.estado !== 'ACTIVO') return 'No puedes desactivar tu propio usuario.'
    if (editando && editando.username === currentUser.username && parseInt(form.nivel_acceso) !== 1 && currentUser.nivel === 1) return 'No puedes quitarte el nivel de Admin a ti mismo.'
    return ''
  }

  async function guardar() {
    const error0 = validar()
    if (error0) { setMsg(error0); return }
    setGuardando(true); setMsg('')

    const data = {
      username:      form.username.toUpperCase().trim(),
      nivel_acceso:  parseInt(form.nivel_acceso),
      estado:        form.estado,
      dni_asociado:  form.dni_asociado || null,
    }

    // Solo cifrar si se escribió contraseña
    const clave = (!editando || cambiarClave) ? form.password.trim() : ''
    if (clave) {
      data.password_hash = md5(clave)
    }
    if (!editando) data.intentos_fallidos = 0

    let error
    if (editando) {
      ({ error } = await supabase.from('usuarios_sistema').update(data).eq('username', editando.username))
    } else {
      ({ error } = await supabase.from('usuarios_sistema').insert(data))
    }

    if (error) {
      setMsg(
        error.code === '23505' ? 'Ese nombre de usuario ya existe.'
        : error.code === '23503' ? 'El trabajador vinculado no existe en la base de datos.'
        : error.code === '42501' ? 'La base de datos rechazó el cambio por permisos (políticas RLS de Supabase).'
        : 'No se pudo guardar: ' + error.message
      )
    } else {
      await supabase.from('audit_log').insert({
        username: currentUser.username,
        accion: editando ? (clave ? 'USUARIO_CLAVE' : 'USUARIO_EDITAR') : 'USUARIO_CREAR',
        registro_id: data.username,
        detalle: `Nivel ${data.nivel_acceso} · ${data.estado}${clave ? ' · contraseña asignada' : ''}`,
      })
      await loadAll()
      if (clave) setCredenciales({ username: data.username, password: clave, nuevo: !editando })
      else cerrarForm()
    }
    setGuardando(false)
  }

  async function toggleEstado(u) {
    if (u.username === currentUser.username) return
    const nuevoEstado = u.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
    await supabase.from('usuarios_sistema').update({ estado: nuevoEstado }).eq('username', u.username)
    await loadAll()
  }

  async function eliminar(username) {
    await supabase.from('usuarios_sistema').delete().eq('username', username)
    setConfirmDelete(null)
    await loadAll()
  }

  function textoCredenciales(c) {
    const url = typeof window !== 'undefined' ? window.location.origin : ''
    return `Acceso al Portal PRODISE\nUsuario: ${c.username}\nContraseña: ${c.password}\nIngresa en: ${url}`
  }

  async function copiar(c) {
    try { await navigator.clipboard.writeText(textoCredenciales(c)); setCopiado(true); setTimeout(() => setCopiado(false), 2000) }
    catch { setCopiado(false) }
  }

  async function compartir(c) {
    const texto = textoCredenciales(c)
    if (navigator.share) { try { await navigator.share({ title: 'Acceso al Portal PRODISE', text: texto }) } catch {} }
    else window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener')
  }

  const nivelColor = n => n === 1 ? 'var(--accent)' : n === 2 ? 'var(--text)' : 'var(--text2)'
  const nivelBg    = n => n === 1 ? 'var(--brand-soft)' : 'var(--fill-2)'
  const nivelCorto = n => n === 1 ? 'Admin' : n === 2 ? 'Planner' : 'Supervisor'

  const visibles = usuarios.filter(u => {
    if (filtroNivel && u.nivel_acceso !== filtroNivel) return false
    if (!filtro) return true
    const q = filtro.toLowerCase()
    return u.username.toLowerCase().includes(q) || (nombreDeTrabajador(u.dni_asociado) || '').toLowerCase().includes(q) || (u.dni_asociado || '').includes(q)
  })
  const activos = usuarios.filter(u => u.estado === 'ACTIVO').length
  const fuerza = fuerzaClave(form.password)

  if (loading) return <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text2)', fontSize: 15 }}><span className="spinner" />Cargando usuarios…</div>

  return (
    <div className="fade">
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h3 className="group-title"><Glifo icono="users" />Usuarios del sistema</h3>
          <div className="num" style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>{usuarios.length} usuarios · {activos} activos</div>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevo} style={{ width: 'auto' }}>
          <Icon name="plus" size={18} />Nuevo usuario
        </button>
      </div>

      {!showForm && msg && <div className="alert alert-err" role="alert" style={{ marginBottom: 16 }}>{msg}</div>}

      {/* Búsqueda y filtro */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <div className="search-field" style={{ flex: '1 1 260px', maxWidth: 420 }}>
          <Icon name="buscador" size={18} />
          <input className="input" type="search" aria-label="Buscar usuario" placeholder="Buscar por usuario, nombre o DNI" value={filtro} onChange={e => setFiltro(e.target.value)} style={{ background: 'var(--surface)' }} />
        </div>
        <div className="segmented" role="tablist" aria-label="Filtrar por nivel">
          <Deslizador />
          {[0, 1, 2, 3].map(n => (
            <button key={n} role="tab" aria-selected={filtroNivel === n} onClick={() => setFiltroNivel(n)} className={`segmented-item ${filtroNivel === n ? 'is-active' : ''}`}>
              {n === 0 ? 'Todos' : `N${n}`}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de usuarios */}
      {visibles.length === 0 ? (
        <div className="card-static empty-state" style={{ marginBottom: 16 }}>
          <Icon name="users" size={28} style={{ color: 'var(--text3)' }} />
          <p style={{ color: 'var(--text2)', fontSize: 15, marginTop: 16 }}>{usuarios.length ? 'Ningún usuario coincide con la búsqueda.' : 'Aún no hay usuarios. Crea el primero con “Nuevo usuario”.'}</p>
        </div>
      ) : (
        <ul className="card-static grouped-list" style={{ marginBottom: 16 }}>
          {visibles.map(u => {
            const yo = u.username === currentUser.username
            const nombre = nombreDeTrabajador(u.dni_asociado)
            return (
              <li key={u.username} className="user-row" style={{ opacity: u.estado === 'INACTIVO' ? 0.6 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: '1 1 280px' }}>
                  <Avatar nombre={nombre || u.username} size={40} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{u.username}</span>
                      {yo && <span className="badge b-pdp">Tú</span>}
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: nivelBg(u.nivel_acceso), color: nivelColor(u.nivel_acceso), fontWeight: 600 }}>
                        N{u.nivel_acceso} · {nivelCorto(u.nivel_acceso)}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: nombre ? 'var(--text2)' : 'var(--text3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {nombre || 'Sin trabajador vinculado'}
                    </div>
                    <div className="num" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: u.estado === 'ACTIVO' ? 'var(--green)' : 'var(--text3)' }} />
                      {u.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'} · {u.ultimo_login ? `Último acceso ${new Date(u.ultimo_login).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: '2-digit' })}` : 'Nunca ha ingresado'}
                    </div>
                  </div>
                </div>

                <div className="user-actions">
                  <button onClick={() => abrirEditar(u, true)} className="act" title="Asignar una contraseña nueva">
                    <Icon name="key" size={16} />Contraseña
                  </button>
                  <button onClick={() => abrirEditar(u)} className="act">
                    <Icon name="edit" size={16} />Editar
                  </button>
                  {!yo && (
                    <button onClick={() => toggleEstado(u)} className="act act-icon" aria-label={u.estado === 'ACTIVO' ? 'Desactivar usuario' : 'Activar usuario'} title={u.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}>
                      <Icon name={u.estado === 'ACTIVO' ? 'pause' : 'play'} size={16} />
                    </button>
                  )}
                  {!yo && (
                    <button onClick={() => setConfirmDelete(u.username)} className="act act-icon act-danger" aria-label="Eliminar usuario">
                      <Icon name="trash" size={16} />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Confirmar eliminación */}
      {confirmDelete && (
        <div role="presentation" className="modal-scrim" style={{ position: 'fixed', inset: 0, background: 'var(--scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div role="dialog" aria-modal="true" className="modal-material modal-panel" style={{ borderRadius: 16, padding: '24px', maxWidth: 340, textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>¿Eliminar usuario?</div>
            <div style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 20 }}>Se eliminará <strong style={{ color: 'var(--text)' }}>{confirmDelete}</strong> permanentemente. Si solo quieres quitarle el acceso, desactívalo.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)} style={{ flex: 1 }}>Cancelar</button>
              <button onClick={() => eliminar(confirmDelete)} className="btn btn-danger" style={{ flex: 1 }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario / credenciales */}
      {showForm && (
        <div role="presentation" className="modal-scrim sheet-scrim" style={{ position: 'fixed', inset: 0, background: 'var(--scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div role="dialog" aria-modal="true" aria-labelledby="usr-titulo" className="modal-material modal-panel sheet-panel" style={{ borderRadius: 16, padding: '24px', width: '100%', maxWidth: 480, maxHeight: '92dvh', overflowY: 'auto' }}>

            {credenciales ? (
              /* ── Listo: credenciales para entregar ── */
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', margin: '0 auto', background: 'color-mix(in srgb, var(--green) 14%, transparent)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={28} strokeWidth={2.25} />
                </div>
                <h3 id="usr-titulo" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 16 }}>{credenciales.nuevo ? 'Usuario creado' : 'Contraseña actualizada'}</h3>
                <p style={{ fontSize: 15, color: 'var(--text2)', marginTop: 6 }}>Entrégale estos datos. Por seguridad no se podrán volver a ver.</p>
                <div style={{ textAlign: 'left', marginTop: 20, padding: '14px 16px', borderRadius: 12, background: 'var(--fill)' }}>
                  <div style={{ fontSize: 13, color: 'var(--text3)' }}>Usuario</div>
                  <div style={{ fontSize: 17, fontWeight: 600, fontFamily: 'var(--font-mono)', marginTop: 2, userSelect: 'all' }}>{credenciales.username}</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 12 }}>Contraseña</div>
                  <div style={{ fontSize: 17, fontWeight: 600, fontFamily: 'var(--font-mono)', marginTop: 2, userSelect: 'all', wordBreak: 'break-all' }}>{credenciales.password}</div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button className="btn btn-ghost" onClick={() => copiar(credenciales)} style={{ flex: 1, minHeight: 44 }}>
                    <Icon name={copiado ? 'check' : 'copy'} size={18} />{copiado ? 'Copiado' : 'Copiar'}
                  </button>
                  <button className="btn btn-ghost" onClick={() => compartir(credenciales)} style={{ flex: 1, minHeight: 44 }}>
                    <Icon name="share" size={18} />Compartir
                  </button>
                </div>
                <button className="btn btn-primary" onClick={cerrarForm} style={{ marginTop: 10 }}>Listo</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 id="usr-titulo" style={{ fontSize: 17, fontWeight: 600 }}>{editando ? `Editar ${editando.username}` : 'Nuevo usuario'}</h3>
                  <button onClick={cerrarForm} className="icon-btn" aria-label="Cerrar" style={{ margin: -10 }}><Icon name="close" size={20} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Usuario */}
                  <div>
                    <label htmlFor="usr-nombre" style={lbl}>Nombre de usuario</label>
                    <input id="usr-nombre" className="input" value={form.username} placeholder="Ej: RCHANCAY" autoComplete="off" autoCapitalize="characters" spellCheck={false}
                      onChange={e => { setForm(f => ({ ...f, username: e.target.value.toUpperCase().replace(/\s/g, '') })); setMsg('') }}
                      disabled={!!editando}
                      style={{ fontFamily: 'var(--font-mono)', opacity: editando ? 0.6 : 1 }}
                    />
                    {!editando && <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6 }}>Letras y números, sin espacios. Es el que escribirá para ingresar.</div>}
                  </div>

                  {/* Contraseña */}
                  <div>
                    {editando && !cambiarClave ? (
                      <button type="button" className="btn btn-ghost" onClick={() => { setCambiarClave(true); setForm(f => ({ ...f, password: generarClave() })) }} style={{ width: '100%', minHeight: 44 }}>
                        <Icon name="key" size={18} />Asignar una contraseña nueva
                      </button>
                    ) : (
                      <>
                        <label htmlFor="usr-clave" style={lbl}>{editando ? 'Contraseña nueva' : 'Contraseña'}</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <input id="usr-clave" className="input" type={verClave ? 'text' : 'password'} value={form.password} autoComplete="new-password" spellCheck={false}
                              onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setMsg('') }}
                              style={{ fontFamily: 'var(--font-mono)', paddingRight: 48 }}
                            />
                            <button type="button" onClick={() => setVerClave(v => !v)} className="icon-btn" aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'} style={{ position: 'absolute', right: 0, top: 0, color: 'var(--text3)' }}>
                              <Icon name={verClave ? 'eyeOff' : 'eye'} size={18} />
                            </button>
                          </div>
                          <button type="button" onClick={() => setForm(f => ({ ...f, password: generarClave() }))} className="btn btn-ghost" style={{ minHeight: 44, whiteSpace: 'nowrap' }} title="Generar otra contraseña">
                            <Icon name="dice" size={16} />Generar
                          </button>
                        </div>
                        {fuerza && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                            <div style={{ flex: 1, display: 'flex', gap: 4 }}>
                              {[0, 1, 2, 3].map(i => <span key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= fuerza.nivel ? fuerza.color : 'var(--fill-2)', transition: 'background-color var(--dur-quick) ease-out' }} />)}
                            </div>
                            <span style={{ fontSize: 13, color: fuerza.color, fontWeight: 500, minWidth: 72, textAlign: 'right' }}>{fuerza.texto}</span>
                          </div>
                        )}
                        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6 }}>Se guarda cifrada. Al guardar podrás copiarla o compartirla con el usuario.</div>
                      </>
                    )}
                  </div>

                  {/* Nivel de acceso */}
                  <fieldset style={{ border: 0 }}>
                    <legend style={lbl}>Nivel de acceso</legend>
                    <div className="card-static grouped-list" style={{ background: 'var(--fill)' }}>
                      {NIVELES.map(({ n, label, desc }) => (
                        <label key={n} className={`choice-row ${parseInt(form.nivel_acceso) === n ? 'is-selected' : ''}`}>
                          <input type="radio" name="usr-nivel" checked={parseInt(form.nivel_acceso) === n} onChange={() => setForm(f => ({ ...f, nivel_acceso: n }))} className="choice-radio" />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 600 }}>Nivel {n} · {label}</div>
                            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {/* Trabajador vinculado */}
                  <div>
                    <label htmlFor="usr-trab" style={lbl}>Trabajador vinculado <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(opcional)</span></label>
                    {form.dni_asociado ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'var(--fill)' }}>
                        <Avatar nombre={nombreDeTrabajador(form.dni_asociado) || form.dni_asociado} size={32} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreDeTrabajador(form.dni_asociado) || 'Trabajador no encontrado'}</div>
                          <div style={{ fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>DNI {form.dni_asociado}</div>
                        </div>
                        <button type="button" className="act" onClick={() => { setForm(f => ({ ...f, dni_asociado: '' })); setBusquedaDni('') }}>Quitar</button>
                      </div>
                    ) : (
                      <>
                        <div className="search-field">
                          <Icon name="buscador" size={18} />
                          <input id="usr-trab" className="input" type="search" placeholder="Buscar por nombre o DNI" value={busquedaDni} onChange={e => setBusquedaDni(e.target.value)} />
                        </div>
                        {busquedaDni && (
                          <ul className="grouped-list" style={{ marginTop: 8, borderRadius: 10, background: 'var(--fill)', overflow: 'hidden' }}>
                            {trabajadoresFiltrados().map(t => (
                              <li key={t.dni}>
                                <button type="button" className="pick-row" onClick={() => { setForm(f => ({ ...f, dni_asociado: t.dni })); setBusquedaDni('') }} style={{ borderRadius: 0 }}>
                                  <span style={{ flex: 1, textAlign: 'left', fontSize: 15 }}>{t.nombres_completos}</span>
                                  <span style={{ fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{t.dni}</span>
                                </button>
                              </li>
                            ))}
                            {trabajadoresFiltrados().length === 0 && <li style={{ padding: '12px', fontSize: 13, color: 'var(--text3)' }}>Sin resultados.</li>}
                          </ul>
                        )}
                        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6 }}>Vincúlalo para que el nombre aparezca en las evaluaciones y los niveles 3 vean sus servicios.</div>
                      </>
                    )}
                  </div>

                  {/* Estado (solo en edición) */}
                  {editando && editando.username !== currentUser.username && (
                    <button type="button" role="switch" aria-checked={form.estado === 'ACTIVO'} onClick={() => setForm(f => ({ ...f, estado: f.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' }))} className="switch-row" style={{ width: '100%', justifyContent: 'flex-start', background: 'var(--fill)' }}>
                      <span className={`switch ${form.estado === 'ACTIVO' ? 'is-on' : ''}`} aria-hidden="true"><span className="switch-knob" /></span>
                      <span style={{ textAlign: 'left' }}>
                        <span style={{ display: 'block', fontSize: 15, fontWeight: 500 }}>Usuario activo</span>
                        <span style={{ display: 'block', fontSize: 13, color: 'var(--text3)' }}>{form.estado === 'ACTIVO' ? 'Puede ingresar al portal' : 'No podrá ingresar hasta reactivarlo'}</span>
                      </span>
                    </button>
                  )}

                  {msg && <div className="alert alert-err" role="alert">{msg}</div>}

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-ghost" onClick={cerrarForm} style={{ flex: 1 }}>Cancelar</button>
                    <button className="btn btn-primary" onClick={guardar} disabled={guardando} style={{ flex: 2 }}>
                      {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear usuario'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const lbl = { fontSize: 13, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }

/* =========================================
   BITÁCORA DE ACTIVIDADES (Vinculación Tarea ↔ Personal)
   ========================================= */
function Bitacora({ svc, user }) {
  const [actividades, setActividades] = useState([])
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState('lista') // 'lista' | 'nueva' | 'detalle'
  const [selAct, setSelAct] = useState(null)
  const [personalAsignado, setPersonalAsignado] = useState([])
  const [comps, setComps] = useState([])
  const [gruposInfo, setGruposInfo] = useState([])

  const [formAct, setFormAct] = useState({ id_competencia: '', nombre: '', id_grupo: '', inicio: '', fin: '', duracion_programada: '', duracion_real: '', url_foto: '' })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { load() }, [svc])

  async function load() {
    setLoading(true)
    const [{ data: acts }, { data: ct }, { data: asigs }, { data: srvs }] = await Promise.all([
      supabase.from('actividades_criticas').select('*, catalogo_competencias(nombre)').order('fecha_inicio', { ascending: false }),
      supabase.from('catalogo_competencias').select('id_competencia, nombre').order('nombre'),
      supabase.from('asignaciones').select('id_grupo').eq('id_servicio', svc.id_servicio).eq('estado', 'ACTIVO'),
      supabase.from('servicios').select('id_servicio, nombre_descriptivo')
    ])

    const srvMap = Object.fromEntries((srvs||[]).map(s => [s.id_servicio, s.nombre_descriptivo]))

    let gCounts = {}
    if (asigs) {
       asigs.forEach(a => {
         const gs = String(a.id_grupo).split(',').map(g => g.trim()).filter(g => g && g !== 'MASTER')
         gs.forEach(g => { gCounts[g] = (gCounts[g] || 0) + 1 })
       })
    }
    const gList = Object.entries(gCounts).map(([grupo, count]) => ({ grupo, count })).sort((a,b) => a.grupo.localeCompare(b.grupo, undefined, {numeric:true}))

    const parsedActs = (acts || []).map(a => {
        let meta = {}
        try { meta = JSON.parse(a.checklist_generado) } catch(e) { meta = { url_foto: '', id_grupo: '' } }
        return { ...a, meta, servicioNombre: srvMap[a.id_servicio] || 'Servicio Desconocido' }
    })

    setActividades(parsedActs)
    setComps(ct || [])
    setGruposInfo(gList)
    setLoading(false)
  }

  async function abrirDetalle(act) {
    setSelAct(act); 
    setVista('detalle');
    setPersonalAsignado([]);
    
    if (act.meta?.id_grupo) {
        const { data: asigs } = await supabase.from('asignaciones')
            .select('dni_trabajador, id_cargo_actual, id_grupo')
            .eq('id_servicio', act.id_servicio)
            .eq('estado', 'ACTIVO')
        
        const groupWorkers = (asigs || []).filter(a => String(a.id_grupo).split(',').map(g=>g.trim()).includes(String(act.meta.id_grupo)));
        const dnis = groupWorkers.map(w => w.dni_trabajador);
        
        if(dnis.length > 0) {
            const [{data: trabs}, {data: cargos}] = await Promise.all([
                supabase.from('trabajadores').select('dni, nombres_completos, url_foto').in('dni', dnis),
                supabase.from('catalogo_cargos').select('id_cargo, nombre_oficial')
            ]);
            const cm = Object.fromEntries((cargos||[]).map(c=>[c.id_cargo, c.nombre_oficial]));
            const merged = groupWorkers.map(gw => {
                const t = (trabs||[]).find(x => x.dni === gw.dni_trabajador) || {};
                return { ...t, cargo: cm[gw.id_cargo_actual] }
            });
            setPersonalAsignado(merged);
        }
    }
  }

  async function crearActividad() {
    if (!formAct.nombre || !formAct.id_competencia || !formAct.id_grupo) return alert('El nombre, grupo y la competencia son obligatorios.')
    setGuardando(true)

    const gSeleccionado = gruposInfo.find(g => g.grupo === formAct.id_grupo)
    const personalProg = gSeleccionado ? gSeleccionado.count : null

    const dReal = formAct.duracion_real ? parseFloat(formAct.duracion_real) : 0
    const dProg = formAct.duracion_programada ? parseFloat(formAct.duracion_programada) : 0
    const estadoFinal = (dReal > dProg && dProg > 0) ? 'RETRASO' : 'EN PLAZO'

    const metaData = JSON.stringify({
        id_grupo: formAct.id_grupo,
        url_foto: formAct.url_foto
    })

    const { error } = await supabase.from('actividades_criticas').insert({
      id_servicio: svc.id_servicio,
      id_competencia: parseInt(formAct.id_competencia),
      nombre_actividad: formAct.nombre,
      fecha_inicio: formAct.inicio || null,
      fecha_fin: formAct.fin || null,
      duracion_programada: formAct.duracion_programada ? parseFloat(formAct.duracion_programada) : null,
      duracion_horas: formAct.duracion_real ? parseFloat(formAct.duracion_real) : null,
      personal_programado: personalProg,
      estado: estadoFinal,
      checklist_generado: metaData, 
      registrado_por: user.username
    })
    
    setGuardando(false)
    if (error) alert(error.message)
    else {
      setFormAct({ id_competencia: '', nombre: '', id_grupo: '', inicio: '', fin: '', duracion_programada: '', duracion_real: '', url_foto: '' })
      setVista('lista'); load() 
    }
  }

  if (loading) return <p style={{ color: 'var(--text3)', fontSize: 13 }}>Cargando actividades...</p>

  return (
    <div className="fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Antetitulo sec="bitacora" /><h2 className="page-title">Trabajos importantes</h2>
          <p className="page-sub">Registro global de trabajos críticos y cuadrillas asignadas</p>
        </div>
        {vista === 'lista' && <button className="btn btn-primary" onClick={() => setVista('nueva')} style={{ width: 'auto' }}><Icon name="plus" size={18} />Registrar trabajo</button>}
      </div>

      {vista === 'lista' && (
        <div className="fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: 16 }}>
          {actividades.length === 0 ? (
             <div className="card-static empty-state" style={{ gridColumn: '1 / -1' }}><Icon name="bitacora" size={28} style={{ color: 'var(--text3)' }} /><p style={{ color: 'var(--text2)', fontSize: 15, marginTop: 16 }}>Aún no hay trabajos importantes registrados.</p></div>
          ) : actividades.map(a => (
            <button type="button" key={a.id_actividad} className="card" onClick={() => abrirDetalle(a)} style={{ padding: '16px', display: 'flex', gap: 16, alignItems: 'center', textAlign: 'left', color: 'var(--text)' }}>
              {a.meta?.url_foto ? (
                 <div style={{ width: 80, height: 80, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={a.meta.url_foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 </div>
              ) : (
                 <div style={{ width: 80, height: 80, borderRadius: 10, background: 'var(--fill)', color: 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="wrench" size={30} /></div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>{a.catalogo_competencias?.nombre}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.servicioNombre}</div>
                
                <div className="num" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, color: 'var(--text3)' }}>
                  <div>
                     <strong style={{display: 'block', color: 'var(--text2)', fontWeight: 500, marginBottom: 2}}>Ejecución</strong>
                     {a.meta?.id_grupo ? `Grupo ${a.meta.id_grupo} (${a.personal_programado || 0} pax)` : 'Sin grupo'}
                  </div>
                  <div>
                     <strong style={{display: 'block', color: 'var(--text2)', fontWeight: 500, marginBottom: 2}}>Tiempos</strong>
                     Prog. {a.duracion_programada||'0'} h · Real <span style={{ color: a.estado === 'EN PLAZO' ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{a.duracion_horas||'0'} h</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {vista === 'nueva' && (
        <div className="fade card-static" style={{ padding: '24px', maxWidth: 800 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Vincular trabajo a grupo</h3>
            <button className="btn btn-ghost" onClick={() => setVista('lista')}>Cancelar</button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                <div>
                  <label className="field-label">Competencia / tarea principal *</label>
                  <select className="input" value={formAct.id_competencia} onChange={e => setFormAct({...formAct, id_competencia: e.target.value})}>
                    <option value="">-- Seleccionar --</option>
                    {comps.map(c => <option key={c.id_competencia} value={c.id_competencia}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="field-label">Grupo asignado *</label>
                  <select className="input" value={formAct.id_grupo} onChange={e => setFormAct({...formAct, id_grupo: e.target.value})}>
                    <option value="">-- Seleccionar --</option>
                    {gruposInfo.map(g => <option key={g.grupo} value={g.grupo}>Grupo {g.grupo} ({g.count} técnicos)</option>)}
                  </select>
                </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">Descripción breve del trabajo *</label>
              <input className="input" placeholder="Ej: Cambio de manto en Molino SAG #2" value={formAct.nombre} onChange={e => setFormAct({...formAct, nombre: e.target.value})} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">Fotografía (URL, opcional)</label>
              <input className="input" placeholder="Ej: https://miservidor.com/foto.jpg" value={formAct.url_foto} onChange={e => setFormAct({...formAct, url_foto: e.target.value})} />
            </div>

            <div>
               <label className="field-label">Horas programadas</label>
               <input type="number" className="input" placeholder="Ej: 12" value={formAct.duracion_programada} onChange={e => setFormAct({...formAct, duracion_programada: e.target.value})} />
            </div>
            <div>
               <label className="field-label">Horas reales</label>
               <input type="number" className="input" placeholder="Ej: 14.5" value={formAct.duracion_real} onChange={e => setFormAct({...formAct, duracion_real: e.target.value})} />
            </div>
          </div>
          
          <button className="btn btn-primary" onClick={crearActividad} disabled={guardando} style={{ marginTop: 24, maxWidth: 200 }}>
            {guardando ? 'Guardando...' : 'Registrar Trabajo'}
          </button>
        </div>
      )}

      {vista === 'detalle' && selAct && (
        <div className="fade" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <button className="btn btn-ghost" onClick={() => setVista('lista')} style={{ width: 'fit-content' }}><Icon name="back" size={16} />Volver a trabajos</button>
          
          <div className="card-static" style={{ padding: '24px', display: 'flex', gap: 24, alignItems: 'center' }}>
            {selAct.meta?.url_foto && (
               <div style={{ width: 220, height: 140, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--fill-2)' }}>
                  <img src={selAct.meta.url_foto} alt="Trabajo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, marginBottom: 6 }}>{selAct.servicioNombre.toUpperCase()}</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8, lineHeight: 1.2 }}>{selAct.catalogo_competencias?.nombre}</h3>
              <div style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 16, paddingLeft: 12 }}>"{selAct.nombre_actividad}"</div>
              
              <div style={{ display: 'flex', gap: 30, fontSize: 13, color: 'var(--text3)' }}>
                 <div>
                    <strong style={{display: 'block', color: 'var(--text)', marginBottom: 4}}>Estado</strong>
                    <span style={{ color: selAct.estado === 'EN PLAZO' ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{selAct.estado}</span>
                 </div>
                 <div>
                    <strong style={{display: 'block', color: 'var(--text)', marginBottom: 4}}>Horas planificadas</strong>
                    {selAct.duracion_programada || '—'} hrs
                 </div>
                 <div>
                    <strong style={{display: 'block', color: 'var(--text)', marginBottom: 4}}>Horas reales</strong>
                    <span style={{ color: selAct.estado === 'EN PLAZO' ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{selAct.duracion_horas || '—'} hrs</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="card-static" style={{ padding: '24px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: 'var(--text)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Personal asignado al trabajo</span>
                <span style={{ color: 'var(--accent)' }}>Grupo {selAct.meta?.id_grupo} ({personalAsignado.length} técnicos)</span>
            </div>
            
            {personalAsignado.length === 0 ? (
               <div style={{ padding: '30px', textAlign: 'center', background: 'var(--fill)', borderRadius: 8, border: '1px dashed var(--border)', color: 'var(--text3)', fontSize: 13 }}>No hay técnicos registrados en el Grupo {selAct.meta?.id_grupo} para este servicio.</div>
            ) : (
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {personalAsignado.map(p => (
                     <div key={p.dni} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', background: 'var(--fill)', borderRadius: 8 }}>
                        <Avatar nombre={p.nombres_completos} foto={p.url_foto} size={36} />
                        <div style={{ minWidth: 0 }}>
                           <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nombres_completos}</div>
                           <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{p.cargo}</div>
                        </div>
                     </div>
                  ))}
               </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

/* =========================================
   ADMIN — GESTIÓN Y BORRADO (completo)
   ========================================= */
function AdminGestion({ svc }) {
  const [asigs, setAsigs]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [confirmDni, setConfirmDni] = useState(null)
  const [msg, setMsg]             = useState('')
  const [turnoFiltro, setTurnoFiltro] = useState('TODOS')
  const [cargoFiltro, setCargoFiltro] = useState('TODOS')
  const [cargos, setCargos]       = useState([])

  useEffect(() => { loadAll() }, [svc])

  async function loadAll() {
    setLoading(true)
    const { data: asigData } = await supabase
      .from('asignaciones')
      .select('id_asignacion, dni_trabajador, id_cargo_actual, turno, id_grupo, estado')
      .eq('id_servicio', svc.id_servicio)
      .order('id_cargo_actual')

    if (!asigData?.length) { setAsigs([]); setLoading(false); return }

    const dnis = asigData.map(a => a.dni_trabajador)
    const cids = [...new Set(asigData.map(a => a.id_cargo_actual))]

    const [{ data: trabs }, { data: catCargos }] = await Promise.all([
      supabase.from('trabajadores').select('dni, nombres_completos, url_foto').in('dni', dnis),
      supabase.from('catalogo_cargos').select('id_cargo, nombre_oficial').in('id_cargo', cids),
    ])
    const tm = Object.fromEntries((trabs || []).map(t => [t.dni, t]))
    const cm = Object.fromEntries((catCargos || []).map(c => [c.id_cargo, c.nombre_oficial]))
    setCargos(catCargos || [])

    setAsigs(asigData.map(a => ({
      ...a,
      nombre:      tm[a.dni_trabajador]?.nombres_completos || a.dni_trabajador,
      foto:        tm[a.dni_trabajador]?.url_foto || null,
      cargoNombre: cm[a.id_cargo_actual] || `Cargo ${a.id_cargo_actual}`,
    })))
    setLoading(false)
  }

  async function desactivar(id_asignacion, nombre) {
    await supabase.from('asignaciones').update({ estado: 'INACTIVO' }).eq('id_asignacion', id_asignacion)
    setMsg(`${nombre} desactivado del servicio`)
    setConfirmDni(null)
    await loadAll()
  }

  async function reactivar(id_asignacion) {
    await supabase.from('asignaciones').update({ estado: 'ACTIVO' }).eq('id_asignacion', id_asignacion)
    await loadAll()
  }

  async function eliminarAsignacion(id_asignacion, nombre) {
    await supabase.from('asignaciones').delete().eq('id_asignacion', id_asignacion)
    setMsg(`${nombre} eliminado del servicio`)
    setConfirmDni(null)
    await loadAll()
  }

  if (loading) return <p style={{ color: 'var(--text3)', fontSize: 13 }}>Cargando personal...</p>

  let filtrados = asigs
  if (search) filtrados = filtrados.filter(a => a.nombre.toLowerCase().includes(search.toLowerCase()) || a.dni_trabajador.includes(search))
  if (turnoFiltro !== 'TODOS') filtrados = filtrados.filter(a => a.turno === turnoFiltro)
  if (cargoFiltro !== 'TODOS') filtrados = filtrados.filter(a => String(a.id_cargo_actual) === cargoFiltro)

  const activos   = filtrados.filter(a => a.estado === 'ACTIVO')
  const inactivos = filtrados.filter(a => a.estado !== 'ACTIVO')

  return (
    <div className="fade">
      {msg && <div className="alert alert-ok" style={{ marginBottom: 14 }}>{msg}</div>}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input className="input" placeholder="Buscar nombre o DNI..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 2, minWidth: 200 }} />
        <select className="input" value={turnoFiltro} onChange={e => setTurnoFiltro(e.target.value)} style={{ minWidth: 110, background: 'var(--bg2)' }}>
          <option value="TODOS">Todos los turnos</option>
          <option value="A">Turno A</option>
          <option value="B">Turno B</option>
        </select>
        <select className="input" value={cargoFiltro} onChange={e => setCargoFiltro(e.target.value)} style={{ minWidth: 160, background: 'var(--bg2)' }}>
          <option value="TODOS">Todos los cargos</option>
          {cargos.map(c => <option key={c.id_cargo} value={String(c.id_cargo)}>{c.nombre_oficial}</option>)}
        </select>
      </div>

      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 12 }}>
        {activos.length} activos · {inactivos.length} inactivos · {filtrados.length} total
      </div>

      {/* Lista activos */}
      {activos.length > 0 && (
        <div className="card-static" style={{ overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>Activos en servicio</div>
          {activos.map((a, i) => (
            <div key={a.id_asignacion} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: i < activos.length - 1 ? '1px solid var(--fill)' : 'none' }}>
              <Avatar nombre={a.nombre} foto={a.foto} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.nombre}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{a.cargoNombre} · G{a.id_grupo} · T{a.turno}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setConfirmDni({ id: a.id_asignacion, nombre: a.nombre, accion: 'desactivar' })}
                  className="act act-warn">
                  <Icon name="pause" size={16} />Desactivar
                </button>
                <button onClick={() => setConfirmDni({ id: a.id_asignacion, nombre: a.nombre, accion: 'eliminar' })}
                  className="act act-danger">
                  <Icon name="close" size={16} />Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lista inactivos */}
      {inactivos.length > 0 && (
        <div className="card-static" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>Inactivos</div>
          {inactivos.map((a, i) => (
            <div key={a.id_asignacion} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: i < inactivos.length - 1 ? '1px solid var(--fill)' : 'none', opacity: 0.55 }}>
              <Avatar nombre={a.nombre} foto={a.foto} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.nombre}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{a.cargoNombre} · G{a.id_grupo} · T{a.turno}</div>
              </div>
              <button onClick={() => reactivar(a.id_asignacion)}
                className="act act-ok">
                <Icon name="play" size={16} />Reactivar
              </button>
            </div>
          ))}
        </div>
      )}

      {filtrados.length === 0 && (
        <div className="card-static" style={{ padding: '36px 20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>No hay personal con esos filtros</p>
        </div>
      )}

      {/* Modal confirmación */}
      {confirmDni && (
        <div role="presentation" className="modal-scrim" style={{ position: 'fixed', inset: 0, background: 'var(--scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div role="dialog" aria-modal="true" className="modal-material modal-panel" style={{ borderRadius: 16, padding: '24px', maxWidth: 340, textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
              {confirmDni.accion === 'desactivar' ? '¿Desactivar del servicio?' : '¿Eliminar del servicio?'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 6 }}>
              <strong style={{ color: 'var(--text)' }}>{confirmDni.nombre}</strong>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
              {confirmDni.accion === 'desactivar'
                ? 'El trabajador permanecerá en el sistema pero no participará en este servicio.'
                : 'Se eliminará la asignación a este servicio. El trabajador permanece en el sistema.'
              }
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDni(null)} style={{ flex: 1, fontSize: 13 }}>Cancelar</button>
              <button onClick={() => confirmDni.accion === 'desactivar'
                ? desactivar(confirmDni.id, confirmDni.nombre)
                : eliminarAsignacion(confirmDni.id, confirmDni.nombre)}
                className="btn btn-danger" style={{ flex: 1, background: confirmDni.accion === 'desactivar' ? 'var(--yellow)' : undefined }}>
                {confirmDni.accion === 'desactivar' ? 'Desactivar' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* =========================================
   ADMIN — GESTIÓN DE SERVICIOS
   3 estados: ACTIVO / INACTIVO / ARCHIVADO
   ========================================= */
function AdminServicios({ user, currentSvcId }) {
  const [servicios, setServicios] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [editando, setEditando]   = useState(null)
  const [msg, setMsg]             = useState('')
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({
    codigo_otp: '', nombre_descriptivo: '', cliente: '',
    tipo: 'PDP', estado: 'ACTIVO', fecha_inicio: '', fecha_fin: '',
    fondo_url: '', logo_url: '',
  })

  const estados = [
    { v: 'ACTIVO',    label: 'Activo',    desc: 'Visible y operativo',                   color: 'var(--green)' },
    { v: 'INACTIVO',  label: 'Inactivo',  desc: 'Aparece en Finalizados (opaco)',         color: 'var(--yellow)' },
    { v: 'ARCHIVADO', label: 'Archivado', desc: 'No aparece en ninguna lista de trabajo', color: 'var(--text3)' },
  ]

  useEffect(() => { loadServicios() }, [])

  async function loadServicios() {
    setLoading(true)
    const { data } = await supabase.from('servicios').select('*').order('fecha_inicio', { ascending: false })
    setServicios(data || [])
    setLoading(false)
  }

  function abrirNuevo() {
    setForm({ codigo_otp: '', nombre_descriptivo: '', cliente: '', tipo: 'PDP', estado: 'ACTIVO', fecha_inicio: '', fecha_fin: '', fondo_url: '', logo_url: '' })
    setEditando(null); setMsg(''); setShowForm(true)
  }

  function abrirEditar(s) {
    setForm({
      codigo_otp:         s.codigo_otp || '',
      nombre_descriptivo: s.nombre_descriptivo || '',
      cliente:            s.cliente || '',
      tipo:               s.tipo || 'PDP',
      estado:             s.estado || 'ACTIVO',
      fecha_inicio:       s.fecha_inicio ? s.fecha_inicio.slice(0, 10) : '',
      fecha_fin:          s.fecha_fin    ? s.fecha_fin.slice(0, 10)    : '',
      fondo_url:          s.fondo_url    || '',
      logo_url:           s.logo_url     || '',
    })
    setEditando(s); setMsg(''); setShowForm(true)
  }

  async function guardar() {
    if (!form.codigo_otp.trim() || !form.nombre_descriptivo.trim()) { setMsg('OTP y nombre son obligatorios'); return }
    setGuardando(true); setMsg('')
    const data = {
      codigo_otp:         form.codigo_otp.trim().toUpperCase(),
      nombre_descriptivo: form.nombre_descriptivo.trim().toUpperCase(),
      cliente:            form.cliente.trim().toUpperCase(),
      tipo:               form.tipo,
      estado:             form.estado,
      fecha_inicio:       form.fecha_inicio || null,
      fecha_fin:          form.fecha_fin    || null,
      fondo_url:          form.fondo_url    || null,
      logo_url:           form.logo_url     || null,
    }
    let error
    if (editando) {
      ({ error } = await supabase.from('servicios').update(data).eq('id_servicio', editando.id_servicio))
    } else {
      ({ error } = await supabase.from('servicios').insert(data))
    }
    if (error) setMsg(error.message)
    else { setShowForm(false); await loadServicios() }
    setGuardando(false)
  }

  const estadoColor = e => e === 'ACTIVO' ? 'var(--green)' : e === 'INACTIVO' ? 'var(--yellow)' : 'var(--text3)'
  const estadoBg    = e => e === 'ACTIVO' ? 'color-mix(in srgb, var(--green) 8%, transparent)' : e === 'INACTIVO' ? 'color-mix(in srgb, var(--yellow) 8%, transparent)' : 'var(--fill)'

  if (loading) return <p style={{ color: 'var(--text3)', fontSize: 13 }}>Cargando servicios...</p>

  return (
    <div className="fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>{servicios.length} servicios registrados</div>
        <button className="btn btn-primary" onClick={abrirNuevo} style={{ width: 'auto' }}><Icon name="plus" size={18} />Nuevo servicio</button>
      </div>

      {/* Leyenda de estados */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        {estados.map(e => (
          <div key={e.v} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: e.color }} />
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>{e.label}</span>
            <span style={{ color: 'var(--text3)' }}>— {e.desc}</span>
          </div>
        ))}
      </div>

      <div className="card-static grouped-list">
        {servicios.map(s => (
          <div key={s.id_servicio} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', flexWrap: 'wrap',
            background: s.id_servicio === currentSvcId ? 'var(--accent-soft)' : 'transparent',
            opacity: s.estado === 'ARCHIVADO' ? 0.55 : 1,
          }}>
            {/* Estado dot */}
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: estadoColor(s.estado), flexShrink: 0 }} />

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <div style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.nombre_descriptivo}</div>
                {s.id_servicio === currentSvcId && <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500, flexShrink: 0 }}>En uso</span>}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>
                {s.cliente} · {s.tipo} · {s.codigo_otp}
                {s.fecha_inicio && ` · ${new Date(s.fecha_inicio).toLocaleDateString('es-PE', { month: 'short', year: 'numeric' })}`}
              </div>
            </div>

            {/* Estado badge */}
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: estadoBg(s.estado), color: estadoColor(s.estado), fontWeight: 600, flexShrink: 0 }}>
              {s.estado}
            </span>

            {/* Acciones rápidas de estado */}
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {s.estado !== 'ACTIVO' && (
                <button onClick={async () => { await supabase.from('servicios').update({ estado: 'ACTIVO' }).eq('id_servicio', s.id_servicio); loadServicios() }}
                  className="act act-ok">Activar</button>
              )}
              {s.estado !== 'INACTIVO' && (
                <button onClick={async () => { await supabase.from('servicios').update({ estado: 'INACTIVO' }).eq('id_servicio', s.id_servicio); loadServicios() }}
                  className="act act-warn">Desactivar</button>
              )}
              {s.estado !== 'ARCHIVADO' && (
                <button onClick={async () => { await supabase.from('servicios').update({ estado: 'ARCHIVADO' }).eq('id_servicio', s.id_servicio); loadServicios() }}
                  className="act" style={{ color: 'var(--text2)' }}>Archivar</button>
              )}
              <button onClick={() => abrirEditar(s)}
                className="act"><Icon name="edit" size={16} />Editar</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal formulario */}
      {showForm && (
        <div role="presentation" className="modal-scrim" style={{ position: 'fixed', inset: 0, background: 'var(--scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div role="dialog" aria-modal="true" className="modal-material modal-panel" style={{ borderRadius: 16, padding: '24px', width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{editando ? 'Editar servicio' : 'Nuevo servicio'}</div>
              <button onClick={() => setShowForm(false)} className="icon-btn" aria-label="Cerrar" style={{ margin: -10 }}><Icon name="close" size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl2}>Código OTP</label>
                  <input className="input" value={form.codigo_otp} placeholder="Ej: PDP-MCB-OXI-MAR-2026"
                    onChange={e => setForm(f => ({...f, codigo_otp: e.target.value.toUpperCase()}))} />
                </div>
                <div>
                  <label style={lbl2}>Tipo</label>
                  <select className="input" value={form.tipo} onChange={e => setForm(f => ({...f, tipo: e.target.value}))}>
                    <option value="PDP">PDP</option>
                    <option value="PROYECTO">PROYECTO</option>
                    <option value="PLANTA">PLANTA</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={lbl2}>Nombre descriptivo</label>
                <input className="input" value={form.nombre_descriptivo} placeholder="Ej: PARADA DE PLANTA MARCOBRE OXIDOS MARZO 2026"
                  onChange={e => setForm(f => ({...f, nombre_descriptivo: e.target.value}))} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl2}>Cliente</label>
                  <input className="input" value={form.cliente} placeholder="Ej: MARCOBRE"
                    onChange={e => setForm(f => ({...f, cliente: e.target.value.toUpperCase()}))} />
                </div>
                <div>
                  <label style={lbl2}>Estado</label>
                  <select className="input" value={form.estado} onChange={e => setForm(f => ({...f, estado: e.target.value}))}>
                    <option value="ACTIVO">ACTIVO — visible y operativo</option>
                    <option value="INACTIVO">INACTIVO — aparece en finalizados</option>
                    <option value="ARCHIVADO">ARCHIVADO — no aparece</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl2}>Fecha inicio</label>
                  <input className="input" type="date" value={form.fecha_inicio} onChange={e => setForm(f => ({...f, fecha_inicio: e.target.value}))} />
                </div>
                <div>
                  <label style={lbl2}>Fecha fin</label>
                  <input className="input" type="date" value={form.fecha_fin} onChange={e => setForm(f => ({...f, fecha_fin: e.target.value}))} />
                </div>
              </div>

              <div>
                <label style={lbl2}>URL de la imagen de fondo (opcional)</label>
                <input className="input" value={form.fondo_url} placeholder="https://... (se mostrará de fondo en la tarjeta)"
                  onChange={e => setForm(f => ({...f, fondo_url: e.target.value}))} />
                {form.fondo_url && (
                  <div style={{ marginTop: 6, height: 60, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={form.fondo_url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                  </div>
                )}
              </div>

              {msg && <div className="alert alert-err">{msg}</div>}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn btn-ghost" onClick={() => setShowForm(false)} style={{ flex: 1 }}>Cancelar</button>
                <button className="btn btn-primary" onClick={guardar} disabled={guardando} style={{ flex: 2 }}>
                  {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear servicio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const lbl2 = { fontSize: 13, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }


/* =========================================
   ADMIN — EDITAR PERSONAL
   Editar cargo_max, nombre, foto URL
   ========================================= */
function AdminPersonal({ svc }) {
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({})
  const [cargos, setCargos] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState('')
  const [buscando, setBuscando] = useState(false)

  useEffect(() => {
    supabase.from('catalogo_cargos').select('id_cargo, nombre_oficial').order('nombre_oficial')
      .then(({ data }) => setCargos(data || []))
  }, [])

  async function buscar() {
    if (!busqueda.trim()) return
    setBuscando(true)
    const q = busqueda.trim()
    // Buscar por nombre o DNI en trabajadores del servicio
    const { data: asigs } = await supabase
      .from('asignaciones').select('id_asignacion, dni_trabajador, id_cargo_actual, turno, id_grupo, estado')
      .eq('id_servicio', svc.id_servicio)

    if (!asigs?.length) { setResultados([]); setBuscando(false); return }

    const dnis = asigs.map(a => a.dni_trabajador)
    let query = supabase.from('trabajadores').select('dni, nombres_completos, url_foto, cargo_max_id').in('dni', dnis)
    
    if (/^\d+$/.test(q)) query = query.ilike('dni', `%${q}%`)
    else query = query.ilike('nombres_completos', `%${q}%`)

    const { data: trabs } = await query.limit(10)
    const asigMap = Object.fromEntries(asigs.map(a => [a.dni_trabajador, a]))
    const cm = Object.fromEntries(cargos.map(c => [c.id_cargo, c.nombre_oficial]))

    setResultados((trabs || []).map(t => ({
      ...t,
      asig: asigMap[t.dni],
      cargoMaxNombre: cm[t.cargo_max_id] || `Cargo ${t.cargo_max_id}`,
      cargoActualNombre: cm[asigMap[t.dni]?.id_cargo_actual] || '',
    })))
    setBuscando(false)
  }

  function abrirEditar(t) {
    setEditando(t)
    setForm({
      nombres_completos: t.nombres_completos || '',
      cargo_max_id:      t.cargo_max_id || '',
      url_foto:          t.url_foto || '',
      id_cargo_actual:   t.asig?.id_cargo_actual || '',
      turno:             t.asig?.turno || 'A',
      id_grupo:          t.asig?.id_grupo || '',
    })
    setMsg('')
  }

  async function guardar() {
    if (!editando) return
    setGuardando(true); setMsg('')
    
    const { error: e1 } = await supabase.from('trabajadores').update({
      nombres_completos: form.nombres_completos.trim(),
      cargo_max_id:      parseInt(form.cargo_max_id) || editando.cargo_max_id,
      url_foto:          form.url_foto.trim() || null,
    }).eq('dni', editando.dni)

    if (e1) { setMsg('Error: ' + e1.message); setGuardando(false); return }

    if (editando.asig) {
      const { error: e2 } = await supabase.from('asignaciones').update({
        id_cargo_actual: parseInt(form.id_cargo_actual) || editando.asig.id_cargo_actual,
        turno:           form.turno,
        id_grupo:        form.id_grupo.trim(),
      }).eq('id_asignacion', editando.asig.id_asignacion)
      if (e2) { setMsg('Error en asignación: ' + e2.message); setGuardando(false); return }
    }

    setMsg('✓ Cambios guardados')
    setGuardando(false)
    setEditando(null)
    buscar()
  }

  return (
    <div className="fade">
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14 }}>
        Busca un trabajador del servicio para editar sus datos, cargo o asignación.
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input className="input" placeholder="Buscar por nombre o DNI..." value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && buscar()}
          style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={buscar} disabled={buscando} style={{ width: 'auto', padding: '0 20px' }}>
          {buscando ? '...' : 'Buscar'}
        </button>
      </div>

      {msg && <div className="alert alert-ok" style={{ marginBottom: 12 }}>{msg}</div>}

      {resultados.length > 0 && (
        <div className="card-static" style={{ overflow: 'hidden' }}>
          {resultados.map((t, i) => (
            <div key={t.dni} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: i < resultados.length - 1 ? '1px solid var(--fill)' : 'none' }}>
              <Avatar nombre={t.nombres_completos} foto={t.url_foto} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t.nombres_completos}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                  DNI: {t.dni} · Cargo max: {t.cargoMaxNombre}
                  {t.asig && ` · Actual: ${t.cargoActualNombre} · G${t.asig.id_grupo} T${t.asig.turno}`}
                </div>
              </div>
              <button onClick={() => abrirEditar(t)} className="act">
                <Icon name="edit" size={16} />Editar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal edición */}
      {editando && (
        <div role="presentation" className="modal-scrim" style={{ position: 'fixed', inset: 0, background: 'var(--scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div role="dialog" aria-modal="true" className="modal-material modal-panel" style={{ borderRadius: 16, padding: '24px', width: '100%', maxWidth: 460 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Editar — {editando.nombres_completos}</div>
              <button onClick={() => setEditando(null)} className="icon-btn" aria-label="Cerrar" style={{ margin: -10 }}><Icon name="close" size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              <div>
                <label style={lbl3}>Nombre completo</label>
                <input className="input" value={form.nombres_completos} onChange={e => setForm(f => ({...f, nombres_completos: e.target.value}))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl3}>Cargo máximo (perfil)</label>
                  <select className="input" value={form.cargo_max_id} onChange={e => setForm(f => ({...f, cargo_max_id: e.target.value}))}>
                    {cargos.map(c => <option key={c.id_cargo} value={c.id_cargo}>{c.nombre_oficial}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl3}>Cargo en este servicio</label>
                  <select className="input" value={form.id_cargo_actual} onChange={e => setForm(f => ({...f, id_cargo_actual: e.target.value}))}>
                    {cargos.map(c => <option key={c.id_cargo} value={c.id_cargo}>{c.nombre_oficial}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl3}>Turno</label>
                  <select className="input" value={form.turno} onChange={e => setForm(f => ({...f, turno: e.target.value}))}>
                    <option value="A">Turno A</option>
                    <option value="B">Turno B</option>
                  </select>
                </div>
                <div>
                  <label style={lbl3}>Grupo</label>
                  <input className="input" value={form.id_grupo} onChange={e => setForm(f => ({...f, id_grupo: e.target.value}))} placeholder="Ej: 1, MASTER" />
                </div>
              </div>
              <div>
                <label style={lbl3}>URL de la foto (opcional)</label>
                <input className="input" value={form.url_foto} onChange={e => setForm(f => ({...f, url_foto: e.target.value}))} placeholder="https://..." />
              </div>

              {msg && <div className="alert alert-ok">{msg}</div>}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn btn-ghost" onClick={() => setEditando(null)} style={{ flex: 1 }}>Cancelar</button>
                <button className="btn btn-primary" onClick={guardar} disabled={guardando} style={{ flex: 2 }}>
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* =========================================
   ADMIN — CATÁLOGO DE COMPETENCIAS
   ========================================= */
function AdminCompetencias() {
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(null)
  const [form, setForm]     = useState({})
  const [guardando, setGuardando] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [msg, setMsg]       = useState('')

  const categorias = ['CHANCADO','MOLIENDA','CLASIFICACION','TRANSPORTE','SOLDADURA','IZAJE','ESTRUCTURA','BOMBEO','METROLOGIA','SEGURIDAD','OTRO']
  const criticidades = [{ v: 1, l: 'Baja' }, { v: 2, l: 'Media' }, { v: 3, l: 'Alta' }]

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('catalogo_competencias').select('*').order('categoria').order('nombre')
    setItems(data || [])
    setLoading(false)
  }

  function abrirNuevo() {
    setForm({ nombre: '', categoria: 'CHANCADO', nivel_criticidad: 2, descripcion: '', equipo_asociado: '' })
    setEditando('nuevo'); setMsg('')
  }

  function abrirEditar(item) {
    setForm({ nombre: item.nombre, categoria: item.categoria, nivel_criticidad: item.nivel_criticidad, descripcion: item.descripcion || '', equipo_asociado: item.equipo_asociado || '' })
    setEditando(item); setMsg('')
  }

  async function guardar() {
    if (!form.nombre.trim()) { setMsg('El nombre es obligatorio'); return }
    setGuardando(true)
    const data = { nombre: form.nombre.trim(), categoria: form.categoria, nivel_criticidad: parseInt(form.nivel_criticidad), descripcion: form.descripcion.trim() || null, equipo_asociado: form.equipo_asociado.trim() || null }
    let error
    if (editando === 'nuevo') {
      ({ error } = await supabase.from('catalogo_competencias').insert(data))
    } else {
      ({ error } = await supabase.from('catalogo_competencias').update(data).eq('id_competencia', editando.id_competencia))
    }
    if (error) setMsg(error.message)
    else { setEditando(null); await load() }
    setGuardando(false)
  }

  async function eliminar(id) {
    await supabase.from('catalogo_competencias').delete().eq('id_competencia', id)
    setConfirmDel(null); await load()
  }

  const critColor = n => n === 3 ? 'var(--red)' : n === 2 ? 'var(--yellow)' : 'var(--green)'

  if (loading) return <p style={{ color: 'var(--text3)', fontSize: 13 }}>Cargando...</p>

  // Agrupar por categoría
  const grouped = {}
  items.forEach(i => { if (!grouped[i.categoria]) grouped[i.categoria] = []; grouped[i.categoria].push(i) })

  return (
    <div className="fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>{items.length} competencias en catálogo</div>
        <button className="btn btn-primary" onClick={abrirNuevo} style={{ width: 'auto' }}><Icon name="plus" size={18} />Nueva competencia</button>
      </div>

      {Object.entries(grouped).map(([cat, comps]) => (
        <div key={cat} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>{cat}</div>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{comps.length}</div>
          </div>
          <div className="card-static" style={{ overflow: 'hidden' }}>
            {comps.map((comp, i) => (
              <div key={comp.id_competencia} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < comps.length - 1 ? '1px solid var(--fill)' : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: critColor(comp.nivel_criticidad), flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{comp.nombre}</div>
                  {comp.equipo_asociado && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{comp.equipo_asociado}</div>}
                </div>
                <div style={{ fontSize: 11, color: critColor(comp.nivel_criticidad), fontWeight: 600 }}>
                  {criticidades.find(c => c.v === comp.nivel_criticidad)?.l}
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button onClick={() => abrirEditar(comp)} className="act act-icon" aria-label="Editar"><Icon name="edit" size={16} /></button>
                  <button onClick={() => setConfirmDel(comp)} className="act act-icon act-danger" aria-label="Eliminar"><Icon name="trash" size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Modal */}
      {editando && (
        <div role="presentation" className="modal-scrim" style={{ position: 'fixed', inset: 0, background: 'var(--scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div role="dialog" aria-modal="true" className="modal-material modal-panel" style={{ borderRadius: 16, padding: '24px', width: '100%', maxWidth: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{editando === 'nuevo' ? 'Nueva competencia' : 'Editar competencia'}</div>
              <button onClick={() => setEditando(null)} className="icon-btn" aria-label="Cerrar" style={{ margin: -10 }}><Icon name="close" size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              <div><label style={lbl3}>Nombre *</label><input className="input" value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value}))} placeholder="Ej: CAMBIO DE CONCAVOS EN CHANCADORA PRIMARIA" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl3}>Categoría</label>
                  <select className="input" value={form.categoria} onChange={e => setForm(f => ({...f, categoria: e.target.value}))}>
                    {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl3}>Criticidad</label>
                  <select className="input" value={form.nivel_criticidad} onChange={e => setForm(f => ({...f, nivel_criticidad: e.target.value}))}>
                    {criticidades.map(c => <option key={c.v} value={c.v}>{c.v} — {c.l}</option>)}
                  </select>
                </div>
              </div>
              <div><label style={lbl3}>Equipo asociado</label><input className="input" value={form.equipo_asociado} onChange={e => setForm(f => ({...f, equipo_asociado: e.target.value}))} placeholder="Ej: Chancadora HP400" /></div>
              <div><label style={lbl3}>Descripción</label><textarea className="input" value={form.descripcion} onChange={e => setForm(f => ({...f, descripcion: e.target.value}))} rows={2} placeholder="Descripción breve..." style={{ resize: 'vertical' }} /></div>
              {msg && <div className="alert alert-err">{msg}</div>}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn btn-ghost" onClick={() => setEditando(null)} style={{ flex: 1 }}>Cancelar</button>
                <button className="btn btn-primary" onClick={guardar} disabled={guardando} style={{ flex: 2 }}>{guardando ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDel && (
        <div role="presentation" className="modal-scrim" style={{ position: 'fixed', inset: 0, background: 'var(--scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div role="dialog" aria-modal="true" className="modal-material modal-panel" style={{ borderRadius: 16, padding: '24px', maxWidth: 320, textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>¿Eliminar competencia?</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}><strong style={{ color: 'var(--text)' }}>{confirmDel.nombre}</strong></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDel(null)} style={{ flex: 1 }}>Cancelar</button>
              <button onClick={() => eliminar(confirmDel.id_competencia)} className="btn btn-danger" style={{ flex: 1 }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* =========================================
   ADMIN — BITÁCORA EDITOR
   Ver y editar actividades críticas
   ========================================= */
function AdminBitacoraEditor({ svc, user }) {
  const [actividades, setActividades] = useState([])
  const [loading, setLoading]         = useState(true)
  const [editando, setEditando]       = useState(null)
  const [form, setForm]               = useState({})
  const [guardando, setGuardando]     = useState(false)
  const [confirmDel, setConfirmDel]   = useState(null)
  const [comps, setComps]             = useState([])

  useEffect(() => { loadAll() }, [svc])

  async function loadAll() {
    setLoading(true)
    const [{ data: acts }, { data: ct }] = await Promise.all([
      supabase.from('actividades_criticas').select('*, catalogo_competencias(nombre)').eq('id_servicio', svc.id_servicio).order('fecha_inicio', { ascending: false }),
      supabase.from('catalogo_competencias').select('id_competencia, nombre').order('nombre'),
    ])
    setActividades(acts || [])
    setComps(ct || [])
    setLoading(false)
  }

  function abrirEditar(act) {
    let meta = {}
    try { meta = JSON.parse(act.checklist_generado) } catch {}
    setForm({
      nombre_actividad:    act.nombre_actividad || '',
      id_competencia:      act.id_competencia || '',
      duracion_programada: act.duracion_programada || '',
      duracion_horas:      act.duracion_horas || '',
      estado:              act.estado || 'EN PLAZO',
      lecciones_aprendidas: act.lecciones_aprendidas || '',
      url_foto:            meta.url_foto || '',
      id_grupo:            meta.id_grupo || '',
    })
    setEditando(act)
  }

  async function guardar() {
    setGuardando(true)
    const meta = JSON.stringify({ url_foto: form.url_foto, id_grupo: form.id_grupo })
    const { error } = await supabase.from('actividades_criticas').update({
      nombre_actividad:    form.nombre_actividad.trim(),
      id_competencia:      parseInt(form.id_competencia) || null,
      duracion_programada: parseFloat(form.duracion_programada) || null,
      duracion_horas:      parseFloat(form.duracion_horas) || null,
      estado:              form.estado,
      lecciones_aprendidas: form.lecciones_aprendidas.trim() || null,
      checklist_generado:  meta,
    }).eq('id_actividad', editando.id_actividad)
    setGuardando(false)
    if (!error) { setEditando(null); await loadAll() }
  }

  async function eliminar(id) {
    await supabase.from('detalle_actividad').delete().eq('id_actividad', id)
    await supabase.from('actividades_criticas').delete().eq('id_actividad', id)
    setConfirmDel(null); await loadAll()
  }

  if (loading) return <p style={{ color: 'var(--text3)', fontSize: 13 }}>Cargando bitácora...</p>

  return (
    <div className="fade">
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
        {actividades.length} trabajos críticos registrados en este servicio
      </div>

      {actividades.length === 0 ? (
        <div className="card-static" style={{ padding: '36px 20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>No hay actividades registradas aún. Regístralas desde la Bitácora.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {actividades.map(act => {
            let meta = {}
            try { meta = JSON.parse(act.checklist_generado) } catch {}
            return (
              <div key={act.id_actividad} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--fill)', borderRadius: 12 }}>
                {meta.url_foto ? (
                  <img src={meta.url_foto} alt="" style={{ width: 56, height: 56, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: 8, background: 'var(--fill)', color: 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="wrench" size={24} /></div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.nombre_actividad}</div>
                  <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 1 }}>{act.catalogo_competencias?.nombre}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                    Prog: {act.duracion_programada || '—'}h · Real: {act.duracion_horas || '—'}h · G{meta.id_grupo}
                    <span style={{ marginLeft: 8, color: act.estado === 'EN PLAZO' ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{act.estado}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => abrirEditar(act)} className="act"><Icon name="edit" size={16} />Editar</button>
                  <button onClick={() => setConfirmDel(act)} className="act act-icon act-danger" aria-label="Eliminar"><Icon name="trash" size={16} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal edición */}
      {editando && (
        <div role="presentation" className="modal-scrim" style={{ position: 'fixed', inset: 0, background: 'var(--scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div role="dialog" aria-modal="true" className="modal-material modal-panel" style={{ borderRadius: 16, padding: '24px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Editar actividad</div>
              <button onClick={() => setEditando(null)} className="icon-btn" aria-label="Cerrar" style={{ margin: -10 }}><Icon name="close" size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              <div><label style={lbl3}>Descripción del trabajo</label><input className="input" value={form.nombre_actividad} onChange={e => setForm(f => ({...f, nombre_actividad: e.target.value}))} /></div>
              <div>
                <label style={lbl3}>Competencia / tipo de trabajo</label>
                <select className="input" value={form.id_competencia} onChange={e => setForm(f => ({...f, id_competencia: e.target.value}))}>
                  <option value="">— Sin competencia —</option>
                  {comps.map(c => <option key={c.id_competencia} value={c.id_competencia}>{c.nombre}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div><label style={lbl3}>H. programadas</label><input className="input" type="number" value={form.duracion_programada} onChange={e => setForm(f => ({...f, duracion_programada: e.target.value}))} /></div>
                <div><label style={lbl3}>H. reales</label><input className="input" type="number" value={form.duracion_horas} onChange={e => setForm(f => ({...f, duracion_horas: e.target.value}))} /></div>
                <div>
                  <label style={lbl3}>Estado</label>
                  <select className="input" value={form.estado} onChange={e => setForm(f => ({...f, estado: e.target.value}))}>
                    <option value="EN PLAZO">EN PLAZO</option>
                    <option value="RETRASO">RETRASO</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={lbl3}>Grupo asignado</label><input className="input" value={form.id_grupo} onChange={e => setForm(f => ({...f, id_grupo: e.target.value}))} placeholder="Ej: 1" /></div>
                <div>
                  <label style={lbl3}>URL foto</label>
                  <input className="input" value={form.url_foto} onChange={e => setForm(f => ({...f, url_foto: e.target.value}))} placeholder="https://..." />
                </div>
              </div>
              <div><label style={lbl3}>Lecciones aprendidas</label><textarea className="input" value={form.lecciones_aprendidas} onChange={e => setForm(f => ({...f, lecciones_aprendidas: e.target.value}))} rows={3} style={{ resize: 'vertical' }} /></div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn btn-ghost" onClick={() => setEditando(null)} style={{ flex: 1 }}>Cancelar</button>
                <button className="btn btn-primary" onClick={guardar} disabled={guardando} style={{ flex: 2 }}>{guardando ? 'Guardando...' : 'Guardar cambios'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDel && (
        <div role="presentation" className="modal-scrim" style={{ position: 'fixed', inset: 0, background: 'var(--scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div role="dialog" aria-modal="true" className="modal-material modal-panel" style={{ borderRadius: 16, padding: '24px', maxWidth: 320, textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>¿Eliminar esta actividad?</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 6 }}><strong style={{ color: 'var(--text)' }}>{confirmDel.nombre_actividad}</strong></div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>Se eliminará también todo el detalle asociado.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDel(null)} style={{ flex: 1 }}>Cancelar</button>
              <button onClick={() => eliminar(confirmDel.id_actividad)} className="btn btn-danger" style={{ flex: 1 }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const lbl3 = { fontSize: 13, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }


/* =========================================
   ADMIN — ANÁLISIS DE EVALUADORES
   Detecta evaluadores permisivos/estrictos
   ========================================= */
function AdminEvaluadores({ svc }) {
  const [datos, setDatos]   = useState([])
  const [loading, setLoading] = useState(true)
  const [sel, setSel]       = useState(null)   // evaluador seleccionado para detalle
  const [detalle, setDetalle] = useState([])

  const r2 = n => Math.round(n * 100) / 100
  const avg = arr => arr.length ? arr.reduce((a,b) => a+b, 0) / arr.length : null
  const sc = v => !v && v!==0 ? 'var(--text3)' : v>=3.5 ? 'var(--green)' : v>=2.0 ? 'var(--yellow)' : 'var(--red)'

  useEffect(() => { load() }, [svc])

  async function load() {
    setLoading(true)
    // Traer todas las evaluaciones del servicio con el evaluador
    const { data: evals } = await supabase
      .from('historial_evaluaciones')
      .select('id_evaluacion, dni_evaluador, promedio, nota_1, nota_2, nota_3, nota_4, fecha_hora, cargo_momento')
      .eq('id_servicio', svc.id_servicio)
      .order('fecha_hora', { ascending: false })

    if (!evals?.length) { setDatos([]); setLoading(false); return }

    // Agrupar por evaluador
    const grupos = {}
    evals.forEach(e => {
      const key = e.dni_evaluador || 'SIN_IDENTIFICAR'
      if (!grupos[key]) grupos[key] = { dni: e.dni_evaluador, evs: [] }
      grupos[key].evs.push(e)
    })

    // Obtener nombres — buscar por DNI en trabajadores y en usuarios_sistema
    const dnis = [...new Set(evals.map(e => e.dni_evaluador).filter(Boolean))]
    const [{ data: usersData }, { data: trabsData }] = await Promise.all([
      dnis.length ? supabase.from('usuarios_sistema').select('username, dni_asociado').in('dni_asociado', dnis) : { data: [] },
      dnis.length ? supabase.from('trabajadores').select('dni, nombres_completos').in('dni', dnis) : { data: [] },
    ])

    const nombresMap = Object.fromEntries((trabsData || []).map(t => [t.dni, t.nombres_completos]))
    const userMap = Object.fromEntries((usersData || []).map(u => [u.dni_asociado, u.username]))

    // Promedio general del servicio para comparar
    const promsGlobal = evals.map(e => parseFloat(e.promedio))
    const globalAvg = r2(avg(promsGlobal))

    // Construir estadísticas por evaluador
    const stats = Object.entries(grupos).map(([key, grupo]) => {
      const dni = grupo.dni
      const evs = grupo.evs
      const proms = evs.map(e => parseFloat(e.promedio))
      const notaMedia = r2(avg(proms))
      const desviacion = r2(Math.sqrt(avg(proms.map(p => Math.pow(p - notaMedia, 2)))) || 0)
      const verdesPorc = Math.round(proms.filter(p => p >= 3.5).length / proms.length * 100)
      const rojaPorc   = Math.round(proms.filter(p => p < 2.0).length / proms.length * 100)
      const diff = r2(notaMedia - globalAvg)

      // Clasificación del perfil evaluador
      let perfil, perfilColor, perfilIcon
      if (diff > 0.4) {
        perfil = 'Muy permisivo'; perfilColor = 'var(--accent)'; perfilIcon = '😊'
      } else if (diff > 0.15) {
        perfil = 'Permisivo'; perfilColor = 'var(--yellow)'; perfilIcon = '🙂'
      } else if (diff < -0.4) {
        perfil = 'Muy estricto'; perfilColor = 'var(--red)'; perfilIcon = '😤'
      } else if (diff < -0.15) {
        perfil = 'Estricto'; perfilColor = 'var(--red)'; perfilIcon = '🤨'
      } else {
        perfil = 'Calibrado'; perfilColor = 'var(--green)'; perfilIcon = '✅'
      }

      return {
        dni: dni || 'SIN_IDENTIFICAR',
        username: dni ? (userMap[dni] || '—') : 'Sistema',
        nombre: dni ? (nombresMap[dni] || dni) : 'Evaluador sin DNI vinculado',
        total: evs.length, notaMedia, desviacion,
        verdesPorc, rojaPorc, diff, perfil, perfilColor, perfilIcon, evs,
      }
    }).sort((a, b) => b.diff - a.diff)

    setDatos(stats)
    setLoading(false)
  }

  function abrirDetalle(ev) {
    setSel(ev)
    // Mostrar sus últimas 10 evaluaciones
    const detalles = ev.evs.slice(0, 10).map(e => ({
      ...e,
      promedio: parseFloat(e.promedio),
    }))
    setDetalle(detalles)
  }

  if (loading) return <p style={{ color: 'var(--text3)', fontSize: 13 }}>Analizando evaluadores...</p>

  if (datos.length === 0) return (
    <div className="card-static" style={{ padding: '36px 20px', textAlign: 'center' }}>
      <p style={{ color: 'var(--text3)', fontSize: 13 }}>No hay evaluaciones registradas aún en este servicio.</p>
    </div>
  )

  // Calcular promedio global para referencia
  const globalProm = datos.length ? r2(datos.reduce((a, d) => a + d.notaMedia * d.total, 0) / datos.reduce((a, d) => a + d.total, 0)) : 0

  return (
    <div className="fade">
      {/* Header con referencia */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, padding: '12px 16px', background: 'var(--fill)', borderRadius: 12 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Promedio global servicio</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: sc(globalProm), fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>{globalProm}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>línea base para comparar</div>
        </div>
        <div style={{ flex: 1, fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
          Los evaluadores con diferencia <span style={{ color: 'var(--accent)', fontWeight: 600 }}>mayor a +0.15</span> tienden a calificar por encima del promedio (<em>permisivos</em>). Los que tienen <span style={{ color: 'var(--red)', fontWeight: 600 }}>menor a -0.15</span> califican más bajo (<em>estrictos</em>). El rango calibrado está entre ±0.15.
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Evaluadores</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent2)', fontVariantNumeric: 'tabular-nums' }}>{datos.length}</div>
        </div>
      </div>

      {/* Lista evaluadores */}
      <div className="card-static" style={{ overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px 70px 70px 110px', gap: 8, padding: '8px 16px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>
          <div>Evaluador</div>
          <div style={{ textAlign: 'center' }}>Evaluaciones</div>
          <div style={{ textAlign: 'center' }}>Media</div>
          <div style={{ textAlign: 'center' }}>vs global</div>
          <div style={{ textAlign: 'center' }}>% verde</div>
          <div style={{ textAlign: 'center' }}>Perfil</div>
        </div>
        {datos.map((ev, i) => (
          <div key={ev.dni}
            onClick={() => abrirDetalle(ev)}
            style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px 70px 70px 110px', gap: 8, padding: '11px 16px', alignItems: 'center', borderBottom: i < datos.length-1 ? '1px solid var(--fill)' : 'none', cursor: 'pointer', background: sel?.dni === ev.dni ? 'var(--fill)' : 'transparent', transition: 'background-color var(--dur-quick) ease-out' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.nombre.split(' ').slice(0,3).join(' ')}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{ev.username}</div>
            </div>
            <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--accent2)' }}>{ev.total}</div>
            <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: sc(ev.notaMedia), fontVariantNumeric: 'tabular-nums' }}>{ev.notaMedia}</div>
            <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: ev.diff > 0 ? 'var(--accent)' : ev.diff < 0 ? 'var(--red)' : 'var(--text3)' }}>
              {ev.diff > 0 ? '+' : ''}{ev.diff}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>{ev.verdesPorc}%</div>
              {ev.rojaPorc > 0 && <div style={{ fontSize: 11, color: 'var(--red)' }}>{ev.rojaPorc}% riesgo</div>}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: ev.perfilColor, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                <Icon name={ev.perfil === 'Calibrado' ? 'check' : 'scale'} size={14} />{ev.perfil}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detalle del evaluador seleccionado */}
      {sel && (
        <div className="card-static fade" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{sel.nombre}</div>
              <div style={{ fontSize: 13, color: sel.perfilColor, fontWeight: 600 }}>{sel.perfil} · Promedio: {sel.notaMedia} · σ {sel.desviacion}</div>
            </div>
            <button onClick={() => setSel(null)} className="icon-btn" aria-label="Cerrar" style={{ margin: -10 }}><Icon name="close" size={20} /></button>
          </div>

          {/* Barra de distribución */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500, marginBottom: 6 }}>Distribución de notas</div>
            <div style={{ display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden', gap: 1 }}>
              {[
                { label: 'Riesgo <2.0', val: sel.evs.filter(e=>parseFloat(e.promedio)<2.0).length, color: 'var(--red)' },
                { label: 'Aceptable 2.0-3.5', val: sel.evs.filter(e=>parseFloat(e.promedio)>=2.0&&parseFloat(e.promedio)<3.5).length, color: 'var(--yellow)' },
                { label: 'Óptimo ≥3.5', val: sel.evs.filter(e=>parseFloat(e.promedio)>=3.5).length, color: 'var(--green)' },
              ].map(b => b.val > 0 && (
                <div key={b.label} title={`${b.label}: ${b.val}`} style={{ flex: b.val, background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--on-accent)' }}>
                  {b.val > 0 && b.val}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 5 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text2)' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)' }} />Riesgo: {sel.evs.filter(e=>parseFloat(e.promedio)<2.0).length}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text2)' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--yellow)' }} />Aceptable: {sel.evs.filter(e=>parseFloat(e.promedio)>=2.0&&parseFloat(e.promedio)<3.5).length}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text2)' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />Óptimo: {sel.evs.filter(e=>parseFloat(e.promedio)>=3.5).length}</span>
            </div>
          </div>

          {/* Últimas evaluaciones */}
          <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500, marginBottom: 8 }}>ÚLTIMAS {detalle.length} EVALUACIONES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {detalle.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', background: 'var(--fill)', borderRadius: 6 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: sc(e.promedio), fontVariantNumeric: 'tabular-nums', width: 36 }}>{e.promedio}</div>
                <div style={{ flex: 1, fontSize: 13, color: 'var(--text2)' }}>{e.cargo_momento || '—'}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[e.nota_1, e.nota_2, e.nota_3, e.nota_4].map((n, ni) => (
                    <div key={ni} style={{ width: 20, height: 20, borderRadius: 6, background: n>=3.5?'color-mix(in srgb, var(--green) 25%, transparent)':n>=2.0?'color-mix(in srgb, var(--yellow) 25%, transparent)':'color-mix(in srgb, var(--red) 25%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: n>=3.5?'var(--green)':n>=2.0?'var(--yellow)':'var(--red)' }}>{n}</div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{e.fecha_hora ? new Date(e.fecha_hora).toLocaleDateString('es-PE',{day:'2-digit',month:'short'}) : '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

