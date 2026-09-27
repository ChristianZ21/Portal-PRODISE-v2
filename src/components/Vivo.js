'use client'
// Piezas de interacción "viva" al estilo iOS. Todas son solo presentación:
// no leen ni escriben datos, respetan prefers-reduced-motion y se pueden
// interrumpir en cualquier momento (las transiciones parten del valor actual).
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

function movimientoReducido() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Toque háptico breve en Android (iOS Safari lo ignora).
export function haptica(ms = 8) {
  try { if (!movimientoReducido()) navigator.vibrate?.(ms) } catch {}
}

/* ───────────────────────────────────────────────────────────────
   Deslizador: indicador que viaja con muelle hasta el elemento activo.
   Se coloca como primer hijo de un control segmentado o de una lista de
   navegación; observa la clase `.is-active` de sus hermanos.
   ─────────────────────────────────────────────────────────────── */
export function Deslizador({ activo = '.is-active', className = '' }) {
  const ref = useRef(null)
  useIsoLayoutEffect(() => {
    const thumb = ref.current
    const parent = thumb?.parentElement
    if (!parent) return
    let primero = true
    let anterior = null
    const colocar = () => {
      const a = parent.querySelector(`:scope > ${activo}, :scope > * > ${activo}`)
      if (!a) { thumb.style.opacity = '0'; return }
      const pr = parent.getBoundingClientRect()
      const r = a.getBoundingClientRect()
      if (primero) thumb.style.transition = 'none'
      thumb.style.opacity = '1'
      thumb.style.width = `${r.width}px`
      thumb.style.height = `${r.height}px`
      thumb.style.transform = `translate(${r.left - pr.left + parent.scrollLeft}px, ${r.top - pr.top + parent.scrollTop}px)`
      if (primero) { thumb.getBoundingClientRect(); thumb.style.transition = ''; primero = false }
      else if (anterior !== a) haptica(6)
      anterior = a
    }
    colocar()
    const mo = new MutationObserver(colocar)
    mo.observe(parent, { attributes: true, subtree: true, attributeFilter: ['class'] })
    const ro = new ResizeObserver(colocar)
    ro.observe(parent)
    return () => { mo.disconnect(); ro.disconnect() }
  }, [activo])
  return <span ref={ref} aria-hidden="true" className={`thumb ${className}`} />
}

/* ───────────────────────────────────────────────────────────────
   Contador: las cifras de un texto suben desde 0 con un muelle
   críticamente amortiguado. "8/12", "3.10" o "67 %" conservan formato.
   ─────────────────────────────────────────────────────────────── */
const NUM = /-?\d+(?:[.,]\d+)?/g
function escalar(texto, f) {
  return texto.replace(NUM, m => {
    const dec = (m.split(/[.,]/)[1] || '').length
    const v = parseFloat(m.replace(',', '.')) * f
    const s = v.toFixed(dec)
    return m.includes(',') ? s.replace('.', ',') : s
  })
}
export function Contador({ valor, duracion = 900 }) {
  const texto = valor == null ? '' : String(valor)
  const animable = NUM.test(texto)
  NUM.lastIndex = 0
  const [salida, setSalida] = useState(() => (animable && !movimientoReducido() ? escalar(texto, 0) : texto))
  useEffect(() => {
    if (!animable || movimientoReducido()) { setSalida(texto); return }
    const w = (2 * Math.PI) / (duracion / 1000 * 0.62)
    let raf, t0
    const paso = now => {
      if (t0 === undefined) t0 = now
      const t = (now - t0) / 1000
      const f = t * 1000 >= duracion ? 1 : 1 - (1 + w * t) * Math.exp(-w * t)
      setSalida(escalar(texto, f))
      if (f < 1) raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
  }, [texto, animable, duracion])
  return <span className="num" aria-label={texto}>{salida}</span>
}

/* ───────────────────────────────────────────────────────────────
   BarraScroll: marca su barra contenedora con
   data-scrolled  → el contenido pasa por debajo (aparece el material)
   data-compact   → el título grande salió de la vista (aparece el título pequeño)
   ─────────────────────────────────────────────────────────────── */
export function BarraScroll({ contenedor, titulo = '.page-title', dep }) {
  const ref = useRef(null)
  useEffect(() => {
    const barra = ref.current?.parentElement
    if (!barra) return
    const sc = contenedor ? document.querySelector(contenedor) : window
    if (!sc) return
    let raf = 0
    const medir = () => {
      raf = 0
      const y = sc === window ? window.scrollY : sc.scrollTop
      barra.dataset.scrolled = y > 4 ? 'true' : 'false'
      const t = (sc === window ? document : sc).querySelector(titulo)
      const limite = barra.getBoundingClientRect().bottom
      barra.dataset.compact = t && t.getBoundingClientRect().bottom < limite + 4 ? 'true' : 'false'
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(medir) }
    medir()
    const tardio = setTimeout(medir, 600)
    sc.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { sc.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); clearTimeout(tardio); cancelAnimationFrame(raf) }
  }, [contenedor, titulo, dep])
  return <span ref={ref} hidden />
}

