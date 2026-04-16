"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  Search,
  Plus,
  Truck,
  Phone,
  Mail,
  Pencil,
  Trash2,
} from "lucide-react"
import {
  createSupplier,
  deleteSupplier,
  fetchSuppliers,
  updateSupplier,
  type SupplierDto,
} from "@/lib/services/suppliers.service"
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

function dash(s: string): string {
  const t = s.trim()
  return t ? t : "—"
}

export function Proveedores() {
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDto | null>(null)
  const [editingSupplier, setEditingSupplier] = useState<SupplierDto | null>(null)
  const [deletingSupplier, setDeletingSupplier] = useState<SupplierDto | null>(null)
  const [saving, setSaving] = useState(false)
  const [editSupplierForm, setEditSupplierForm] = useState({
    companyName: "",
    contactName: "",
    phone: "",
    email: "",
  })
  const [newSupplier, setNewSupplier] = useState({
    companyName: "",
    contactName: "",
    phone: "",
    email: "",
  })

  const loadSuppliers = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent)
    if (!silent) {
      setListLoading(true)
    }
    try {
      const rows = await fetchSuppliers()
      setSuppliers(rows)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cargar proveedores")
      setSuppliers([])
    } finally {
      if (!silent) {
        setListLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void loadSuppliers()
  }, [loadSuppliers])

  const filteredSuppliers = suppliers.filter((supplier) => {
    const q = searchTerm.toLowerCase()
    return (
      supplier.companyName.toLowerCase().includes(q) ||
      supplier.contactName.toLowerCase().includes(q) ||
      supplier.phone.toLowerCase().includes(q) ||
      supplier.email.toLowerCase().includes(q)
    )
  })

  const handleAddSupplier = async () => {
    if (!newSupplier.companyName.trim()) {
      toast.error("Indica el nombre o empresa del proveedor")
      return
    }
    setSaving(true)
    try {
      await createSupplier({
        companyName: newSupplier.companyName,
        contactName: newSupplier.contactName,
        phone: newSupplier.phone,
        email: newSupplier.email,
      })
      toast.success("Proveedor registrado")
      setShowAddSupplier(false)
      setNewSupplier({ companyName: "", contactName: "", phone: "", email: "" })
      await loadSuppliers({ silent: true })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar")
    } finally {
      setSaving(false)
    }
  }

  const openSupplierEdit = (s: SupplierDto) => {
    setEditingSupplier(s)
    setEditSupplierForm({
      companyName: s.companyName,
      contactName: s.contactName,
      phone: s.phone,
      email: s.email,
    })
  }

  const saveSupplierEdit = async () => {
    if (!editingSupplier) return
    if (!editSupplierForm.companyName.trim()) {
      toast.error("Indica el nombre o empresa del proveedor")
      return
    }
    setSaving(true)
    try {
      const updated = await updateSupplier(editingSupplier.id, {
        companyName: editSupplierForm.companyName,
        contactName: editSupplierForm.contactName,
        phone: editSupplierForm.phone,
        email: editSupplierForm.email,
      })
      toast.success("Proveedor actualizado")
      setEditingSupplier(null)
      await loadSuppliers({ silent: true })
      setSelectedSupplier((cur) => (cur?.id === updated.id ? updated : cur))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar")
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deletingSupplier) return
    setSaving(true)
    try {
      await deleteSupplier(deletingSupplier.id)
      toast.success("Proveedor eliminado")
      const id = deletingSupplier.id
      setDeletingSupplier(null)
      setSelectedSupplier((cur) => (cur?.id === id ? null : cur))
      await loadSuppliers({ silent: true })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Proveedores</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Contactos de tus proveedores
          </p>
        </div>
        <Dialog open={showAddSupplier} onOpenChange={setShowAddSupplier}>
          <DialogTrigger asChild>
            <Button className="h-11 gap-2 sm:h-12 sm:px-6" disabled={listLoading}>
              <Plus className="h-4 w-4" />
              <span>Nuevo Proveedor</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar contacto</DialogTitle>
              <DialogDescription>Datos del proveedor para consulta y comunicación.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre o empresa</label>
                <Input
                  value={newSupplier.companyName}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, companyName: e.target.value })
                  }
                  className="h-12"
                  placeholder="Nombre del proveedor"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contacto</label>
                <Input
                  value={newSupplier.contactName}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, contactName: e.target.value })
                  }
                  className="h-12"
                  placeholder="Persona de contacto"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono</label>
                <Input
                  value={newSupplier.phone}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, phone: e.target.value })
                  }
                  className="h-12"
                  placeholder="555-1234"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Correo</label>
                <Input
                  type="email"
                  value={newSupplier.email}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, email: e.target.value })
                  }
                  className="h-12"
                  placeholder="proveedor@email.com"
                />
              </div>
              <Button className="mt-2 h-12 w-full" onClick={() => void handleAddSupplier()} disabled={saving}>
                {saving ? <Spinner className="mx-auto" /> : "Guardar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm">
        <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12">
            <Truck className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground sm:text-sm">Total de proveedores</p>
            <p className="text-lg font-bold sm:text-2xl">
              {listLoading ? "…" : suppliers.length}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, contacto, teléfono o correo…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-11 pl-10 sm:h-12"
          disabled={listLoading}
        />
      </div>

      {listLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8 text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredSuppliers.map((supplier) => (
            <Card
              key={supplier.id}
              className="relative cursor-pointer shadow-sm transition-all hover:shadow-md"
              onClick={() => setSelectedSupplier(supplier)}
            >
              <CardContent className="p-6">
                <div
                  className="absolute right-3 top-3 flex gap-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Editar proveedor"
                    onClick={() => openSupplierEdit(supplier)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    aria-label="Eliminar proveedor"
                    onClick={() => setDeletingSupplier(supplier)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-col gap-4 pr-14 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Truck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{dash(supplier.companyName)}</h3>
                      <p className="text-sm text-muted-foreground">
                        Contacto: {dash(supplier.contactName)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{dash(supplier.phone)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate">{dash(supplier.email)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={selectedSupplier !== null}
        onOpenChange={(open) => !open && setSelectedSupplier(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Proveedor</DialogTitle>
            <DialogDescription className="sr-only">Datos de contacto</DialogDescription>
          </DialogHeader>
          {selectedSupplier && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{dash(selectedSupplier.companyName)}</h2>
                  <p className="text-muted-foreground">
                    Contacto: {dash(selectedSupplier.contactName)}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{dash(selectedSupplier.phone)}</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{dash(selectedSupplier.email)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editingSupplier !== null} onOpenChange={(open) => !open && setEditingSupplier(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar proveedor</DialogTitle>
            <DialogDescription>Actualiza los datos de contacto.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre o empresa</label>
              <Input
                value={editSupplierForm.companyName}
                onChange={(e) =>
                  setEditSupplierForm({ ...editSupplierForm, companyName: e.target.value })
                }
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contacto</label>
              <Input
                value={editSupplierForm.contactName}
                onChange={(e) =>
                  setEditSupplierForm({ ...editSupplierForm, contactName: e.target.value })
                }
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Teléfono</label>
              <Input
                value={editSupplierForm.phone}
                onChange={(e) =>
                  setEditSupplierForm({ ...editSupplierForm, phone: e.target.value })
                }
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Correo</label>
              <Input
                type="email"
                value={editSupplierForm.email}
                onChange={(e) =>
                  setEditSupplierForm({ ...editSupplierForm, email: e.target.value })
                }
                className="h-12"
              />
            </div>
            <Button className="h-12 w-full" onClick={() => void saveSupplierEdit()} disabled={saving}>
              {saving ? <Spinner className="mx-auto" /> : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingSupplier !== null} onOpenChange={(open) => !open && setDeletingSupplier(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará {deletingSupplier ? dash(deletingSupplier.companyName) : ""} de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={saving}
              onClick={(e) => {
                e.preventDefault()
                void confirmDelete()
              }}
            >
              {saving ? <Spinner className="mx-auto size-4" /> : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
