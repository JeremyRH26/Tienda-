"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plus,
  UserCog,
  Users,
  Mail,
  Phone,
  Clock,
  UserPlus,
} from "lucide-react"
import { mockEmployees } from "@/lib/mock-data"
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

export function Equipo() {
  const [showInvite, setShowInvite] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    shift: "",
  })

  const activeEmployees = mockEmployees.filter((e) => e.status === "active")
  const adminCount = mockEmployees.filter((e) => e.role === "admin").length
  const cashierCount = mockEmployees.filter((e) => e.role === "cajero").length

  const handleInvite = () => {
    // In a real app, this would send an invitation
    setShowInvite(false)
    setNewEmployee({ name: "", email: "", phone: "", role: "", shift: "" })
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
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Equipo</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Gestiona los roles y turnos de tu equipo
          </p>
        </div>
        <Dialog open={showInvite} onOpenChange={setShowInvite}>
          <DialogTrigger asChild>
            <Button className="h-11 gap-2 sm:h-12 sm:px-6">
              <UserPlus className="h-4 w-4" />
              <span>Invitar Colaborador</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Invitar Nuevo Colaborador</DialogTitle>
              <DialogDescription>Completa la información para enviar una invitación al nuevo miembro del equipo.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre Completo</label>
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
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, email: e.target.value })
                  }
                  className="h-12"
                  placeholder="colaborador@tienda.com"
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
                    value={newEmployee.role}
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
                    value={newEmployee.shift}
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
                <Mail className="h-4 w-4" />
                Enviar Invitación
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
              <p className="truncate text-xs text-muted-foreground sm:text-sm">Equipo Activo</p>
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

      {/* Team Members */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {mockEmployees.map((employee) => (
          <Card key={employee.id} className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
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
                    <div className="mt-1 flex items-center gap-2">
                      {getRoleBadge(employee.role)}
                      {getStatusBadge(employee.status)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{employee.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{employee.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Turno {employee.shift}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Card */}
        <Card
          className="flex cursor-pointer items-center justify-center border-dashed shadow-sm transition-colors hover:bg-muted/50"
          onClick={() => setShowInvite(true)}
        >
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">Agregar Colaborador</p>
            <p className="text-sm text-muted-foreground">
              Invita a un nuevo miembro al equipo
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
