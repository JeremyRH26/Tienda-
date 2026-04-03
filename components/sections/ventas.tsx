"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, User, ShoppingCart, Receipt, Clock, Eye } from "lucide-react"
import { mockProducts, mockCustomers, mockTodaySales, type SaleRecord } from "@/lib/mock-data"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

interface CartItem {
  product: typeof mockProducts[0]
  quantity: number
}

export function Ventas() {
  const [searchTerm, setSearchTerm] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<string>("efectivo")
  const [mobileCartOpen, setMobileCartOpen] = useState(false)
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>(mockTodaySales)
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null)
  const [showSaleDetail, setShowSaleDetail] = useState(false)

  const filteredProducts = mockProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addToCart = (product: typeof mockProducts[0]) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const total = cart.reduce(
    (acc, item) => acc + item.product.salePrice * item.quantity,
    0
  )

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0)

  const todayTotal = salesHistory.reduce((acc, sale) => acc + sale.total, 0)

  const handleCheckout = () => {
    const newSale: SaleRecord = {
      id: salesHistory.length + 1,
      timestamp: new Date(),
      customer: selectedCustomer ? mockCustomers.find(c => c.id.toString() === selectedCustomer)?.name || "Cliente General" : "Cliente General",
      items: cart.map(item => ({ name: item.product.name, quantity: item.quantity, price: item.product.salePrice })),
      total,
      paymentMethod: paymentMethod as "efectivo" | "tarjeta" | "fiado",
      employeeId: 1,
    }
    setSalesHistory([newSale, ...salesHistory])
    setCart([])
    setShowCheckout(false)
    setSelectedCustomer("")
    setPaymentMethod("efectivo")
    setMobileCartOpen(false)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
  }

  const getPaymentBadge = (method: string) => {
    switch (method) {
      case "efectivo":
        return <Badge variant="outline" className="border-primary text-primary">Efectivo</Badge>
      case "tarjeta":
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Tarjeta</Badge>
      case "fiado":
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Fiado</Badge>
      default:
        return <Badge variant="outline">{method}</Badge>
    }
  }

  const CartContent = () => (
    <>
      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Agrega productos al carrito
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <span className="text-sm font-bold text-muted-foreground">
                    {item.product.name.charAt(0)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ${item.product.salePrice} c/u
                  </p>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={() => updateQuantity(item.product.id, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium sm:w-8">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={() => updateQuantity(item.product.id, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10 sm:h-8 sm:w-8"
                    onClick={() => removeFromCart(item.product.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total & Checkout */}
      <div className="border-t p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Total</span>
          <span className="text-2xl font-bold text-primary">
            ${total.toLocaleString()}
          </span>
        </div>
        <Button
          className="h-12 w-full text-base"
          disabled={cart.length === 0}
          onClick={() => setShowCheckout(true)}
        >
          Cobrar
        </Button>
      </div>
    </>
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs defaultValue="pos" className="w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">Punto de Venta</h1>
            <p className="text-sm text-muted-foreground sm:text-base">Realiza ventas y consulta el historial del dia</p>
          </div>
          <TabsList className="grid w-full grid-cols-2 sm:w-auto">
            <TabsTrigger value="pos" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Nueva Venta</span>
              <span className="sm:hidden">POS</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Historial</span>
              <span className="sm:hidden">Ventas</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pos" className="mt-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
            {/* Products Grid */}
            <div className="flex min-h-0 flex-1 flex-col space-y-4 overflow-hidden">
              <div className="flex items-start justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar producto o categoría..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-11 pl-10 text-base sm:h-12"
                  />
                </div>
                {/* Mobile Cart Button */}
                <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="relative h-11 w-11 shrink-0 sm:h-12 sm:w-12 lg:hidden">
                      <ShoppingCart className="h-5 w-5" />
                      {cartItemCount > 0 && (
                        <Badge className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center p-0 text-xs">
                          {cartItemCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
                    <SheetHeader className="border-b p-4">
                      <SheetTitle className="flex items-center justify-between text-base">
                        <span>Carrito</span>
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                          {cartItemCount} items
                        </span>
                      </SheetTitle>
                      <SheetDescription className="sr-only">Tu carrito de compras actual.</SheetDescription>
                    </SheetHeader>
                    <div className="flex min-h-0 flex-1 flex-col">
                      <CartContent />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Products */}
              <div className="min-h-0 flex-1 overflow-y-auto pb-4" style={{ maxHeight: "calc(100vh - 22rem)" }}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <Card
                      key={product.id}
                      className="cursor-pointer shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                      onClick={() => addToCart(product)}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="mb-2 flex h-12 items-center justify-center rounded-lg bg-muted sm:h-16">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="h-full w-full rounded-lg object-cover" />
                          ) : (
                            <span className="text-xl font-bold text-muted-foreground sm:text-2xl">
                              {product.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <h3 className="line-clamp-2 text-xs font-medium sm:text-sm">{product.name}</h3>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-base font-bold text-primary sm:text-lg">
                            ${product.salePrice}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {product.stock}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Cart Sidebar */}
            <Card className="hidden w-80 shrink-0 shadow-sm lg:flex lg:w-96 lg:flex-col" style={{ maxHeight: "calc(100vh - 14rem)" }}>
              <CardHeader className="shrink-0 border-b">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Carrito</span>
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {cartItemCount} items
                  </span>
                </CardTitle>
              </CardHeader>
              <div className="flex min-h-0 flex-1 flex-col">
                <CartContent />
              </div>
            </Card>

            {/* Mobile Floating Cart Button */}
            {cartItemCount > 0 && (
              <div className="fixed bottom-4 left-4 right-4 z-50 lg:hidden">
                <Button 
                  className="h-14 w-full gap-3 text-base shadow-lg" 
                  onClick={() => setMobileCartOpen(true)}
                >
                  <ShoppingCart className="h-5 w-5" />
                  Ver Carrito ({cartItemCount})
                  <span className="ml-auto font-bold">${total.toLocaleString()}</span>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          {/* Today's Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            <Card className="shadow-sm">
              <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12">
                  <Receipt className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">Ventas Hoy</p>
                  <p className="text-lg font-bold sm:text-2xl">{salesHistory.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12">
                  <Banknote className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">Total Hoy</p>
                  <p className="text-lg font-bold text-primary sm:text-2xl">${todayTotal.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-2 shadow-sm sm:col-span-1">
              <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 sm:h-12 sm:w-12">
                  <User className="h-5 w-5 text-amber-600 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">Fiados Hoy</p>
                  <p className="text-lg font-bold text-amber-600 sm:text-2xl">
                    ${salesHistory.filter(s => s.paymentMethod === "fiado").reduce((acc, s) => acc + s.total, 0).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sales List */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold sm:text-base">
                <Clock className="h-4 w-4" />
                Historial de Ventas del Dia
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {salesHistory.map((sale) => (
                  <div 
                    key={sale.id} 
                    className="flex cursor-pointer items-center gap-4 p-4 transition-colors hover:bg-muted/50"
                    onClick={() => { setSelectedSale(sale); setShowSaleDetail(true); }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 sm:h-12 sm:w-12">
                      <Receipt className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium sm:text-base">{sale.customer}</p>
                        {getPaymentBadge(sale.paymentMethod)}
                      </div>
                      <p className="text-xs text-muted-foreground sm:text-sm">
                        {sale.items.length} producto{sale.items.length > 1 ? "s" : ""} - {formatTime(sale.timestamp)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-primary sm:text-lg">${sale.total}</p>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sale Detail Dialog */}
      <Dialog open={showSaleDetail} onOpenChange={setShowSaleDetail}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle de Venta</DialogTitle>
            <DialogDescription>Informacion completa de la transaccion.</DialogDescription>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Venta #{selectedSale.id}</span>
                <span className="text-sm text-muted-foreground">{formatTime(selectedSale.timestamp)}</span>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">{selectedSale.customer}</p>
                <div className="mt-1">{getPaymentBadge(selectedSale.paymentMethod)}</div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Productos</p>
                {selectedSale.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">${item.price} x {item.quantity}</p>
                    </div>
                    <p className="font-medium">${item.price * item.quantity}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-lg bg-primary/10 p-4">
                <span className="font-medium">Total</span>
                <span className="text-2xl font-bold text-primary">${selectedSale.total}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar Venta</DialogTitle>
            <DialogDescription>Selecciona el cliente y metodo de pago para completar la venta.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Customer Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente (opcional)</label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger className="h-11 sm:h-12">
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Cliente General</SelectItem>
                  {mockCustomers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Metodo de Pago</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={paymentMethod === "efectivo" ? "default" : "outline"}
                  className="h-14 flex-col gap-1 sm:h-12"
                  onClick={() => setPaymentMethod("efectivo")}
                >
                  <Banknote className="h-4 w-4" />
                  <span className="text-xs">Efectivo</span>
                </Button>
                <Button
                  variant={paymentMethod === "tarjeta" ? "default" : "outline"}
                  className="h-14 flex-col gap-1 sm:h-12"
                  onClick={() => setPaymentMethod("tarjeta")}
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="text-xs">Tarjeta</span>
                </Button>
                <Button
                  variant={paymentMethod === "fiado" ? "default" : "outline"}
                  className="h-14 flex-col gap-1 sm:h-12"
                  onClick={() => setPaymentMethod("fiado")}
                >
                  <User className="h-4 w-4" />
                  <span className="text-xs">Fiado</span>
                </Button>
              </div>
            </div>

            {/* Total */}
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total a Cobrar</span>
                <span className="text-2xl font-bold text-primary">
                  ${total.toLocaleString()}
                </span>
              </div>
            </div>

            <Button className="h-12 w-full text-base" onClick={handleCheckout}>
              Confirmar Venta
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
