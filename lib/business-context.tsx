"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

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
  }) => void
  removeExpense: (id: string) => void
}

const BusinessContext = createContext<BusinessContextValue | null>(null)

let abonoSeq = 0
let expenseSeq = 0

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [abonos, setAbonos] = useState<AbonoEntry[]>([])
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([])

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
    }) => {
      expenseSeq += 1
      const id = `gasto-${Date.now()}-${expenseSeq}`
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

  const value = useMemo(
    () => ({
      abonos,
      registerAbono,
      expenses,
      registerExpense,
      removeExpense,
    }),
    [abonos, registerAbono, expenses, registerExpense, removeExpense]
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
