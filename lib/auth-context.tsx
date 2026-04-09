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
import { login as loginApi } from "@/lib/services/auth.service"

const STORAGE_KEY = "minimer-session-user"

const AuthContext = createContext<{
  user: Employee | null
  login: (
    username: string,
    password: string
  ) => Promise<{ ok: boolean; message?: string }>
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

  useEffect(() => {
    const restored = loadStoredUser()
    if (restored) setUser(restored)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    try {
      const next = await loginApi(username, password)
      setUser(next)
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return { ok: true }
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
    () => ({ user, login, logout }),
    [user, login, logout]
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
