"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { toast } from "sonner"
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
  Pencil,
  Trash2,
  FileDown,
  Tags,
} from "lucide-react"
import { formatQ } from "@/lib/currency"
import {
  adjustInventoryStock,
  createInventoryCategory,
  createInventoryProduct,
  deleteInventoryCategory,
  deleteInventoryProduct,
  fetchInventoryCategories,
  fetchInventoryProducts,
  fetchInventorySuppliers,
  mapProductDtoToRow,
  setInventoryMinStock,
  updateInventoryCategory,
  updateInventoryProduct,
  uploadInventoryProductImage,
  type InventoryCategoryDto,
  type InventorySupplierDto,
} from "@/lib/services/inventory.service"
import { CategoryAdminDialog } from "@/components/category-admin-dialog"
import { downloadInventoryPdf } from "@/lib/pdf-reports"
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

const SUPPLIER_NONE = "__none__"

function parseSupplierFormValue(v: string): number | null {
  if (!v || v === SUPPLIER_NONE) return null
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

type ProductRow = {
  id: number
  name: string
  category: string
  categoryId: number
  costPrice: number
  salePrice: number
  stock: number
  minStock: number
  supplierId: number | null
  supplier: string
  image: string | null
  status: number
}

export function Inventario() {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [suppliers, setSuppliers] = useState<InventorySupplierDto[]>([])
  const [productCategories, setProductCategories] = useState<InventoryCategoryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categoryDialogFor, setCategoryDialogFor] = useState<"add" | "edit" | null>(null)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newProduct, setNewProduct] = useState({
    name: "",
    categoryId: "",
    costPrice: "",
    salePrice: "",
    stock: "",
    minStock: "",
    supplierId: SUPPLIER_NONE,
  })
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null)
  const [editProductForm, setEditProductForm] = useState({
    name: "",
    categoryId: "",
    costPrice: "",
    salePrice: "",
    stock: "",
    minStock: "",
    supplierId: SUPPLIER_NONE,
  })
  const [deletingProduct, setDeletingProduct] = useState<ProductRow | null>(null)
  const [showCategoryAdminDialog, setShowCategoryAdminDialog] = useState(false)

  const clearAddImage = useCallback(() => {
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview)
    }
    setImagePreview(null)
    setImageFile(null)
  }, [imagePreview])

  const loadInventory = useCallback(async () => {
    setLoading(true)
    try {
      const cats = await fetchInventoryCategories()
      setProductCategories(cats)
    } catch (e) {
      setProductCategories([])
      toast.error(
        e instanceof Error ? e.message : "No se pudieron cargar las categorías de producto.",
      )
    }
    let supList: InventorySupplierDto[] = []
    try {
      supList = await fetchInventorySuppliers()
      setSuppliers(supList)
    } catch {
      setSuppliers([])
    }
    try {
      const prods = await fetchInventoryProducts(false)
      setProducts(
        prods.map((p) => mapProductDtoToRow(p, supList)).filter((x) => x.status === 1),
      )
    } catch (e) {
      setProducts([])
      toast.error(
        e instanceof Error ? e.message : "No se pudieron cargar los productos.",
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadInventory()
  }, [loadInventory])

  useEffect(() => {
    if (!showAddProduct) return
    void (async () => {
      try {
        const [cats, sups] = await Promise.all([
          fetchInventoryCategories(),
          fetchInventorySuppliers().catch(() => [] as InventorySupplierDto[]),
        ])
        setProductCategories(cats)
        setSuppliers(sups)
      } catch {
        /* se mantiene el listado previo */
      }
    })()
  }, [showAddProduct])

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
      categoryFilter === "all" || String(product.categoryId) === categoryFilter
    return matchesSearch && matchesCategory
  })

  const lowStockCount = products.filter((p) => p.stock < p.minStock).length
  const totalProducts = products.length
  const totalValue = products.reduce((acc, p) => acc + p.salePrice * p.stock, 0)
  const totalMargin = products.reduce((acc, p) => acc + (p.salePrice - p.costPrice) * p.stock, 0)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview)
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleAddProduct = async () => {
    const categoryId = Number(newProduct.categoryId)
    if (!newProduct.name.trim() || !Number.isFinite(categoryId) || categoryId <= 0) {
      toast.error("Indica nombre y categoría del producto.")
      return
    }
    const cost = parseFloat(newProduct.costPrice) || 0
    const sale = parseFloat(newProduct.salePrice) || 0
    const stock = parseInt(newProduct.stock, 10) || 0
    const minStock = parseInt(newProduct.minStock, 10) || 0
    const supplierId = parseSupplierFormValue(newProduct.supplierId)
    try {
      setSaving(true)
      const { productId } = await createInventoryProduct({
        categoryId,
        name: newProduct.name.trim(),
        costPrice: cost,
        salePrice: sale,
        initialQuantity: stock,
        minStock,
        supplierId,
        status: 1,
      })
      if (imageFile) {
        try {
          await uploadInventoryProductImage(productId, imageFile)
        } catch (imgErr) {
          toast.warning(
            imgErr instanceof Error
              ? `Producto creado, pero la imagen falló: ${imgErr.message}`
              : "Producto creado, pero no se subió la imagen.",
          )
        }
      }
      await loadInventory()
      toast.success("Producto creado correctamente.")
      setShowAddProduct(false)
      clearAddImage()
      setNewProduct({
        name: "",
        categoryId: "",
        costPrice: "",
        salePrice: "",
        stock: "",
        minStock: "",
        supplierId: SUPPLIER_NONE,
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear el producto.")
    } finally {
      setSaving(false)
    }
  }

  const openProductEdit = (p: ProductRow) => {
    setEditingProduct(p)
    setEditProductForm({
      name: p.name,
      categoryId: String(p.categoryId),
      costPrice: String(p.costPrice),
      salePrice: String(p.salePrice),
      stock: String(p.stock),
      minStock: String(p.minStock),
      supplierId:
        p.supplierId != null ? String(p.supplierId) : SUPPLIER_NONE,
    })
  }

  const saveProductEdit = async () => {
    if (!editingProduct) return
    const id = editingProduct.id
    const categoryId = Number(editProductForm.categoryId)
    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      toast.error("Selecciona una categoría válida.")
      return
    }
    const cost = parseFloat(editProductForm.costPrice) || 0
    const sale = parseFloat(editProductForm.salePrice) || 0
    const stock = parseInt(editProductForm.stock, 10) || 0
    const minStock = parseInt(editProductForm.minStock, 10) || 0
    const oldStock = editingProduct.stock
    const oldMin = editingProduct.minStock
    const supplierId = parseSupplierFormValue(editProductForm.supplierId)
    try {
      setSaving(true)
      await updateInventoryProduct(id, {
        categoryId,
        name: editProductForm.name.trim() || editingProduct.name,
        costPrice: cost,
        salePrice: sale,
        imageUrl: editingProduct.image,
        supplierId,
        status: editingProduct.status,
      })
      if (minStock !== oldMin) {
        await setInventoryMinStock(id, minStock)
      }
      const delta = stock - oldStock
      if (delta !== 0) {
        await adjustInventoryStock(id, delta)
      }
      await loadInventory()
      toast.success("Producto actualizado.")
      setEditingProduct(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar el producto.")
    } finally {
      setSaving(false)
    }
  }

  const calculateMargin = (cost: string, sale: string) => {
    const costNum = parseFloat(cost) || 0
    const saleNum = parseFloat(sale) || 0
    if (saleNum === 0) return 0
    return ((saleNum - costNum) / saleNum * 100).toFixed(1)
  }

  const saveNewProductCategory = async () => {
    const name = newCategoryName.trim()
    if (!name) return
    const existing = productCategories.find((c) => c.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      if (categoryDialogFor === "add") {
        setNewProduct((p) => ({ ...p, categoryId: String(existing.id) }))
      } else if (categoryDialogFor === "edit") {
        setEditProductForm((f) => ({ ...f, categoryId: String(existing.id) }))
      }
      setCategoryDialogFor(null)
      setNewCategoryName("")
      toast.info("Esa categoría ya existe; se seleccionó en el formulario.")
      return
    }
    try {
      setSaving(true)
      const created = await createInventoryCategory(name)
      const cats = await fetchInventoryCategories()
      setProductCategories(cats)
      if (categoryDialogFor === "add") {
        setNewProduct((p) => ({ ...p, categoryId: String(created.id) }))
      } else if (categoryDialogFor === "edit") {
        setEditProductForm((f) => ({ ...f, categoryId: String(created.id) }))
      }
      toast.success("Categoría creada.")
      setCategoryDialogFor(null)
      setNewCategoryName("")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear la categoría.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Inventario</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Gestiona tu stock y productos
            {loading ? " · Cargando…" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 gap-2 sm:h-12 sm:px-6"
            onClick={() => setShowCategoryAdminDialog(true)}
          >
            <Tags className="h-4 w-4" />
            <span className="hidden sm:inline">Categorías</span>
            <span className="sm:hidden">Cat.</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 gap-2 sm:h-12 sm:px-6"
            onClick={() => void downloadInventoryPdf(products)}
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">Generar PDF inventario</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        <Dialog
          open={showAddProduct}
          onOpenChange={(open) => {
            setShowAddProduct(open)
            if (!open) clearAddImage()
          }}
        >
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
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            clearAddImage()
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
                  <div className="flex gap-2">
                    <Select
                      value={newProduct.categoryId || undefined}
                      onValueChange={(value) =>
                        setNewProduct({ ...newProduct, categoryId: value })
                      }
                    >
                      <SelectTrigger className="h-11 min-w-0 flex-1 sm:h-12">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {productCategories.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 shrink-0 sm:h-12 sm:w-12"
                      aria-label="Nueva categoría"
                      onClick={() => {
                        setCategoryDialogFor("add")
                        setNewCategoryName("")
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {productCategories.length === 0 ? (
                    <p className="text-muted-foreground text-xs">
                      No hay categorías: pulsa + para crear una, o revisa que el API responda en{" "}
                      <code className="rounded bg-muted px-1">/inventory/categories</code>.
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Proveedor</label>
                  <Select
                    value={
                      newProduct.supplierId && newProduct.supplierId !== SUPPLIER_NONE
                        ? newProduct.supplierId
                        : SUPPLIER_NONE
                    }
                    onValueChange={(value) =>
                      setNewProduct({ ...newProduct, supplierId: value })
                    }
                  >
                    <SelectTrigger className="h-11 sm:h-12">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SUPPLIER_NONE}>Sin proveedor</SelectItem>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.companyName.trim() || `Proveedor #${s.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      placeholder="0.00"
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
                      placeholder="0.00"
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
                      (
                      {formatQ(
                        (parseFloat(newProduct.salePrice) || 0) -
                          (parseFloat(newProduct.costPrice) || 0)
                      )}{" "}
                      por unidad)
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
              <Button
                className="mt-2 h-11 w-full sm:h-12"
                onClick={() => void handleAddProduct()}
                disabled={saving || loading}
              >
                {saving ? "Guardando…" : "Agregar Producto"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
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
              <p className="text-lg font-bold sm:text-2xl">{formatQ(totalValue)}</p>
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
              <p className="text-lg font-bold text-primary sm:text-2xl">{formatQ(totalMargin)}</p>
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
              {productCategories.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold sm:text-base">
            Productos ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {!loading && filteredProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay productos que coincidan. Crea una categoría (botón + junto al selector) y luego
              &quot;Nuevo producto&quot; para registrar en el servidor.
            </p>
          ) : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const margin = (
                ((product.salePrice - product.costPrice) / product.salePrice) *
                100
              ).toFixed(1)
              return (
                <Card key={product.id} className="overflow-hidden shadow-sm">
                  <div className="relative aspect-[4/3] w-full bg-muted">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-4xl font-bold text-muted-foreground">
                          {product.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="absolute right-2 top-2 flex gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 shadow-md"
                        aria-label="Editar"
                        onClick={() => openProductEdit(product)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 text-destructive shadow-md hover:text-destructive"
                        aria-label="Eliminar"
                        onClick={() => setDeletingProduct(product)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="space-y-3 p-4">
                    <div>
                      <h3 className="line-clamp-2 font-semibold leading-tight">{product.name}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {product.category}
                        </Badge>
                        {product.stock < product.minStock ? (
                          <Badge
                            variant="outline"
                            className="border-amber-500 text-xs text-amber-600"
                          >
                            Stock bajo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-primary text-xs text-primary">
                            Normal
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Costo</p>
                        <p className="font-medium">{formatQ(product.costPrice)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Venta</p>
                        <p className="font-semibold text-primary">{formatQ(product.salePrice)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Stock</p>
                        <p
                          className={`font-medium ${
                            product.stock < product.minStock ? "text-amber-600" : ""
                          }`}
                        >
                          {product.stock}{" "}
                          <span className="text-muted-foreground">/ mín. {product.minStock}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Margen</p>
                        <p className="font-medium text-primary">{margin}%</p>
                      </div>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{product.supplier}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={editingProduct !== null} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar producto</DialogTitle>
            <DialogDescription>Actualiza precios, stock y datos del producto.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={editProductForm.name}
                onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoría</label>
              <div className="flex gap-2">
                <Select
                  value={editProductForm.categoryId || undefined}
                  onValueChange={(v) =>
                    setEditProductForm({ ...editProductForm, categoryId: v })
                  }
                >
                  <SelectTrigger className="h-11 min-w-0 flex-1">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {productCategories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0"
                  aria-label="Nueva categoría"
                  onClick={() => {
                    setCategoryDialogFor("edit")
                    setNewCategoryName("")
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {productCategories.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  Sin categorías en el listado. Crea una con + o recarga la página.
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Proveedor</label>
              <Select
                value={
                  editProductForm.supplierId &&
                  editProductForm.supplierId !== SUPPLIER_NONE
                    ? editProductForm.supplierId
                    : SUPPLIER_NONE
                }
                onValueChange={(value) =>
                  setEditProductForm({ ...editProductForm, supplierId: value })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SUPPLIER_NONE}>Sin proveedor</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.companyName.trim() || `Proveedor #${s.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Precio costo</label>
                <Input
                  type="number"
                  value={editProductForm.costPrice}
                  onChange={(e) =>
                    setEditProductForm({ ...editProductForm, costPrice: e.target.value })
                  }
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Precio venta</label>
                <Input
                  type="number"
                  value={editProductForm.salePrice}
                  onChange={(e) =>
                    setEditProductForm({ ...editProductForm, salePrice: e.target.value })
                  }
                  className="h-11"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Stock</label>
                <Input
                  type="number"
                  value={editProductForm.stock}
                  onChange={(e) =>
                    setEditProductForm({ ...editProductForm, stock: e.target.value })
                  }
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Stock mínimo</label>
                <Input
                  type="number"
                  value={editProductForm.minStock}
                  onChange={(e) =>
                    setEditProductForm({ ...editProductForm, minStock: e.target.value })
                  }
                  className="h-11"
                />
              </div>
            </div>
            <Button
              className="h-11 w-full"
              onClick={() => void saveProductEdit()}
              disabled={saving}
            >
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={categoryDialogFor !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCategoryDialogFor(null)
            setNewCategoryName("")
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva categoría</DialogTitle>
            <DialogDescription>Solo se guarda el nombre; quedará disponible en el listado.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="h-11"
                placeholder="Ej. Bebidas"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    saveNewProductCategory()
                  }
                }}
              />
            </div>
            <Button
              type="button"
              className="h-11 w-full"
              onClick={() => void saveNewProductCategory()}
              disabled={saving}
            >
              {saving ? "Guardando…" : "Agregar categoría"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CategoryAdminDialog
        open={showCategoryAdminDialog}
        onOpenChange={setShowCategoryAdminDialog}
        title="Categorías de producto"
        description="Edita el nombre o elimina categorías que no tengan productos asociados."
        categories={productCategories}
        onReload={loadInventory}
        onRename={async (id, name) => {
          await updateInventoryCategory(id, name)
        }}
        onDelete={(id) => deleteInventoryCategory(id)}
      />

      <AlertDialog open={deletingProduct !== null} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se quitará {deletingProduct?.name} del inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                const p = deletingProduct
                setDeletingProduct(null)
                if (!p) return
                void (async () => {
                  try {
                    setSaving(true)
                    await deleteInventoryProduct(p.id)
                    await loadInventory()
                    toast.success("Producto dado de baja.")
                  } catch (e) {
                    toast.error(
                      e instanceof Error ? e.message : "No se pudo eliminar el producto.",
                    )
                  } finally {
                    setSaving(false)
                  }
                })()
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
