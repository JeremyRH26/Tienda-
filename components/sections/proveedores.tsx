"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Plus,
  Truck,
  Phone,
  Mail,
  Calendar,
  Package,
  DollarSign,
} from "lucide-react"
import { mockSuppliers } from "@/lib/mock-data"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

type Supplier = typeof mockSuppliers[0]

export function Proveedores() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
  })

  const filteredSuppliers = mockSuppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.products.some((p) =>
        p.toLowerCase().includes(searchTerm.toLowerCase())
      )
  )

  const totalPending = mockSuppliers.reduce(
    (acc, s) => acc + s.pendingPayment,
    0
  )
  const suppliersWithPending = mockSuppliers.filter(
    (s) => s.pendingPayment > 0
  ).length

  const handleAddSupplier = () => {
    setShowAddSupplier(false)
    setNewSupplier({ name: "", contact: "", phone: "", email: "" })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Proveedores</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Gestiona tus proveedores y pagos pendientes
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
              <DialogTitle>Agregar Nuevo Proveedor</DialogTitle>
              <DialogDescription>Ingresa los datos de contacto del nuevo proveedor.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre de Empresa</label>
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
                  placeholder="Nombre del contacto"
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
                <label className="text-sm font-medium">Email</label>
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
                Agregar Proveedor
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
              <Truck className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground sm:text-sm">Total Proveedores</p>
              <p className="text-lg font-bold sm:text-2xl">{mockSuppliers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 sm:h-12 sm:w-12">
              <DollarSign className="h-5 w-5 text-amber-600 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground sm:text-sm">Por Pagar</p>
              <p className="text-lg font-bold text-amber-600 sm:text-2xl">
                ${totalPending.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 shadow-sm lg:col-span-1">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12">
              <Calendar className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground sm:text-sm">Pagos Pendientes</p>
              <p className="text-lg font-bold sm:text-2xl">{suppliersWithPending}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, contacto o producto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-11 pl-10 sm:h-12"
        />
      </div>

      {/* Suppliers List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredSuppliers.map((supplier) => (
          <Card
            key={supplier.id}
            className="cursor-pointer shadow-sm transition-all hover:shadow-md"
            onClick={() => setSelectedSupplier(supplier)}
          >
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>{supplier.products.length} productos</span>
                  </div>

                  {supplier.pendingPayment > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-amber-500 text-amber-600">
                        Pago: ${supplier.pendingPayment.toLocaleString()}
                      </Badge>
                      {supplier.nextPayment && (
                        <Badge variant="secondary">
                          <Calendar className="mr-1 h-3 w-3" />
                          {supplier.nextPayment}
                        </Badge>
                      )}
                    </div>
                  )}

                  {supplier.pendingPayment === 0 && (
                    <Badge variant="outline" className="border-primary text-primary">
                      Al corriente
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {supplier.products.map((product) => (
                  <Badge key={product} variant="secondary" className="text-xs">
                    {product}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Supplier Detail Dialog */}
      <Dialog
        open={selectedSupplier !== null}
        onOpenChange={(open) => !open && setSelectedSupplier(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle del Proveedor</DialogTitle>
            <DialogDescription>Información de contacto, productos y estado de pagos del proveedor.</DialogDescription>
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

              <div className="space-y-3">
                <h3 className="font-semibold">Información de Contacto</h3>
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

              <div className="space-y-3">
                <h3 className="font-semibold">Productos que Suministra</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSupplier.products.map((product) => (
                    <Badge key={product} variant="secondary">
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedSupplier.pendingPayment > 0 && (
                <Card className="bg-amber-50 dark:bg-amber-900/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Pago Pendiente
                        </p>
                        <p className="text-2xl font-bold text-amber-600">
                          ${selectedSupplier.pendingPayment.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Próximo Pago
                        </p>
                        <p className="font-semibold">
                          {selectedSupplier.nextPayment}
                        </p>
                      </div>
                    </div>
                    <Button className="mt-4 h-12 w-full gap-2">
                      <DollarSign className="h-4 w-4" />
                      Registrar Pago
                    </Button>
                  </CardContent>
                </Card>
              )}

              {selectedSupplier.pendingPayment === 0 && (
                <Card className="bg-primary/5">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <p className="font-medium text-primary">
                      Al corriente con los pagos
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
