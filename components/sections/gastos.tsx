"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Wallet, Plus, Trash2, Banknote, Landmark, CalendarDays } from "lucide-react"
import { formatQ } from "@/lib/currency"
import { useBusiness, type ExpenseEntry } from "@/lib/business-context"
import { Badge } from "@/components/ui/badge"

const EXPENSE_CATEGORIES: { id: string; label: string }[] = [
  { id: "servicios_publicos", label: "Servicios públicos" },
  { id: "compra_insumos", label: "Compra de productos e insumos" },
  { id: "arriendo", label: "Arriendo" },
  { id: "nomina", label: "Nómina" },
  { id: "administrativos", label: "Gastos administrativos" },
  { id: "transporte_logistica", label: "Transporte y logística" },
  { id: "muebles_equipo", label: "Muebles, equipo o maquinaria" },
  { id: "otros", label: "Otros" },
]

function categoryLabel(
  id: string,
  custom: { id: string; label: string }[]
): string {
  return (
    EXPENSE_CATEGORIES.find((c) => c.id === id)?.label ??
    custom.find((c) => c.id === id)?.label ??
    id
  )
}

function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

function monthValue(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

function parseMonthValue(v: string): Date {
  const [y, m] = v.split("-").map((x) => parseInt(x, 10))
  return new Date(y, (m || 1) - 1, 1)
}

export function Gastos() {
  const { expenses, registerExpense, removeExpense } = useBusiness()
  const [filterMonth, setFilterMonth] = useState(() => monthValue(new Date()))
  const [customExpenseCategories, setCustomExpenseCategories] = useState<
    { id: string; label: string }[]
  >([])
  const [showExpenseCategoryDialog, setShowExpenseCategoryDialog] = useState(false)
  const [newExpenseCategoryName, setNewExpenseCategoryName] = useState("")

  const allExpenseCategories = [...EXPENSE_CATEGORIES, ...customExpenseCategories]

  const [formDate, setFormDate] = useState(() => {
    const t = new Date()
    return t.toISOString().slice(0, 10)
  })
  const [formCategory, setFormCategory] = useState<string>("")
  const [formAmount, setFormAmount] = useState("")
  const [formPayment, setFormPayment] = useState<"efectivo" | "transferencia">(
    "efectivo"
  )
  const [formNote, setFormNote] = useState("")

  const filterRef = useMemo(() => parseMonthValue(filterMonth), [filterMonth])

  const filtered = useMemo(
    () => expenses.filter((e) => sameMonth(e.date, filterRef)),
    [expenses, filterRef]
  )

  const monthTotal = useMemo(
    () => filtered.reduce((a, e) => a + e.amount, 0),
    [filtered]
  )

  const saveNewExpenseCategory = () => {
    const label = newExpenseCategoryName.trim()
    if (!label) return
    const id = `cat_${Date.now()}`
    setCustomExpenseCategories((prev) => [...prev, { id, label }])
    setFormCategory(id)
    setShowExpenseCategoryDialog(false)
    setNewExpenseCategoryName("")
  }

  const handleAdd = () => {
    if (!formCategory) return
    const raw = formAmount.replace(",", ".").trim()
    const amount = parseFloat(raw)
    if (!Number.isFinite(amount) || amount <= 0) return
    const d = new Date(formDate + "T12:00:00")
    if (Number.isNaN(d.getTime())) return
    registerExpense({
      date: d,
      category: formCategory,
      amount,
      paymentMethod: formPayment,
      note: formNote,
    })
    setFormAmount("")
    setFormNote("")
  }

  const paymentBadge = (m: ExpenseEntry["paymentMethod"]) =>
    m === "efectivo" ? (
      <Badge variant="outline" className="border-primary/50 text-primary">
        Efectivo
      </Badge>
    ) : (
      <Badge variant="outline" className="border-blue-500/50 text-blue-600">
        Transferencia
      </Badge>
    )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Gastos</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Registre los gastos del negocio por mes: categoría, pago y notas del comprobante.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <label htmlFor="gasto-mes" className="text-sm text-muted-foreground">
              Mes
            </label>
            <Input
              id="gasto-mes"
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="h-9 w-[9.5rem] border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-5 w-5 text-primary" />
              Total del mes seleccionado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{formatQ(monthTotal)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {filtered.length} registro{filtered.length === 1 ? "" : "s"} en{" "}
              {filterRef.toLocaleDateString("es-GT", { month: "long", year: "numeric" })}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-5 w-5 text-primary" />
              Nuevo gasto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha</label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Monto (Q)</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="h-11"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoría</label>
              <div className="flex gap-2">
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger className="h-11 flex-1">
                    <SelectValue placeholder="Seleccione categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {allExpenseCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0"
                  aria-label="Nueva categoría de gasto"
                  onClick={() => {
                    setNewExpenseCategoryName("")
                    setShowExpenseCategoryDialog(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Método de pago</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={formPayment === "efectivo" ? "default" : "outline"}
                  className="h-12 gap-2"
                  onClick={() => setFormPayment("efectivo")}
                >
                  <Banknote className="h-4 w-4" />
                  Efectivo
                </Button>
                <Button
                  type="button"
                  variant={formPayment === "transferencia" ? "default" : "outline"}
                  className="h-12 gap-2"
                  onClick={() => setFormPayment("transferencia")}
                >
                  <Landmark className="h-4 w-4" />
                  Transferencia bancaria
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nota / comprobante</label>
              <Textarea
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                placeholder="Detalle del gasto, número de factura, referencia de transferencia, etc."
                className="min-h-[100px] resize-y"
              />
            </div>

            <Button
              type="button"
              className="h-11 w-full gap-2 sm:w-auto"
              disabled={!formCategory}
              onClick={handleAdd}
            >
              <Plus className="h-4 w-4" />
              Registrar gasto
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Listado del mes</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="p-3 font-medium">Fecha</th>
                  <th className="p-3 font-medium">Categoría</th>
                  <th className="p-3 text-right font-medium">Monto</th>
                  <th className="p-3 font-medium">Pago</th>
                  <th className="p-3 font-medium">Nota</th>
                  <th className="w-12 p-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No hay gastos en este mes.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="p-3 whitespace-nowrap text-muted-foreground">
                        {row.date.toLocaleDateString("es-GT")}
                      </td>
                      <td className="max-w-[200px] p-3">
                        {categoryLabel(row.category, customExpenseCategories)}
                      </td>
                      <td className="p-3 text-right font-semibold tabular-nums">
                        {formatQ(row.amount)}
                      </td>
                      <td className="p-3">{paymentBadge(row.paymentMethod)}</td>
                      <td className="max-w-xs p-3 text-muted-foreground">
                        <span className="line-clamp-2">{row.note || "—"}</span>
                      </td>
                      <td className="p-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          aria-label="Eliminar gasto"
                          onClick={() => removeExpense(row.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={showExpenseCategoryDialog}
        onOpenChange={(open) => {
          setShowExpenseCategoryDialog(open)
          if (!open) setNewExpenseCategoryName("")
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva categoría de gasto</DialogTitle>
            <DialogDescription>Solo se guarda el nombre para clasificar gastos.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={newExpenseCategoryName}
                onChange={(e) => setNewExpenseCategoryName(e.target.value)}
                className="h-11"
                placeholder="Ej. Mantenimiento"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    saveNewExpenseCategory()
                  }
                }}
              />
            </div>
            <Button type="button" className="h-11 w-full" onClick={saveNewExpenseCategory}>
              Agregar categoría
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
