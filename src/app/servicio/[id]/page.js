'use client'
import { useState, useEffect, use, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '@/lib/supabase'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <p style={{ color: 'var(--text3)', fontSize: 13 }}>Cargando...</p>
    </div>
  )

  // Nivel 3 no asignado — bloqueo con mensaje
  if (asigCheck === false) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ fontSize: 48 }}>🔒</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>No participas en este servicio</div>
      <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', maxWidth: 320 }}>
        No estás asignado a <strong style={{ color: 'var(--text2)' }}>{svc.nombre_descriptivo}</strong>.<br />
        Contacta a tu coordinador o planner si crees que es un error.
      </div>
      <button className="btn btn-ghost" onClick={() => router.push('/servicios')} style={{ marginTop: 8 }}>
        ← Volver a mis servicios
      </button>
    </div>
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

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Overlay oscuro móvil */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 40 }} />
      )}

      {/* ── Sidebar ── */}
      <aside style={{
        width: 210, background: 'rgba(5,5,7,0.99)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        height: '100vh', zIndex: 50,
        // Móvil: posición fija, fuera de pantalla por defecto
        position: typeof window !== 'undefined' && window.innerWidth <= 768 ? 'fixed' : 'sticky',
        top: 0,
        transform: typeof window !== 'undefined' && window.innerWidth <= 768 && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'transform 0.28s ease',
      }}>
        <div style={{ padding: '12px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: -6, borderRadius: 12, background: 'radial-gradient(ellipse, rgba(255,255,255,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ background: 'rgba(255,255,255,0.91)', borderRadius: 8, padding: '5px 12px', boxShadow: '0 0 0 1px rgba(255,255,255,0.13), 0 0 14px 5px rgba(255,255,255,0.06), 0 0 30px 10px rgba(255,255,255,0.025)' }}>
                <img src="/logo_prodise.png" alt="PRODISE" style={{ height: 26, objectFit: 'contain', display: 'block' }} />
              </div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="close-sidebar-btn" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 20, cursor: 'pointer', padding: '0 4px', lineHeight: 1, display: 'none' }}>×</button>
        </div>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{user.nombre}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Nivel {n}</div>
        </div>
        <div style={{ margin: 8, padding: '9px 11px', borderRadius: 7, background: 'rgba(230,126,34,0.04)', border: '1px solid rgba(230,126,34,0.08)' }}>
          <div style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 600, letterSpacing: 0.3 }}>SERVICIO ACTIVO</div>
          <div style={{ fontSize: 10, fontWeight: 600, marginTop: 2, lineHeight: 1.3 }}>{svc.nombre_descriptivo}</div>
          <span className={`badge ${svc.tipo === 'PDP' ? 'b-pdp' : 'b-pro'}`} style={{ marginTop: 4 }}>{svc.tipo}</span>
        </div>
        <nav style={{ flex: 1, padding: '6px 6px', overflowY: 'auto' }}>
          {nav.map(x => (
            <button key={x.id} onClick={() => { if (!x.disabled) { setSec(x.id); setSidebarOpen(false) } }} style={{
              display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '7px 10px',
              borderRadius: 6, border: 'none', fontSize: 12,
              cursor: x.disabled ? 'not-allowed' : 'pointer',
              opacity: x.disabled ? 0.35 : 1,
              background: sec === x.id ? 'rgba(230,126,34,0.08)' : 'none',
              color: sec === x.id ? 'var(--accent)' : 'rgba(255,255,255,0.55)',
              fontWeight: sec === x.id ? 600 : 400, fontFamily: 'Inter', textAlign: 'left', marginBottom: 1,
            }}>
              <span style={{ fontSize: 13, width: 18, textAlign: 'center' }}>{x.icon}</span>
              <span style={{ flex: 1 }}>{x.label}</span>
              {x.disabled && <span style={{ fontSize: 10, color: 'var(--text3)' }}>🔒</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding: 8, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
          <button className="btn btn-ghost" style={{ width: '100%', fontSize: 10 }} onClick={() => router.push('/servicios')}>Cambiar servicio</button>
          <button className="btn btn-ghost" style={{ width: '100%', fontSize: 10 }} onClick={() => { logout(); router.push('/') }}>Cerrar sesión</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: '22px 26px', background: 'var(--bg)', overflowY: 'auto', height: '100vh', position: 'relative' }}>
        {/* Botón hamburguesa - solo visible en móvil via CSS */}
        <button onClick={() => setSidebarOpen(true)} className="hamburger-btn" style={{
          position: 'fixed', top: 10, left: 10, zIndex: 39,
          background: 'rgba(5,5,7,0.95)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '8px 11px', cursor: 'pointer', color: 'var(--text)',
          fontSize: 16, lineHeight: 1, display: 'none',
        }}>☰</button>
        {sec === 'evaluar'   && <Evaluar    svc={svc} user={user} />}
        {sec === 'historial' && <Historial  svc={svc} user={user} />}
        {sec === 'dashboard' && <Dashboard  svc={svc} user={user} />}
        {sec === 'admin'     && <AdminPanel svc={svc} user={user} />}
        {sec === 'ranking'   && <Ranking svc={svc} user={user} />}
        {sec === 'perfiles'  && <Perfiles svc={svc} user={user} />}
        {sec === 'buscador'  && <Buscador svc={svc} user={user} />}
        {sec === 'predictor' && <Predictor svc={svc} user={user} />}
        {sec === 'bitacora'  && <Bitacora svc={svc} user={user} />}
      </main>
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
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>Evaluar Personal</h2>
      <p style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 18 }}>{svc.nombre_descriptivo}</p>
      {msg && <div className="alert alert-ok" style={{ marginBottom: 14 }}>{msg}</div>}
      {!sel ? (
        list.length === 0 ? (
          <div className="card-static" style={{ padding: '36px 20px', textAlign: 'center' }}>
            <p style={{ fontWeight: 600, fontSize: 14 }}>Todo evaluado</p>
            <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 3 }}>No hay personal pendiente de evaluación</p>
          </div>
        ) : (
          <>
            <input className="input" placeholder="Buscar por nombre..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320, marginBottom: 12 }} />
            <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10 }}>Pendientes: {list.length}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {list.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase())).map(p => (
                <div key={p.id_asignacion} onClick={() => pick(p)} className="card" style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(230,126,34,0.06)', border: '2px solid rgba(230,126,34,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent)', flexShrink: 0, overflow: 'hidden' }}>
                    {p.foto ? <img src={p.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(p.nombre)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nombre}</div>
                    <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 500 }}>{p.cargo_nombre}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 10, color: 'var(--text3)' }}>
                    <div>G{p.id_grupo}</div><div>T{p.turno}</div>
                  </div>
                  <span style={{ color: 'var(--text3)', fontSize: 14 }}>›</span>
                </div>
              ))}
            </div>
          </>
        )
      ) : (
        <div className="fade">
          <button className="btn btn-ghost" onClick={() => { setSel(null); setPregs([]) }} style={{ marginBottom: 16 }}>← Volver a la lista</button>
          <div className="card-static" style={{ padding: '16px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 62, height: 62, borderRadius: '50%', background: 'rgba(230,126,34,0.06)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'var(--accent)', flexShrink: 0, overflow: 'hidden' }}>
              {sel.foto
                ? <img src={sel.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display='none' }} />
                : getInitials(sel.nombre)
              }
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{sel.nombre}</div>
              <div style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 12 }}>{sel.cargo_nombre}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>Grupo {sel.id_grupo} · Turno {sel.turno}</div>
            </div>
          </div>
          {pregs.length === 0 ? (
            <div className="alert alert-err">No hay kit de preguntas para {sel.cargo_nombre} en {svc.tipo}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {pregs.map((p, i) => (
                <div key={p.id_preg} className="card-static" style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{i + 1}. {p.dimension}</span>
                    <span className="badge b-pdp">{(parseFloat(p.peso) * 100).toFixed(0)}%</span>
                  </div>
                  {[p.nivel_1, p.nivel_2, p.nivel_3, p.nivel_4].map((niv, ni) => (
                    <label key={ni} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', borderRadius: 7,
                      cursor: 'pointer', marginBottom: 3,
                      border: resp[i] === ni + 1 ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: resp[i] === ni + 1 ? 'rgba(230,126,34,0.04)' : 'transparent',
                    }}>
                      <input type="radio" name={`q${i}`} checked={resp[i] === ni + 1} onChange={() => setResp({ ...resp, [i]: ni + 1 })} style={{ marginTop: 3, accentColor: 'var(--accent)' }} />
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 600, color: resp[i] === ni + 1 ? 'var(--accent)' : 'var(--text3)' }}>Nivel {ni + 1}</span>
                        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginTop: 1 }}>{niv}</div>
                      </div>
                    </label>
                  ))}
                </div>
              ))}
              <div className="card-static" style={{ padding: '16px 18px' }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Observaciones</label>
                <textarea className="input" placeholder="Mínimo 20 caracteres. Describe el desempeño del trabajador..." value={comment} onChange={e => setComment(e.target.value)} rows={4} style={{ resize: 'vertical' }} />
                <div style={{ fontSize: 10, marginTop: 3, color: comment.length >= 20 ? 'var(--green)' : 'var(--text3)' }}>{comment.length}/20 mínimo</div>
              </div>
              <button className="btn btn-primary" onClick={save} disabled={saving} style={{ maxWidth: 260, fontSize: 13 }}>{saving ? 'Guardando...' : 'Guardar evaluación'}</button>
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
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>Historial de Evaluaciones</h2>
      <p style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 14 }}>{svc.nombre_descriptivo} · {data.length} evaluaciones</p>

      {data.length > 0 && (
        <input className="input" placeholder="Buscar por nombre de trabajador, evaluador o cargo..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 450, marginBottom: 14 }} />
      )}

      {data.length === 0 ? (
        <div className="card-static" style={{ padding: '36px 20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text3)' }}>No hay evaluaciones registradas</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-static" style={{ padding: '24px 20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>Sin resultados para "{search}"</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(h => (
            <div key={h.id_eval} className="card-static" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{h.nombre_trabajador}</div>
                  <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>{h.cargo_momento} · G{h.grupo_momento} · T{h.turno_momento}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: h.promedio >= 3.5 ? 'var(--green)' : h.promedio >= 2.0 ? 'var(--yellow)' : 'var(--red)' }}>{h.promedio}</div>
                  <div style={{ fontSize: 9, color: 'var(--text3)' }}>{new Date(h.fecha_hora).toLocaleDateString('es-PE')}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '5px 10px', background: 'rgba(91,164,207,0.04)', borderRadius: 5 }}>
                <div style={{ fontSize: 10, color: 'var(--text2)' }}>Evaluado por: <span style={{ fontWeight: 600, color: 'var(--accent2)' }}>{h.nombre_evaluador}</span></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 8 }}>
                {[{ l: 'Seguridad', v: h.nota_1 }, { l: 'Calidad', v: h.nota_2 }, { l: 'Actitud', v: h.nota_3 }, { l: 'Precisión', v: h.nota_4 }].map((d, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '6px 4px', background: 'rgba(255,255,255,0.02)', borderRadius: 5, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: d.v >= 3.5 ? 'var(--green)' : d.v >= 2.0 ? 'var(--yellow)' : 'var(--red)' }}>{d.v}</div>
                    <div style={{ fontSize: 8, color: 'var(--text3)', marginTop: 1 }}>{d.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, padding: '8px 12px', background: 'rgba(255,255,255,0.01)', borderRadius: 6, borderLeft: '2px solid rgba(91,164,207,0.2)' }}>
                <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600, marginBottom: 2 }}>COMENTARIO DEL EVALUADOR</div>
                {h.comentarios}
              </div>
            </div>
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

  // GSAP Animations
  useGSAP(() => {
    if (!loading) {
      gsap.from(".card-static", {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out"
      });
    }
  }, [loading]);

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>Dashboard</h2>
          <p style={{ color: 'var(--text3)', fontSize: 12 }}>{svc.nombre_descriptivo}</p>
        </div>
        <button className="btn btn-ghost" onClick={loadAll} style={{ fontSize: 11 }}>↻ Actualizar</button>
      </div>

      {/* Tabs dashboard */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: '1px solid var(--border)' }}>
        {[
          { id: 'resumen', label: 'Resumen' },
          { id: 'alertas', label: `Alertas ${alertas.length > 0 ? `(${alertas.length})` : ''}`, badge: alertas.length > 0 },
        ].map(t => (
          <button key={t.id} onClick={() => setDashTab(t.id)} style={{
            padding: '7px 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontFamily: 'Inter', fontWeight: dashTab === t.id ? 600 : 400,
            color: dashTab === t.id ? (t.badge ? 'var(--red)' : 'var(--accent)') : 'var(--text3)',
            borderBottom: dashTab === t.id ? `2px solid ${t.badge ? 'var(--red)' : 'var(--accent)'}` : '2px solid transparent',
            marginBottom: -1, transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {t.id === 'alertas' && alertas.length > 0 && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} />}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Alertas */}
      {dashTab === 'alertas' && (
        <div className="fade">
          {alertas.length === 0 ? (
            <div className="card-static" style={{ padding: '36px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>✓</div>
              <p style={{ color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>Sin alertas activas</p>
              <p style={{ color: 'var(--text3)', fontSize: 11, marginTop: 4 }}>Todos los indicadores están dentro de los rangos normales</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alertas.map((a, i) => (
                <div key={i} style={{
                  padding: '12px 16px', borderRadius: 9, fontSize: 12, display: 'flex', alignItems: 'center', gap: 10,
                  background: a.tipo === 'baja' ? 'rgba(192,57,43,0.07)' : 'rgba(212,160,23,0.07)',
                  border: `1px solid ${a.tipo === 'baja' ? 'rgba(192,57,43,0.2)' : 'rgba(212,160,23,0.2)'}`,
                  color: a.tipo === 'baja' ? '#E8A09A' : '#D4A017',
                }}>
                  <span style={{ fontSize: 16 }}>{a.tipo === 'baja' ? '⚠' : '◎'}</span>
                  <div style={{ flex: 1 }}>
                    {a.tipo === 'baja'
                      ? <><strong style={{ color: 'var(--text)' }}>{a.nombre}</strong> <span style={{ color: 'var(--text3)' }}>·</span> {a.cargo} <span style={{ color: 'var(--red)', fontWeight: 600 }}>· {a.msg}</span></>
                      : a.msg
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {dashTab === 'resumen' && <>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
        <KpiCard label="Personal Total" value={kpi.total} sub="asignados al servicio" color="var(--accent2)" />
        <KpiCard label="Evaluados" value={`${kpi.evaluados}/${kpi.total}`} sub={`${kpi.pctEval}% completado`} color={kpi.pctEval >= 80 ? 'var(--green)' : kpi.pctEval >= 50 ? 'var(--yellow)' : 'var(--red)'} />
        <KpiCard label="Nota Promedio" value={kpi.avgGeneral ?? '—'} sub="de 1 a 4" color={scoreColor(kpi.avgGeneral)} />
        <KpiCard label="Sin Evaluar" value={kpi.sinEval} sub="pendientes" color={kpi.sinEval === 0 ? 'var(--green)' : 'var(--yellow)'} />
      </div>

      <div className="card-static" style={{ padding: '14px 18px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Progreso de evaluación</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: kpi.pctEval >= 80 ? 'var(--green)' : kpi.pctEval >= 50 ? 'var(--yellow)' : 'var(--red)' }}>{kpi.pctEval}%</span>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${kpi.pctEval}%`, borderRadius: 4, transition: 'width 0.8s ease',
            background: kpi.pctEval >= 80 ? 'var(--green)' : kpi.pctEval >= 50 ? 'var(--yellow)' : 'var(--red)',
          }} />
        </div>
      </div>

      {/* ── GRID PRINCIPAL: dimensiones + cargo + grupos ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>

        {/* Columna 1: Promedio por dimensión */}
        {byDim.length > 0 && (
          <div className="card-static" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 0.5, marginBottom: 14, textTransform: 'uppercase' }}>Por Dimensión</div>
            {byDim.map(d => (
              <div key={d.dim} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: 'var(--text2)' }}>{d.dim}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: scoreColor(d.avg), fontFamily: 'monospace' }}>{d.avg ?? '—'}</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${d.avg ? (parseFloat(d.avg) / 4) * 100 : 0}%`, background: scoreColor(d.avg), transition: 'width 0.8s ease' }} />
                </div>
              </div>
            ))}
            {/* Nota promedio por cargo — debajo de dimensiones */}
            {byCargo.length > 0 && (
              <>
                <div style={{ height: 1, background: 'var(--border)', margin: '14px 0 12px' }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' }}>Por Cargo</div>
                {byCargo.slice(0, 8).map((cargo, i) => (
                  <div key={cargo.cargo} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>{cargo.cargo}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: cargo.promedio ? scoreColor(cargo.promedio) : 'var(--text3)', fontFamily: 'monospace', flexShrink: 0 }}>
                        {cargo.promedio ?? '—'}
                      </span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 2, width: cargo.promedio ? `${(parseFloat(cargo.promedio) / 4) * 100}%` : '0%', background: cargo.promedio ? scoreColor(cargo.promedio) : 'transparent', transition: 'width 0.8s ease' }} />
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 1 }}>{cargo.evaluados} eval.</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Columna 2 & 3: Estado por grupo — expandido */}
        {byGrupo.length > 0 && (
          <div className="card-static" style={{ padding: '16px 18px', gridColumn: 'span 2' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 0.5, marginBottom: 14, textTransform: 'uppercase' }}>Estado por Grupo</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px 20px' }}>
              {byGrupo.map(g => (
                <div key={g.grupo}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: g.promedio ? 600 : 400 }}>Grupo {g.grupo}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 9, color: 'var(--text3)' }}>{g.evaluados}/{g.total}</span>
                      {g.promedio && <span style={{ fontSize: 13, fontWeight: 800, color: scoreColor(g.promedio), fontFamily: 'monospace' }}>{g.promedio}</span>}
                    </div>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, width: `${g.pct}%`, background: g.pct >= 80 ? 'var(--green)' : g.pct >= 50 ? 'var(--accent)' : 'var(--text3)', transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {actividades.length > 0 && (
        <div className="card-static" style={{ padding: '16px 18px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Trabajos y Actividades Recientes</span>
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>Vinculados a cuadrillas</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {actividades.map(a => (
              <div key={a.id_actividad} style={{ display: 'flex', gap: 12, background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 8, border: '1px solid var(--border)' }}>
                {a.meta?.url_foto ? (
                  <img src={a.meta.url_foto} alt="Actividad" style={{ width: 60, height: 60, borderRadius: 6, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 60, height: 60, borderRadius: 6, background: 'rgba(230,126,34,0.1)', border: '1px solid rgba(230,126,34,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🔧</div>
                )}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.nombre_actividad}</div>
                  <div style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 600, marginTop: 2 }}>{a.catalogo_competencias?.nombre}</div>
                  <div style={{ display: 'flex', gap: 10, fontSize: 9, color: 'var(--text3)', marginTop: 4, fontFamily: 'monospace' }}>
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

}

      <div style={{ display: 'grid', gridTemplateColumns: kpi.topScorer ? '1fr 200px' : '1fr', gap: 14 }}>
        {recent.length > 0 && (
          <div className="card-static" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Últimas evaluaciones</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recent.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <Avatar nombre={r.nombre} foto={r.foto} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.nombre}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)' }}>{r.cargo}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: scoreColor(r.nota) }}>{r.nota}</div>
                    <div style={{ fontSize: 9, color: 'var(--text3)' }}>{new Date(r.fecha).toLocaleDateString('es-PE')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {kpi.topScorer && (
          <div className="card-static" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', letterSpacing: 1 }}>TOP SCORER</div>
            <Avatar nombre={kpi.topScorer.nombre} foto={kpi.topScorer.foto} size={56} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>{kpi.topScorer.nombre}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{kpi.topScorer.cargo}</div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--green)', lineHeight: 1 }}>{kpi.topScorer.nota}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>de 4.0</div>
          </div>
        )}
      </div>

      </>
      }
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function KpiCard({ label, value, sub, color }) {
  return (
    <div className="card-static" style={{ padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text3)' }}>{sub}</div>
    </div>
  )
}

function Avatar({ nombre, foto, size = 36 }) {
  const initials = nombre ? nombre.split(' ').slice(0, 2).map(p => p[0]).join('') : '?'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
      background: 'rgba(230,126,34,0.08)', border: '1.5px solid rgba(230,126,34,0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.3, fontWeight: 700, color: 'var(--accent)',
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
    { id: 'personal',     label: 'Editar Personal' },
    { id: 'carga',        label: 'Carga Masiva' },
    { id: 'competencias', label: 'Competencias' },
    { id: 'bitacora',     label: 'Bitácora' },
    { id: 'evaluadores',  label: 'Análisis Evaluadores' },
    { id: 'usuarios',     label: 'Usuarios' },
    { id: 'gestion',      label: 'Asignaciones' },
    { id: 'servicios',    label: 'Servicios' },
  ]

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>Panel de Administración</h2>
      <p style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 18 }}>Control central para {svc.nombre_descriptivo}</p>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontFamily: 'Inter', fontWeight: tab === t.id ? 600 : 400,
            color: tab === t.id ? 'var(--accent)' : 'var(--text3)',
            borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -1, transition: 'color 0.2s',
          }}>{t.label}</button>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
        <div className="card-static" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>{stats.total}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginTop: 8 }}>TÉCNICOS EN EL SERVICIO</div>
        </div>
        <div className="card-static" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>DISTRIBUCIÓN POR TURNO</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
             <div><div style={{ fontSize: 24, fontWeight: 800 }}>{stats.turnos.A}</div><div style={{ fontSize: 10, color: 'var(--text3)' }}>Turno A</div></div>
             <div><div style={{ fontSize: 24, fontWeight: 800 }}>{stats.turnos.B}</div><div style={{ fontSize: 10, color: 'var(--text3)' }}>Turno B</div></div>
          </div>
        </div>
      </div>

      <div className="card-static" style={{ padding: '20px' }}>
         <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 16 }}>DESGLOSE POR ESPECIALIDAD (CARGOS)</div>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {stats.cargos.map(([nombre, cant]) => (
               <div key={nombre} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid var(--border)' }}>
                 <span style={{ fontSize: 11, fontWeight: 600 }}>{nombre}</span>
                 <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent2)' }}>{cant}</span>
               </div>
            ))}
         </div>
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
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span>Formato de Columnas Requerido</span>
              <button className="btn btn-ghost" onClick={downloadTemplate} style={{ fontSize: 11, padding: '2px 8px', margin: 0, width: 'auto' }}>↓ Descargar plantilla Excel/CSV</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {[
                { col: 'DNI', req: true, desc: '8 dígitos numéricos' },
                { col: 'NOMBRES_COMPLETOS', req: true, desc: 'APELLIDOS NOMBRES' },
                { col: 'CARGO', req: true, desc: 'Revisa la lista de abajo' },
                { col: 'TURNO', req: true, desc: 'Letra A o B' },
                { col: 'ID_GRUPO', req: true, desc: 'Número o MASTER' },
              ].map(c => (
                <div key={c.col} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 7, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', marginBottom: 3 }}>{c.col}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', lineHeight: 1.4 }}>{c.desc}</div>
                </div>
              ))}
            </div>
            
            {cargos.length > 0 && (
              <div style={{ marginTop: 16, padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>CATÁLOGO ESTRICTO DE CARGOS PERMITIDOS (Copia y pega exacto):</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {cargos.map(c => (
                    <span key={c.id_cargo} style={{ padding: '4px 8px', background: 'rgba(91,164,207,0.08)', borderRadius: 4, fontSize: 10, color: 'var(--accent2)', border: '1px solid rgba(91,164,207,0.2)', fontFamily: 'monospace' }}>
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
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--green)' }}>Opción A: Pegar desde Excel (Recomendado)</div>
              <textarea 
                className="input" 
                value={textoPegado} 
                onChange={e => setTextoPegado(e.target.value)} 
                placeholder="Selecciona tus 5 columnas en Excel (incluyendo los encabezados), cópialas y presiona aquí Ctrl + V..."
                style={{ flex: 1, minHeight: 160, resize: 'none', fontFamily: 'monospace', fontSize: 11, whiteSpace: 'pre', border: '2px dashed var(--green)', background: 'rgba(39,174,96,0.03)' }}
              />
              <button className="btn" onClick={procesarPegadoExcel} disabled={!textoPegado} style={{ marginTop: 10, background: 'var(--green)', color: '#000', fontWeight: 800 }}>Procesar datos pegados</button>
            </div>
            <div style={{ width: 1, background: 'var(--border)', margin: '10px 0' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text2)' }}>Opción B: Subir archivo CSV</div>
              <div onClick={() => fileRef.current?.click()} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)', borderRadius: 12, padding: '20px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s', background: 'rgba(255,255,255,0.01)', minHeight: 160 }} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { const dt = new DataTransfer(); dt.items.add(f); fileRef.current.files = dt.files; handleFile({ target: fileRef.current }) } }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📁</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Arrastra tu CSV aquí</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>o haz click para buscar</div>
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
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent2)' }}>{stats.total}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>Filas leídas</div>
            </div>
            <div className="card-static" style={{ padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>{stats.validos}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>Válidos</div>
            </div>
            <div className="card-static" style={{ padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: stats.errores > 0 ? 'var(--red)' : 'var(--green)' }}>{stats.errores}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>Con errores</div>
            </div>
          </div>

          {errors.length > 0 ? (
            <div className="card-static" style={{ padding: '16px 20px', marginBottom: 14, border: '1px solid var(--red)', background: 'rgba(231,76,60,0.05)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>⚠️ Carga Bloqueada por Errores</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 12 }}>El archivo contiene datos inválidos o cargos que no existen en el catálogo. <strong>Debes corregir tu archivo Excel y volver a pegarlo.</strong> No se permite la subida parcial.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                {errors.map((e, i) => (
                  <div key={i} style={{ fontSize: 11, padding: '7px 10px', background: 'rgba(192,57,43,0.05)', borderRadius: 6, borderLeft: '2px solid rgba(192,57,43,0.3)' }}>
                    <span style={{ fontWeight: 600 }}>Fila {e.fila}</span> — {e.dni} {e.nombre && `· ${e.nombre}`}
                    <div style={{ color: '#E8A09A', marginTop: 2 }}>{e.errores.join(' · ')}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : rows.length > 0 && (
            <div className="card-static" style={{ padding: '14px 18px', marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: 'var(--green)' }}>✓ Datos listos para importar (Previsualización de 5 filas)</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['DNI', 'Nombres', 'Cargo', 'Turno', 'Grupo'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--text3)', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '5px 8px', fontFamily: 'monospace' }}>{r.dni}</td>
                        <td style={{ padding: '5px 8px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.nombre}</td>
                        <td style={{ padding: '5px 8px', color: 'var(--accent)' }}>{r.cargoNombre}</td>
                        <td style={{ padding: '5px 8px' }}>{r.turno}</td>
                        <td style={{ padding: '5px 8px' }}>{r.grupo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 5 && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 6 }}>...y {rows.length - 5} más</div>}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={reset} style={{ flex: 1 }}>← {errors.length > 0 ? 'Volver y Corregir' : 'Cancelar'}</button>
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>{stats.erroresCarga?.length === 0 ? '✅' : '⚠️'}</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Carga completada</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>
            <strong style={{ color: 'var(--green)' }}>{stats.exitosos}</strong> trabajadores importados exitosamente
            {stats.erroresCarga?.length > 0 && <> · <strong style={{ color: 'var(--red)' }}>{stats.erroresCarga.length}</strong> errores</>}
          </div>
          {stats.erroresCarga?.length > 0 && (
            <div style={{ marginBottom: 20, textAlign: 'left', maxWidth: 500, margin: '0 auto 20px' }}>
              {stats.erroresCarga.map((e, i) => (
                <div key={i} style={{ fontSize: 11, padding: '6px 10px', marginBottom: 4, background: 'rgba(192,57,43,0.07)', borderRadius: 6, color: '#E8A09A' }}>
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
            <div style={{ fontSize: 12, fontWeight: 600 }}>{c.archivo_nombre}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
              {c.username} · {new Date(c.fecha_hora).toLocaleString('es-PE')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="badge b-ok">{c.registros_exitosos} ok</span>
            {c.registros_error > 0 && <span className="badge b-err">{c.registros_error} err</span>}
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>{c.registros_total} total</span>
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
  const medalColor = p => p === 1 ? '#FFD700' : p === 2 ? '#C0C0C0' : '#CD7F32'

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
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>Ranking por Cargo</h2>
          <p style={{ color: 'var(--text3)', fontSize: 12 }}>{svc.nombre_descriptivo}</p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {/* Modo: Solo este servicio */}
          <button onClick={() => { setModoRanking('actual'); setUsar7030(false) }}
            style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${modoRanking === 'actual' ? 'var(--accent2)' : 'var(--border)'}`, background: modoRanking === 'actual' ? 'rgba(91,164,207,0.1)' : 'rgba(255,255,255,0.03)', color: modoRanking === 'actual' ? 'var(--accent2)' : 'var(--text3)', fontSize: 12, fontWeight: modoRanking === 'actual' ? 700 : 400, cursor: 'pointer', fontFamily: 'Inter', transition: 'all 0.15s' }}>
            Solo este servicio
            {modoRanking === 'actual' && <div style={{ fontSize: 9, opacity: 0.7, marginTop: 1 }}>Sin historial previo</div>}
          </button>
          {/* Modo: Fórmula 70/30 */}
          <button onClick={() => { setModoRanking('formula'); setUsar7030(true) }}
            style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${modoRanking === 'formula' ? 'var(--accent)' : 'var(--border)'}`, background: modoRanking === 'formula' ? 'rgba(230,126,34,0.08)' : 'rgba(255,255,255,0.03)', color: modoRanking === 'formula' ? 'var(--accent)' : 'var(--text3)', fontSize: 12, fontWeight: modoRanking === 'formula' ? 700 : 400, cursor: 'pointer', fontFamily: 'Inter', transition: 'all 0.15s' }}>
            Fórmula 70/30
            {modoRanking === 'formula' && <div style={{ fontSize: 9, opacity: 0.7, marginTop: 1 }}>{(pesos.actual*100).toFixed(0)}% actual + {(pesos.historico*100).toFixed(0)}% hist.</div>}
          </button>
          {/* Podio del servicio */}
          <ToggleSwitch on={verPodioServicio} onChange={setVerPodioServicio} color="var(--accent2)"
            label="Podio del servicio" sub="Top 3 general" />
        </div>
      </div>

      {verPodioServicio && rowsServicio.slice(0,3).length >= 2 && (
        <div style={{ marginBottom: 24 }} className="fade">
          <SectionLabel text={`PODIO GENERAL — ${svc.nombre_descriptivo.toUpperCase()}`} color="var(--accent2)" />
          <Podio items={rowsServicio.slice(0,3)} medalColor={medalColor} scoreColor={scoreColor} svcId={svc.id_servicio} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 2, minWidth: 200 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginBottom: 5 }}>FILTRAR POR CARGO</div>
          <select className="input" value={cargoSelPodio} onChange={e => setCargoSelPodio(e.target.value === 'TODOS' ? 'TODOS' : parseInt(e.target.value))}
            style={{ fontSize: 12, background: 'var(--bg2)', color: 'var(--text)' }}>
            <option value="TODOS" style={{ background: '#0c0c10', color: '#E8E8E8' }}>Mostrar todos los cargos</option>
            {cargos.map(c => <option key={c.id} value={c.id} style={{ background: '#0c0c10', color: '#E8E8E8' }}>{c.nombre}{!c.tieneEvals ? ' (sin eval.)' : ''}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 110 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginBottom: 5 }}>TURNO</div>
          <select className="input" value={turnoFiltro} onChange={e => setTurnoFiltro(e.target.value)} style={{ fontSize: 12, background: 'var(--bg2)', color: 'var(--text)' }}>
            <option style={{ background: '#0c0c10' }} value="TODOS">Todos</option>
            <option style={{ background: '#0c0c10' }} value="A">Turno A</option>
            <option style={{ background: '#0c0c10' }} value="B">Turno B</option>
          </select>
        </div>
        {grupos.length > 0 && (
          <div style={{ minWidth: 110 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginBottom: 5 }}>GRUPO</div>
            <select className="input" value={grupoFiltro} onChange={e => setGrupoFiltro(e.target.value)} style={{ fontSize: 12, background: 'var(--bg2)', color: 'var(--text)' }}>
              <option style={{ background: '#0c0c10' }} value="TODOS">Todos</option>
              {grupos.map(g => <option key={g} value={g} style={{ background: '#0c0c10' }}>Grupo {g}</option>)}
            </select>
          </div>
        )}
      </div>

      {podioCargo.length >= 2 && (
        <div style={{ marginBottom: 24 }}>
          <SectionLabel text={`PODIO — ${cargos.find(c => c.id === cargoSelPodio)?.nombre.toUpperCase() || ''}`} color="var(--text3)" />
          <Podio items={podioCargo} medalColor={medalColor} scoreColor={scoreColor} svcId={svc.id_servicio} />
        </div>
      )}

      {rowsByGrupo.length === 0 ? (
        <div className="card-static" style={{ padding: '36px 20px', textAlign: 'center' }}><p style={{ color: 'var(--text3)', fontSize: 13 }}>No hay evaluaciones con los filtros aplicados.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {rowsByGrupo.map(grupo => (
            <div key={grupo.cargoId}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: 0.6 }}>{grupo.cargoNombre.toUpperCase()}</div>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>{grupo.rows.length} evaluados</div>
              </div>
              <div className="card-static" style={{ overflow: 'hidden', overflowX: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 64px 64px 90px', gap: 4, padding: '7px 12px', borderBottom: '1px solid var(--border)', fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: 0.3 }}>
                  <div>#</div><div>TRABAJADOR</div>
                  <div style={{ textAlign: 'right' }}><span style={{ color: 'var(--accent)' }}>{modoRanking === 'actual' ? '' : `${(pesos.actual*100).toFixed(0)}%`}</span>{modoRanking === 'actual' ? 'NOTA' : 'ACT.'}</div>
                  <div style={{ textAlign: 'right', opacity: modoRanking === 'formula' ? 1 : 0.15 }}><span style={{ color: 'var(--accent2)' }}>{(pesos.historico*100).toFixed(0)}%</span></div>
                  <div style={{ textAlign: 'right' }}>FINAL</div>
                </div>
                {grupo.rows.map((r, i) => (
                  <div key={r.id_asignacion} style={{ borderBottom: i < grupo.rows.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', background: r.posicion <= 3 ? 'rgba(255,255,255,0.012)' : 'transparent' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 64px 64px 90px', gap: 4, padding: '9px 12px', alignItems: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, textAlign: 'center', color: r.posicion <= 3 ? medalColor(r.posicion) : 'var(--text3)' }}>
                        {r.posicion <= 3 ? ['🥇','🥈','🥉'][r.posicion-1] : r.posicion}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <Avatar nombre={r.nombre} foto={r.foto} size={32} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{r.nombre}</div>
                          <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 1 }}>G{r.id_grupo} · T{r.turno}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: scoreColor(r.notaActual) }}>{r.notaActual}</div>
                      <div style={{ textAlign: 'right', fontSize: 12, color: usar7030 ? 'var(--accent2)' : 'var(--text3)', opacity: usar7030 ? 1 : 0.2 }}>{usar7030 ? (r.notaHist ?? '—') : '—'}</div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                        <span style={{ fontSize: 15, fontWeight: 900, color: scoreColor(r.notaFinal), fontFamily: 'monospace' }}>{r.notaFinal}</span>
                        <div style={{ width: 60, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 2, width: `${(r.notaFinal / 4) * 100}%`, background: scoreColor(r.notaFinal), transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: 'var(--text3)', marginRight: 4 }}>Total evaluados: {totalEval} ·</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />≥ 3.5 Óptimo
        </span>
        <span style={{ color: 'var(--text3)', fontSize: 10 }}>·</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--yellow)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--yellow)' }} />≥ 2.0 Aceptable
        </span>
        <span style={{ color: 'var(--text3)', fontSize: 10 }}>·</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--red)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)' }} />{'< 2.0 Riesgo'}
        </span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function ToggleSwitch({ on, onChange, color, label, sub }) {
  return (
    <div onClick={() => onChange(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', cursor: 'pointer', background: on ? `${color}14` : 'rgba(255,255,255,0.03)', border: `1px solid ${on ? `${color}44` : 'var(--border)'}`, borderRadius: 8, transition: 'all 0.2s', userSelect: 'none' }}>
      <div style={{ width: 32, height: 18, borderRadius: 9, position: 'relative', transition: 'background 0.2s', background: on ? color : 'rgba(255,255,255,0.1)' }}>
        <div style={{ position: 'absolute', top: 3, left: on ? 16 : 3, width: 12, height: 12, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
      </div>
      <div style={{ fontSize: 11 }}>
        <div style={{ fontWeight: 600, color: on ? color : 'var(--text3)' }}>{label}</div>
        <div style={{ fontSize: 9, color: 'var(--text3)' }}>{sub}</div>
      </div>
    </div>
  )
}

function SectionLabel({ text, color }) {
  return <div style={{ fontSize: 11, color: color || 'var(--text3)', fontWeight: 600, letterSpacing: 0.8, marginBottom: 14 }}>{text}</div>
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
  
  const trofeo = pos => pos === 1 ? '🥇' : pos === 2 ? '🥈' : '🥉'
  const podioH = pos => pos === 1 ? 'auto' : 'auto'
  const podioFlex = pos => pos === 1 ? 1.25 : 1

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, justifyContent: 'center' }}>
      {orden.map((p, vi) => {
        const pos = vi === 0 ? 2 : vi === 1 ? 1 : 3
        const isFirst = pos === 1
        const dni = p.dni_trabajador || p.dni
        const v = victorias[dni] || 0
        const leyenda = v >= 4 ? '⭐ Leyenda PRODISE' : v >= 3 ? '🔥 Tricampeón' : v === 2 ? '🔁 2× Campeón' : v === 1 ? '🏆 Campeón prev.' : (isFirst && p.notaFinal >= 3.5) ? '✨ Debut' : null
        const cercanoPrimero = pos === 2 && items[0] && Math.abs((p.notaFinal||0)-(items[0].notaFinal||0)) <= 0.1

        return (
          <div key={p.id_asignacion} style={{
            flex: podioFlex(pos), minWidth: 0, position: 'relative', textAlign: 'center',
            background: isFirst
              ? 'linear-gradient(160deg, rgba(255,215,0,0.09) 0%, rgba(255,180,0,0.04) 100%)'
              : pos===2 ? 'rgba(192,192,192,0.04)' : 'rgba(205,127,50,0.04)',
            border: `1px solid ${isFirst ? 'rgba(255,215,0,0.32)' : pos===2 ? 'rgba(192,192,192,0.16)' : 'rgba(205,127,50,0.16)'}`,
            borderRadius: 14, padding: isFirst ? '18px 12px 14px' : '14px 10px 12px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
            boxShadow: isFirst ? '0 0 28px rgba(255,215,0,0.1), 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,215,0,0.12)' : '0 2px 12px rgba(0,0,0,0.2)',
          }}>

            {/* Badge victorias históricas */}
            {v > 0 && (
              <div style={{ position: 'absolute', top: -8, right: -8, background: 'rgba(255,215,0,0.18)', border: '1px solid rgba(255,215,0,0.35)', borderRadius: 10, padding: '2px 6px', fontSize: 9, fontWeight: 800, color: '#FFD700', zIndex: 2 }}>
                🏆×{v}
              </div>
            )}

            {/* Trofeo grande */}
            <div style={{ fontSize: isFirst ? 36 : 28, lineHeight: 1, marginBottom: 2 }}>{trofeo(pos)}</div>

            {/* Avatar */}
            <Avatar nombre={p.nombre} foto={p.foto} size={isFirst ? 72 : 54} />

            {/* Nombre completo (2 líneas max) */}
            <div style={{ fontSize: isFirst ? 12 : 10, fontWeight: 800, lineHeight: 1.25, maxWidth: '100%', wordBreak: 'break-word', letterSpacing: -0.2 }}>
              {p.nombre}
            </div>

            {/* Cargo */}
            {p.cargoNombre && (
              <div style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                {p.cargoNombre}
              </div>
            )}

            {/* Grupo y turno */}
            <div style={{ fontSize: 9, color: 'var(--text3)' }}>G{p.id_grupo} · T{p.turno}</div>

            {/* Nota */}
            <div style={{
              fontSize: isFirst ? 32 : 24, fontWeight: 900, color: scoreColor(p.notaFinal),
              lineHeight: 1, fontFamily: 'monospace',
              textShadow: isFirst ? `0 0 20px ${scoreColor(p.notaFinal)}66` : 'none',
              marginTop: 2,
            }}>{p.notaFinal}</div>

            {/* Leyenda dinámica */}
            {leyenda && (
              <div style={{ fontSize: 9, color: isFirst ? '#FFD700' : 'rgba(255,255,255,0.45)', fontWeight: 700, marginTop: 2 }}>
                {leyenda}
              </div>
            )}
            {cercanoPrimero && (
              <div style={{ fontSize: 9, color: 'rgba(192,192,192,0.55)' }}>🎯 -{Math.abs((p.notaFinal||0)-(items[0].notaFinal||0)).toFixed(2)} del 1°</div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div><h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>Perfiles Analíticos 360°</h2><p style={{ color: 'var(--text3)', fontSize: 12 }}>{svc.nombre_descriptivo}</p></div>
          <input className="input" placeholder="Buscar por nombre o cargo..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280, marginLeft: 'auto' }} />
        </div>
        {loadingLista ? <p style={{ color: 'var(--text3)', fontSize: 13 }}>Cargando directorio...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {filtrados.map(t => (
              <div key={t.id_asignacion} onClick={() => seleccionar(t)} className="card" style={{ padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.03)' }}>
                <Avatar nombre={t.nombre} foto={t.foto} size={42} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.nombre}</div>
                  <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, marginTop: 2 }}>{t.cargoNombre}</div>
                  <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'monospace', marginTop: 2 }}>G{t.id_grupo} | T{t.turno}</div>
                </div>
                {t.evaluado ? <div style={{ fontSize: 18, fontWeight: 800, color: sc(t.promedio), flexShrink: 0, fontFamily: 'monospace' }}>{t.promedio}</div> : <div style={{ fontSize: 10, color: 'var(--text3)' }}>S/E</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button className="btn btn-ghost" onClick={() => { setSel(null); setPerfil(null); setAiResumen('') }} style={{ fontSize: 11 }}>← Volver al directorio</button>
        <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 1 }}>INFORME ANALÍTICO DE RENDIMIENTO</div>
      </div>

      {loadingPerfil ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '60px 0' }}>
          <div style={{ width: 18, height: 18, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ color: 'var(--text3)', fontSize: 13, fontWeight: 600 }}>Extrayendo telemetría del trabajador...</span>
        </div>
      ) : perfil && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          <div className="card-static" style={{ padding: '16px 18px', borderLeft: `4px solid ${sc(perfil.notaActual)}` }}>
            {/* Fila superior: avatar + nombre + cargo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <Avatar nombre={sel.nombre} foto={sel.foto} size={56} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: -0.3, lineHeight: 1.2 }}>{sel.nombre.toUpperCase()}</div>
                <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginTop: 4 }}>{sel.cargoNombre}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 5, fontSize: 10, color: 'var(--text3)', flexWrap: 'wrap' }}>
                  <span>DNI: {sel.dni}</span>
                  <span>G{sel.id_grupo} · T{sel.turno}</span>
                </div>
              </div>
            </div>
            {/* Fila inferior: KPIs en grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {[
                { label: 'NOTA ACTUAL', val: perfil.notaActual, sub: `${perfil.evalsActual.length} evaluaciones`, color: sc(perfil.notaActual) },
                { label: 'PROM. CARGO (AQUÍ)', val: perfil.promedioCargoServicio, sub: 'Mismo cargo, este servicio', color: 'var(--accent2)' },
                { label: 'PROM. CARGO (GLOBAL)', val: perfil.promedioCargoGlobal, sub: 'Todo PRODISE', color: 'var(--text2)' },
                { label: 'TENDENCIA', val: perfil.tendencia !== null ? `${perfil.tendencia > 0 ? '+' : ''}${perfil.tendencia}` : '—', sub: 'Última vs anterior', color: perfil.tendencia > 0 ? 'var(--green)' : perfil.tendencia < 0 ? 'var(--red)' : 'var(--text3)' },
              ].map(k => (
                <div key={k.label} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600, letterSpacing: 0.4, marginBottom: 4 }}>{k.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: k.color, lineHeight: 1, fontFamily: 'monospace' }}>{k.val ?? '—'}</div>
                  <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 3 }}>{k.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }} className="perfil-grid">

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              
              <div className="card-static" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 1, marginBottom: 16, width: '100%', textAlign: 'left' }}>ANÁLISIS DIMENSIONAL VS CARGO</div>
                {perfil.dims ? (
                  <>
                    <RadarSVG dims={perfil.dims} grupoDims={perfil.cargoServicioDims} size={220} color={sc(perfil.notaActual)} />
                    <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 9, color: 'var(--text3)', fontWeight: 600 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, background: sc(perfil.notaActual), opacity: 0.6, borderRadius: 2 }} /> Trabajador</span>
                      {perfil.cargoServicioDims && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, background: 'rgba(150,160,170,0.3)', border: '1px solid rgba(180,190,200,0.6)', borderRadius: 2 }} /> Promedio Cargo</span>}
                    </div>
                  </>
                ) : <div style={{ padding: '40px 0', fontSize: 11, color: 'var(--text3)' }}>Requiere evaluación para generar radar</div>}
              </div>

              <div className="card-static" style={{ padding: '16px' }}>
                 <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 1, marginBottom: 12 }}>DESGLOSE DE VARIANZA (Δ)</div>
                 {perfil.dims ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {Object.entries({ 'Seguridad': 'd1', 'Calidad Técnica': 'd2', 'Actitud': 'd3', 'Precisión': 'd4' }).map(([label, key]) => {
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
                            <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              {deltaCargo !== null && <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace', color: deltaCargo >= 0 ? 'var(--green)' : 'var(--red)' }}>{deltaCargo >= 0 ? `+${deltaCargo}` : deltaCargo} vs Cargo</span>}
                              <span style={{ fontSize: 14, fontWeight: 800, color: sc(miNota), fontFamily: 'monospace' }}>{miNota.toFixed(2)}</span>
                            </div>
                          </div>
                          
                          <div style={{ height: 16, position: 'relative', background: 'rgba(0,0,0,0.2)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)', marginTop: 4 }}>
                             <div style={{ position: 'absolute', left: '33.3%', top: 0, bottom: 0, borderLeft: '1px dashed rgba(255,255,255,0.06)' }} />
                             <div style={{ position: 'absolute', left: '66.6%', top: 0, bottom: 0, borderLeft: '1px dashed rgba(255,255,255,0.06)' }} />
                             
                             {widthPct > 0 && (
                               <div style={{ position: 'absolute', left: `${minPct}%`, width: `${widthPct}%`, top: 5, bottom: 5, background: isPositive ? 'rgba(39,174,96,0.35)' : 'rgba(231,76,60,0.35)', borderRadius: 2 }} />
                             )}
                             
                             <div style={{ position: 'absolute', left: `${pctCargo}%`, top: -3, bottom: -3, width: 2, background: 'var(--text3)', transform: 'translateX(-50%)', zIndex: 2 }} title="Promedio Cargo" />
                             <div style={{ position: 'absolute', left: `${pctMe}%`, top: 2, bottom: 2, width: 8, background: sc(miNota), borderRadius: 4, transform: 'translateX(-50%)', zIndex: 3, boxShadow: '0 0 5px rgba(0,0,0,0.8)' }} title="Nota Trabajador" />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 8, color: 'var(--text3)', fontFamily: 'monospace' }}>
                            <span>Nivel 1</span><span>Nivel 4</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                 ) : <div style={{ fontSize: 11, color: 'var(--text3)' }}>Sin datos.</div>}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="card-static" style={{ padding: '16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 1, marginBottom: 12 }}>LÍNEA DE TIEMPO DE RENDIMIENTO</div>
                {perfil.trayectoria.length > 0
                  ? <TrayectoriaSVG data={perfil.trayectoria} scoreColor={sc} />
                  : <div style={{ padding: '30px 0', fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>No hay data histórica suficiente para trazar curva de rendimiento.</div>}
              </div>

              <div className="card-static" style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 1 }}>MATRIZ DE COMPETENCIAS TÉCNICAS ({perfil.competencias.length})</div>
                </div>
                
                {perfil.competencias.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px', gap: 10, fontSize: 9, color: 'var(--text3)', fontWeight: 600, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                      <div>COMPETENCIA</div><div style={{ textAlign: 'center' }}>DOMINIO</div><div style={{ textAlign: 'right' }}>EXPERIENCIA</div>
                    </div>
                    {perfil.competencias.map((c, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px', gap: 10, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.nombre}>{c.nombre || `Cód: ${c.id_competencia}`}</div>
                        <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                          {[1,2,3,4,5].map(s => <div key={s} style={{ width: 8, height: 8, borderRadius: 2, background: s <= (c.nivel_dominio || 0) ? 'var(--accent)' : 'rgba(255,255,255,0.05)' }} />)}
                        </div>
                        <div style={{ textAlign: 'right', fontSize: 10, fontFamily: 'monospace', color: c.veces_ejecutado > 5 ? 'var(--green)' : 'var(--text2)' }}>
                          {c.veces_ejecutado || 0} ejec.
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--text3)' }}>No tiene competencias específicas registradas en matriz.</div>}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              
              <div className="card-static" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 1 }}>DIAGNÓSTICO DEL SISTEMA</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: loadingAi ? 'var(--accent)' : 'var(--green)', display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 4 }}>
                    {loadingAi ? '⏳ SINTETIZANDO...' : '✓ ANÁLISIS COMPLETADO'}
                  </div>
                </div>
                {loadingAi ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 10, color: 'var(--text3)' }}>El sistema está cruzando variables de rendimiento...</div>
                ) : aiResumen ? (
                  <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5, padding: '10px 12px', background: 'rgba(230,126,34,0.05)', borderLeft: '3px solid var(--accent)', borderRadius: 4 }}>
                    {aiResumen}
                  </div>
                ) : null}
              </div>

              {perfil.habilidades.length > 0 && (
                <div className="card-static" style={{ padding: '16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 1, marginBottom: 10 }}>POLIVALENCIA CERTIFICADA</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {perfil.habilidades.map((h, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(91,164,207,0.06)', border: '1px solid rgba(91,164,207,0.1)', borderRadius: 6 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent2)' }}>{h.cargoNombre}</div>
                          {h.fecha_certificacion && <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>Cert: {new Date(h.fecha_certificacion).toLocaleDateString('es-PE')}</div>}
                        </div>
                        <div style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: h.estado === 'VIGENTE' ? 'rgba(39,174,96,0.15)' : 'rgba(241,196,15,0.15)', color: h.estado === 'VIGENTE' ? 'var(--green)' : 'var(--yellow)' }}>
                          {h.estado}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card-static" style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 1, marginBottom: 12 }}>FEED DE OBSERVACIONES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1 }}>
                  {perfil.comentarios?.length > 0 ? perfil.comentarios.map((c, i) => (
                    <div key={i} style={{ fontSize: 10, color: 'var(--text2)', lineHeight: 1.5, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, borderLeft: '2px solid var(--border)' }}>
                      "{c}"
                    </div>
                  )) : <div style={{ fontSize: 10, color: 'var(--text3)' }}>No hay comentarios cualitativos en las evaluaciones de este servicio.</div>}
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
  const maxRadius = (size / 2) - 30
  
  const getPoint = (val, angleDeg) => {
    const r = (val / 4) * maxRadius
    const a = (angleDeg - 90) * (Math.PI / 180)
    return { x: center + r * Math.cos(a), y: center + r * Math.sin(a) }
  }

  const axes = [
    { key: 'd1', label: 'SEGURIDAD', angle: 0 },
    { key: 'd2', label: 'CALIDAD', angle: 90 },
    { key: 'd3', label: 'ACTITUD', angle: 180 },
    { key: 'd4', label: 'PRECISIÓN', angle: 270 }
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
        <polygon key={i} points={ring.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      {axes.map((a, i) => {
        const p = getPoint(4, a.angle)
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      })}

      {grupoPoly && (
        <polygon points={grupoPoly} fill="rgba(150, 160, 170, 0.2)" stroke="rgba(180, 190, 200, 0.6)" strokeWidth="1.5" strokeDasharray="4,4" />
      )}

      <polygon points={userPoly} fill={`${color}44`} stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {userPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} />)}

      {axes.map((a, i) => {
        const p = getPoint(4.8, a.angle)
        return (
          <text key={i} x={p.x} y={p.y + (a.angle === 180 ? 8 : 0)} textAnchor="middle" alignmentBaseline="middle" fontSize="9" fontWeight="700" fill="var(--text2)" letterSpacing="0.5">
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
            <stop offset="0%" stopColor={col} stopOpacity="0.3" />
            <stop offset="100%" stopColor={col} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {[1, 2, 3, 4].map(v => (
          <g key={v}>
            <line x1={P.l} y1={toY(v)} x2={W - P.r} y2={toY(v)} stroke={v === 3 ? 'rgba(39,174,96,0.2)' : 'rgba(255,255,255,0.05)'} strokeWidth="1" strokeDasharray={v === 3 ? '4,4' : undefined} />
            <text x={P.l - 6} y={toY(v)} textAnchor="end" alignmentBaseline="middle" fontSize="8" fill="var(--text3)" fontFamily="monospace">{v}.0</text>
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
               style={{ cursor: 'crosshair', transition: 'all 0.2s ease' }}>
              
              {isHovered && <line x1={cx} y1={P.t} x2={cx} y2={H - P.b} stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3,3" />}
              <circle cx={cx} cy={cy} r="15" fill="transparent" />
              <circle cx={cx} cy={cy} r={isHovered ? 6 : (d.esActual ? 5 : 3.5)} fill={isHovered ? '#fff' : (d.esActual ? col : 'var(--bg)')} stroke={col} strokeWidth={d.esActual && !isHovered ? 0 : 2} style={{ transition: 'all 0.2s ease' }} />
              
              <text x={cx} y={H - 6} textAnchor="middle" fontSize="8" fill={isHovered || d.esActual ? 'var(--text)' : 'var(--text3)'} fontWeight={d.esActual ? '700' : '500'}>
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
          background: 'rgba(15, 15, 20, 0.98)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8,
          padding: '10px 12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
          pointerEvents: 'none',
          zIndex: 10,
          display: 'flex', flexDirection: 'column', gap: 6
        }}>
          <div style={{ fontSize: 9, color: 'var(--accent2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{data[hoverIdx].tipo}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.4, wordWrap: 'break-word' }}>{data[hoverIdx].nombre}</div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: scoreColor(data[hoverIdx].promedio), lineHeight: 1, fontFamily: 'monospace' }}>
              {data[hoverIdx].promedio.toFixed(2)}
            </div>
            {hoverIdx > 0 && (
              <div style={{ fontSize: 11, fontWeight: 800, color: data[hoverIdx].promedio >= data[hoverIdx-1].promedio ? 'var(--green)' : 'var(--red)' }}>
                {data[hoverIdx].promedio >= data[hoverIdx-1].promedio ? '▲' : '▼'} 
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
      {[1, 2, 3, 4, 5].map(s => <div key={s} style={{ width: 10, height: 10, borderRadius: '50%', background: s <= (nivel || 0) ? 'var(--accent)' : 'rgba(255,255,255,0.08)' }} />)}
    </div>
  )

  return (
    <div className="fade">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>Buscador de Talento</h2>
        <p style={{ color: 'var(--text3)', fontSize: 12 }}>Filtra al personal histórico por sus habilidades técnicas</p>
      </div>

      <div className="card-static" style={{ padding: '16px 20px', marginBottom: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 250 }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', marginBottom: 6, display: 'block' }}>BUSCAR POR NOMBRE O DNI</label>
          <input className="input" placeholder="Ej. Juan Perez..." value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)} />
        </div>
        <div style={{ flex: 1, minWidth: 250 }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', marginBottom: 6, display: 'block' }}>COMPETENCIA TÉCNICA</label>
          <select className="input" value={filtroComp} onChange={e => setFiltroComp(e.target.value)} style={{ background: 'var(--bg2)' }}>
            <option value="TODAS">-- Todas las competencias --</option>
            {catComps.map(c => <option key={c.id_competencia} value={c.id_competencia}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text3)', fontSize: 13 }}>Buscando talento...</p>
      ) : resultados.length === 0 ? (
        <div className="card-static" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>No se encontraron técnicos con esos criterios.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {resultados.map(r => (
            <div key={r.dni} className="card-static" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar nombre={r.nombres_completos} foto={r.url_foto} size={42} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.nombres_completos}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'monospace' }}>DNI: {r.dni}</div>
                </div>
              </div>

              {r.habilidades.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {r.habilidades.map((h, i) => (
                    <span key={i} style={{ fontSize: 9, padding: '4px 8px', borderRadius: 4, background: 'rgba(91,164,207,0.1)', color: 'var(--accent2)', border: '1px solid rgba(91,164,207,0.2)' }}>
                      ★ {h.catalogo_cargos?.nombre_oficial}
                    </span>
                  ))}
                </div>
              )}

              {r.competencias.length > 0 ? (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 8 }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text3)', letterSpacing: 0.5, marginBottom: 8 }}>COMPETENCIAS TÉCNICAS ({r.competencias.length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {r.competencias.slice(0, 3).map(c => (
                      <div key={c.id_competencia} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{c.catalogo_competencias?.nombre}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 9, color: 'var(--text3)' }}>{c.veces_ejecutado}x</span>
                          {renderEstrellas(c.nivel_dominio)}
                        </div>
                      </div>
                    ))}
                    {r.competencias.length > 3 && <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2, textAlign: 'center' }}>+{r.competencias.length - 3} competencias más...</div>}
                  </div>
                </div>
              ) : <div style={{ fontSize: 10, color: 'var(--text3)', padding: '10px 0', textAlign: 'center' }}>Sin competencias técnicas registradas</div>}
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
    <div className="fade" style={{ display: 'flex', gap: 20, height: 'calc(100vh - 100px)' }}>
      
      <div className="card-static" style={{ width: 340, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Armar Cuadrilla</h2>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginTop: 4 }}>
                {seleccionados.length} SELECCIONADOS
              </div>
            </div>
            {seleccionados.length > 0 && (
              <button className="btn btn-ghost" onClick={() => setSeleccionados([])} style={{ fontSize: 10, padding: '4px 8px' }}>Limpiar</button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 14, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 8 }}>
            <button onClick={() => setModoIzq('lista')} style={{ flex: 1, padding: '6px', fontSize: 11, borderRadius: 6, border: 'none', background: modoIzq === 'lista' ? 'var(--accent)' : 'transparent', color: modoIzq === 'lista' ? '#fff' : 'var(--text3)', fontWeight: 600, cursor: 'pointer' }}>Buscador</button>
            <button onClick={() => setModoIzq('masiva')} style={{ flex: 1, padding: '6px', fontSize: 11, borderRadius: 6, border: 'none', background: modoIzq === 'masiva' ? 'var(--accent)' : 'transparent', color: modoIzq === 'masiva' ? '#fff' : 'var(--text3)', fontWeight: 600, cursor: 'pointer' }}>Pegar DNIs</button>
          </div>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {loading ? <p style={{ color: 'var(--text3)', fontSize: 12, textAlign: 'center' }}>Cargando personal...</p> : 
           modoIzq === 'lista' ? (
             <>
               <input className="input" placeholder="Buscar nombre, DNI o cargo..." value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)} style={{ marginBottom: 12 }} />
               {personalFiltrado.length === 0 && <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', padding: '20px 0' }}>No hay coincidencias.</div>}
               {personalFiltrado.map(p => {
                 const sel = seleccionados.includes(p.dni)
                 return (
                   <div key={p.dni} onClick={() => toggleTrabajador(p.dni)} style={{
                     display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', 
                     borderRadius: 6, cursor: 'pointer', marginBottom: 4,
                     background: sel ? 'rgba(230,126,34,0.08)' : 'transparent',
                     border: `1px solid ${sel ? 'rgba(230,126,34,0.3)' : 'transparent'}`
                   }}>
                     <div style={{ width: 14, height: 14, borderRadius: 3, border: `1px solid ${sel ? 'var(--accent)' : 'var(--text3)'}`, background: sel ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       {sel && <span style={{ color: '#fff', fontSize: 10 }}>✓</span>}
                     </div>
                     <div style={{ flex: 1, minWidth: 0 }}>
                       <div style={{ fontSize: 11, fontWeight: sel ? 700 : 500, color: sel ? 'var(--accent)' : 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nombre}</div>
                       <div style={{ fontSize: 9, color: 'var(--text3)' }}>{p.cargo}</div>
                     </div>
                     <div style={{ fontSize: 11, fontWeight: 700, color: sc(p.promedio) }}>{p.promedio ? p.promedio.toFixed(2) : '—'}</div>
                   </div>
                 )
               })}
             </>
           ) : (
             <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
               <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4 }}>Copia la columna desde tu Excel, haz clic en la caja punteada y presiona <strong>Ctrl + V</strong>.</div>
               
               {!dnisPegados ? (
                 <textarea className="input" value={dnisPegados} onChange={e => setDnisPegados(e.target.value)} placeholder="Haz clic aquí y presiona Ctrl + V 📋" style={{ flex: 1, resize: 'none', fontSize: 14, fontWeight: 600, textAlign: 'center', border: '2px dashed var(--accent)', background: 'rgba(230,126,34,0.04)', borderRadius: 8, paddingTop: '40%', cursor: 'pointer', color: 'var(--text)' }} />
               ) : (
                 <div className="fade" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{ fontSize: 10, color: 'var(--accent)' }}>{dnisExtraidosUnicos.length} DNIs detectados</span>
                     <button className="btn btn-ghost" onClick={() => setDnisPegados('')} style={{ fontSize: 10, padding: '2px 6px' }}>← Limpiar</button>
                   </div>
                   <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg2)' }}>
                     <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, textAlign: 'left' }}>
                       <thead style={{ background: 'rgba(255,255,255,0.05)', position: 'sticky', top: 0 }}><tr><th style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>DNI</th><th style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>Estado</th></tr></thead>
                       <tbody>
                         {previewDnis.map((item, i) => (<tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}><td style={{ padding: '6px 8px', fontFamily: 'monospace', color: item.existe ? 'var(--text)' : 'var(--text3)' }}>{item.dni}</td><td style={{ padding: '6px 8px', color: item.existe ? 'var(--green)' : 'var(--red)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{item.existe ? item.nombre : 'No asignado'}</td></tr>))}
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
           <div className="card-static" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
             <div>
               <div style={{ fontSize: 40, marginBottom: 10 }}>🧑‍🔧↔️👨‍🔧</div>
               <div style={{ fontSize: 14, fontWeight: 600 }}>Esperando selección</div>
               <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Selecciona al menos 2 personas para predecir su rendimiento conjunto y ver su red de afinidad.</div>
             </div>
           </div>
        ) : (
          <>
            <div className="card-static" style={{ padding: '24px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 1, marginBottom: 16 }}>PROYECCIÓN DE RENDIMIENTO GRUPAL</div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Promedio Técnico Base</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: sc(baseScore) }}>{baseScore.toFixed(2)}</div>
                </div>
                <div style={{ fontSize: 20, color: 'var(--text3)' }}>{multiplicadorQuimica >= 0 ? '+' : '-'}</div>
                
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Factor Química (Afinidad)</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: multiplicadorQuimica > 0 ? 'var(--green)' : multiplicadorQuimica < 0 ? 'var(--red)' : 'var(--text3)' }}>
                    {Math.abs(multiplicadorQuimica).toFixed(2)}
                  </div>
                </div>
                <div style={{ fontSize: 20, color: 'var(--text3)' }}>=</div>
                
                <div style={{ padding: '14px 24px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: `2px solid ${sc(scoreFinal)}` }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>PROYECCIÓN FINAL</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: sc(scoreFinal), lineHeight: 1 }}>{scoreFinal.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, flex: 1 }}>
              <div className="card-static" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 1, marginBottom: 10 }}>MAPA DE AFINIDAD (Visual)</div>
                <div style={{ flex: 1, position: 'relative', background: 'rgba(5,5,7,0.3)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <RedAfinidadSVG cuadrilla={cuadrilla} afinidades={afinidades} />
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 10, fontSize: 9, color: 'var(--text3)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 10, height: 2, background: 'var(--green)' }}/> Sinergia Alta</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 10, height: 2, background: 'var(--red)' }}/> Conflicto</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="card-static" style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 1, marginBottom: 10 }}>ADVERTENCIAS DE CONFLICTO</div>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {advertencias.length === 0 ? (
                      <div style={{ fontSize: 11, color: 'var(--green)', padding: '10px', background: 'rgba(39,174,96,0.08)', borderRadius: 6 }}>✓ No se detectaron conflictos históricos.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {advertencias.map((adv, i) => (
                          <div key={i} style={{ fontSize: 11, color: '#E8A09A', padding: '8px', background: 'rgba(192,57,43,0.08)', borderRadius: 6, borderLeft: '3px solid var(--red)' }}>⚠️ {adv}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-static" style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 1, marginBottom: 10 }}>SINERGIAS DETECTADAS</div>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {bonos.length === 0 ? (
                      <div style={{ fontSize: 11, color: 'var(--text3)', padding: '10px' }}>No hay datos de sinergia excepcional registrados.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {bonos.map((bono, i) => (
                          <div key={i} style={{ fontSize: 11, color: 'var(--green)', padding: '8px', background: 'rgba(39,174,96,0.08)', borderRadius: 6, borderLeft: '3px solid var(--green)' }}>⭐ {bono}</div>
                        ))}
                      </div>
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
           <circle cx={n.x} cy={n.y} r="18" fill="rgba(230,126,34,0.15)" stroke="var(--accent)" strokeWidth="2" />
           <text x={n.x} y={n.y+4} textAnchor="middle" fontSize="11" fill="var(--accent)" fontWeight="800">
             {n.nombre.substring(0,2).toUpperCase()}
           </text>
           <text x={n.x} y={n.y+28} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="600">{n.nombre.split(' ')[0]}</text>
           <text x={n.x} y={n.y+40} textAnchor="middle" fontSize="8" fill="var(--text3)">{n.cargo.substring(0, 15)}</text>
        </g>
      ))}
    </svg>
  )
}

/* =========================================
   GESTIÓN DE USUARIOS
   ========================================= */

// MD5 puro en JS — mismo resultado que Python hashlib.md5
function md5(input) {
  function safeAdd(x,y){const l=(x&0xFFFF)+(y&0xFFFF);return((x>>16)+(y>>16)+(l>>16)<<16)|(l&0xFFFF)}
  function rol(n,c){return(n<<c)|(n>>>(32-c))}
  function cmn(q,a,b,x,s,t){return safeAdd(rol(safeAdd(safeAdd(a,q),safeAdd(x,t)),s),b)}
  function ff(a,b,c,d,x,s,t){return cmn((b&c)|((~b)&d),a,b,x,s,t)}
  function gg(a,b,c,d,x,s,t){return cmn((b&d)|(c&(~d)),a,b,x,s,t)}
  function hh(a,b,c,d,x,s,t){return cmn(b^c^d,a,b,x,s,t)}
  function ii(a,b,c,d,x,s,t){return cmn(c^(b|(~d)),a,b,x,s,t)}
  const s8=unescape(encodeURIComponent(input));const x=[]
  for(let i=0;i<s8.length;i+=4)x[i>>2]=s8.charCodeAt(i)+(s8.charCodeAt(i+1)<<8)+(s8.charCodeAt(i+2)<<16)+(s8.charCodeAt(i+3)<<24)
  const l=s8.length;x[l>>2]|=0x80<<((l%4)*8);x[(((l+64)>>>9)<<4)+14]=l*8
  let [a,b,c,d]=[0x67452301,0xEFCDAB89,0x98BADCFE,0x10325476]
  for(let i=0;i<x.length;i+=16){
    const[A,B,C,D]=[a,b,c,d]
    a=ff(a,b,c,d,x[i],7,-680876936);d=ff(d,a,b,c,x[i+1],12,-389564586);c=ff(c,d,a,b,x[i+2],17,606105819);b=ff(b,c,d,a,x[i+3],22,-1044525330)
    a=ff(a,b,c,d,x[i+4],7,-176418897);d=ff(d,a,b,c,x[i+5],12,1200080426);c=ff(c,d,a,b,x[i+6],17,-1473231341);b=ff(b,c,d,a,x[i+7],22,-45705983)
    a=ff(a,b,c,d,x[i+8],7,1770035416);d=ff(d,a,b,c,x[i+9],12,-1958414417);c=ff(c,d,a,b,x[i+10],17,-42063);b=ff(b,c,d,a,x[i+11],22,-1990404162)
    a=ff(a,b,c,d,x[i+12],7,1804603682);d=ff(d,a,b,c,x[i+13],12,-40341101);c=ff(c,d,a,b,x[i+14],17,-1502002290);b=ff(b,c,d,a,x[i+15],22,1236535329)
    a=gg(a,b,c,d,x[i+1],5,-165796510);d=gg(d,a,b,c,x[i+6],9,-1069501632);c=gg(c,d,a,b,x[i+11],14,643717713);b=gg(b,c,d,a,x[i],20,-373897302)
    a=gg(a,b,c,d,x[i+5],5,-701558691);d=gg(d,a,b,c,x[i+10],9,38016083);c=gg(c,d,a,b,x[i+15],14,-660478335);b=gg(b,c,d,a,x[i+4],20,-405537848)
    a=gg(a,b,c,d,x[i+9],5,568446438);d=gg(d,a,b,c,x[i+14],9,-1019803690);c=gg(c,d,a,b,x[i+3],14,-187363961);b=gg(b,c,d,a,x[i+8],20,1163531501)
    a=gg(a,b,c,d,x[i+13],5,-1444681467);d=gg(d,a,b,c,x[i+2],9,-51403784);c=gg(c,d,a,b,x[i+7],14,1735328473);b=gg(b,c,d,a,x[i+12],20,-1926607734)
    a=hh(a,b,c,d,x[i+5],4,-378558);d=hh(d,a,b,c,x[i+8],11,-2022574463);c=hh(c,d,a,b,x[i+11],16,1839030562);b=hh(b,c,d,a,x[i+14],23,-35309556)
    a=hh(a,b,c,d,x[i+1],4,-1530992060);d=hh(d,a,b,c,x[i+4],11,1272893353);c=hh(c,d,a,b,x[i+7],16,-155497632);b=hh(b,c,d,a,x[i+10],23,-1094730640)
    a=hh(a,b,c,d,x[i+13],4,681279174);d=hh(d,a,b,c,x[i],11,-358537222);c=hh(c,d,a,b,x[i+3],16,-722521979);b=hh(b,c,d,a,x[i+6],23,76029189)
    a=hh(a,b,c,d,x[i+9],4,-640364487);d=hh(d,a,b,c,x[i+12],11,-421815835);c=hh(c,d,a,b,x[i+15],16,530742520);b=hh(b,c,d,a,x[i+2],23,-995338651)
    a=ii(a,b,c,d,x[i],6,-198630844);d=ii(d,a,b,c,x[i+7],10,1126891415);c=ii(c,d,a,b,x[i+14],15,-1416354905);b=ii(b,c,d,a,x[i+5],21,-57434055)
    a=ii(a,b,c,d,x[i+12],6,1700485571);d=ii(d,a,b,c,x[i+3],10,-1894986606);c=ii(c,d,a,b,x[i+10],15,-1051523);b=ii(b,c,d,a,x[i+1],21,-2054922799)
    a=ii(a,b,c,d,x[i+8],6,1873313359);d=ii(d,a,b,c,x[i+15],10,-30611744);c=ii(c,d,a,b,x[i+6],15,-1560198380);b=ii(b,c,d,a,x[i+13],21,1309151649)
    a=ii(a,b,c,d,x[i+4],6,-145523070);d=ii(d,a,b,c,x[i+11],10,-1120210379);c=ii(c,d,a,b,x[i+2],15,718787259);b=ii(b,c,d,a,x[i+9],21,-343485551)
    a=safeAdd(a,A);b=safeAdd(b,B);c=safeAdd(c,C);d=safeAdd(d,D)
  }
  return[a,b,c,d].map(n=>('00000000'+((n<0?n+0x100000000:n)).toString(16)).slice(-8).match(/../g).reverse().join('')).join('')
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

  // Form state
  const [form, setForm] = useState({
    username: '', password: '', dni_asociado: '', nivel_acceso: 2, estado: 'ACTIVO'
  })
  const [generatedPwd, setGeneratedPwd] = useState('')

  const nivelLabels = { 1: 'Nivel 1 — Admin', 2: 'Nivel 2 — Planner/Coordinador', 3: 'Nivel 3 — Supervisor' }

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: usrs }, { data: trabs }] = await Promise.all([
      supabase.from('usuarios_sistema').select('*').order('username'),
      supabase.from('trabajadores').select('dni, nombres_completos').order('nombres_completos'),
    ])
    setUsuarios(usrs || [])
    setTrab(trabs || [])
    setLoading(false)
  }

  function nombreDeTrabajador(dni) {
    return trabajadores.find(t => t.dni === dni)?.nombres_completos || dni || '—'
  }

  function trabajadoresFiltrados() {
    if (!busquedaDni) return trabajadores.slice(0, 8)
    const q = busquedaDni.toLowerCase()
    return trabajadores.filter(t =>
      t.nombres_completos.toLowerCase().includes(q) || t.dni.includes(q)
    ).slice(0, 8)
  }

  function abrirNuevo() {
    setForm({ username: '', password: '', dni_asociado: '', nivel_acceso: 2, estado: 'ACTIVO' })
    setGeneratedPwd(''); setEditando(null); setBusquedaDni(''); setMsg(''); setShowForm(true)
  }

  function abrirEditar(u) {
    setForm({ username: u.username, password: '', dni_asociado: u.dni_asociado || '', nivel_acceso: u.nivel_acceso, estado: u.estado })
    setGeneratedPwd(''); setEditando(u); setBusquedaDni(''); setMsg(''); setShowForm(true)
  }

  function generarPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789#@!'
    const pwd = Array.from({length: 10}, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setForm(f => ({ ...f, password: pwd }))
    setGeneratedPwd(pwd)
  }

  async function guardar() {
    if (!form.username.trim()) { setMsg('El nombre de usuario es obligatorio'); return }
    if (!editando && !form.password.trim()) { setMsg('La contraseña es obligatoria para usuarios nuevos'); return }
    setGuardando(true); setMsg('')

    const data = {
      username:      form.username.toUpperCase().trim(),
      nivel_acceso:  parseInt(form.nivel_acceso),
      estado:        form.estado,
      dni_asociado:  form.dni_asociado || null,
    }

    // Solo hashear si se escribió contraseña
    if (form.password.trim()) {
      data.password_hash = md5(form.password.trim())
    }

    let error
    if (editando) {
      ({ error } = await supabase.from('usuarios_sistema').update(data).eq('username', editando.username))
    } else {
      ({ error } = await supabase.from('usuarios_sistema').insert(data))
    }

    if (error) {
      setMsg(error.code === '23505' ? 'Ese nombre de usuario ya existe' : error.message)
    } else {
      setShowForm(false)
      setMsg('')
      await loadAll()
    }
    setGuardando(false)
  }

  async function toggleEstado(u) {
    const nuevoEstado = u.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
    await supabase.from('usuarios_sistema').update({ estado: nuevoEstado }).eq('username', u.username)
    await loadAll()
  }

  async function eliminar(username) {
    await supabase.from('usuarios_sistema').delete().eq('username', username)
    setConfirmDelete(null)
    await loadAll()
  }

  const nivelColor = n => n === 1 ? 'var(--accent)' : n === 2 ? 'var(--accent2)' : 'var(--green)'
  const nivelBg    = n => n === 1 ? 'rgba(230,126,34,0.08)' : n === 2 ? 'rgba(91,164,207,0.08)' : 'rgba(39,174,96,0.08)'

  if (loading) return <p style={{ color: 'var(--text3)', fontSize: 13 }}>Cargando usuarios...</p>

  return (
    <div className="fade">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Usuarios del sistema</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{usuarios.length} usuarios registrados</div>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevo} style={{ width: 'auto', padding: '8px 18px', fontSize: 12 }}>
          + Nuevo usuario
        </button>
      </div>

      {/* Tabla de usuarios */}
      <div className="card-static" style={{ overflow: 'hidden', marginBottom: 16 }}>
        {/* Cabecera */}
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px 80px 120px 100px', gap: 8, padding: '9px 16px', borderBottom: '1px solid var(--border)', fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: 0.4 }}>
          <div>USUARIO</div><div>TRABAJADOR VINCULADO</div><div>NIVEL</div><div>ESTADO</div><div>ÚLTIMO ACCESO</div><div style={{ textAlign: 'right' }}>ACCIONES</div>
        </div>

        {usuarios.map((u, i) => (
          <div key={u.username} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px 80px 120px 100px', gap: 8, padding: '11px 16px', alignItems: 'center', borderBottom: i < usuarios.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', opacity: u.estado === 'INACTIVO' ? 0.45 : 1 }}>
            {/* Username */}
            <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: u.username === currentUser.username ? 'var(--accent)' : 'var(--text)' }}>
              {u.username}
              {u.username === currentUser.username && <span style={{ fontSize: 8, color: 'var(--accent)', marginLeft: 6, fontFamily: 'Inter' }}>tú</span>}
            </div>

            {/* Trabajador */}
            <div style={{ fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {nombreDeTrabajador(u.dni_asociado)}
            </div>

            {/* Nivel */}
            <div>
              <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, background: nivelBg(u.nivel_acceso), color: nivelColor(u.nivel_acceso), fontWeight: 600 }}>
                N{u.nivel_acceso} · {u.nivel_acceso === 1 ? 'Admin' : u.nivel_acceso === 2 ? 'Planner' : 'Supervisor'}
              </span>
            </div>

            {/* Estado */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: u.estado === 'ACTIVO' ? 'var(--green)' : 'var(--text3)', flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: u.estado === 'ACTIVO' ? 'var(--green)' : 'var(--text3)' }}>{u.estado}</span>
            </div>

            {/* Último acceso */}
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>
              {u.ultimo_login ? new Date(u.ultimo_login).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: '2-digit' }) : 'Nunca'}
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
              <button onClick={() => abrirEditar(u)} style={{ padding: '4px 9px', fontSize: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text2)', cursor: 'pointer', fontFamily: 'Inter' }}>
                ✏ Editar
              </button>
              <button onClick={() => toggleEstado(u)} style={{ padding: '4px 9px', fontSize: 10, background: 'transparent', border: '1px solid var(--border)', borderRadius: 5, color: u.estado === 'ACTIVO' ? 'var(--yellow)' : 'var(--green)', cursor: 'pointer', fontFamily: 'Inter' }}>
                {u.estado === 'ACTIVO' ? '⏸' : '▶'}
              </button>
              {u.username !== currentUser.username && (
                <button onClick={() => setConfirmDelete(u.username)} style={{ padding: '4px 9px', fontSize: 10, background: 'transparent', border: '1px solid rgba(192,57,43,0.25)', borderRadius: 5, color: 'var(--red)', cursor: 'pointer', fontFamily: 'Inter' }}>
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Confirm delete */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', maxWidth: 320, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>¿Eliminar usuario?</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}>Se eliminará <strong style={{ color: 'var(--text)' }}>{confirmDelete}</strong> permanentemente.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)} style={{ flex: 1, fontSize: 12 }}>Cancelar</button>
              <button onClick={() => eliminar(confirmDelete)} style={{ flex: 1, padding: '9px', background: 'var(--red)', border: 'none', borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal formulario */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '26px 28px', width: '100%', maxWidth: 440 }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{editando ? 'Editar usuario' : 'Nuevo usuario'}</div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Username */}
              <div>
                <label style={lbl}>NOMBRE DE USUARIO</label>
                <input className="input" value={form.username} placeholder="Ej: RCHANCAY"
                  onChange={e => setForm(f => ({ ...f, username: e.target.value.toUpperCase() }))}
                  disabled={!!editando}
                  style={{ fontFamily: 'monospace', opacity: editando ? 0.6 : 1 }}
                />
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>Solo letras y números, sin espacios. Se guardará en MAYÚSCULAS.</div>
              </div>

              {/* Trabajador vinculado */}
              <div>
                <label style={lbl}>TRABAJADOR VINCULADO</label>
                <input className="input" placeholder="Buscar por nombre o DNI..."
                  value={busquedaDni}
                  onChange={e => setBusquedaDni(e.target.value)}
                  style={{ marginBottom: 6 }}
                />
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 7, overflow: 'hidden' }}>
                  {/* Opción ninguno */}
                  <div onClick={() => { setForm(f => ({...f, dni_asociado: ''})); setBusquedaDni('') }}
                    style={{ padding: '7px 12px', fontSize: 11, cursor: 'pointer', background: !form.dni_asociado ? 'rgba(230,126,34,0.07)' : 'transparent', color: !form.dni_asociado ? 'var(--accent)' : 'var(--text3)', borderBottom: '1px solid var(--border)' }}>
                    — Sin vincular
                  </div>
                  {trabajadoresFiltrados().map(t => (
                    <div key={t.dni} onClick={() => { setForm(f => ({...f, dni_asociado: t.dni})); setBusquedaDni(t.nombres_completos) }}
                      style={{ padding: '7px 12px', fontSize: 11, cursor: 'pointer', background: form.dni_asociado === t.dni ? 'rgba(230,126,34,0.07)' : 'transparent', color: form.dni_asociado === t.dni ? 'var(--accent)' : 'var(--text2)', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <span style={{ fontWeight: form.dni_asociado === t.dni ? 600 : 400 }}>{t.nombres_completos}</span>
                      <span style={{ color: 'var(--text3)', fontFamily: 'monospace' }}>{t.dni}</span>
                    </div>
                  ))}
                </div>
                {form.dni_asociado && <div style={{ fontSize: 10, color: 'var(--green)', marginTop: 4 }}>✓ Vinculado: {nombreDeTrabajador(form.dni_asociado)}</div>}
              </div>

              {/* Nivel de acceso */}
              <div>
                <label style={lbl}>NIVEL DE ACCESO</label>
                <select className="input" value={form.nivel_acceso} onChange={e => setForm(f => ({...f, nivel_acceso: parseInt(e.target.value)}))} style={{ background: 'var(--bg2)' }}>
                  <option value={1} style={{ background: '#0c0c10' }}>Nivel 1 — Admin (acceso total)</option>
                  <option value={2} style={{ background: '#0c0c10' }}>Nivel 2 — Planner / Coordinador</option>
                  <option value={3} style={{ background: '#0c0c10' }}>Nivel 3 — Supervisor (solo evaluar)</option>
                </select>
              </div>

              {/* Contraseña */}
              <div>
                <label style={lbl}>{editando ? 'NUEVA CONTRASEÑA (dejar vacío para no cambiar)' : 'CONTRASEÑA *'}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="input" type="text" value={form.password} placeholder={editando ? 'Escribe para cambiar contraseña' : 'Escribe una contraseña...'}
                    onChange={e => { setForm(f => ({...f, password: e.target.value})); setGeneratedPwd('') }}
                    style={{ flex: 1 }}
                  />
                  <button type="button" onClick={generarPassword}
                    style={{ padding: '0 14px', background: 'rgba(91,164,207,0.1)', border: '1px solid rgba(91,164,207,0.2)', borderRadius: 8, color: 'var(--accent2)', fontSize: 11, cursor: 'pointer', fontFamily: 'Inter', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    🎲 Generar
                  </button>
                </div>
                {form.password && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(39,174,96,0.07)', border: '1px solid rgba(39,174,96,0.15)', borderRadius: 7 }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>CONTRASEÑA QUE VERÁ EL USUARIO:</div>
                    <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'monospace', color: 'var(--green)', letterSpacing: 1 }}>{form.password}</div>
                    <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 4 }}>Se guardará encriptada en la base de datos. Comparte esta contraseña con el usuario.</div>
                  </div>
                )}
              </div>

              {/* Estado (solo en edición) */}
              {editando && (
                <div>
                  <label style={lbl}>ESTADO</label>
                  <select className="input" value={form.estado} onChange={e => setForm(f => ({...f, estado: e.target.value}))} style={{ background: 'var(--bg2)' }}>
                    <option value="ACTIVO" style={{ background: '#0c0c10' }}>ACTIVO</option>
                    <option value="INACTIVO" style={{ background: '#0c0c10' }}>INACTIVO</option>
                  </select>
                </div>
              )}

              {msg && <div className="alert alert-err">{msg}</div>}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn btn-ghost" onClick={() => setShowForm(false)} style={{ flex: 1 }}>Cancelar</button>
                <button className="btn btn-primary" onClick={guardar} disabled={guardando} style={{ flex: 2 }}>
                  {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear usuario'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leyenda de niveles */}
      <div className="card-static" style={{ padding: '12px 16px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', marginBottom: 8, letterSpacing: 0.4 }}>REFERENCIA DE NIVELES</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { n: 1, label: 'Admin', desc: 'Acceso total a todos los módulos y servicios' },
            { n: 2, label: 'Planner', desc: 'Dashboard, Ranking, Perfiles, Buscador, Bitácora' },
            { n: 3, label: 'Supervisor', desc: 'Solo puede Evaluar y ver Ranking' },
          ].map(({ n, label, desc }) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: nivelBg(n), color: nivelColor(n), fontWeight: 600 }}>N{n} · {label}</span>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const lbl = { fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: 0.5, display: 'block', marginBottom: 5 }

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
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>Trabajos Importantes</h2>
          <p style={{ color: 'var(--text3)', fontSize: 12 }}>Registro global de trabajos críticos y cuadrillas asignadas</p>
        </div>
        {vista === 'lista' && <button className="btn btn-primary" onClick={() => setVista('nueva')} style={{ width: 'auto', fontSize: 11, padding: '6px 12px' }}>+ Registrar Trabajo</button>}
      </div>

      {vista === 'lista' && (
        <div className="fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 14 }}>
          {actividades.length === 0 ? (
             <div className="card-static" style={{ gridColumn: '1 / -1', padding: '40px 20px', textAlign: 'center' }}><p style={{ color: 'var(--text3)', fontSize: 13 }}>No hay trabajos importantes registrados aún.</p></div>
          ) : actividades.map(a => (
            <div key={a.id_actividad} className="card-static" onClick={() => abrirDetalle(a)} style={{ padding: '16px', display: 'flex', gap: 14, alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid var(--border)' }}>
              {a.meta?.url_foto ? (
                 <div style={{ width: 80, height: 80, borderRadius: 6, overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src={a.meta.url_foto} alt="Trabajo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 </div>
              ) : (
                 <div style={{ width: 80, height: 80, borderRadius: 6, background: 'rgba(230,126,34,0.05)', border: '1px solid rgba(230,126,34,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👷</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>{a.catalogo_competencias?.nombre}</div>
                <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.servicioNombre}</div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 10, color: 'var(--text3)' }}>
                  <div>
                     <strong style={{display: 'block', color: 'var(--text2)', marginBottom: 2}}>EJECUCIÓN</strong>
                     {a.meta?.id_grupo ? `Grupo ${a.meta.id_grupo} (${a.personal_programado || 0} pax)` : 'Sin grupo'}
                  </div>
                  <div>
                     <strong style={{display: 'block', color: 'var(--text2)', marginBottom: 2}}>TIEMPOS</strong>
                     Prog: {a.duracion_programada||'0'}h | Real: <span style={{ color: a.estado === 'EN PLAZO' ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{a.duracion_horas||'0'}h</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {vista === 'nueva' && (
        <div className="fade card-static" style={{ padding: '24px', maxWidth: 800 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Vincular Trabajo a Grupo</h3>
            <button className="btn btn-ghost" onClick={() => setVista('lista')} style={{ fontSize: 10, padding: '4px 8px' }}>✕ Cancelar</button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginBottom: 4, display: 'block' }}>COMPETENCIA / TAREA PRINCIPAL *</label>
                  <select className="input" value={formAct.id_competencia} onChange={e => setFormAct({...formAct, id_competencia: e.target.value})} style={{ background: 'var(--bg2)' }}>
                    <option value="">-- Seleccionar --</option>
                    {comps.map(c => <option key={c.id_competencia} value={c.id_competencia}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginBottom: 4, display: 'block' }}>GRUPO ASIGNADO *</label>
                  <select className="input" value={formAct.id_grupo} onChange={e => setFormAct({...formAct, id_grupo: e.target.value})} style={{ background: 'var(--bg2)' }}>
                    <option value="">-- Seleccionar --</option>
                    {gruposInfo.map(g => <option key={g.grupo} value={g.grupo}>Grupo {g.grupo} ({g.count} técnicos)</option>)}
                  </select>
                </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginBottom: 4, display: 'block' }}>DESCRIPCIÓN BREVE DEL TRABAJO *</label>
              <input className="input" placeholder="Ej: Cambio de manto en Molino SAG #2" value={formAct.nombre} onChange={e => setFormAct({...formAct, nombre: e.target.value})} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginBottom: 4, display: 'block' }}>FOTOGRAFÍA (URL Opcional)</label>
              <input className="input" placeholder="Ej: https://miservidor.com/foto.jpg" value={formAct.url_foto} onChange={e => setFormAct({...formAct, url_foto: e.target.value})} />
            </div>

            <div>
               <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginBottom: 4, display: 'block' }}>HORAS PROGRAMADAS</label>
               <input type="number" className="input" placeholder="Ej: 12" value={formAct.duracion_programada} onChange={e => setFormAct({...formAct, duracion_programada: e.target.value})} />
            </div>
            <div>
               <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginBottom: 4, display: 'block' }}>HORAS REALES</label>
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
          <button className="btn btn-ghost" onClick={() => setVista('lista')} style={{ width: 'fit-content', fontSize: 11, padding: '4px 8px' }}>← Volver a trabajos</button>
          
          <div className="card-static" style={{ padding: '24px', display: 'flex', gap: 24, alignItems: 'center' }}>
            {selAct.meta?.url_foto && (
               <div style={{ width: 220, height: 140, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={selAct.meta.url_foto} alt="Trabajo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>{selAct.servicioNombre.toUpperCase()}</div>
              <h3 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', marginBottom: 8, lineHeight: 1.2 }}>{selAct.catalogo_competencias?.nombre}</h3>
              <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 16, borderLeft: '3px solid var(--border)', paddingLeft: 12 }}>"{selAct.nombre_actividad}"</div>
              
              <div style={{ display: 'flex', gap: 30, fontSize: 11, color: 'var(--text3)' }}>
                 <div>
                    <strong style={{display: 'block', color: 'var(--text)', marginBottom: 4}}>ESTADO</strong>
                    <span style={{ color: selAct.estado === 'EN PLAZO' ? 'var(--green)' : 'var(--red)', fontWeight: 800 }}>{selAct.estado}</span>
                 </div>
                 <div>
                    <strong style={{display: 'block', color: 'var(--text)', marginBottom: 4}}>HORAS PLANIFICADAS</strong>
                    {selAct.duracion_programada || '—'} hrs
                 </div>
                 <div>
                    <strong style={{display: 'block', color: 'var(--text)', marginBottom: 4}}>HORAS REALES</strong>
                    <span style={{ color: selAct.estado === 'EN PLAZO' ? 'var(--green)' : 'var(--red)', fontWeight: 800 }}>{selAct.duracion_horas || '—'} hrs</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="card-static" style={{ padding: '24px' }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 16, color: 'var(--text)', display: 'flex', justifyContent: 'space-between' }}>
                <span>PERSONAL ASIGNADO AL TRABAJO</span>
                <span style={{ color: 'var(--accent)' }}>Grupo {selAct.meta?.id_grupo} ({personalAsignado.length} técnicos)</span>
            </div>
            
            {personalAsignado.length === 0 ? (
               <div style={{ padding: '30px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px dashed var(--border)', color: 'var(--text3)', fontSize: 12 }}>No hay técnicos registrados en el Grupo {selAct.meta?.id_grupo} para este servicio.</div>
            ) : (
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {personalAsignado.map(p => (
                     <div key={p.dni} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 8 }}>
                        <Avatar nombre={p.nombres_completos} foto={p.url_foto} size={36} />
                        <div style={{ minWidth: 0 }}>
                           <div style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nombres_completos}</div>
                           <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>{p.cargo}</div>
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

      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}>
        {activos.length} activos · {inactivos.length} inactivos · {filtrados.length} total
      </div>

      {/* Lista activos */}
      {activos.length > 0 && (
        <div className="card-static" style={{ overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 600, color: 'var(--text3)', letterSpacing: 0.4 }}>ACTIVOS EN SERVICIO</div>
          {activos.map((a, i) => (
            <div key={a.id_asignacion} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: i < activos.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
              <Avatar nombre={a.nombre} foto={a.foto} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.nombre}</div>
                <div style={{ fontSize: 9, color: 'var(--text3)' }}>{a.cargoNombre} · G{a.id_grupo} · T{a.turno}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setConfirmDni({ id: a.id_asignacion, nombre: a.nombre, accion: 'desactivar' })}
                  style={{ padding: '4px 10px', fontSize: 10, background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 5, color: 'var(--yellow)', cursor: 'pointer', fontFamily: 'Inter' }}>
                  ⏸ Desactivar
                </button>
                <button onClick={() => setConfirmDni({ id: a.id_asignacion, nombre: a.nombre, accion: 'eliminar' })}
                  style={{ padding: '4px 10px', fontSize: 10, background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 5, color: 'var(--red)', cursor: 'pointer', fontFamily: 'Inter' }}>
                  ✕ Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lista inactivos */}
      {inactivos.length > 0 && (
        <div className="card-static" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 600, color: 'var(--text3)', letterSpacing: 0.4 }}>INACTIVOS</div>
          {inactivos.map((a, i) => (
            <div key={a.id_asignacion} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: i < inactivos.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', opacity: 0.55 }}>
              <Avatar nombre={a.nombre} foto={a.foto} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.nombre}</div>
                <div style={{ fontSize: 9, color: 'var(--text3)' }}>{a.cargoNombre} · G{a.id_grupo} · T{a.turno}</div>
              </div>
              <button onClick={() => reactivar(a.id_asignacion)}
                style={{ padding: '4px 10px', fontSize: 10, background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.2)', borderRadius: 5, color: 'var(--green)', cursor: 'pointer', fontFamily: 'Inter' }}>
                ▶ Reactivar
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', maxWidth: 340, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
              {confirmDni.accion === 'desactivar' ? '¿Desactivar del servicio?' : '¿Eliminar del servicio?'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>
              <strong style={{ color: 'var(--text)' }}>{confirmDni.nombre}</strong>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 20 }}>
              {confirmDni.accion === 'desactivar'
                ? 'El trabajador permanecerá en el sistema pero no participará en este servicio.'
                : 'Se eliminará la asignación a este servicio. El trabajador permanece en el sistema.'
              }
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDni(null)} style={{ flex: 1, fontSize: 12 }}>Cancelar</button>
              <button onClick={() => confirmDni.accion === 'desactivar'
                ? desactivar(confirmDni.id, confirmDni.nombre)
                : eliminarAsignacion(confirmDni.id, confirmDni.nombre)}
                style={{ flex: 1, padding: '9px', background: confirmDni.accion === 'desactivar' ? 'var(--yellow)' : 'var(--red)', border: 'none', borderRadius: 8, color: confirmDni.accion === 'desactivar' ? '#000' : 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter' }}>
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
  const estadoBg    = e => e === 'ACTIVO' ? 'rgba(39,174,96,0.08)' : e === 'INACTIVO' ? 'rgba(212,160,23,0.08)' : 'rgba(255,255,255,0.04)'

  if (loading) return <p style={{ color: 'var(--text3)', fontSize: 13 }}>Cargando servicios...</p>

  return (
    <div className="fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{servicios.length} servicios registrados</div>
        <button className="btn btn-primary" onClick={abrirNuevo} style={{ width: 'auto', padding: '8px 18px', fontSize: 12 }}>+ Nuevo servicio</button>
      </div>

      {/* Leyenda de estados */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        {estados.map(e => (
          <div key={e.v} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: e.color }} />
            <span style={{ color: e.color, fontWeight: 600 }}>{e.label}</span>
            <span style={{ color: 'var(--text3)' }}>— {e.desc}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {servicios.map(s => (
          <div key={s.id_servicio} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
            background: s.id_servicio === currentSvcId ? 'rgba(230,126,34,0.04)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${s.id_servicio === currentSvcId ? 'rgba(230,126,34,0.15)' : 'var(--border)'}`,
            borderRadius: 10, opacity: s.estado === 'ARCHIVADO' ? 0.45 : 1,
          }}>
            {/* Estado dot */}
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: estadoColor(s.estado), flexShrink: 0 }} />

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.nombre_descriptivo}</div>
                {s.id_servicio === currentSvcId && <span style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>ACTIVO AHORA</span>}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                {s.cliente} · {s.tipo} · {s.codigo_otp}
                {s.fecha_inicio && ` · ${new Date(s.fecha_inicio).toLocaleDateString('es-PE', { month: 'short', year: 'numeric' })}`}
              </div>
            </div>

            {/* Estado badge */}
            <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 4, background: estadoBg(s.estado), color: estadoColor(s.estado), fontWeight: 600, flexShrink: 0 }}>
              {s.estado}
            </span>

            {/* Acciones rápidas de estado */}
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {s.estado !== 'ACTIVO' && (
                <button onClick={async () => { await supabase.from('servicios').update({ estado: 'ACTIVO' }).eq('id_servicio', s.id_servicio); loadServicios() }}
                  style={{ padding: '3px 8px', fontSize: 9, background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.2)', borderRadius: 4, color: 'var(--green)', cursor: 'pointer', fontFamily: 'Inter' }}>Activar</button>
              )}
              {s.estado !== 'INACTIVO' && (
                <button onClick={async () => { await supabase.from('servicios').update({ estado: 'INACTIVO' }).eq('id_servicio', s.id_servicio); loadServicios() }}
                  style={{ padding: '3px 8px', fontSize: 9, background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 4, color: 'var(--yellow)', cursor: 'pointer', fontFamily: 'Inter' }}>Desactivar</button>
              )}
              {s.estado !== 'ARCHIVADO' && (
                <button onClick={async () => { await supabase.from('servicios').update({ estado: 'ARCHIVADO' }).eq('id_servicio', s.id_servicio); loadServicios() }}
                  style={{ padding: '3px 8px', fontSize: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text3)', cursor: 'pointer', fontFamily: 'Inter' }}>Archivar</button>
              )}
              <button onClick={() => abrirEditar(s)}
                style={{ padding: '3px 8px', fontSize: 9, background: 'rgba(91,164,207,0.08)', border: '1px solid rgba(91,164,207,0.15)', borderRadius: 4, color: 'var(--accent2)', cursor: 'pointer', fontFamily: 'Inter' }}>✏ Editar</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal formulario */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px 26px', width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{editando ? 'Editar servicio' : 'Nuevo servicio'}</div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl2}>CÓDIGO OTP</label>
                  <input className="input" value={form.codigo_otp} placeholder="Ej: PDP-MCB-OXI-MAR-2026"
                    onChange={e => setForm(f => ({...f, codigo_otp: e.target.value.toUpperCase()}))} />
                </div>
                <div>
                  <label style={lbl2}>TIPO</label>
                  <select className="input" value={form.tipo} onChange={e => setForm(f => ({...f, tipo: e.target.value}))} style={{ background: 'var(--bg2)' }}>
                    <option value="PDP">PDP</option>
                    <option value="PROYECTO">PROYECTO</option>
                    <option value="PLANTA">PLANTA</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={lbl2}>NOMBRE DESCRIPTIVO</label>
                <input className="input" value={form.nombre_descriptivo} placeholder="Ej: PARADA DE PLANTA MARCOBRE OXIDOS MARZO 2026"
                  onChange={e => setForm(f => ({...f, nombre_descriptivo: e.target.value}))} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl2}>CLIENTE</label>
                  <input className="input" value={form.cliente} placeholder="Ej: MARCOBRE"
                    onChange={e => setForm(f => ({...f, cliente: e.target.value.toUpperCase()}))} />
                </div>
                <div>
                  <label style={lbl2}>ESTADO</label>
                  <select className="input" value={form.estado} onChange={e => setForm(f => ({...f, estado: e.target.value}))} style={{ background: 'var(--bg2)' }}>
                    <option value="ACTIVO">ACTIVO — visible y operativo</option>
                    <option value="INACTIVO">INACTIVO — aparece en finalizados</option>
                    <option value="ARCHIVADO">ARCHIVADO — no aparece</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl2}>FECHA INICIO</label>
                  <input className="input" type="date" value={form.fecha_inicio} onChange={e => setForm(f => ({...f, fecha_inicio: e.target.value}))} />
                </div>
                <div>
                  <label style={lbl2}>FECHA FIN</label>
                  <input className="input" type="date" value={form.fecha_fin} onChange={e => setForm(f => ({...f, fecha_fin: e.target.value}))} />
                </div>
              </div>

              <div>
                <label style={lbl2}>URL IMAGEN DE FONDO (opcional)</label>
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

const lbl2 = { fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: 0.5, display: 'block', marginBottom: 5 }


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
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14 }}>
        Busca un trabajador del servicio para editar sus datos, cargo o asignación.
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input className="input" placeholder="Buscar por nombre o DNI..." value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && buscar()}
          style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={buscar} disabled={buscando} style={{ width: 'auto', padding: '0 20px', fontSize: 12 }}>
          {buscando ? '...' : 'Buscar'}
        </button>
      </div>

      {msg && <div className="alert alert-ok" style={{ marginBottom: 12 }}>{msg}</div>}

      {resultados.length > 0 && (
        <div className="card-static" style={{ overflow: 'hidden' }}>
          {resultados.map((t, i) => (
            <div key={t.dni} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: i < resultados.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
              <Avatar nombre={t.nombres_completos} foto={t.url_foto} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{t.nombres_completos}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                  DNI: {t.dni} · Cargo max: {t.cargoMaxNombre}
                  {t.asig && ` · Actual: ${t.cargoActualNombre} · G${t.asig.id_grupo} T${t.asig.turno}`}
                </div>
              </div>
              <button onClick={() => abrirEditar(t)} style={{ padding: '5px 12px', fontSize: 11, background: 'rgba(91,164,207,0.08)', border: '1px solid rgba(91,164,207,0.2)', borderRadius: 6, color: 'var(--accent2)', cursor: 'pointer', fontFamily: 'Inter' }}>
                ✏ Editar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal edición */}
      {editando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px', width: '100%', maxWidth: 460 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Editar — {editando.nombres_completos}</div>
              <button onClick={() => setEditando(null)} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              <div>
                <label style={lbl3}>NOMBRE COMPLETO</label>
                <input className="input" value={form.nombres_completos} onChange={e => setForm(f => ({...f, nombres_completos: e.target.value}))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl3}>CARGO MÁXIMO (perfil)</label>
                  <select className="input" value={form.cargo_max_id} onChange={e => setForm(f => ({...f, cargo_max_id: e.target.value}))} style={{ background: 'var(--bg2)' }}>
                    {cargos.map(c => <option key={c.id_cargo} value={c.id_cargo} style={{ background: '#0c0c10' }}>{c.nombre_oficial}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl3}>CARGO EN ESTE SERVICIO</label>
                  <select className="input" value={form.id_cargo_actual} onChange={e => setForm(f => ({...f, id_cargo_actual: e.target.value}))} style={{ background: 'var(--bg2)' }}>
                    {cargos.map(c => <option key={c.id_cargo} value={c.id_cargo} style={{ background: '#0c0c10' }}>{c.nombre_oficial}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl3}>TURNO</label>
                  <select className="input" value={form.turno} onChange={e => setForm(f => ({...f, turno: e.target.value}))} style={{ background: 'var(--bg2)' }}>
                    <option value="A">Turno A</option>
                    <option value="B">Turno B</option>
                  </select>
                </div>
                <div>
                  <label style={lbl3}>GRUPO</label>
                  <input className="input" value={form.id_grupo} onChange={e => setForm(f => ({...f, id_grupo: e.target.value}))} placeholder="Ej: 1, MASTER" />
                </div>
              </div>
              <div>
                <label style={lbl3}>URL FOTO (opcional)</label>
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
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{items.length} competencias en catálogo</div>
        <button className="btn btn-primary" onClick={abrirNuevo} style={{ width: 'auto', padding: '8px 18px', fontSize: 12 }}>+ Nueva competencia</button>
      </div>

      {Object.entries(grouped).map(([cat, comps]) => (
        <div key={cat} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', letterSpacing: 0.8 }}>{cat}</div>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <div style={{ fontSize: 9, color: 'var(--text3)' }}>{comps.length}</div>
          </div>
          <div className="card-static" style={{ overflow: 'hidden' }}>
            {comps.map((comp, i) => (
              <div key={comp.id_competencia} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < comps.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: critColor(comp.nivel_criticidad), flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{comp.nombre}</div>
                  {comp.equipo_asociado && <div style={{ fontSize: 10, color: 'var(--text3)' }}>{comp.equipo_asociado}</div>}
                </div>
                <div style={{ fontSize: 9, color: critColor(comp.nivel_criticidad), fontWeight: 600 }}>
                  {criticidades.find(c => c.v === comp.nivel_criticidad)?.l}
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button onClick={() => abrirEditar(comp)} style={{ padding: '3px 9px', fontSize: 10, background: 'rgba(91,164,207,0.08)', border: '1px solid rgba(91,164,207,0.2)', borderRadius: 5, color: 'var(--accent2)', cursor: 'pointer', fontFamily: 'Inter' }}>✏</button>
                  <button onClick={() => setConfirmDel(comp)} style={{ padding: '3px 9px', fontSize: 10, background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.15)', borderRadius: 5, color: 'var(--red)', cursor: 'pointer', fontFamily: 'Inter' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Modal */}
      {editando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px', width: '100%', maxWidth: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{editando === 'nuevo' ? 'Nueva competencia' : 'Editar competencia'}</div>
              <button onClick={() => setEditando(null)} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              <div><label style={lbl3}>NOMBRE *</label><input className="input" value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value}))} placeholder="Ej: CAMBIO DE CONCAVOS EN CHANCADORA PRIMARIA" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl3}>CATEGORÍA</label>
                  <select className="input" value={form.categoria} onChange={e => setForm(f => ({...f, categoria: e.target.value}))} style={{ background: 'var(--bg2)' }}>
                    {categorias.map(cat => <option key={cat} value={cat} style={{ background: '#0c0c10' }}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl3}>CRITICIDAD</label>
                  <select className="input" value={form.nivel_criticidad} onChange={e => setForm(f => ({...f, nivel_criticidad: e.target.value}))} style={{ background: 'var(--bg2)' }}>
                    {criticidades.map(c => <option key={c.v} value={c.v} style={{ background: '#0c0c10' }}>{c.v} — {c.l}</option>)}
                  </select>
                </div>
              </div>
              <div><label style={lbl3}>EQUIPO ASOCIADO</label><input className="input" value={form.equipo_asociado} onChange={e => setForm(f => ({...f, equipo_asociado: e.target.value}))} placeholder="Ej: Chancadora HP400" /></div>
              <div><label style={lbl3}>DESCRIPCIÓN</label><textarea className="input" value={form.descripcion} onChange={e => setForm(f => ({...f, descripcion: e.target.value}))} rows={2} placeholder="Descripción breve..." style={{ resize: 'vertical' }} /></div>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', maxWidth: 320, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>¿Eliminar competencia?</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}><strong style={{ color: 'var(--text)' }}>{confirmDel.nombre}</strong></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDel(null)} style={{ flex: 1 }}>Cancelar</button>
              <button onClick={() => eliminar(confirmDel.id_competencia)} style={{ flex: 1, padding: '9px', background: 'var(--red)', border: 'none', borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter' }}>Eliminar</button>
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
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 16 }}>
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
              <div key={act.id_actividad} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 10 }}>
                {meta.url_foto ? (
                  <img src={meta.url_foto} alt="" style={{ width: 56, height: 56, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: 6, background: 'rgba(230,126,34,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🔧</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.nombre_actividad}</div>
                  <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 1 }}>{act.catalogo_competencias?.nombre}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                    Prog: {act.duracion_programada || '—'}h · Real: {act.duracion_horas || '—'}h · G{meta.id_grupo}
                    <span style={{ marginLeft: 8, color: act.estado === 'EN PLAZO' ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{act.estado}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => abrirEditar(act)} style={{ padding: '4px 10px', fontSize: 10, background: 'rgba(91,164,207,0.08)', border: '1px solid rgba(91,164,207,0.2)', borderRadius: 5, color: 'var(--accent2)', cursor: 'pointer', fontFamily: 'Inter' }}>✏ Editar</button>
                  <button onClick={() => setConfirmDel(act)} style={{ padding: '4px 10px', fontSize: 10, background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.15)', borderRadius: 5, color: 'var(--red)', cursor: 'pointer', fontFamily: 'Inter' }}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal edición */}
      {editando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Editar actividad</div>
              <button onClick={() => setEditando(null)} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              <div><label style={lbl3}>DESCRIPCIÓN DEL TRABAJO</label><input className="input" value={form.nombre_actividad} onChange={e => setForm(f => ({...f, nombre_actividad: e.target.value}))} /></div>
              <div>
                <label style={lbl3}>COMPETENCIA / TIPO DE TRABAJO</label>
                <select className="input" value={form.id_competencia} onChange={e => setForm(f => ({...f, id_competencia: e.target.value}))} style={{ background: 'var(--bg2)' }}>
                  <option value="">— Sin competencia —</option>
                  {comps.map(c => <option key={c.id_competencia} value={c.id_competencia} style={{ background: '#0c0c10' }}>{c.nombre}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div><label style={lbl3}>H. PROGRAMADAS</label><input className="input" type="number" value={form.duracion_programada} onChange={e => setForm(f => ({...f, duracion_programada: e.target.value}))} /></div>
                <div><label style={lbl3}>H. REALES</label><input className="input" type="number" value={form.duracion_horas} onChange={e => setForm(f => ({...f, duracion_horas: e.target.value}))} /></div>
                <div>
                  <label style={lbl3}>ESTADO</label>
                  <select className="input" value={form.estado} onChange={e => setForm(f => ({...f, estado: e.target.value}))} style={{ background: 'var(--bg2)' }}>
                    <option value="EN PLAZO">EN PLAZO</option>
                    <option value="RETRASO">RETRASO</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={lbl3}>GRUPO ASIGNADO</label><input className="input" value={form.id_grupo} onChange={e => setForm(f => ({...f, id_grupo: e.target.value}))} placeholder="Ej: 1" /></div>
                <div>
                  <label style={lbl3}>URL FOTO</label>
                  <input className="input" value={form.url_foto} onChange={e => setForm(f => ({...f, url_foto: e.target.value}))} placeholder="https://..." />
                </div>
              </div>
              <div><label style={lbl3}>LECCIONES APRENDIDAS</label><textarea className="input" value={form.lecciones_aprendidas} onChange={e => setForm(f => ({...f, lecciones_aprendidas: e.target.value}))} rows={3} style={{ resize: 'vertical' }} /></div>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', maxWidth: 320, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>¿Eliminar esta actividad?</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}><strong style={{ color: 'var(--text)' }}>{confirmDel.nombre_actividad}</strong></div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 20 }}>Se eliminará también todo el detalle asociado.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDel(null)} style={{ flex: 1 }}>Cancelar</button>
              <button onClick={() => eliminar(confirmDel.id_actividad)} style={{ flex: 1, padding: '9px', background: 'var(--red)', border: 'none', borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const lbl3 = { fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: 0.5, display: 'block', marginBottom: 5 }


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
  const sc = v => !v && v!==0 ? 'var(--text3)' : v>=3 ? 'var(--green)' : v>=1.6 ? 'var(--yellow)' : 'var(--red)'

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

    // Agrupar por evaluador (usar dni_evaluador o 'SIN_IDENTIFICAR' si es null)
    const grupos = {}
    evals.forEach(e => {
      const key = e.dni_evaluador || 'SIN_DNI_' + (e.id_evaluacion % 100)
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
      const verdesPorc = Math.round(proms.filter(p => p >= 3).length / proms.length * 100)
      const rojaPorc   = Math.round(proms.filter(p => p < 1.6).length / proms.length * 100)
      const diff = r2(notaMedia - globalAvg)

      // Clasificación del perfil evaluador
      let perfil, perfilColor, perfilIcon
      if (diff > 0.4) {
        perfil = 'Muy permisivo'; perfilColor = '#E67E22'; perfilIcon = '😊'
      } else if (diff > 0.15) {
        perfil = 'Permisivo'; perfilColor = '#D4A017'; perfilIcon = '🙂'
      } else if (diff < -0.4) {
        perfil = 'Muy estricto'; perfilColor = 'var(--red)'; perfilIcon = '😤'
      } else if (diff < -0.15) {
        perfil = 'Estricto'; perfilColor = '#E8A09A'; perfilIcon = '🤨'
      } else {
        perfil = 'Calibrado'; perfilColor = 'var(--green)'; perfilIcon = '✅'
      }

      return {
        dni, username: userMap[dni] || '—',
        nombre: nombresMap[dni] || dni,
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 10 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600, letterSpacing: 0.4 }}>PROMEDIO GLOBAL SERVICIO</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: sc(globalProm), fontFamily: 'monospace', lineHeight: 1.2 }}>{globalProm}</div>
          <div style={{ fontSize: 9, color: 'var(--text3)' }}>línea base para comparar</div>
        </div>
        <div style={{ flex: 1, fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>
          Los evaluadores con diferencia <span style={{ color: '#E67E22', fontWeight: 600 }}>mayor a +0.15</span> tienden a calificar por encima del promedio (<em>permisivos</em>). Los que tienen <span style={{ color: 'var(--red)', fontWeight: 600 }}>menor a -0.15</span> califican más bajo (<em>estrictos</em>). El rango calibrado está entre ±0.15.
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600 }}>EVALUADORES</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent2)', fontFamily: 'monospace' }}>{datos.length}</div>
        </div>
      </div>

      {/* Lista evaluadores */}
      <div className="card-static" style={{ overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px 70px 70px 110px', gap: 8, padding: '8px 16px', borderBottom: '1px solid var(--border)', fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: 0.3 }}>
          <div>EVALUADOR</div>
          <div style={{ textAlign: 'center' }}>EVALS</div>
          <div style={{ textAlign: 'center' }}>MEDIA</div>
          <div style={{ textAlign: 'center' }}>vs GLOBAL</div>
          <div style={{ textAlign: 'center' }}>% VERDE</div>
          <div style={{ textAlign: 'center' }}>PERFIL</div>
        </div>
        {datos.map((ev, i) => (
          <div key={ev.dni}
            onClick={() => abrirDetalle(ev)}
            style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px 70px 70px 110px', gap: 8, padding: '11px 16px', alignItems: 'center', borderBottom: i < datos.length-1 ? '1px solid rgba(255,255,255,0.03)' : 'none', cursor: 'pointer', background: sel?.dni === ev.dni ? 'rgba(255,255,255,0.02)' : 'transparent', transition: 'background 0.15s' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{ev.nombre.split(' ').slice(0,3).join(' ')}</div>
              <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'monospace' }}>{ev.username}</div>
            </div>
            <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--accent2)' }}>{ev.total}</div>
            <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 800, color: sc(ev.notaMedia), fontFamily: 'monospace' }}>{ev.notaMedia}</div>
            <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: ev.diff > 0 ? '#E67E22' : ev.diff < 0 ? 'var(--red)' : 'var(--text3)' }}>
              {ev.diff > 0 ? '+' : ''}{ev.diff}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>{ev.verdesPorc}%</div>
              {ev.rojaPorc > 0 && <div style={{ fontSize: 9, color: 'var(--red)' }}>{ev.rojaPorc}% riesgo</div>}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: ev.perfilColor, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                <span>{ev.perfilIcon}</span>{ev.perfil}
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
              <div style={{ fontSize: 11, color: sel.perfilColor, fontWeight: 600 }}>{sel.perfilIcon} {sel.perfil} · Promedio: {sel.notaMedia} · σ {sel.desviacion}</div>
            </div>
            <button onClick={() => setSel(null)} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 18, cursor: 'pointer' }}>×</button>
          </div>

          {/* Barra de distribución */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600, marginBottom: 6 }}>DISTRIBUCIÓN DE NOTAS</div>
            <div style={{ display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden', gap: 1 }}>
              {[
                { label: 'Riesgo <1.6', val: sel.evs.filter(e=>parseFloat(e.promedio)<1.6).length, color: 'var(--red)' },
                { label: 'Aceptable 1.6-3', val: sel.evs.filter(e=>parseFloat(e.promedio)>=1.6&&parseFloat(e.promedio)<3).length, color: 'var(--yellow)' },
                { label: 'Óptimo ≥3', val: sel.evs.filter(e=>parseFloat(e.promedio)>=3).length, color: 'var(--green)' },
              ].map(b => b.val > 0 && (
                <div key={b.label} title={`${b.label}: ${b.val}`} style={{ flex: b.val, background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.6)' }}>
                  {b.val > 0 && b.val}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 5 }}>
              <span style={{ fontSize: 9, color: 'var(--red)' }}>■ Riesgo: {sel.evs.filter(e=>parseFloat(e.promedio)<1.6).length}</span>
              <span style={{ fontSize: 9, color: 'var(--yellow)' }}>■ Aceptable: {sel.evs.filter(e=>parseFloat(e.promedio)>=1.6&&parseFloat(e.promedio)<3).length}</span>
              <span style={{ fontSize: 9, color: 'var(--green)' }}>■ Óptimo: {sel.evs.filter(e=>parseFloat(e.promedio)>=3).length}</span>
            </div>
          </div>

          {/* Últimas evaluaciones */}
          <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600, marginBottom: 8 }}>ÚLTIMAS {detalle.length} EVALUACIONES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {detalle.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: sc(e.promedio), fontFamily: 'monospace', width: 36 }}>{e.promedio}</div>
                <div style={{ flex: 1, fontSize: 11, color: 'var(--text2)' }}>{e.cargo_momento || '—'}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[e.nota_1, e.nota_2, e.nota_3, e.nota_4].map((n, ni) => (
                    <div key={ni} style={{ width: 20, height: 20, borderRadius: 4, background: n>=3?'rgba(39,174,96,0.25)':n>=1.6?'rgba(212,160,23,0.25)':'rgba(192,57,43,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: n>=3.5?'var(--green)':n>=2.0?'var(--yellow)':'var(--red)' }}>{n}</div>
                  ))}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text3)' }}>{e.fecha_hora ? new Date(e.fecha_hora).toLocaleDateString('es-PE',{day:'2-digit',month:'short'}) : '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

