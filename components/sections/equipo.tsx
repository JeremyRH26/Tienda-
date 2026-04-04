"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plus,
  UserCog,
  Users,
  User,
  Phone,
  Clock,
  UserPlus,
  KeyRound,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
} from "lucide-react"
import {
  mockEmployees,
  allModules,
  type Employee,
  type ModulePermission,
} from "@/lib/mock-data"
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

function defaultPermissions(role: string): ModulePermission[] {
  if (role === "admin") return allModules.map((m) => m.id)
  return ["dashboard", "ventas", "clientes"]
}

export function Equipo() {
  const [employees, setEmployees] = useState<Employee[]>(() =>
    mockEmployees.map((e) => ({ ...e, permissions: [...e.permissions] }))
  )
  const [showInvite, setShowInvite] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    username: "",
    password: "",
    phone: "",
    role: "",
    shift: "",
  })
  const [showPwFor, setShowPwFor] = useState<number | null>(null)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    username: "",
    password: "",
    phone: "",
    role: "" as "" | "admin" | "cajero",
    shift: "",
    status: "" as "" | "active" | "inactive",
  })
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)

  const activeEmployees = employees.filter((e) => e.status === "active")
  const adminCount = employees.filter((e) => e.role === "admin").length
  const cashierCount = employees.filter((e) => e.role === "cajero").length

  const handleInvite = () => {
    if (!newEmployee.name.trim() || !newEmployee.username.trim() || !newEmployee.password) return
    const role = (newEmployee.role || "cajero") as "admin" | "cajero"
    const nextId = employees.length ? Math.max(...employees.map((e) => e.id)) + 1 : 1
    setEmployees((prev) => [
      ...prev,
      {
        id: nextId,
        name: newEmployee.name.trim(),
        username: newEmployee.username.trim(),
        password: newEmployee.password,
        phone: newEmployee.phone.trim() || "-",
        role,
        shift: newEmployee.shift || "Matutino",
        status: "active",
        permissions: defaultPermissions(role),
      },
    ])
    setShowInvite(false)
    setNewEmployee({ name: "", username: "", password: "", phone: "", role: "", shift: "" })
  }

  const openEdit = (e: Employee) => {
    setEditingEmployee(e)
    setEditForm({
      name: e.name,
      username: e.username,
      password: e.password,
      phone: e.phone,
      role: e.role,
      shift: e.shift,
      status: e.status,
    })
  }

  const saveEdit = () => {
    if (!editingEmployee) return
    const id = editingEmployee.id
    const role = editForm.role || editingEmployee.role
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              name: editForm.name.trim() || e.name,
              username: editForm.username.trim() || e.username,
              password: editForm.password || e.password,
              phone: editForm.phone.trim() || e.phone,
              role,
              shift: editForm.shift || e.shift,
              status: editForm.status || e.status,
              permissions:
                role !== e.role ? defaultPermissions(role) : e.permissions,
            }
          : e
      )
    )
    setEditingEmployee(null)
  }

  const getRoleBadge = (role: string) => {
    if (role === "admin") {
      return (
        <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
          Administrador
        </Badge>
      )
    }
    return <Badge variant="secondary">Cajero</Badge>
  }

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return (
        <Badge variant="outline" className="border-primary text-primary">
          Activo
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Inactivo
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Equipo</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Usuarios y contraseñas para ingresar al sistema
          </p>
        </div>
        <Dialog open={showInvite} onOpenChange={setShowInvite}>
          <DialogTrigger asChild>
            <Button className="h-11 gap-2 sm:h-12 sm:px-6">
              <UserPlus className="h-4 w-4" />
              <span>Nuevo colaborador</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Asignar acceso al sistema</DialogTitle>
              <DialogDescription>
                Define el usuario y la contraseña con los que podrá iniciar sesión.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre completo</label>
                <Input
                  value={newEmployee.name}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, name: e.target.value })
                  }
                  className="h-12"
                  placeholder="Nombre del colaborador"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Usuario</label>
                <Input
                  value={newEmployee.username}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, username: e.target.value })
                  }
                  className="h-12"
                  autoComplete="username"
                  placeholder="ej. maria.caja"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contraseña</label>
                <Input
                  type="password"
                  value={newEmployee.password}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, password: e.target.value })
                  }
                  className="h-12"
                  autoComplete="new-password"
                  placeholder="Contraseña de acceso"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono</label>
                <Input
                  value={newEmployee.phone}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, phone: e.target.value })
                  }
                  className="h-12"
                  placeholder="555-1234"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rol</label>
                  <Select
                    value={newEmployee.role || undefined}
                    onValueChange={(value) =>
                      setNewEmployee({ ...newEmployee, role: value })
                    }
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="cajero">Cajero</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Turno</label>
                  <Select
                    value={newEmployee.shift || undefined}
                    onValueChange={(value) =>
                      setNewEmployee({ ...newEmployee, shift: value })
                    }
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Matutino">Matutino</SelectItem>
                      <SelectItem value="Vespertino">Vespertino</SelectItem>
                      <SelectItem value="Nocturno">Nocturno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="mt-2 h-12 w-full gap-2" onClick={handleInvite}>
                <KeyRound className="h-4 w-4" />
                Crear acceso
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12">
              <Users className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground sm:text-sm">Equipo activo</p>
              <p className="text-lg font-bold sm:text-2xl">{activeEmployees.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12">
              <UserCog className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground sm:text-sm">Administradores</p>
              <p className="text-lg font-bold sm:text-2xl">{adminCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 shadow-sm lg:col-span-1">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary sm:h-12 sm:w-12">
              <Users className="h-5 w-5 text-secondary-foreground sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground sm:text-sm">Cajeros</p>
              <p className="text-lg font-bold sm:text-2xl">{cashierCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {employees.map((employee) => (
          <Card key={employee.id} className="relative shadow-sm">
            <CardContent className="p-6">
              <div className="absolute right-2 top-2 flex gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Editar"
                  onClick={() => openEdit(employee)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  aria-label="Eliminar"
                  onClick={() => setDeletingEmployee(employee)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-start justify-between pr-16">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="text-sm font-semibold">
                      {employee.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{employee.name}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {getRoleBadge(employee.role)}
                      {getStatusBadge(employee.status)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <User className="h-4 w-4 shrink-0" />
                  <span className="font-mono text-foreground">{employee.username}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <KeyRound className="h-4 w-4 shrink-0" />
                  <span className="font-mono text-foreground">
                    {showPwFor === employee.id ? employee.password : "••••••••"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label={showPwFor === employee.id ? "Ocultar contraseña" : "Mostrar contraseña"}
                    onClick={() =>
                      setShowPwFor((cur) => (cur === employee.id ? null : employee.id))
                    }
                  >
                    {showPwFor === employee.id ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{employee.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>Turno {employee.shift}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card
          className="flex cursor-pointer items-center justify-center border-dashed shadow-sm transition-colors hover:bg-muted/50"
          onClick={() => setShowInvite(true)}
        >
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">Agregar colaborador</p>
            <p className="text-sm text-muted-foreground">Asignar usuario y contraseña</p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={editingEmployee !== null} onOpenChange={(open) => !open && setEditingEmployee(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar colaborador</DialogTitle>
            <DialogDescription>Actualiza datos y credenciales de acceso.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Usuario</label>
              <Input
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                className="h-12 font-mono"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contraseña</label>
              <Input
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                className="h-12"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Teléfono</label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="h-12"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Rol</label>
                <Select
                  value={editForm.role}
                  onValueChange={(v) =>
                    setEditForm({ ...editForm, role: v as "admin" | "cajero" })
                  }
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="cajero">Cajero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <Select
                  value={editForm.status}
                  onValueChange={(v) =>
                    setEditForm({ ...editForm, status: v as "active" | "inactive" })
                  }
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Turno</label>
              <Select
                value={editForm.shift}
                onValueChange={(v) => setEditForm({ ...editForm, shift: v })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Matutino">Matutino</SelectItem>
                  <SelectItem value="Vespertino">Vespertino</SelectItem>
                  <SelectItem value="Nocturno">Nocturno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="h-12 w-full" onClick={saveEdit}>
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingEmployee !== null} onOpenChange={(open) => !open && setDeletingEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar colaborador?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el acceso de {deletingEmployee?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingEmployee) {
                  const id = deletingEmployee.id
                  setEmployees((prev) => prev.filter((e) => e.id !== id))
                }
                setDeletingEmployee(null)
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
