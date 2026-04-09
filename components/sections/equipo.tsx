"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useGetListRoles } from "@/hooks/use-get-list-roles";
import { useGetListAllPermissions } from "@/hooks/use-get-list-all-permissions";
import {
  createRoleWithPermissions,
  fetchRolePermissions,
  updateRoleWithPermissions,
  type RoleDto,
} from "@/lib/services/roles.service";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Shield,
  UserCog,
  Users,
  User,
  Phone,
  UserPlus,
  KeyRound,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  mockEmployees,
  allModules,
  MOCK_PASSWORD_HASH_PLACEHOLDER,
  isAdminRoleLabel,
  type EmployeeWithPermissions,
  type ModulePermission,
} from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function defaultPermissions(roleLabel: string | undefined): ModulePermission[] {
  if (isAdminRoleLabel(roleLabel)) return allModules.map((m) => m.id);
  return ["dashboard", "ventas", "clientes"];
}

export function Equipo() {
  const queryClient = useQueryClient();
  const { data: rolesList = [], isLoading: rolesLoading } = useGetListRoles();
  const [showRolesAdmin, setShowRolesAdmin] = useState(false);
  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [roleFormEditingId, setRoleFormEditingId] = useState<number | null>(
    null,
  );
  const [loadingEditRolePerms, setLoadingEditRolePerms] = useState(false);
  const { data: allPermissions = [], isLoading: permissionsLoading } =
    useGetListAllPermissions(roleFormOpen);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRolePermissionIds, setNewRolePermissionIds] = useState<number[]>(
    [],
  );
  const [creatingRole, setCreatingRole] = useState(false);

  const openRoleFormCreate = () => {
    setRoleFormEditingId(null);
    setNewRoleName("");
    setNewRolePermissionIds([]);
    setLoadingEditRolePerms(false);
    setRoleFormOpen(true);
  };

  const openRoleFormEdit = async (r: RoleDto) => {
    setShowRolesAdmin(false);
    setRoleFormEditingId(r.id);
    setNewRoleName(r.name);
    setNewRolePermissionIds([]);
    setRoleFormOpen(true);
    setLoadingEditRolePerms(true);
    try {
      const perms = await queryClient.fetchQuery({
        queryKey: ["permissions", "byRole", r.id],
        queryFn: () => fetchRolePermissions(r.id),
      });
      setNewRolePermissionIds(perms.map((p) => p.id));
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "No se pudieron cargar los permisos del rol.",
      );
      setRoleFormOpen(false);
      setRoleFormEditingId(null);
    } finally {
      setLoadingEditRolePerms(false);
    }
  };

  const [employees, setEmployees] = useState<EmployeeWithPermissions[]>(() =>
    mockEmployees.map((e) => ({ ...e, permissions: [...e.permissions] })),
  );
  const [showInvite, setShowInvite] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    fullName: "",
    username: "",
    password: "",
    phone: "",
    role: "",
  });
  const [editingEmployee, setEditingEmployee] =
    useState<EmployeeWithPermissions | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    username: "",
    password: "",
    phone: "",
    role: "",
    status: "" as "" | "0" | "1",
  });
  const [deletingEmployee, setDeletingEmployee] =
    useState<EmployeeWithPermissions | null>(null);

  const activeEmployees = employees.filter((e) => e.status === 1);
  const adminCount = employees.filter((e) =>
    isAdminRoleLabel(e.roleLabel),
  ).length;
  const cashierCount = employees.filter(
    (e) => !isAdminRoleLabel(e.roleLabel),
  ).length;

  const handleInvite = () => {
    if (
      !newEmployee.fullName.trim() ||
      !newEmployee.username.trim() ||
      !newEmployee.password
    )
      return;
    const selectedRole = rolesList.find(
      (r) => String(r.id) === newEmployee.role,
    );
    const roleLabel = selectedRole?.name;
    const roleId = selectedRole ? selectedRole.id : 1;
    const nextId = employees.length
      ? Math.max(...employees.map((e) => e.id)) + 1
      : 1;
    const now = new Date().toISOString();
    setEmployees((prev) => [
      ...prev,
      {
        id: nextId,
        roleId,
        fullName: newEmployee.fullName.trim(),
        username: newEmployee.username.trim(),
        passwordHash: MOCK_PASSWORD_HASH_PLACEHOLDER,
        phone: newEmployee.phone.trim() || null,
        status: 1,
        createdAt: now,
        updatedAt: now,
        roleLabel,
        permissions: defaultPermissions(roleLabel),
      },
    ]);
    setShowInvite(false);
    setNewEmployee({
      fullName: "",
      username: "",
      password: "",
      phone: "",
      role: "",
    });
  };

  const handleRoleFormSubmit = async () => {
    const name = newRoleName.trim();
    if (!name) {
      toast.error("Indica el nombre del rol.");
      return;
    }
    setCreatingRole(true);
    try {
      if (roleFormEditingId == null) {
        const created = await createRoleWithPermissions(
          name,
          newRolePermissionIds,
        );
        const roleIdStr = String(created.id);
        setNewEmployee((prev) => ({ ...prev, role: roleIdStr }));
        setEditForm((prev) => ({ ...prev, role: roleIdStr }));
        toast.success("Rol creado y permisos asignados.");
      } else {
        await updateRoleWithPermissions(
          roleFormEditingId,
          name,
          newRolePermissionIds,
        );
        await queryClient.invalidateQueries({
          queryKey: ["permissions", "byRole", roleFormEditingId],
        });
        toast.success("Rol y permisos actualizados.");
      }
      await queryClient.invalidateQueries({ queryKey: ["roles", "list"] });
      setRoleFormOpen(false);
      setNewRoleName("");
      setNewRolePermissionIds([]);
      setRoleFormEditingId(null);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudo guardar el rol.",
      );
    } finally {
      setCreatingRole(false);
    }
  };

  const openEdit = (e: EmployeeWithPermissions) => {
    setEditingEmployee(e);
    setEditForm({
      fullName: e.fullName,
      username: e.username,
      password: "",
      phone: e.phone ?? "",
      role: String(e.roleId),
      status: e.status === 1 ? "1" : "0",
    });
  };

  const saveEdit = () => {
    if (!editingEmployee) return;
    const id = editingEmployee.id;
    const selectedRole = rolesList.find((r) => String(r.id) === editForm.role);
    const roleLabel = selectedRole?.name ?? editingEmployee.roleLabel;
    const roleId = selectedRole ? selectedRole.id : editingEmployee.roleId;
    const nextStatus: 0 | 1 = editForm.status === "1" ? 1 : 0;
    const now = new Date().toISOString();
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              fullName: editForm.fullName.trim() || e.fullName,
              username: editForm.username.trim() || e.username,
              passwordHash: editForm.password.trim()
                ? `$mock$updated:${editForm.password.trim()}`
                : e.passwordHash,
              phone: editForm.phone.trim() ? editForm.phone.trim() : null,
              roleId,
              roleLabel,
              status: nextStatus,
              updatedAt: now,
              permissions:
                roleId !== e.roleId
                  ? defaultPermissions(roleLabel)
                  : e.permissions,
            }
          : e,
      ),
    );
    setEditingEmployee(null);
  };

  const getRoleBadge = (roleLabel?: string) => {
    if (roleLabel) {
      return (
        <Badge
          variant="secondary"
          className="max-w-[200px] truncate"
          title={roleLabel}
        >
          {roleLabel}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Sin rol
      </Badge>
    );
  };

  const getStatusBadge = (status: 0 | 1) => {
    if (status === 1) {
      return (
        <Badge variant="outline" className="border-primary text-primary">
          Activo
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Inactivo
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            Equipo
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Usuarios y contraseñas para ingresar al sistema
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Dialog open={showRolesAdmin} onOpenChange={setShowRolesAdmin}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 shrink-0 sm:h-12 sm:w-12"
                      aria-label="Administrar roles y permisos"
                    >
                      <Shield className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>
                  Administrar roles y permisos
                </TooltipContent>
              </Tooltip>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Administrar roles y permisos</DialogTitle>
                  <DialogDescription>
                    Lista de roles del sistema. Edita el nombre y los permisos
                    asociados a cada uno.
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[min(60vh,360px)] pr-3">
                  {rolesLoading ? (
                    <p className="py-4 text-sm text-muted-foreground">
                      Cargando roles…
                    </p>
                  ) : rolesList.length === 0 ? (
                    <p className="py-4 text-sm text-muted-foreground">
                      No hay roles. Crea uno con + junto al selector de rol.
                    </p>
                  ) : (
                    <ul className="divide-y py-1">
                      {rolesList.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center justify-between gap-2 py-3"
                        >
                          <span className="min-w-0 truncate font-medium">
                            {r.name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            title={`Editar rol: ${r.name}`}
                            aria-label={`Editar permisos de ${r.name}`}
                            onClick={() => void openRoleFormEdit(r)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>

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
                Define el usuario y la contraseña con los que podrá iniciar
                sesión.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre completo</label>
                <Input
                  value={newEmployee.fullName}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, fullName: e.target.value })
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Rol</label>
                <div className="flex gap-2">
                  <Select
                    value={newEmployee.role || undefined}
                    onValueChange={(value) =>
                      setNewEmployee({ ...newEmployee, role: value })
                    }
                    disabled={rolesLoading}
                  >
                    <SelectTrigger className="h-12 min-w-0 flex-1">
                      <SelectValue
                        placeholder={
                          rolesLoading ? "Cargando roles…" : "Seleccionar"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {rolesList.map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    title="Nuevo rol"
                    aria-label="Crear nuevo rol"
                    onClick={openRoleFormCreate}
                  >
                    <Plus
                      className="h-4 w-4"
                    />
                  </Button>
                </div>
                {rolesList.length === 0 && !rolesLoading ? (
                  <p className="text-xs text-muted-foreground">
                    No hay roles en el servidor. Usa + para crear uno.
                  </p>
                ) : null}
              </div>
              <Button className="mt-2 h-12 w-full gap-2" onClick={handleInvite}>
                <KeyRound className="h-4 w-4" />
                Crear acceso
              </Button>
            </div>
          </DialogContent>
            </Dialog>
          </div>

        <Dialog
          open={roleFormOpen}
          onOpenChange={(open) => {
            setRoleFormOpen(open);
            if (!open) {
              setNewRoleName("");
              setNewRolePermissionIds([]);
              setRoleFormEditingId(null);
              setLoadingEditRolePerms(false);
            }
          }}
        >
          <DialogContent className="flex max-h-[min(90vh,560px)] flex-col gap-0 overflow-hidden sm:max-w-lg">
            <DialogHeader className="shrink-0">
              <DialogTitle>
                {roleFormEditingId == null ? "Nuevo rol" : "Editar rol"}
              </DialogTitle>
              <DialogDescription>
                {roleFormEditingId == null
                  ? "Define el nombre y los permisos del nuevo rol."
                  : "Modifica el nombre y los permisos de este rol."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden py-4">
              <div className="shrink-0 space-y-2">
                <Label htmlFor="new-role-name">Nombre del rol</Label>
                <Input
                  id="new-role-name"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="h-12"
                  placeholder="Ej. Vendedor"
                  autoComplete="off"
                />
              </div>
              <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden">
                <Label className="shrink-0">Permisos</Label>
                <ScrollArea className="min-h-0 rounded-md border p-3 pr-4">
                  {permissionsLoading || loadingEditRolePerms ? (
                    <p className="text-sm text-muted-foreground">
                      {loadingEditRolePerms
                        ? "Cargando permisos del rol…"
                        : "Cargando permisos…"}
                    </p>
                  ) : allPermissions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay permisos registrados en el sistema.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {allPermissions.map((p) => (
                        <label
                          key={p.id}
                          className="flex cursor-pointer items-start gap-3 pl-2 text-sm leading-tight"
                        >
                          <Checkbox
                            className="mt-0.5"
                            checked={newRolePermissionIds.includes(p.id)}
                            disabled={loadingEditRolePerms}
                            onCheckedChange={(checked) => {
                              if (checked === true) {
                                setNewRolePermissionIds((prev) =>
                                  prev.includes(p.id) ? prev : [...prev, p.id],
                                );
                              } else {
                                setNewRolePermissionIds((prev) =>
                                  prev.filter((id) => id !== p.id),
                                );
                              }
                            }}
                          />
                          <span>
                            <span className="font-mono text-xs text-foreground">
                              {p.code}
                            </span>
                            {p.description ? (
                              <span className="mt-0.5 block text-muted-foreground">
                                {p.description}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-11 sm:h-10"
                onClick={() => setRoleFormOpen(false)}
                disabled={creatingRole}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="h-11 gap-2 sm:h-10"
                onClick={() => void handleRoleFormSubmit()}
                disabled={
                  creatingRole ||
                  permissionsLoading ||
                  loadingEditRolePerms
                }
              >
                {creatingRole
                  ? "Guardando…"
                  : roleFormEditingId == null
                    ? "Crear rol"
                    : "Guardar cambios"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12">
              <Users className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground sm:text-sm">
                Equipo activo
              </p>
              <p className="text-lg font-bold sm:text-2xl">
                {activeEmployees.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12">
              <UserCog className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground sm:text-sm">
                Administradores
              </p>
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
              <p className="truncate text-xs text-muted-foreground sm:text-sm">
                Cajeros
              </p>
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
                      {employee.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{employee.fullName}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {getRoleBadge(employee.roleLabel)}
                      {getStatusBadge(employee.status)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <User className="h-4 w-4 shrink-0" />
                  <span className="font-mono text-foreground">
                    {employee.username}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <KeyRound className="h-4 w-4 shrink-0" />
                  <span className="font-mono text-foreground">••••••••</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{employee.phone ?? "—"}</span>
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
            <p className="text-sm text-muted-foreground">
              Asignar usuario y contraseña
            </p>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={editingEmployee !== null}
        onOpenChange={(open) => !open && setEditingEmployee(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar colaborador</DialogTitle>
            <DialogDescription>
              Actualiza datos y credenciales de acceso.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={editForm.fullName}
                onChange={(e) =>
                  setEditForm({ ...editForm, fullName: e.target.value })
                }
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Usuario</label>
              <Input
                value={editForm.username}
                onChange={(e) =>
                  setEditForm({ ...editForm, username: e.target.value })
                }
                className="h-12 font-mono"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contraseña</label>
              <Input
                type="password"
                value={editForm.password}
                onChange={(e) =>
                  setEditForm({ ...editForm, password: e.target.value })
                }
                className="h-12"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Teléfono</label>
              <Input
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
                className="h-12"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Rol</label>
                <div className="flex gap-2">
                  <Select
                    value={editForm.role || undefined}
                    onValueChange={(v) => setEditForm({ ...editForm, role: v })}
                    disabled={rolesLoading}
                  >
                    <SelectTrigger className="h-12 min-w-0 flex-1">
                      <SelectValue
                        placeholder={rolesLoading ? "Cargando…" : "Seleccionar"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {rolesList.map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    title="Nuevo rol"
                    aria-label="Crear nuevo rol"
                    onClick={openRoleFormCreate}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {rolesList.length === 0 && !rolesLoading ? (
                  <p className="text-xs text-muted-foreground">
                    No hay roles en el servidor. Usa + para crear uno.
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <Select
                  value={editForm.status || undefined}
                  onValueChange={(v) =>
                    setEditForm({ ...editForm, status: v as "0" | "1" })
                  }
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Activo</SelectItem>
                    <SelectItem value="0">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="h-12 w-full" onClick={saveEdit}>
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deletingEmployee !== null}
        onOpenChange={(open) => !open && setDeletingEmployee(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar colaborador?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el acceso de {deletingEmployee?.fullName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingEmployee) {
                  const id = deletingEmployee.id;
                  setEmployees((prev) => prev.filter((e) => e.id !== id));
                }
                setDeletingEmployee(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
