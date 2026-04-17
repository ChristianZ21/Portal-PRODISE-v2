'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

// ════════════════════════════════════════════════
//  USUARIO MAESTRO — no requiere base de datos
//  Cambia las credenciales cuando quieras
// ════════════════════════════════════════════════
const MASTER = {
  username: 'MASTER',
  password: 'prodise2026',
  perfil: {
    username: 'MASTER',
    nombre:   'Administrador del Sistema',
    nivel:    1,
    dni:      null,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const s = sessionStorage.getItem('prodise_user')
      if (s) setUser(JSON.parse(s))
    } catch {}
    setLoading(false)
  }, [])

  async function login(username, password) {
    const uUp = username.toUpperCase()

    // 1. Usuario maestro — no toca la BD
    if (uUp === MASTER.username && password === MASTER.password) {
      sessionStorage.setItem('prodise_user', JSON.stringify(MASTER.perfil))
      setUser(MASTER.perfil)
      return { success: true }
    }

    // 2. Login normal contra Supabase
    try {
      // Calcular hash MD5 del password (igual que el SQL de setup)
      const hash = md5(password)

      const { data, error } = await supabase
        .from('usuarios_sistema')
        .select(`
          username, nivel_acceso, dni_asociado, estado, intentos_fallidos,
          trabajadores (nombres_completos)
        `)
        .eq('username', uUp)
        .eq('password_hash', hash)
        .eq('estado', 'ACTIVO')
        .single()

      if (error || !data) {
        // Incrementar intentos fallidos si el usuario existe
        await supabase
          .from('usuarios_sistema')
          .update({ intentos_fallidos: supabase.rpc('coalesce', {}) })
          .eq('username', uUp)
          .catch(() => {})
        return { success: false, error: 'Usuario o contraseña incorrectos' }
      }

      const userData = {
        username: data.username,
        nombre:   data.trabajadores?.nombres_completos || data.username,
        nivel:    data.nivel_acceso,
        dni:      data.dni_asociado,
      }

      // Actualizar último login
      await supabase
        .from('usuarios_sistema')
        .update({ ultimo_login: new Date().toISOString(), intentos_fallidos: 0 })
        .eq('username', uUp)
        .catch(() => {})

      // Audit log
      await supabase
        .from('audit_log')
        .insert({ username: uUp, accion: 'LOGIN', tabla_afectada: 'usuarios_sistema', detalle: 'Login exitoso' })
        .catch(() => {})

      sessionStorage.setItem('prodise_user', JSON.stringify(userData))
      setUser(userData)
      return { success: true }

    } catch (err) {
      return { success: false, error: 'Error de conexión con el servidor' }
    }
  }

  function logout() {
    sessionStorage.removeItem('prodise_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

// ── MD5 puro en JS (sin dependencias externas) ──────────────────────────────
// Genera el mismo hash que Python's hashlib.md5(str).hexdigest()
function md5(input) {
  function safeAdd(x, y) {
    const lsw = (x & 0xFFFF) + (y & 0xFFFF)
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16)
    return (msw << 16) | (lsw & 0xFFFF)
  }
  function rol(n, c) { return (n << c) | (n >>> (32 - c)) }
  function cmn(q, a, b, x, s, t) { return safeAdd(rol(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b) }
  function ff(a,b,c,d,x,s,t){return cmn((b&c)|((~b)&d),a,b,x,s,t)}
  function gg(a,b,c,d,x,s,t){return cmn((b&d)|(c&(~d)),a,b,x,s,t)}
  function hh(a,b,c,d,x,s,t){return cmn(b^c^d,a,b,x,s,t)}
  function ii(a,b,c,d,x,s,t){return cmn(c^(b|(~d)),a,b,x,s,t)}

  const str8 = unescape(encodeURIComponent(input))
  const x = []
  for (let i = 0; i < str8.length; i += 4)
    x[i >> 2] = str8.charCodeAt(i) + (str8.charCodeAt(i+1) << 8) + (str8.charCodeAt(i+2) << 16) + (str8.charCodeAt(i+3) << 24)
  const l = str8.length
  x[l >> 2] |= 0x80 << ((l % 4) * 8)
  x[(((l + 64) >>> 9) << 4) + 14] = l * 8
  let [a, b, c, d] = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476]
  for (let i = 0; i < x.length; i += 16) {
    const [A, B, C, D] = [a, b, c, d]
    a=ff(a,b,c,d,x[i+0],7,-680876936);d=ff(d,a,b,c,x[i+1],12,-389564586);c=ff(c,d,a,b,x[i+2],17,606105819);b=ff(b,c,d,a,x[i+3],22,-1044525330)
    a=ff(a,b,c,d,x[i+4],7,-176418897);d=ff(d,a,b,c,x[i+5],12,1200080426);c=ff(c,d,a,b,x[i+6],17,-1473231341);b=ff(b,c,d,a,x[i+7],22,-45705983)
    a=ff(a,b,c,d,x[i+8],7,1770035416);d=ff(d,a,b,c,x[i+9],12,-1958414417);c=ff(c,d,a,b,x[i+10],17,-42063);b=ff(b,c,d,a,x[i+11],22,-1990404162)
    a=ff(a,b,c,d,x[i+12],7,1804603682);d=ff(d,a,b,c,x[i+13],12,-40341101);c=ff(c,d,a,b,x[i+14],17,-1502002290);b=ff(b,c,d,a,x[i+15],22,1236535329)
    a=gg(a,b,c,d,x[i+1],5,-165796510);d=gg(d,a,b,c,x[i+6],9,-1069501632);c=gg(c,d,a,b,x[i+11],14,643717713);b=gg(b,c,d,a,x[i+0],20,-373897302)
    a=gg(a,b,c,d,x[i+5],5,-701558691);d=gg(d,a,b,c,x[i+10],9,38016083);c=gg(c,d,a,b,x[i+15],14,-660478335);b=gg(b,c,d,a,x[i+4],20,-405537848)
    a=gg(a,b,c,d,x[i+9],5,568446438);d=gg(d,a,b,c,x[i+14],9,-1019803690);c=gg(c,d,a,b,x[i+3],14,-187363961);b=gg(b,c,d,a,x[i+8],20,1163531501)
    a=gg(a,b,c,d,x[i+13],5,-1444681467);d=gg(d,a,b,c,x[i+2],9,-51403784);c=gg(c,d,a,b,x[i+7],14,1735328473);b=gg(b,c,d,a,x[i+12],20,-1926607734)
    a=hh(a,b,c,d,x[i+5],4,-378558);d=hh(d,a,b,c,x[i+8],11,-2022574463);c=hh(c,d,a,b,x[i+11],16,1839030562);b=hh(b,c,d,a,x[i+14],23,-35309556)
    a=hh(a,b,c,d,x[i+1],4,-1530992060);d=hh(d,a,b,c,x[i+4],11,1272893353);c=hh(c,d,a,b,x[i+7],16,-155497632);b=hh(b,c,d,a,x[i+10],23,-1094730640)
    a=hh(a,b,c,d,x[i+13],4,681279174);d=hh(d,a,b,c,x[i+0],11,-358537222);c=hh(c,d,a,b,x[i+3],16,-722521979);b=hh(b,c,d,a,x[i+6],23,76029189)
    a=hh(a,b,c,d,x[i+9],4,-640364487);d=hh(d,a,b,c,x[i+12],11,-421815835);c=hh(c,d,a,b,x[i+15],16,530742520);b=hh(b,c,d,a,x[i+2],23,-995338651)
    a=ii(a,b,c,d,x[i+0],6,-198630844);d=ii(d,a,b,c,x[i+7],10,1126891415);c=ii(c,d,a,b,x[i+14],15,-1416354905);b=ii(b,c,d,a,x[i+5],21,-57434055)
    a=ii(a,b,c,d,x[i+12],6,1700485571);d=ii(d,a,b,c,x[i+3],10,-1894986606);c=ii(c,d,a,b,x[i+10],15,-1051523);b=ii(b,c,d,a,x[i+1],21,-2054922799)
    a=ii(a,b,c,d,x[i+8],6,1873313359);d=ii(d,a,b,c,x[i+15],10,-30611744);c=ii(c,d,a,b,x[i+6],15,-1560198380);b=ii(b,c,d,a,x[i+13],21,1309151649)
    a=ii(a,b,c,d,x[i+4],6,-145523070);d=ii(d,a,b,c,x[i+11],10,-1120210379);c=ii(c,d,a,b,x[i+2],15,718787259);b=ii(b,c,d,a,x[i+9],21,-343485551)
    a=safeAdd(a,A); b=safeAdd(b,B); c=safeAdd(c,C); d=safeAdd(d,D)
  }
  return [a,b,c,d]
    .map(n => ('00000000' + ((n < 0 ? n + 0x100000000 : n)).toString(16)).slice(-8)
      .match(/../g).reverse().join(''))
    .join('')
}
