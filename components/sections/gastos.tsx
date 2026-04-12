"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Wallet,
  Plus,
  Trash2,
  Banknote,
  Landmark,
  CalendarDays,
  Eye,
  Pencil,
} from "lucide-react"
import { formatQ } from "@/lib/currency"
import { useBusiness, type ExpenseEntry } from "@/lib/business-context"
import {
  createExpense,
  createExpenseCategory,
  deleteExpense,
  fetchExpenseById,
  fetchExpenseCategories,
  updateExpense as updateExpenseApi,
  type ExpenseCategoryDto,
  type ExpenseDetailDto,
} from "@/lib/services/expenses.service"
import { Badge } from "@/components/ui/badge"

function categoryNameFromId(
  categoryIdStr: string,
  list: ExpenseCategoryDto[],
): string {
  const id = Number(categoryIdStr)
  const row = list.find((c) => c.id === id)
  return row?.name ?? `Categoría #${categoryIdStr}`
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

/** Id numérico devuelto por la API al crear el gasto en la BD. */
function isServerExpenseId(id: string): boolean {
  return /^\d+$/.test(id.trim())
}

export function Gastos() {
  const { expenses, registerExpense, removeExpense, updateExpense } = useBusiness()
  const [filterMonth, setFilterMonth] = useState(() => monthValue(new Date()))
  const [dbCategories, setDbCategories] = useState<ExpenseCategoryDto[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [showExpenseCategoryDialog, setShowExpenseCategoryDialog] = useState(false)
  const [newExpenseCategoryName, setNewExpenseCategoryName] = useState("")
  const [savingCategory, setSavingCategory] = useState(false)

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true)
    try {
      const list = await fetchExpenseCategories()
      setDbCategories(list)
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudieron cargar las categorías.",
      )
      setDbCategories([])
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

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
  const [saving, setSaving] = useState(false)

  const [expenseDetailOpen, setExpenseDetailOpen] = useState(false)
  const [expenseDetailLoading, setExpenseDetailLoading] = useState(false)
  const [expenseDetail, setExpenseDetail] = useState<ExpenseDetailDto | null>(null)

  const [expensePendingDelete, setExpensePendingDelete] =
    useState<ExpenseEntry | null>(null)
  const [deletingExpense, setDeletingExpense] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  /** Id del listado (contexto); coincide con fila de `expenses`. */
  const [editEntryId, setEditEntryId] = useState<string | null>(null)
  /** Id numérico en servidor para PATCH; null = solo sesión local. */
  const [editNumericId, setEditNumericId] = useState<number | null>(null)
  const [editDate, setEditDate] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [editAmount, setEditAmount] = useState("")
  const [editPayment, setEditPayment] = useState<"efectivo" | "transferencia">(
    "efectivo",
  )
  const [editNote, setEditNote] = useState("")

  const filterRef = useMemo(() => parseMonthValue(filterMonth), [filterMonth])

  const filtered = useMemo(
    () => expenses.filter((e) => sameMonth(e.date, filterRef)),
    [expenses, filterRef]
  )

  const monthTotal = useMemo(
    () => filtered.reduce((a, e) => a + e.amount, 0),
    [filtered]
  )

  const saveNewExpenseCategory = async () => {
    const label = newExpenseCategoryName.trim()
    if (!label || savingCategory) return
    setSavingCategory(true)
    try {
      const created = await createExpenseCategory(label)
      await loadCategories()
      setFormCategory(String(created.id))
      setShowExpenseCategoryDialog(false)
      setNewExpenseCategoryName("")
      toast.success("Categoría guardada exitosamente.")
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudo crear la categoría.",
      )
    } finally {
      setSavingCategory(false)
    }
  }

  const handleAdd = async () => {
    if (!formCategory || saving) return
    const raw = formAmount.replace(",", ".").trim()
    const amount = parseFloat(raw)
    if (!Number.isFinite(amount) || amount <= 0) return
    const d = new Date(formDate + "T12:00:00")
    if (Number.isNaN(d.getTime())) return

    const categoryId = parseInt(formCategory, 10)
    if (!Number.isFinite(categoryId) || categoryId <= 0) return

    setSaving(true)
    try {
      const { expenseId } = await createExpense({
        categoryId,
        expenseDate: formDate,
        amount,
        paymentMethod: formPayment,
        note: formNote,
      })
      registerExpense({
        id: String(expenseId),
        date: d,
        category: String(categoryId),
        amount,
        paymentMethod: formPayment,
        note: formNote,
      })
      toast.success("Gasto guardado exitosamente.")
      setFormAmount("")
      setFormNote("")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar el gasto.")
    } finally {
      setSaving(false)
    }
  }

  const openExpenseDetail = async (row: ExpenseEntry) => {
    if (!isServerExpenseId(row.id)) {
      toast.error(
        "Este gasto solo está en la sesión local; registra uno nuevo para verlo en el servidor.",
      )
      return
    }
    setExpenseDetailOpen(true)
    setExpenseDetailLoading(true)
    setExpenseDetail(null)
    try {
      const d = await fetchExpenseById(Number(row.id))
      setExpenseDetail(d)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar el detalle.")
      setExpenseDetailOpen(false)
    } finally {
      setExpenseDetailLoading(false)
    }
  }

  const formatDateInput = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  }

  const openEditExpense = async (row: ExpenseEntry) => {
    setEditEntryId(row.id)
    setEditOpen(true)

    if (!isServerExpenseId(row.id)) {
      setEditNumericId(null)
      setEditLoading(false)
      setEditDate(formatDateInput(row.date))
      setEditCategory(row.category)
      setEditAmount(String(row.amount))
      setEditPayment(row.paymentMethod)
      setEditNote(row.note ?? "")
      return
    }

    const numId = Number(row.id)
    setEditNumericId(numId)
    setEditLoading(true)
    try {
      const d = await fetchExpenseById(numId)
      setEditDate(d.expenseDate)
      setEditCategory(String(d.categoryId))
      setEditAmount(String(d.amount))
      setEditPayment(d.paymentMethod)
      setEditNote(d.note ?? "")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar el gasto.")
      setEditOpen(false)
      setEditEntryId(null)
      setEditNumericId(null)
    } finally {
      setEditLoading(false)
    }
  }

  const submitEditExpense = async () => {
    if (editEntryId == null || editSaving) return
    const categoryId = parseInt(editCategory, 10)
    if (!Number.isFinite(categoryId) || categoryId <= 0) return
    const raw = editAmount.replace(",", ".").trim()
    const amount = parseFloat(raw)
    if (!Number.isFinite(amount) || amount <= 0) return
    const d = new Date(editDate + "T12:00:00")
    if (Number.isNaN(d.getTime())) return

    const patch = {
      date: d,
      category: String(categoryId),
      amount,
      paymentMethod: editPayment,
      note: editNote,
    }

    setEditSaving(true)
    try {
      if (editNumericId != null) {
        await updateExpenseApi(editNumericId, {
          categoryId,
          expenseDate: editDate,
          amount,
          paymentMethod: editPayment,
          note: editNote,
        })
      }
      toast.success("Gasto editado exitosamente.")
      updateExpense(editEntryId, patch)
      setEditOpen(false)
      setEditEntryId(null)
      setEditNumericId(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar el cambio.")
    } finally {
      setEditSaving(false)
    }
  }

  const confirmDeleteExpense = async () => {
    const row = expensePendingDelete
    if (!row || deletingExpense) return
    setDeletingExpense(true)
    try {
      if (isServerExpenseId(row.id)) {
        await deleteExpense(Number(row.id))
        removeExpense(row.id)
        toast.success("Gasto eliminado correctamente.")
      } else {
        removeExpense(row.id)
        toast.success("Gasto eliminado correctamente.")
      }
      setExpensePendingDelete(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar el gasto.")
    } finally {
      setDeletingExpense(false)
    }
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
                <Select
                  value={formCategory}
                  onValueChange={setFormCategory}
                  disabled={categoriesLoading || dbCategories.length === 0}
                >
                  <SelectTrigger className="h-11 flex-1">
                    <SelectValue
                      placeholder={
                        categoriesLoading
                          ? "Cargando categorías…"
                          : dbCategories.length === 0
                            ? "Cree una categoría primero"
                            : "Seleccione categoría"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {dbCategories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
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
              disabled={
                !formCategory || saving || categoriesLoading || dbCategories.length === 0
              }
              onClick={() => void handleAdd()}
            >
              <Plus className="h-4 w-4" />
              {saving ? "Guardando…" : "Registrar gasto"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Listado del mes</CardTitle>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Listado en tabla; las acciones son solo iconos (ver, editar, eliminar).
          </p>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {filtered.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              No hay gastos en este mes.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border/60">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="whitespace-nowrap p-3 font-medium">Fecha</th>
                    <th className="p-3 font-medium">Categoría</th>
                    <th className="whitespace-nowrap p-3 text-right font-medium">
                      Monto
                    </th>
                    <th className="p-3 font-medium">Pago</th>
                    <th className="min-w-[120px] p-3 font-medium">Nota</th>
                    <th className="w-px whitespace-nowrap p-3 text-center font-medium">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border/60 last:border-0 hover:bg-muted/20"
                    >
                      <td className="whitespace-nowrap p-3 text-muted-foreground">
                        {row.date.toLocaleDateString("es-GT")}
                      </td>
                      <td className="max-w-[200px] p-3">
                        {categoryNameFromId(row.category, dbCategories)}
                      </td>
                      <td className="whitespace-nowrap p-3 text-right font-semibold tabular-nums text-foreground">
                        {formatQ(row.amount)}
                      </td>
                      <td className="p-3">{paymentBadge(row.paymentMethod)}</td>
                      <td className="max-w-[220px] p-3 text-muted-foreground">
                        <span className="line-clamp-2">{row.note?.trim() || "—"}</span>
                      </td>
                      <td className="p-2">
                        <div
                          role="group"
                          aria-label="Acciones del gasto"
                          className="flex items-center justify-center gap-1"
                        >
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0 text-primary"
                            title="Ver detalle"
                            aria-label="Ver detalle del gasto"
                            onClick={() => void openExpenseDetail(row)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0 text-violet-700 dark:text-violet-300"
                            title="Editar"
                            aria-label="Editar gasto"
                            onClick={() => void openEditExpense(row)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0 text-destructive hover:bg-destructive/10"
                            title="Eliminar"
                            aria-label="Eliminar gasto"
                            onClick={() => setExpensePendingDelete(row)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={expenseDetailOpen}
        onOpenChange={(open) => {
          setExpenseDetailOpen(open)
          if (!open) {
            setExpenseDetail(null)
            setExpenseDetailLoading(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle del gasto</DialogTitle>
            <DialogDescription className="sr-only">
              Información detallada del gasto
            </DialogDescription>
          </DialogHeader>
          {expenseDetailLoading ? (
            <p className="py-6 text-sm text-muted-foreground">Cargando…</p>
          ) : expenseDetail ? (
            <div className="grid gap-3 py-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Id</span>
                <span className="font-medium tabular-nums">#{expenseDetail.id}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Categoría</span>
                <span className="text-right font-medium">{expenseDetail.categoryName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Fecha</span>
                <span className="font-medium">
                  {new Date(expenseDetail.expenseDate + "T12:00:00").toLocaleDateString(
                    "es-GT",
                  )}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Monto</span>
                <span className="font-semibold text-primary tabular-nums">
                  {formatQ(expenseDetail.amount)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Pago</span>
                <span>{paymentBadge(expenseDetail.paymentMethod)}</span>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground">Nota</p>
                <p className="mt-1 whitespace-pre-wrap">
                  {expenseDetail.note?.trim() ? expenseDetail.note : "—"}
                </p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) {
            setEditEntryId(null)
            setEditNumericId(null)
            setEditLoading(false)
            setEditSaving(false)
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editNumericId != null ? `Editar gasto #${editNumericId}` : "Editar gasto"}
            </DialogTitle>
            <DialogDescription>
              Modifica los datos y pulsa guardar para aplicar los cambios.
            </DialogDescription>
          </DialogHeader>
          {editLoading ? (
            <p className="py-6 text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <div className="grid gap-4 py-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha</label>
                  <Input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monto (Q)</label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="h-11"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoría</label>
                <Select
                  value={editCategory}
                  onValueChange={setEditCategory}
                  disabled={categoriesLoading || dbCategories.length === 0}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {dbCategories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Método de pago</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={editPayment === "efectivo" ? "default" : "outline"}
                    className="h-12 gap-2"
                    onClick={() => setEditPayment("efectivo")}
                  >
                    <Banknote className="h-4 w-4" />
                    Efectivo
                  </Button>
                  <Button
                    type="button"
                    variant={editPayment === "transferencia" ? "default" : "outline"}
                    className="h-12 gap-2"
                    onClick={() => setEditPayment("transferencia")}
                  >
                    <Landmark className="h-4 w-4" />
                    Transferencia
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nota / comprobante</label>
                <Textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="min-h-[100px] resize-y"
                />
              </div>
              <Button
                type="button"
                className="h-11 w-full"
                disabled={
                  editSaving ||
                  !editCategory ||
                  categoriesLoading ||
                  dbCategories.length === 0
                }
                onClick={() => void submitEditExpense()}
              >
                {editSaving ? "Guardando…" : "Guardar cambios"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={expensePendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deletingExpense) setExpensePendingDelete(null)
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="sr-only">Eliminar gasto</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-foreground sm:text-base">
              ¿Eliminar este gasto? Se eliminará de forma permanente el registro de gasto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingExpense}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingExpense}
              onClick={(e) => {
                e.preventDefault()
                void confirmDeleteExpense()
              }}
            >
              {deletingExpense ? "Eliminando…" : "Sí, eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <DialogDescription>
              Añade un nombre para usar esta categoría en tus gastos.
            </DialogDescription>
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
                    void saveNewExpenseCategory()
                  }
                }}
              />
            </div>
            <Button
              type="button"
              className="h-11 w-full"
              disabled={savingCategory}
              onClick={() => void saveNewExpenseCategory()}
            >
              {savingCategory ? "Guardando…" : "Agregar categoría"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
