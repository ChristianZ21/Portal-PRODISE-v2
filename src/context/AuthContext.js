'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext({ user: null, loading: false, login: async () => ({}), logout: () => {} })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const s = localStorage.getItem('prodise_session')
      if (s) {
        const parsed = JSON.parse(s)
        if (parsed && parsed.username) {
          setUser(parsed)
        }
      }
    } catch (e) {
      console.error('Error reading session:', e)
      localStorage.removeItem('prodise_session')
    } finally {
      setLoading(false)
    }
  }, [])

  async function login(username, password) {
    try {
      const { data, error } = await supabase.from('usuarios_sistema').select('*').eq('username', username.trim().toUpperCase()).limit(1)
      if (error || !data?.length) return { ok: false, msg: 'Usuario no encontrado' }
      const u = data[0]
      if (u.estado !== 'ACTIVO') return { ok: false, msg: 'Usuario bloqueado' }
      if (u.intentos_fallidos >= 5) return { ok: false, msg: 'Cuenta bloqueada por intentos fallidos' }
      if (u.password_hash !== password) {
        const n = (u.intentos_fallidos || 0) + 1
        await supabase.from('usuarios_sistema').update({ intentos_fallidos: n }).eq('username', u.username)
        return { ok: false, msg: `Contraseña incorrecta. Intentos restantes: ${5 - n}` }
      }
      const { data: t } = await supabase.from('trabajadores').select('nombres_completos, url_foto').eq('dni', u.dni_asociado).single()
      const session = { username: u.username, dni: u.dni_asociado, nivel: u.nivel_acceso, nombre: t?.nombres_completos || u.username, foto: t?.url_foto }
      setUser(session)
      localStorage.setItem('prodise_session', JSON.stringify(session))
      await supabase.from('usuarios_sistema').update({ intentos_fallidos: 0, ultimo_login: new Date().toISOString() }).eq('username', u.username)
      await supabase.from('audit_log').insert({ username: u.username, accion: 'LOGIN_EXITOSO' })
      return { ok: true }
    } catch (e) {
      console.error('Login error:', e)
      return { ok: false, msg: 'Error de conexión. Intente nuevamente.' }
    }
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('prodise_session')
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
