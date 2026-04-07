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
import { mockEmployees, type Employee } from "@/lib/mock-data"

const STORAGE_KEY = "minimer-session-user-id"

type AuthContextValue = {
  user: Employee | null
  login: (username: string, password: string) => { ok: boolean; message?: string }
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function findActiveEmployee(username: string, password: string): Employee | null {
  const u = username.trim().toLowerCase()
  return (
    mockEmployees.find(
      (e) =>
        e.status === "active" &&
        e.username.toLowerCase() === u &&
        e.password === password
    ) ?? null
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Employee | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const id = parseInt(raw, 10)
      if (!Number.isFinite(id)) return
      const e = mockEmployees.find((x) => x.id === id && x.status === "active")
      if (e) setUser({ ...e, permissions: [...e.permissions] })
    } catch {
      /* ignore */
    }
  }, [])

  const login = useCallback((username: string, password: string) => {
    const employee = findActiveEmployee(username, password)
    if (!employee) {
      return {
        ok: false,
        message: "Usuario o contraseña incorrectos, o la cuenta está inactiva.",
      }
    }
    const next = { ...employee, permissions: [...employee.permissions] }
    setUser(next)
    try {
      sessionStorage.setItem(STORAGE_KEY, String(next.id))
    } catch {
      /* ignore */
    }
    return { ok: true }
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
