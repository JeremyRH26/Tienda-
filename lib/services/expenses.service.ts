import { API_BASE } from "@/lib/api-config"

export type ExpenseCategoryDto = {
  id: number
  name: string
}

/** Listado completo de gastos (para hidratar el estado tras recargar la página). */
export async function fetchExpenses(): Promise<ExpenseDetailDto[]> {
  const res = await fetch(`${API_BASE}/expenses`)
  const json = (await res.json()) as {
    message?: string
    data?: ExpenseDetailDto[]
  }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudieron cargar los gastos.")
  }
  return json.data ?? []
}

export async function fetchExpenseCategories(): Promise<ExpenseCategoryDto[]> {
  const res = await fetch(`${API_BASE}/expenses/categories`)
  const json = (await res.json()) as {
    message?: string
    data?: ExpenseCategoryDto[]
  }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudieron cargar las categorías.")
  }
  return json.data ?? []
}

export async function updateExpenseCategory(
  id: number,
  name: string,
): Promise<ExpenseCategoryDto> {
  const res = await fetch(`${API_BASE}/expenses/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name.trim() }),
  })
  const json = (await res.json().catch(() => ({}))) as {
    message?: string
    data?: ExpenseCategoryDto
  }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudo actualizar la categoría.")
  }
  if (!json.data?.id) {
    throw new Error("Respuesta inválida del servidor.")
  }
  return json.data
}

export async function deleteExpenseCategory(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/expenses/categories/${id}`, {
    method: "DELETE",
  })
  const json = (await res.json().catch(() => ({}))) as { message?: string }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudo eliminar la categoría.")
  }
}

export async function createExpenseCategory(name: string): Promise<ExpenseCategoryDto> {
  const res = await fetch(`${API_BASE}/expenses/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name.trim() }),
  })
  const json = (await res.json()) as {
    message?: string
    data?: ExpenseCategoryDto
  }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudo crear la categoría.")
  }
  if (!json.data?.id) {
    throw new Error("Respuesta inválida del servidor.")
  }
  return json.data
}

export type CreateExpensePayload = {
  categoryId: number
  expenseDate: string
  amount: number
  paymentMethod: "efectivo" | "transferencia"
  note?: string
}

export type CreateExpenseResult = {
  expenseId: number
}

export type ExpenseDetailDto = {
  id: number
  categoryId: number
  categoryName: string
  expenseDate: string
  amount: number
  paymentMethod: "efectivo" | "transferencia"
  note: string
}

export async function fetchExpenseById(id: number): Promise<ExpenseDetailDto> {
  const res = await fetch(`${API_BASE}/expenses/${id}`)
  const json = (await res.json()) as {
    message?: string
    data?: ExpenseDetailDto
  }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudo cargar el gasto.")
  }
  if (!json.data) {
    throw new Error("Respuesta inválida del servidor.")
  }
  return json.data
}

export async function deleteExpense(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/expenses/${id}`, { method: "DELETE" })
  const json = (await res.json()) as { message?: string }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudo eliminar el gasto.")
  }
}

export async function updateExpense(
  id: number,
  payload: CreateExpensePayload,
): Promise<ExpenseDetailDto> {
  const res = await fetch(`${API_BASE}/expenses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      categoryId: payload.categoryId,
      expenseDate: payload.expenseDate,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod,
      note: payload.note ?? "",
    }),
  })
  const json = (await res.json()) as {
    message?: string
    data?: ExpenseDetailDto
  }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudo actualizar el gasto.")
  }
  if (!json.data) {
    throw new Error("Respuesta inválida del servidor.")
  }
  return json.data
}

export async function createExpense(
  payload: CreateExpensePayload,
): Promise<CreateExpenseResult> {
  const res = await fetch(`${API_BASE}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      categoryId: payload.categoryId,
      expenseDate: payload.expenseDate,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod,
      note: payload.note ?? "",
    }),
  })
  const json = (await res.json()) as {
    message?: string
    data?: CreateExpenseResult
  }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudo registrar el gasto.")
  }
  if (json.data?.expenseId == null) {
    throw new Error("Respuesta inválida del servidor.")
  }
  return json.data
}
