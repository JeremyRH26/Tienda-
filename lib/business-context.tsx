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
import {
  fetchExpenses,
  type ExpenseDetailDto,
} from "@/lib/services/expenses.service"

export type AbonoEntry = {
  id: string
  timestamp: Date
  customerId: number
  customerName: string
  amount: number
  /** Nota opcional; aparece en el historial del día del abono. */
  note: string
}

/** Id de categoría de gasto (predefinidas o creadas por el usuario). */
export type ExpenseCategoryId = string

export type ExpenseEntry = {
  id: string
  date: Date
  category: ExpenseCategoryId
  amount: number
  paymentMethod: "efectivo" | "transferencia"
  note: string
  createdAt: Date
}

type BusinessContextValue = {
  abonos: AbonoEntry[]
  registerAbono: (entry: {
    customerId: number
    customerName: string
    amount: number
    timestamp?: Date
    note?: string
  }) => void
  expenses: ExpenseEntry[]
  registerExpense: (entry: {
    date: Date
    category: ExpenseCategoryId
    amount: number
    paymentMethod: "efectivo" | "transferencia"
    note: string
    /** Si viene del servidor (p. ej. id numérico de `expense`). */
    id?: string
  }) => void
  removeExpense: (id: string) => void
  updateExpense: (
    id: string,
    patch: {
      date: Date
      category: ExpenseCategoryId
      amount: number
      paymentMethod: "efectivo" | "transferencia"
      note: string
    },
  ) => void
}

const BusinessContext = createContext<BusinessContextValue | null>(null)

let abonoSeq = 0
let expenseSeq = 0

function mapExpenseDtosToEntries(dtos: ExpenseDetailDto[]): ExpenseEntry[] {
  return dtos.map((d) => {
    const date = new Date(d.expenseDate + "T12:00:00")
    return {
      id: String(d.id),
      date,
      category: String(d.categoryId),
      amount: d.amount,
      paymentMethod: d.paymentMethod,
      note: (d.note ?? "").trim(),
      createdAt: date,
    }
  })
}

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [abonos, setAbonos] = useState<AbonoEntry[]>([])
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([])

  useEffect(() => {
    let cancelled = false
    void fetchExpenses()
      .then((data) => {
        if (cancelled) return
        const fromServer = mapExpenseDtosToEntries(data)
        setExpenses((prev) => {
          if (prev.length === 0) return fromServer
          const byId = new Map<string, ExpenseEntry>()
          for (const e of fromServer) byId.set(e.id, e)
          for (const e of prev) {
            if (!byId.has(e.id)) byId.set(e.id, e)
          }
          return Array.from(byId.values()).sort(
            (a, b) => b.date.getTime() - a.date.getTime(),
          )
        })
      })
      .catch(() => {
        if (cancelled) return
      })
    return () => {
      cancelled = true
    }
  }, [])

  const registerAbono = useCallback(
    (entry: {
      customerId: number
      customerName: string
      amount: number
      timestamp?: Date
      note?: string
    }) => {
      abonoSeq += 1
      const id = `abono-${Date.now()}-${abonoSeq}`
      setAbonos((prev) => [
        ...prev,
        {
          id,
          timestamp: entry.timestamp ?? new Date(),
          customerId: entry.customerId,
          customerName: entry.customerName,
          amount: entry.amount,
          note: (entry.note ?? "").trim(),
        },
      ])
    },
    []
  )

  const registerExpense = useCallback(
    (entry: {
      date: Date
      category: ExpenseCategoryId
      amount: number
      paymentMethod: "efectivo" | "transferencia"
      note: string
      id?: string
    }) => {
      expenseSeq += 1
      const id =
        entry.id != null && entry.id !== ""
          ? entry.id
          : `gasto-${Date.now()}-${expenseSeq}`
      const now = new Date()
      setExpenses((prev) => [
        {
          id,
          date: entry.date,
          category: entry.category,
          amount: Math.round(entry.amount * 100) / 100,
          paymentMethod: entry.paymentMethod,
          note: entry.note.trim(),
          createdAt: now,
        },
        ...prev,
      ])
    },
    []
  )

  const removeExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const updateExpense = useCallback(
    (
      id: string,
      patch: {
        date: Date
        category: ExpenseCategoryId
        amount: number
        paymentMethod: "efectivo" | "transferencia"
        note: string
      },
    ) => {
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                date: patch.date,
                category: patch.category,
                amount: Math.round(patch.amount * 100) / 100,
                paymentMethod: patch.paymentMethod,
                note: patch.note.trim(),
              }
            : e,
        ),
      )
    },
    [],
  )

  const value = useMemo(
    () => ({
      abonos,
      registerAbono,
      expenses,
      registerExpense,
      removeExpense,
      updateExpense,
    }),
    [abonos, registerAbono, expenses, registerExpense, removeExpense, updateExpense]
  )

  return (
    <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>
  )
}

export function useBusiness() {
  const ctx = useContext(BusinessContext)
  if (!ctx) {
    throw new Error("useBusiness debe usarse dentro de BusinessProvider")
  }
  return ctx
}
