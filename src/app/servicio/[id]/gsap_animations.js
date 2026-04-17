// ══════════════════════════════════════════════════════════════
//  GSAP ANIMATIONS — Instrucciones de integración
//  Agrega estas animaciones al archivo servicio/[id]/page.js
// ══════════════════════════════════════════════════════════════
//
// PASO 1: Ya tienes estos imports arriba del archivo:
//   import gsap from 'gsap'
//   import { useGSAP } from '@gsap/react'
//
// PASO 2: En el componente ServicioPage, reemplaza la sección
//   del <main> con la versión animada de abajo.
//
// PASO 3: Reemplaza cada componente hijo con su versión animada.
// ══════════════════════════════════════════════════════════════

// ── A. ServicioPage — animar sidebar y cambio de sección ──────
// 
// Agrega este useEffect en ServicioPage, después de los existentes:
//
// const mainRef = useRef(null)
// const sidebarRef = useRef(null)
// const prevSec = useRef(sec)
//
// useGSAP(() => {
//   // Entrada inicial: sidebar desliza desde la izquierda
//   gsap.from(sidebarRef.current, {
//     x: -210, opacity: 0, duration: 0.6, ease: 'power3.out'
//   })
//   gsap.from(mainRef.current, {
//     opacity: 0, x: 20, duration: 0.5, delay: 0.2, ease: 'power2.out'
//   })
// }, [])
//
// useEffect(() => {
//   // Transición al cambiar sección
//   if (!mainRef.current) return
//   gsap.fromTo(mainRef.current,
//     { opacity: 0, y: 12 },
//     { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
//   )
// }, [sec])
//
// Y agrega ref={sidebarRef} al <aside> y ref={mainRef} al <main>


// ── B. Reemplaza el renderizado del botón de nav con hover animado ──
// En el nav.map del sidebar, cambia cada button para agregar:
//
// onMouseEnter={e => { if (!x.disabled && sec !== x.id) gsap.to(e.currentTarget, { x: 3, duration: 0.15 }) }}
// onMouseLeave={e => gsap.to(e.currentTarget, { x: 0, duration: 0.15 })}


// ── C. Dashboard — reemplaza la función loadAll para animar KPIs ──
// Después del setLoading(false), agrega:
//
// gsap.from('.kpi-value', {
//   textContent: 0,
//   duration: 1.2,
//   ease: 'power1.out',
//   snap: { textContent: 0.01 },
//   stagger: 0.1,
// })
// gsap.from('.card-static', {
//   y: 24, opacity: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out'
// })
//
// Y agrega className="kpi-value" al div del número en KpiCard:
// <div className="kpi-value" style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>


// ══════════════════════════════════════════════════════════════
//  VERSIÓN LISTA PARA PEGAR — ServicioPage con GSAP completo
// ══════════════════════════════════════════════════════════════

// Reemplaza la función ServicioPage con esta versión:

/*
export default function ServicioPage({ params }) {
  const { id } = use(params)
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [svc, setSvc] = useState(null)
  const [sec, setSec] = useState('evaluar')

  const mainRef    = useRef(null)
  const sidebarRef = useRef(null)

  useEffect(() => { if (!loading && !user) router.push('/') }, [user, loading, router])
  useEffect(() => {
    if (!user) return
    supabase.from('servicios').select('*').eq('id_servicio', id).single().then(({ data }) => setSvc(data))
  }, [user, id])

  // Entrada inicial de la página
  useGSAP(() => {
    if (!svc) return
    gsap.from(sidebarRef.current, {
      x: -210, opacity: 0, duration: 0.55, ease: 'power3.out'
    })
    gsap.from(mainRef.current, {
      opacity: 0, x: 16, duration: 0.45, delay: 0.18, ease: 'power2.out'
    })
  }, [svc])

  // Transición al cambiar sección
  useEffect(() => {
    if (!mainRef.current || !svc) return
    gsap.fromTo(mainRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
    )
  }, [sec])

  if (loading || !user || !svc) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 14, height: 14, border: '2px solid #E67E22', borderTopColor: 'transparent', borderRadius: '50%', animation: 'gsapSpin 0.8s linear infinite' }} />
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Cargando...</p>
      </div>
      <style>{`@keyframes gsapSpin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  const n = user.nivel
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
    let allowed = false
    if (n === 1) allowed = true
    else if (n === 2) allowed = (x.id !== 'predictor' && x.id !== 'admin')
    else allowed = (x.id === 'evaluar' || x.id === 'ranking')
    return { ...x, disabled: !allowed }
  })

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside ref={sidebarRef} style={{ width: 210, background: 'rgba(5,5,7,0.98)', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <img src="/logo_prodise.png" alt="PRODISE" style={{ height: 30, objectFit: 'contain', filter: 'drop-shadow(0 0 6px rgba(230,126,34,0.3))' }} />
        </div>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: 11, fontWeight: 600 }}>{user.nombre}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>Nivel {n}</div>
        </div>
        <div style={{ margin: 8, padding: '9px 11px', borderRadius: 7, background: 'rgba(230,126,34,0.04)', border: '1px solid rgba(230,126,34,0.08)' }}>
          <div style={{ fontSize: 9, color: '#E67E22', fontWeight: 600, letterSpacing: 0.3 }}>SERVICIO ACTIVO</div>
          <div style={{ fontSize: 10, fontWeight: 600, marginTop: 2, lineHeight: 1.3 }}>{svc.nombre_descriptivo}</div>
          <span className={`badge ${svc.tipo === 'PDP' ? 'b-pdp' : 'b-pro'}`} style={{ marginTop: 4 }}>{svc.tipo}</span>
        </div>
        <nav style={{ flex: 1, padding: '6px 6px' }}>
          {nav.map(x => (
            <button key={x.id}
              onClick={() => { if (!x.disabled) setSec(x.id) }}
              onMouseEnter={e => { if (!x.disabled && sec !== x.id) gsap.to(e.currentTarget, { x: 3, duration: 0.12, ease: 'power2.out' }) }}
              onMouseLeave={e => gsap.to(e.currentTarget, { x: 0, duration: 0.12 })}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '7px 10px',
                borderRadius: 6, border: 'none', fontSize: 12,
                cursor: x.disabled ? 'not-allowed' : 'pointer',
                opacity: x.disabled ? 0.3 : 1,
                background: sec === x.id ? 'rgba(230,126,34,0.08)' : 'none',
                color: sec === x.id ? '#E67E22' : 'rgba(255,255,255,0.4)',
                fontWeight: sec === x.id ? 600 : 400,
                fontFamily: 'Inter', textAlign: 'left', marginBottom: 1,
              }}>
              <span style={{ fontSize: 13, width: 18, textAlign: 'center' }}>{x.icon}</span>
              <span style={{ flex: 1 }}>{x.label}</span>
              {x.disabled && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>🔒</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding: 8, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <button className="btn btn-ghost" style={{ width: '100%', fontSize: 10 }} onClick={() => router.push('/servicios')}>Cambiar servicio</button>
          <button className="btn btn-ghost" style={{ width: '100%', fontSize: 10 }} onClick={() => { logout(); router.push('/') }}>Cerrar sesión</button>
        </div>
      </aside>

      <main ref={mainRef} style={{ flex: 1, padding: '22px 26px', background: 'var(--bg)', overflowY: 'auto' }}>
        {sec === 'evaluar'   && <Evaluar    svc={svc} user={user} />}
        {sec === 'historial' && <Historial  svc={svc} user={user} />}
        {sec === 'dashboard' && <Dashboard  svc={svc} user={user} />}
        {sec === 'admin'     && <AdminPanel svc={svc} user={user} />}
        {sec === 'ranking'   && <Ranking    svc={svc} user={user} />}
        {sec === 'perfiles'  && <Perfiles   svc={svc} user={user} />}
        {sec === 'buscador'  && <Buscador   svc={svc} user={user} />}
        {sec === 'predictor' && <Predictor  svc={svc} user={user} />}
        {sec === 'bitacora'  && <Bitacora   svc={svc} user={user} />}
      </main>
    </div>
  )
}
*/

