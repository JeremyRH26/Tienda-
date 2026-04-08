"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Plus,
  Truck,
  Phone,
  Mail,
  Pencil,
  Trash2,
} from "lucide-react"
import { mockSuppliers, type SupplierContact } from "@/lib/mock-data"
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

type Supplier = SupplierContact

export function Proveedores() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    mockSuppliers.map((s) => ({ ...s }))
  )
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null)
  const [editSupplierForm, setEditSupplierForm] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
  })
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
  })

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone.includes(searchTerm) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddSupplier = () => {
    if (!newSupplier.name.trim()) return
    const nextId = suppliers.length ? Math.max(...suppliers.map((s) => s.id)) + 1 : 1
    setSuppliers((prev) => [
      ...prev,
      {
        id: nextId,
        name: newSupplier.name.trim(),
        contact: newSupplier.contact.trim() || "-",
        phone: newSupplier.phone.trim() || "-",
        email: newSupplier.email.trim() || "-",
      },
    ])
    setShowAddSupplier(false)
    setNewSupplier({ name: "", contact: "", phone: "", email: "" })
  }

  const openSupplierEdit = (s: Supplier) => {
    setEditingSupplier(s)
    setEditSupplierForm({
      name: s.name,
      contact: s.contact,
      phone: s.phone,
      email: s.email,
    })
  }

  const saveSupplierEdit = () => {
    if (!editingSupplier) return
    const id = editingSupplier.id
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              name: editSupplierForm.name.trim() || s.name,
              contact: editSupplierForm.contact.trim() || s.contact,
              phone: editSupplierForm.phone.trim() || s.phone,
              email: editSupplierForm.email.trim() || s.email,
            }
          : s
      )
    )
    setSelectedSupplier((cur) =>
      cur?.id === id
        ? {
            ...cur,
            name: editSupplierForm.name.trim() || cur.name,
            contact: editSupplierForm.contact.trim() || cur.contact,
            phone: editSupplierForm.phone.trim() || cur.phone,
            email: editSupplierForm.email.trim() || cur.email,
          }
        : cur
    )
    setEditingSupplier(null)
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
            <Button className="h-11 gap-2 sm:h-12 sm:px-6">
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
                  value={newSupplier.name}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, name: e.target.value })
                  }
                  className="h-12"
                  placeholder="Nombre del proveedor"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contacto</label>
                <Input
                  value={newSupplier.contact}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, contact: e.target.value })
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
              <Button className="mt-2 h-12 w-full" onClick={handleAddSupplier}>
                Guardar
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
            <p className="text-lg font-bold sm:text-2xl">{suppliers.length}</p>
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
        />
      </div>

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
                    <h3 className="font-semibold">{supplier.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Contacto: {supplier.contact}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{supplier.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
                  <h2 className="text-xl font-bold">{selectedSupplier.name}</h2>
                  <p className="text-muted-foreground">
                    Contacto: {selectedSupplier.contact}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedSupplier.phone}</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedSupplier.email}</span>
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
                value={editSupplierForm.name}
                onChange={(e) => setEditSupplierForm({ ...editSupplierForm, name: e.target.value })}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contacto</label>
              <Input
                value={editSupplierForm.contact}
                onChange={(e) => setEditSupplierForm({ ...editSupplierForm, contact: e.target.value })}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Teléfono</label>
              <Input
                value={editSupplierForm.phone}
                onChange={(e) => setEditSupplierForm({ ...editSupplierForm, phone: e.target.value })}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Correo</label>
              <Input
                type="email"
                value={editSupplierForm.email}
                onChange={(e) => setEditSupplierForm({ ...editSupplierForm, email: e.target.value })}
                className="h-12"
              />
            </div>
            <Button className="h-12 w-full" onClick={saveSupplierEdit}>
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingSupplier !== null} onOpenChange={(open) => !open && setDeletingSupplier(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará {deletingSupplier?.name} de la lista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingSupplier) {
                  const id = deletingSupplier.id
                  setSuppliers((prev) => prev.filter((s) => s.id !== id))
                  setSelectedSupplier((cur) => (cur?.id === id ? null : cur))
                }
                setDeletingSupplier(null)
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
