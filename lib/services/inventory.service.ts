import { API_BASE } from "@/lib/api-config"

export type InventoryCategoryDto = {
  id: number
  name: string
}

export type InventoryProductDto = {
  id: number
  categoryId: number
  categoryName: string
  supplierId: number | null
  name: string
  costPrice: number
  salePrice: number
  imageUrl: string | null
  status: number
  quantity: number
  minStock: number
}

async function readJson(res: Response): Promise<{ message?: string; data?: unknown }> {
  try {
    return (await res.json()) as { message?: string; data?: unknown }
  } catch {
    return {}
  }
}

export async function fetchInventoryCategories(): Promise<InventoryCategoryDto[]> {
  const res = await fetch(`${API_BASE}/inventory/categories`)
  const json = await readJson(res)
  if (!res.ok) {
    throw new Error(
      typeof json.message === "string" ? json.message : "No se pudieron cargar las categorías."
    )
  }
  const data = json.data
  if (!Array.isArray(data)) {
    return []
  }
  return data.map((row) => {
    const r = row as Record<string, unknown>
    return {
      id: Number(r.id),
      name: String(r.name ?? ""),
    }
  })
}

export async function createInventoryCategory(
  name: string,
): Promise<InventoryCategoryDto> {
  const res = await fetch(`${API_BASE}/inventory/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name.trim() }),
  })
  const json = await readJson(res)
  if (!res.ok) {
    throw new Error(
      typeof json.message === "string" ? json.message : "No se pudo crear la categoría."
    )
  }
  const d = json.data as Record<string, unknown> | undefined
  if (!d || d.id == null) {
    throw new Error("Respuesta inválida del servidor.")
  }
  return { id: Number(d.id), name: String(d.name ?? name.trim()) }
}

export async function fetchInventoryProducts(
  includeInactive = false,
): Promise<InventoryProductDto[]> {
  const q = includeInactive ? "?includeInactive=1" : ""
  const res = await fetch(`${API_BASE}/inventory/products${q}`)
  const json = await readJson(res)
  if (!res.ok) {
    throw new Error(
      typeof json.message === "string" ? json.message : "No se pudieron cargar los productos."
    )
  }
  const data = json.data
  if (!Array.isArray(data)) {
    return []
  }
  return data.map((row) => {
    const r = row as Record<string, unknown>
    return {
      id: Number(r.id),
      categoryId: Number(r.categoryId),
      categoryName: String(r.categoryName ?? ""),
      supplierId: r.supplierId != null ? Number(r.supplierId) : null,
      name: String(r.name ?? ""),
      costPrice: Number(r.costPrice),
      salePrice: Number(r.salePrice),
      imageUrl: r.imageUrl != null ? String(r.imageUrl) : null,
      status: Number(r.status ?? 1),
      quantity: Number(r.quantity ?? 0),
      minStock: Number(r.minStock ?? 0),
    }
  })
}

export type CreateInventoryProductPayload = {
  categoryId: number
  name: string
  costPrice: number
  salePrice: number
  initialQuantity: number
  minStock: number
  supplierId?: number | null
  imageUrl?: string | null
  status?: number
}

export async function createInventoryProduct(
  payload: CreateInventoryProductPayload,
): Promise<{ productId: number }> {
  const res = await fetch(`${API_BASE}/inventory/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      categoryId: payload.categoryId,
      name: payload.name.trim(),
      costPrice: payload.costPrice,
      salePrice: payload.salePrice,
      initialQuantity: payload.initialQuantity,
      minStock: payload.minStock,
      supplierId: payload.supplierId ?? null,
      imageUrl: payload.imageUrl ?? null,
      status: payload.status ?? 1,
    }),
  })
  const json = await readJson(res)
  if (!res.ok) {
    throw new Error(
      typeof json.message === "string" ? json.message : "No se pudo crear el producto."
    )
  }
  const d = json.data as Record<string, unknown> | undefined
  const raw = d?.productId ?? d?.product_id
  if (raw == null) {
    throw new Error("Respuesta inválida del servidor.")
  }
  return { productId: Number(raw) }
}

export async function uploadInventoryProductImage(
  productId: number,
  file: File,
): Promise<void> {
  const fd = new FormData()
  fd.append("image", file)
  const res = await fetch(`${API_BASE}/inventory/products/${productId}/image`, {
    method: "POST",
    body: fd,
  })
  const json = await readJson(res)
  if (!res.ok) {
    throw new Error(
      typeof json.message === "string" ? json.message : "No se pudo subir la imagen."
    )
  }
}

export type UpdateInventoryProductPayload = {
  categoryId: number
  name: string
  costPrice: number
  salePrice: number
  imageUrl?: string | null
  supplierId?: number | null
  status?: number
}

export async function updateInventoryProduct(
  id: number,
  payload: UpdateInventoryProductPayload,
): Promise<void> {
  const res = await fetch(`${API_BASE}/inventory/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      categoryId: payload.categoryId,
      name: payload.name.trim(),
      costPrice: payload.costPrice,
      salePrice: payload.salePrice,
      imageUrl: payload.imageUrl ?? null,
      supplierId: payload.supplierId ?? null,
      status: payload.status ?? 1,
    }),
  })
  const json = await readJson(res)
  if (!res.ok) {
    throw new Error(
      typeof json.message === "string" ? json.message : "No se pudo actualizar el producto."
    )
  }
}

export async function deleteInventoryProduct(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/inventory/products/${id}`, {
    method: "DELETE",
  })
  const json = await readJson(res)
  if (!res.ok) {
    throw new Error(
      typeof json.message === "string" ? json.message : "No se pudo eliminar el producto."
    )
  }
}

export async function adjustInventoryStock(productId: number, delta: number): Promise<void> {
  const res = await fetch(`${API_BASE}/inventory/products/${productId}/stock`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ delta }),
  })
  const json = await readJson(res)
  if (!res.ok) {
    throw new Error(
      typeof json.message === "string" ? json.message : "No se pudo ajustar el stock."
    )
  }
}

export async function setInventoryMinStock(
  productId: number,
  minStock: number,
): Promise<void> {
  const res = await fetch(`${API_BASE}/inventory/products/${productId}/min-stock`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ minStock }),
  })
  const json = await readJson(res)
  if (!res.ok) {
    throw new Error(
      typeof json.message === "string"
        ? json.message
        : "No se pudo actualizar el stock mínimo."
    )
  }
}

export function mapProductDtoToRow(dto: InventoryProductDto): {
  id: number
  name: string
  category: string
  categoryId: number
  costPrice: number
  salePrice: number
  stock: number
  minStock: number
  supplier: string
  image: string | null
  status: number
} {
  return {
    id: dto.id,
    name: dto.name,
    category: dto.categoryName,
    categoryId: dto.categoryId,
    costPrice: dto.costPrice,
    salePrice: dto.salePrice,
    stock: dto.quantity,
    minStock: dto.minStock,
    supplier:
      dto.supplierId != null ? `Proveedor #${dto.supplierId}` : "-",
    image: dto.imageUrl,
    status: dto.status,
  }
}
