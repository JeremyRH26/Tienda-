"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Plus,
  Users,
  DollarSign,
  Phone,
  Mail,
  ShoppingBag,
} from "lucide-react"
import { mockCustomers } from "@/lib/mock-data"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Customer = typeof mockCustomers[0]

export function Clientes() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
  })

  const filteredCustomers = mockCustomers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalDebt = mockCustomers.reduce((acc, c) => acc + c.balance, 0)
  const customersWithDebt = mockCustomers.filter((c) => c.balance > 0).length

  const handleAddCustomer = () => {
    setShowAddCustomer(false)
    setNewCustomer({ name: "", phone: "", email: "" })
  }

  const handlePayment = () => {
    // In a real app, this would process the payment
    setShowPayment(false)
    setPaymentAmount("")
    setSelectedCustomer(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Clientes</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Gestiona tu directorio de clientes y fiados</p>
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
              <Button className="mt-2 h-12 w-full" onClick={handleAddCustomer}>
                Agregar Cliente
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
              <p className="text-lg font-bold sm:text-2xl">{mockCustomers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 sm:h-12 sm:w-12">
              <DollarSign className="h-5 w-5 text-destructive sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground sm:text-sm">Total por Cobrar</p>
              <p className="text-lg font-bold text-destructive sm:text-2xl">
                ${totalDebt.toLocaleString()}
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
        {filteredCustomers.map((customer) => (
          <Card
            key={customer.id}
            className="cursor-pointer shadow-sm transition-all hover:shadow-md"
            onClick={() => setSelectedCustomer(customer)}
          >
            <CardContent className="p-6">
              <div className="mb-4 flex items-start justify-between">
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
                    ${customer.balance.toLocaleString()}
                  </p>
                </div>
                {customer.balance > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedCustomer(customer)
                      setShowPayment(true)
                    }}
                  >
                    <DollarSign className="h-3 w-3" />
                    Registrar Abono
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Perfil del Cliente</DialogTitle>
            <DialogDescription>Información detallada y estado de cuenta del cliente.</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6 py-4">
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
                      ${selectedCustomer.totalPurchases.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card className={selectedCustomer.balance > 0 ? "bg-destructive/10" : "bg-primary/10"}>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Saldo Deudor</p>
                    <p className={`text-xl font-bold ${selectedCustomer.balance > 0 ? "text-destructive" : "text-primary"}`}>
                      ${selectedCustomer.balance.toLocaleString()}
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

              {selectedCustomer.balance > 0 && (
                <Button
                  className="h-12 w-full gap-2"
                  onClick={() => setShowPayment(true)}
                >
                  <DollarSign className="h-4 w-4" />
                  Registrar Abono
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
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
                  ${selectedCustomer.balance.toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Monto del Abono</label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="h-12 text-lg"
                  placeholder="$0.00"
                />
              </div>

              <Button className="h-12 w-full" onClick={handlePayment}>
                Confirmar Abono
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