/* ───────────────────────────────────────────────────────────────
   GestoCajon: en móvil, el menú lateral abierto sigue al dedo 1:1,
   ofrece resistencia elástica hacia la derecha y, al soltar, proyecta
   la inercia para decidir si se cierra (misma función que usa iOS).
   ─────────────────────────────────────────────────────────────── */
function proyectar(v, d = 0.998) { return (v / 1000) * d / (1 - d) }
function elastico(x, dim, c = 0.55) { return (x * dim * c) / (dim + c * Math.abs(x)) }

export function GestoCajon({ abierto, onCerrar, selector = '.sidebar', velo = '.sidebar-scrim' }) {
  useEffect(() => {
    if (!abierto || !window.matchMedia('(max-width: 768px)').matches) return
    const aside = document.querySelector(selector)
    if (!aside) return
    let inicio = null, dx = 0, historial = [], arrastrando = false

    const abajo = e => {
      if (e.pointerType === 'mouse') return
      inicio = { x: e.clientX, y: e.clientY }; dx = 0; historial = [{ x: e.clientX, t: e.timeStamp }]; arrastrando = false
    }
    const mover = e => {
      if (!inicio) return
      const ddx = e.clientX - inicio.x, ddy = e.clientY - inicio.y
      if (!arrastrando) {
        if (Math.abs(ddx) < 10 || Math.abs(ddx) < Math.abs(ddy)) return
        arrastrando = true
        aside.style.transition = 'none'
      }
      dx = ddx
      historial.push({ x: e.clientX, t: e.timeStamp }); if (historial.length > 6) historial.shift()
      const w = aside.offsetWidth
      const x = dx > 0 ? elastico(dx, w) : dx
      // !important: la clase .sidebar-open fija la posición con !important
      aside.style.setProperty('transform', `translateX(${x}px)`, 'important')
      const v = document.querySelector(velo); if (v) v.style.opacity = String(Math.max(0, 1 + Math.min(0, dx) / w))
    }
    const arriba = () => {
      if (!inicio) return
      const eraArrastre = arrastrando
      inicio = null; arrastrando = false
      if (!eraArrastre) return
      const a = historial[0], b = historial[historial.length - 1]
      const vel = b && a && b.t > a.t ? ((b.x - a.x) / (b.t - a.t)) * 1000 : 0
      const destino = dx + proyectar(vel, 0.99)
      aside.style.transition = ''
      aside.style.removeProperty('transform')
      const v = document.querySelector(velo); if (v) v.style.opacity = ''
      if (destino < -aside.offsetWidth / 2) { haptica(10); onCerrar?.() }
    }
    aside.addEventListener('pointerdown', abajo)
    window.addEventListener('pointermove', mover, { passive: true })
    window.addEventListener('pointerup', arriba)
    window.addEventListener('pointercancel', arriba)
    const veloEl = document.querySelector(velo)
    veloEl?.addEventListener('pointerdown', abajo)
    return () => {
      aside.removeEventListener('pointerdown', abajo)
      veloEl?.removeEventListener('pointerdown', abajo)
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', arriba)
      window.removeEventListener('pointercancel', arriba)
      aside.style.transition = ''; aside.style.removeProperty('transform')
    }
  }, [abierto, onCerrar, selector, velo])
  return null
}
