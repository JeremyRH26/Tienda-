"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Plus,
  Users,
  Phone,
  Mail,
  ShoppingBag,
  Pencil,
  ScrollText,
  FileDown,
  MessageCircle,
  Trash2,
} from "lucide-react"
import type { ShopCustomer, PendingCreditLine } from "@/lib/mock-data"
import {
  createCustomerAbonoApi,
  createCustomerApi,
  deleteCustomerApi,
  fetchCustomerCreditSales,
  fetchCustomersWithBalance,
  mapCreditSalesToPendingLines,
  mapCustomerDtoToShopCustomer,
  updateCustomerApi,
} from "@/lib/services/customers.service"
import { formatQ } from "@/lib/currency"
import { useBusiness } from "@/lib/business-context"
import { downloadCustomerCreditPdf } from "@/lib/pdf-reports"
import { openWhatsAppDebtReminder } from "@/lib/whatsapp"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

type Customer = ShopCustomer

function IconoQuetzal({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center font-bold leading-none ${className ?? ""}`}
      aria-hidden
    >
      Q
    </span>
  )
}

export function Clientes() {
  const { registerAbono } = useBusiness()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customersLoadState, setCustomersLoadState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle")
  const [customersError, setCustomersError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentNote, setPaymentNote] = useState("")
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "" })
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
  })
  const [savingCustomer, setSavingCustomer] = useState(false)
  const [customerPendingDelete, setCustomerPendingDelete] = useState<Customer | null>(
    null,
  )
  const [deleteCustomerInFlight, setDeleteCustomerInFlight] = useState(false)

  const refreshCustomers = useCallback(async () => {
    setCustomersLoadState("loading")
    setCustomersError(null)
    try {
      const rows = await fetchCustomersWithBalance()
      setCustomers(rows.map((c) => mapCustomerDtoToShopCustomer(c, [])))
      setCustomersLoadState("ready")
    } catch (e) {
      setCustomersLoadState("error")
      setCustomersError(
        e instanceof Error ? e.message : "No se pudieron cargar los clientes.",
      )
    }
  }, [])

  useEffect(() => {
    void refreshCustomers()
  }, [refreshCustomers])

  useEffect(() => {
    if (!selectedCustomer || showPayment) return
    const id = selectedCustomer.id
    let cancelled = false
    void fetchCustomerCreditSales(id)
      .then((credit) => {
        if (cancelled) return
        const lines = mapCreditSalesToPendingLines(credit)
        setSelectedCustomer((prev) =>
          prev && prev.id === id ? { ...prev, pendingCreditLines: lines } : prev,
        )
        setCustomers((prev) =>
          prev.map((c) => (c.id === id ? { ...c, pendingCreditLines: lines } : c)),
        )
      })
      .catch(() => {
        if (cancelled) return
      })
    return () => {
      cancelled = true
    }
  }, [selectedCustomer?.id, showPayment])

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalDebt = customers.reduce((acc, c) => acc + c.balance, 0)
  const customersWithDebt = customers.filter((c) => c.balance > 0).length

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      toast.error("Nombre y teléfono son obligatorios.")
      return
    }
    setSavingCustomer(true)
    try {
      await createCustomerApi({
        fullName: newCustomer.name.trim(),
        phone: newCustomer.phone.trim(),
        email: newCustomer.email.trim(),
      })
      toast.success("Cliente creado.")
      setShowAddCustomer(false)
      setNewCustomer({ name: "", phone: "", email: "" })
      await refreshCustomers()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear el cliente.")
    } finally {
      setSavingCustomer(false)
    }
  }

  const openEdit = (c: Customer) => {
    setEditingCustomer(c)
    setEditForm({ name: c.name, phone: c.phone, email: c.email })
  }

  const saveEdit = async () => {
    if (!editingCustomer) return
    const id = editingCustomer.id
    setSavingCustomer(true)
    try {
      await updateCustomerApi(id, {
        fullName: editForm.name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
      })
      toast.success("Cliente actualizado.")
      setEditingCustomer(null)
      await refreshCustomers()
      setSelectedCustomer((cur) =>
        cur?.id === id
          ? {
              ...cur,
              name: editForm.name.trim() || cur.name,
              phone: editForm.phone.trim() || cur.phone,
              email: editForm.email.trim() || cur.email,
            }
          : cur,
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar.")
    } finally {
      setSavingCustomer(false)
    }
  }

  const handlePayment = async () => {
    if (!selectedCustomer) return
    const raw = paymentAmount.replace(",", ".").trim()
    const amount = parseFloat(raw)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Indica un monto válido.")
      return
    }

    const id = selectedCustomer.id
    const applied = Math.min(amount, selectedCustomer.balance)
    if (applied <= 0) return

    setSavingCustomer(true)
    try {
      const { customerAccountId } = await createCustomerAbonoApi(id, {
        amount: applied,
        note: paymentNote,
      })
      registerAbono({
        id: String(customerAccountId),
        customerId: id,
        customerName: selectedCustomer.name,
        amount: applied,
        note: paymentNote,
      })
      toast.success("Abono registrado.")
      setShowPayment(false)
      setPaymentAmount("")
      setPaymentNote("")
      setSelectedCustomer(null)
      await refreshCustomers()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo registrar el abono.")
    } finally {
      setSavingCustomer(false)
    }
  }

  const handleConfirmDeleteCustomer = async () => {
    if (!customerPendingDelete) return
    setDeleteCustomerInFlight(true)
    try {
      await deleteCustomerApi(customerPendingDelete.id)
      toast.success("Cliente eliminado.")
      setCustomerPendingDelete(null)
      setSelectedCustomer(null)
      await refreshCustomers()
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudo eliminar el cliente.",
      )
    } finally {
      setDeleteCustomerInFlight(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Clientes</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Directorio y saldos desde el servidor (ventas a crédito y abonos).
          </p>
          {customersLoadState === "error" && customersError ? (
            <p className="mt-2 text-sm text-destructive">{customersError}</p>
          ) : null}
        </div>
        <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
          <DialogTrigger asChild>
            <Button className="h-11 gap-2 sm:h-12 sm:px-6">
              <Plus className="h-4 w-4" />
              <span>Nuevo Cliente</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
              <DialogDescription>Ingresa los datos del nuevo cliente para agregarlo al directorio.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre Completo</label>
                <Input
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                  className="h-12"
                  placeholder="Nombre del cliente"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono</label>
                <Input
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, phone: e.target.value })
                  }
                  className="h-12"
                  placeholder="555-1234"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email (opcional)</label>
                <Input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, email: e.target.value })
                  }
                  className="h-12"
                  placeholder="cliente@email.com"
                />
              </div>
              <Button
                className="mt-2 h-12 w-full"
                disabled={savingCustomer}
                onClick={() => void handleAddCustomer()}
              >
                {savingCustomer ? "Guardando…" : "Agregar Cliente"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12">
              <Users className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground sm:text-sm">Total Clientes</p>
              <p className="text-lg font-bold sm:text-2xl">{customers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-destructive/40 bg-destructive/10 sm:h-12 sm:w-12">
              <IconoQuetzal className="text-base text-destructive sm:text-xl" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground sm:text-sm">
                Total por cobrar (quetzales)
              </p>
              <p className="text-lg font-bold text-destructive sm:text-2xl">
                {formatQ(totalDebt)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 shadow-sm lg:col-span-1">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 sm:h-12 sm:w-12">
              <Users className="h-5 w-5 text-amber-600 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground sm:text-sm">Con Deuda</p>
              <p className="text-lg font-bold text-amber-600 sm:text-2xl">{customersWithDebt}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, teléfono o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-11 pl-10 sm:h-12"
        />
      </div>

      {/* Customers Grid */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {customersLoadState === "loading" && customers.length === 0 ? (
          <p className="col-span-full text-sm text-muted-foreground">Cargando clientes…</p>
        ) : null}
        {filteredCustomers.map((customer) => (
          <Card
            key={customer.id}
            className="relative cursor-pointer shadow-sm transition-all hover:shadow-md"
            onClick={() => setSelectedCustomer(customer)}
          >
            <CardContent className="p-6">
              <div
                className="absolute right-2 top-2 flex gap-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Editar cliente"
                  onClick={() => openEdit(customer)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Eliminar cliente"
                  title={
                    customer.balance > 0
                      ? "Liquide el saldo antes de eliminar"
                      : "Eliminar cliente"
                  }
                  disabled={customer.balance > 0}
                  onClick={() => {
                    if (customer.balance > 0) {
                      toast.error(
                        "No se puede eliminar mientras tenga saldo deudor. Registre abonos hasta dejar el saldo en cero.",
                      )
                      return
                    }
                    setCustomerPendingDelete(customer)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="mb-4 flex items-start justify-between pr-14">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="text-sm font-semibold">
                      {customer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{customer.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Cliente desde 2023
                    </p>
                  </div>
                </div>
                {customer.balance > 0 && (
                  <span className="rounded-full bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">
                    Debe
                    {customer.pendingCreditLines.length > 0 && (
                      <span className="ml-1 font-normal opacity-90">
                        ({customer.pendingCreditLines.length} fiado
                        {customer.pendingCreditLines.length > 1 ? "s" : ""})
                      </span>
                    )}
                  </span>
                )}
              </div>

              <div className="mb-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {customer.phone}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {customer.email}
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <p className="text-xs text-muted-foreground">Saldo Deudor</p>
                  <p
                    className={`text-lg font-bold ${
                      customer.balance > 0 ? "text-destructive" : "text-primary"
                    }`}
                  >
                    {formatQ(customer.balance)}
                  </p>
                </div>
                {customer.balance > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedCustomer(customer)
                      setShowPayment(true)
                    }}
                  >
                    <IconoQuetzal className="text-xs text-foreground" />
                    Registrar abono
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Customer Detail Dialog */}
      <Dialog
        open={selectedCustomer !== null && !showPayment}
        onOpenChange={(open) => !open && setSelectedCustomer(null)}
      >
        <DialogContent className="!flex max-h-[min(90vh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="shrink-0 border-b px-6 pb-4 pt-6 pr-14">
            <DialogTitle>Perfil del Cliente</DialogTitle>
            <DialogDescription>Información detallada y estado de cuenta del cliente.</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <>
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-xl font-semibold">
                    {selectedCustomer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedCustomer.name}</h2>
                  <p className="text-muted-foreground">{selectedCustomer.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Total Compras</p>
                    <p className="text-xl font-bold">
                      {formatQ(selectedCustomer.totalPurchases)}
                    </p>
                  </CardContent>
                </Card>
                <Card className={selectedCustomer.balance > 0 ? "bg-destructive/10" : "bg-primary/10"}>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Saldo Deudor</p>
                    <p className={`text-xl font-bold ${selectedCustomer.balance > 0 ? "text-destructive" : "text-primary"}`}>
                      {formatQ(selectedCustomer.balance)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Información de Contacto</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    <span>Última compra: {selectedCustomer.lastPurchase}</span>
                  </div>
                </div>
              </div>

              {selectedCustomer.balance > 0 && selectedCustomer.pendingCreditLines.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 font-semibold">
                        <ScrollText className="h-4 w-4 text-muted-foreground" />
                        Historial de fiados pendientes
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Cada venta al fiado con el detalle de productos (cantidad, precio y subtotal).
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-2"
                      onClick={() =>
                        void downloadCustomerCreditPdf(
                          selectedCustomer.name,
                          selectedCustomer.balance,
                          selectedCustomer.pendingCreditLines
                        )
                      }
                    >
                      <FileDown className="h-4 w-4" />
                      Generar PDF
                    </Button>
                  </div>
                  <div className="max-h-[min(20rem,40vh)] space-y-4 overflow-y-auto rounded-md border border-border/60 bg-muted/20 p-2 pr-1">
                    {selectedCustomer.pendingCreditLines.map((line) => (
                      <div
                        key={line.id}
                        className="overflow-hidden rounded-lg border bg-card text-xs sm:text-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2 border-b bg-muted/50 px-3 py-2">
                          <div>
                            <p className="font-medium text-foreground">{line.descripcion}</p>
                            <p className="text-muted-foreground">{line.fecha}</p>
                          </div>
                          <div className="text-right text-xs sm:text-sm">
                            <p className="text-muted-foreground">
                              Original{" "}
                              <span className="font-medium tabular-nums text-foreground">
                                {formatQ(line.totalOriginal)}
                              </span>
                            </p>
                            <p className="text-destructive">
                              Pendiente{" "}
                              <span className="font-semibold tabular-nums">
                                {formatQ(line.saldoPendiente)}
                              </span>
                            </p>
                          </div>
                        </div>
                        <table className="w-full">
                          <thead>
                            <tr className="border-b text-left text-muted-foreground">
                              <th className="px-3 py-2 font-medium">Producto</th>
                              <th className="px-3 py-2 text-right font-medium">Cant.</th>
                              <th className="px-3 py-2 text-right font-medium">P. unit.</th>
                              <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {line.items.map((item, idx) => (
                              <tr key={`${line.id}-${idx}`} className="border-b border-border/50 last:border-0">
                                <td className="px-3 py-2">{item.name}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{item.quantity}</td>
                                <td className="px-3 py-2 text-right tabular-nums">
                                  {formatQ(item.price)}
                                </td>
                                <td className="px-3 py-2 text-right font-medium tabular-nums">
                                  {formatQ(item.quantity * item.price)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCustomer.balance > 0 && selectedCustomer.pendingCreditLines.length === 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed p-3">
                  <p className="text-sm text-muted-foreground">
                    Hay saldo pendiente sin detalle de ventas. Puede generar un PDF con el resumen.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() =>
                      void downloadCustomerCreditPdf(
                        selectedCustomer.name,
                        selectedCustomer.balance,
                        []
                      )
                    }
                  >
                    <FileDown className="h-4 w-4" />
                    Generar PDF
                  </Button>
                </div>
              )}
            </div>

            {selectedCustomer.balance > 0 && (
              <div className="shrink-0 border-t bg-background px-6 py-4 shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.12)]">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 flex-1 gap-2 border-emerald-600/40 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    onClick={() => {
                      const ok = openWhatsAppDebtReminder(
                        selectedCustomer.phone,
                        selectedCustomer.name,
                        formatQ(selectedCustomer.balance),
                        "MiniMer"
                      )
                      if (!ok) {
                        window.alert(
                          "No se pudo abrir WhatsApp: verifique que el teléfono tenga al menos 7 dígitos o incluya el código 502."
                        )
                      }
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar recordatorio (WhatsApp)
                  </Button>
                  <Button className="h-12 flex-1 gap-2" onClick={() => setShowPayment(true)}>
                    <IconoQuetzal className="text-sm text-primary-foreground" />
                    Registrar abono
                  </Button>
                </div>
              </div>
            )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog
        open={showPayment}
        onOpenChange={(open) => {
          setShowPayment(open)
          if (!open) setPaymentNote("")
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Abono</DialogTitle>
            <DialogDescription>Ingresa el monto del abono para reducir el saldo deudor.</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-semibold">{selectedCustomer.name}</p>
                <p className="mt-2 text-sm text-muted-foreground">Saldo Actual</p>
                <p className="text-xl font-bold text-destructive">
                  {formatQ(selectedCustomer.balance)}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Monto del Abono</label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="h-12 text-lg"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Comentario (opcional)</label>
                <Textarea
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="min-h-[80px] resize-y"
                  placeholder="Ej. pago parcial, referencia…"
                />
              </div>

              <Button
                className="h-12 w-full"
                disabled={savingCustomer}
                onClick={() => void handlePayment()}
              >
                {savingCustomer ? "Registrando…" : "Confirmar Abono"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editingCustomer !== null} onOpenChange={(open) => !open && setEditingCustomer(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
            <DialogDescription>Modifica los datos del cliente.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre completo</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Teléfono</label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Correo</label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="h-12"
              />
            </div>
            <Button
              className="h-12 w-full"
              disabled={savingCustomer}
              onClick={() => void saveEdit()}
            >
              {savingCustomer ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={customerPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteCustomerInFlight) setCustomerPendingDelete(null)
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará{" "}
              <span className="font-medium text-foreground">
                {customerPendingDelete?.name}
              </span>{" "}
              del directorio. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCustomerInFlight}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCustomerInFlight}
              onClick={(e) => {
                e.preventDefault()
                void handleConfirmDeleteCustomer()
              }}
            >
              {deleteCustomerInFlight ? "Eliminando…" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
