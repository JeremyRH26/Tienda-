"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  Filter,
  ImagePlus,
  X,
  TrendingUp,
} from "lucide-react"
import { mockProducts, categories } from "@/lib/mock-data"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export function Inventario() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [productImage, setProductImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    costPrice: "",
    salePrice: "",
    stock: "",
    minStock: "",
    supplier: "",
  })

  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const lowStockCount = mockProducts.filter((p) => p.stock < p.minStock).length
  const totalProducts = mockProducts.length
  const totalValue = mockProducts.reduce((acc, p) => acc + p.salePrice * p.stock, 0)
  const totalMargin = mockProducts.reduce((acc, p) => acc + (p.salePrice - p.costPrice) * p.stock, 0)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProductImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddProduct = () => {
    setShowAddProduct(false)
    setProductImage(null)
    setNewProduct({
      name: "",
      category: "",
      costPrice: "",
      salePrice: "",
      stock: "",
      minStock: "",
      supplier: "",
    })
  }

  const calculateMargin = (cost: string, sale: string) => {
    const costNum = parseFloat(cost) || 0
    const saleNum = parseFloat(sale) || 0
    if (saleNum === 0) return 0
    return ((saleNum - costNum) / saleNum * 100).toFixed(1)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Inventario</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Gestiona tu stock y productos</p>
        </div>
        <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
          <DialogTrigger asChild>
            <Button className="h-11 gap-2 sm:h-12 sm:px-6">
              <Plus className="h-4 w-4" />
              <span className="sm:inline">Nuevo Producto</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Producto</DialogTitle>
              <DialogDescription>Completa la información del producto para agregarlo al inventario.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Imagen del Producto</label>
                <div className="flex items-center gap-4">
                  <div 
                    className="relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-primary/50 hover:bg-muted"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {productImage ? (
                      <>
                        <img src={productImage} alt="Preview" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setProductImage(null)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <ImagePlus className="h-8 w-8 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Haz clic para subir una imagen del producto
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG hasta 5MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre del Producto</label>
                <Input
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  className="h-11 sm:h-12"
                  placeholder="Ej: Coca-Cola 600ml"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoría</label>
                  <Select
                    value={newProduct.category}
                    onValueChange={(value) =>
                      setNewProduct({ ...newProduct, category: value })
                    }
                  >
                    <SelectTrigger className="h-11 sm:h-12">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Proveedor</label>
                  <Input
                    value={newProduct.supplier}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, supplier: e.target.value })
                    }
                    className="h-11 sm:h-12"
                    placeholder="Nombre del proveedor"
                  />
                </div>
              </div>

              {/* Prices Section */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <h4 className="mb-3 text-sm font-semibold">Precios</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Precio Costo</label>
                    <Input
                      type="number"
                      value={newProduct.costPrice}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, costPrice: e.target.value })
                      }
                      className="h-11 sm:h-12"
                      placeholder="$0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Precio Venta</label>
                    <Input
                      type="number"
                      value={newProduct.salePrice}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, salePrice: e.target.value })
                      }
                      className="h-11 sm:h-12"
                      placeholder="$0.00"
                    />
                  </div>
                </div>
                {(newProduct.costPrice || newProduct.salePrice) && (
                  <div className="mt-3 flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      Margen de Ganancia: {calculateMargin(newProduct.costPrice, newProduct.salePrice)}%
                    </span>
                    <span className="text-sm text-muted-foreground">
                      (${((parseFloat(newProduct.salePrice) || 0) - (parseFloat(newProduct.costPrice) || 0)).toFixed(2)} por unidad)
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stock Inicial</label>
                  <Input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, stock: e.target.value })
                    }
                    className="h-11 sm:h-12"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stock Mínimo</label>
                  <Input
                    type="number"
                    value={newProduct.minStock}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, minStock: e.target.value })
                    }
                    className="h-11 sm:h-12"
                    placeholder="0"
                  />
                </div>
              </div>
              <Button className="mt-2 h-11 w-full sm:h-12" onClick={handleAddProduct}>
                Agregar Producto
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12">
              <Package className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground sm:text-sm">Total Productos</p>
              <p className="text-lg font-bold sm:text-2xl">{totalProducts}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 sm:h-12 sm:w-12">
              <AlertTriangle className="h-5 w-5 text-amber-600 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground sm:text-sm">Stock Bajo</p>
              <p className="text-lg font-bold text-amber-600 sm:text-2xl">{lowStockCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12">
              <Package className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground sm:text-sm">Valor Inventario</p>
              <p className="text-lg font-bold sm:text-2xl">${totalValue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12">
              <TrendingUp className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground sm:text-sm">Ganancia Potencial</p>
              <p className="text-lg font-bold text-primary sm:text-2xl">${totalMargin.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:gap-4 sm:p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-10 sm:h-12"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-11 w-full sm:h-12 sm:w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Products - Cards for mobile, Table for desktop */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold sm:text-base">
            Lista de Productos ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile: Card layout */}
          <div className="space-y-3 p-4 sm:hidden">
            {filteredProducts.map((product) => {
              const margin = ((product.salePrice - product.costPrice) / product.salePrice * 100).toFixed(1)
              return (
                <div 
                  key={product.id} 
                  className="rounded-lg border bg-card p-4"
                >
                  <div className="mb-3 flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="h-full w-full rounded-lg object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-muted-foreground">
                          {product.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium">{product.name}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                        {product.stock < product.minStock ? (
                          <Badge variant="outline" className="border-amber-500 text-xs text-amber-600">
                            Stock Bajo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-primary text-xs text-primary">
                            Normal
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Costo</p>
                      <p className="font-medium">${product.costPrice}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Venta</p>
                      <p className="font-medium text-primary">${product.salePrice}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Stock</p>
                      <p className={`font-medium ${product.stock < product.minStock ? "text-amber-600" : ""}`}>
                        {product.stock} / {product.minStock} min
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Margen</p>
                      <p className="font-medium text-primary">{margin}%</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{product.supplier}</p>
                </div>
              )
            })}
          </div>

          {/* Desktop: Table layout */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Producto</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Categoría</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">P. Costo</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">P. Venta</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Margen</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Stock</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Proveedor</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const margin = ((product.salePrice - product.costPrice) / product.salePrice * 100).toFixed(1)
                  return (
                    <tr key={product.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="h-full w-full rounded-lg object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-muted-foreground">
                                {product.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{product.category}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        ${product.costPrice}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ${product.salePrice}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-medium text-primary">{margin}%</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={
                            product.stock < product.minStock
                              ? "font-bold text-amber-600"
                              : ""
                          }
                        >
                          {product.stock}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          / {product.minStock} min
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {product.supplier}
                      </td>
                      <td className="px-4 py-3">
                        {product.stock < product.minStock ? (
                          <Badge variant="outline" className="border-amber-500 text-amber-600">
                            Stock Bajo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-primary text-primary">
                            Normal
                          </Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
