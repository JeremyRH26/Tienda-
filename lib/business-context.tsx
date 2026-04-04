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
}

type BusinessContextValue = {
  abonos: AbonoEntry[]
  registerAbono: (entry: {
    customerId: number
    customerName: string
    amount: number
    timestamp?: Date
  }) => void
}

const BusinessContext = createContext<BusinessContextValue | null>(null)

let abonoSeq = 0

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [abonos, setAbonos] = useState<AbonoEntry[]>([])

  const registerAbono = useCallback(
    (entry: {
      customerId: number
      customerName: string
      amount: number
      timestamp?: Date
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
        },
      ])
    },
    []
  )

  const value = useMemo(
    () => ({ abonos, registerAbono }),
    [abonos, registerAbono]
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