// ── D. KpiCard animado (reemplaza el existente) ──────────────
/*
function KpiCard({ label, value, sub, color }) {
  const numRef = useRef(null)

  useGSAP(() => {
    if (numRef.current && typeof value === 'number') {
      gsap.from(numRef.current, {
        textContent: 0, duration: 1.0, ease: 'power2.out',
        snap: { textContent: 1 },
        onUpdate() { if(numRef.current) numRef.current.textContent = Math.round(parseFloat(numRef.current.textContent)) }
      })
    }
  }, [value])

  return (
    <div className="card-static" style={{ padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, fontWeight: 500 }}>{label}</div>
      <div ref={numRef} style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text3)' }}>{sub}</div>
    </div>
  )
}
*/

// ── E. Podio animado (reemplaza el Podio existente) ──────────
/*
function Podio({ items, medalColor, scoreColor }) {
  const podioRef = useRef(null)

  useGSAP(() => {
    if (!podioRef.current) return
    const cards = podioRef.current.children
    gsap.from(cards, {
      y: 60, opacity: 0, scale: 0.9,
      duration: 0.6, stagger: 0.12, ease: 'back.out(1.5)',
      delay: 0.1,
    })
  }, [items])

  const orden = [items[1], items[0], items[2]].filter(Boolean)
  return (
    <div ref={podioRef} style={{ display: 'flex', alignItems: 'flex-end', gap: 14, justifyContent: 'center' }}>
      {orden.map((p, vi) => {
        const pos = vi === 0 ? 2 : vi === 1 ? 1 : 3
        const isFirst = pos === 1
        return (
          <div key={p.id_asignacion}
            onMouseEnter={e => gsap.to(e.currentTarget, { y: -4, scale: 1.02, duration: 0.2, ease: 'power2.out' })}
            onMouseLeave={e => gsap.to(e.currentTarget, { y: 0, scale: 1, duration: 0.2 })}
            style={{ flex: isFirst ? 1.15 : 1, minWidth: 0, height: isFirst ? 210 : 175, background: isFirst ? 'rgba(255,215,0,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isFirst ? 'rgba(255,215,0,0.22)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 14, padding: '20px 16px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, position: 'relative', textAlign: 'center', boxShadow: isFirst ? '0 0 24px rgba(255,215,0,0.07)' : 'none', cursor: 'default' }}>
            <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', width: 28, height: 28, borderRadius: '50%', background: medalColor(pos), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: pos === 1 ? '#111' : '#fff', boxShadow: `0 2px 10px ${medalColor(pos)}66` }}>{pos}°</div>
            <Avatar nombre={p.nombre} foto={p.foto} size={isFirst ? 66 : 52} />
            <div style={{ width: '100%' }}>
              <div style={{ fontSize: isFirst ? 13 : 12, fontWeight: 700, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre.split(' ').slice(0, 2).join(' ')}</div>
              {p.cargoNombre && <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 500, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.cargoNombre}</div>}
              <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>G{p.id_grupo} · T{p.turno}</div>
            </div>
            <div style={{ fontSize: isFirst ? 30 : 24, fontWeight: 900, color: scoreColor(p.notaFinal), lineHeight: 1 }}>{p.notaFinal}</div>
          </div>
        )
      })}
    </div>
  )
}
*/
