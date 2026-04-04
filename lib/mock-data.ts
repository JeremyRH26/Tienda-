// Mock data for the business management app

const productPhoto = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/480/360`

export const mockProducts = [
  { id: 1, name: "Coca-Cola 600ml", category: "Bebidas", costPrice: 18, salePrice: 25, stock: 48, minStock: 20, supplier: "Distribuidora El Sol", image: productPhoto("tienda-bebida-1") },
  { id: 2, name: "Pan Bimbo Grande", category: "Panadería", costPrice: 48, salePrice: 65, stock: 12, minStock: 15, supplier: "Bimbo", image: productPhoto("tienda-pan-2") },
  { id: 3, name: "Leche Lala 1L", category: "Lácteos", costPrice: 24, salePrice: 32, stock: 35, minStock: 25, supplier: "Grupo Lala", image: productPhoto("tienda-lacteo-3") },
  { id: 4, name: "Jabón Zote", category: "Limpieza", costPrice: 12, salePrice: 18, stock: 5, minStock: 10, supplier: "Distribuidora Norte", image: productPhoto("tienda-limpieza-4") },
  { id: 5, name: "Huevos Docena", category: "Básicos", costPrice: 42, salePrice: 58, stock: 20, minStock: 10, supplier: "Granja San Pedro", image: productPhoto("tienda-huevo-5") },
  { id: 6, name: "Arroz 1kg", category: "Básicos", costPrice: 25, salePrice: 35, stock: 45, minStock: 20, supplier: "Distribuidora El Sol", image: productPhoto("tienda-arroz-6") },
  { id: 7, name: "Aceite 1L", category: "Básicos", costPrice: 35, salePrice: 48, stock: 22, minStock: 15, supplier: "Distribuidora Norte", image: productPhoto("tienda-aceite-7") },
  { id: 8, name: "Sabritas Original", category: "Snacks", costPrice: 15, salePrice: 22, stock: 60, minStock: 30, supplier: "PepsiCo", image: productPhoto("tienda-snack-8") },
  { id: 9, name: "Galletas Marías", category: "Snacks", costPrice: 10, salePrice: 15, stock: 8, minStock: 15, supplier: "Gamesa", image: productPhoto("tienda-galleta-9") },
  { id: 10, name: "Detergente Roma", category: "Limpieza", costPrice: 30, salePrice: 42, stock: 18, minStock: 10, supplier: "Distribuidora Norte", image: productPhoto("tienda-detergente-10") },
]

export const mockCustomers = [
  { id: 1, name: "María García", phone: "555-1234", email: "maria@email.com", balance: 450, lastPurchase: "2024-01-15", totalPurchases: 12500 },
  { id: 2, name: "Carlos López", phone: "555-5678", email: "carlos@email.com", balance: 0, lastPurchase: "2024-01-18", totalPurchases: 8900 },
  { id: 3, name: "Ana Martínez", phone: "555-9012", email: "ana@email.com", balance: 1250, lastPurchase: "2024-01-10", totalPurchases: 22400 },
  { id: 4, name: "Roberto Sánchez", phone: "555-3456", email: "roberto@email.com", balance: 0, lastPurchase: "2024-01-17", totalPurchases: 5600 },
  { id: 5, name: "Laura Hernández", phone: "555-7890", email: "laura@email.com", balance: 780, lastPurchase: "2024-01-12", totalPurchases: 15800 },
  { id: 6, name: "Pedro Ramírez", phone: "555-2345", email: "pedro@email.com", balance: 2100, lastPurchase: "2024-01-08", totalPurchases: 31200 },
]

export const mockSuppliers = [
  { id: 1, name: "Distribuidora El Sol", contact: "José Mendoza", phone: "555-1111", email: "ventas@elsol.com", products: ["Coca-Cola", "Arroz", "Frijol"], pendingPayment: 15800, nextPayment: "2024-01-25" },
  { id: 2, name: "Bimbo", contact: "Laura Torres", phone: "555-2222", email: "dist@bimbo.com", products: ["Pan Bimbo", "Marinela", "Barcel"], pendingPayment: 8500, nextPayment: "2024-01-22" },
  { id: 3, name: "Grupo Lala", contact: "Miguel Ángel", phone: "555-3333", email: "ventas@lala.com", products: ["Leche", "Yogurt", "Queso"], pendingPayment: 0, nextPayment: null },
  { id: 4, name: "Distribuidora Norte", contact: "Carmen Ruiz", phone: "555-4444", email: "pedidos@norte.com", products: ["Jabón", "Detergente", "Aceite"], pendingPayment: 4200, nextPayment: "2024-01-28" },
  { id: 5, name: "PepsiCo", contact: "Ricardo Vega", phone: "555-5555", email: "dist@pepsico.com", products: ["Sabritas", "Pepsi", "Gatorade"], pendingPayment: 12300, nextPayment: "2024-01-30" },
]

export type ModulePermission = "dashboard" | "ventas" | "inventario" | "clientes" | "proveedores" | "equipo" | "reportes"

export const allModules: { id: ModulePermission; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "ventas", label: "Ventas/POS" },
  { id: "inventario", label: "Inventario" },
  { id: "clientes", label: "Clientes" },
  { id: "proveedores", label: "Proveedores" },
  { id: "equipo", label: "Equipo" },
  { id: "reportes", label: "Reportes" },
]

export interface Employee {
  id: number
  name: string
  role: "admin" | "cajero"
  username: string
  password: string
  phone: string
  status: "active" | "inactive"
  shift: string
  permissions: ModulePermission[]
}

export const mockEmployees: Employee[] = [
  { id: 1, name: "Juan Díaz", role: "admin", username: "juan.admin", password: "Admin2024!", phone: "555-0001", status: "active", shift: "Matutino", permissions: ["dashboard", "ventas", "inventario", "clientes", "proveedores", "equipo", "reportes"] },
  { id: 2, name: "María Flores", role: "cajero", username: "maria.caja", password: "Caja2024!", phone: "555-0002", status: "active", shift: "Vespertino", permissions: ["dashboard", "ventas", "clientes"] },
  { id: 3, name: "Pedro Gómez", role: "cajero", username: "pedro.caja", password: "Pedro2024!", phone: "555-0003", status: "inactive", shift: "Nocturno", permissions: ["ventas"] },
  { id: 4, name: "Ana Morales", role: "cajero", username: "ana.caja", password: "Ana2024!", phone: "555-0004", status: "active", shift: "Matutino", permissions: ["dashboard", "ventas", "inventario", "clientes"] },
]

export interface SaleRecord {
  id: number
  timestamp: Date
  customer: string
  items: { name: string; quantity: number; price: number }[]
  total: number
  paymentMethod: "efectivo" | "tarjeta" | "fiado"
  employeeId: number
}

function yesterdayAt(hour: number, minute = 0): Date {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  d.setHours(hour, minute, 0, 0)
  return d
}

// Ventas de ejemplo de hoy (misma fecha que al cargar la app)
export const mockTodaySales: SaleRecord[] = [
  { id: 1, timestamp: new Date(Date.now() - 1000 * 60 * 5), customer: "María García", items: [{ name: "Coca-Cola 600ml", quantity: 2, price: 25 }, { name: "Sabritas Original", quantity: 1, price: 22 }], total: 72, paymentMethod: "efectivo", employeeId: 1 },
  { id: 2, timestamp: new Date(Date.now() - 1000 * 60 * 15), customer: "Cliente General", items: [{ name: "Pan Bimbo Grande", quantity: 1, price: 65 }, { name: "Leche Lala 1L", quantity: 2, price: 32 }], total: 129, paymentMethod: "tarjeta", employeeId: 2 },
  { id: 3, timestamp: new Date(Date.now() - 1000 * 60 * 45), customer: "Carlos López", items: [{ name: "Huevos Docena", quantity: 1, price: 58 }, { name: "Arroz 1kg", quantity: 2, price: 35 }], total: 128, paymentMethod: "efectivo", employeeId: 1 },
  { id: 4, timestamp: new Date(Date.now() - 1000 * 60 * 90), customer: "Ana Martínez", items: [{ name: "Jabón Zote", quantity: 3, price: 18 }, { name: "Detergente Roma", quantity: 1, price: 42 }], total: 96, paymentMethod: "fiado", employeeId: 2 },
  { id: 5, timestamp: new Date(Date.now() - 1000 * 60 * 120), customer: "Cliente General", items: [{ name: "Aceite 1L", quantity: 1, price: 48 }, { name: "Galletas Marías", quantity: 2, price: 15 }], total: 78, paymentMethod: "efectivo", employeeId: 1 },
  { id: 6, timestamp: new Date(Date.now() - 1000 * 60 * 180), customer: "Laura Hernández", items: [{ name: "Leche Lala 1L", quantity: 3, price: 32 }], total: 96, paymentMethod: "tarjeta", employeeId: 4 },
]

/** Incluye ventas de días anteriores para probar el filtro "Solo hoy" */
export const mockSalesHistoryExtended: SaleRecord[] = [
  ...mockTodaySales,
  {
    id: 7,
    timestamp: yesterdayAt(9, 15),
    customer: "Roberto Sánchez",
    items: [{ name: "Arroz 1kg", quantity: 4, price: 35 }],
    total: 140,
    paymentMethod: "efectivo",
    employeeId: 1,
  },
  {
    id: 8,
    timestamp: yesterdayAt(16, 40),
    customer: "Cliente General",
    items: [{ name: "Coca-Cola 600ml", quantity: 6, price: 25 }],
    total: 150,
    paymentMethod: "tarjeta",
    employeeId: 2,
  },
]

// Daily sales data for "hoy" filter
export const mockDailySalesHours = [
  { hour: "8am", sales: 450, expenses: 120 },
  { hour: "9am", sales: 680, expenses: 180 },
  { hour: "10am", sales: 920, expenses: 250 },
  { hour: "11am", sales: 1150, expenses: 320 },
  { hour: "12pm", sales: 1580, expenses: 450 },
  { hour: "1pm", sales: 1320, expenses: 380 },
  { hour: "2pm", sales: 890, expenses: 240 },
  { hour: "3pm", sales: 1050, expenses: 290 },
  { hour: "4pm", sales: 1280, expenses: 350 },
  { hour: "5pm", sales: 1450, expenses: 400 },
  { hour: "6pm", sales: 1680, expenses: 480 },
  { hour: "7pm", sales: 1120, expenses: 310 },
]

export const mockSalesData = [
  { day: "Lun", sales: 4500, expenses: 1200 },
  { day: "Mar", sales: 3800, expenses: 800 },
  { day: "Mié", sales: 5200, expenses: 1500 },
  { day: "Jue", sales: 4100, expenses: 900 },
  { day: "Vie", sales: 6800, expenses: 2100 },
  { day: "Sáb", sales: 8500, expenses: 2800 },
  { day: "Dom", sales: 7200, expenses: 1800 },
]

export const mockMonthlySales = [
  { month: "Ene", sales: 145000, expenses: 52000 },
  { month: "Feb", sales: 138000, expenses: 48000 },
  { month: "Mar", sales: 162000, expenses: 58000 },
  { month: "Abr", sales: 155000, expenses: 54000 },
  { month: "May", sales: 171000, expenses: 61000 },
  { month: "Jun", sales: 168000, expenses: 59000 },
]

export const categories = ["Bebidas", "Panadería", "Lácteos", "Limpieza", "Básicos", "Snacks"]
