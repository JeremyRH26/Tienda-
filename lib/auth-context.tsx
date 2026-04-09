"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Employee } from "@/lib/mock-data"
import { getRoleHomePath } from "@/lib/app-routes"
import { login as loginApi } from "@/lib/services/auth.service"

const STORAGE_KEY = "minimer-session-user"

const AuthContext = createContext<{
  user: Employee | null
  /** `true` tras leer sesión en el cliente (evita flash login al recargar). */
  ready: boolean
  login: (
    username: string,
    password: string
  ) => Promise<{ ok: boolean; message?: string; redirectTo?: string }>
  logout: () => void
} | null>(null)

function loadStoredUser(): Employee | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const u = JSON.parse(raw) as Employee
    if (!u?.id || !Array.isArray(u.permissions)) return null
    return { ...u, permissions: [...u.permissions] }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Employee | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const restored = loadStoredUser()
    if (restored) setUser(restored)
    setReady(true)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    try {
      const next = await loginApi(username, password)
      if (!next.permissions || next.permissions.length === 0) {
        return {
          ok: false,
          message: "El usuario no tiene permisos asignados.",
        }
      }
      setUser(next)
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return {
        ok: true,
        redirectTo: getRoleHomePath(next.role),
      }
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "No se pudo iniciar sesión.",
      }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(
    () => ({ user, ready, login, logout }),
    [user, ready, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider")
  }
  return ctx
}
