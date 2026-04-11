"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useGetListEmployees } from "@/hooks/use-get-list-employees";
import { useGetListRoles } from "@/hooks/use-get-list-roles";
import { useGetListAllPermissions } from "@/hooks/use-get-list-all-permissions";
import { deleteRole, type RoleDto } from "@/lib/services/roles.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pencil, Shield, Trash2, UserCog, Users } from "lucide-react";
import {
  isAdminRoleLabel,
  type EmployeeWithPermissions,
} from "@/lib/mock-data";
import { deleteEmployee } from "@/lib/services/employees.service";
import { NuevoColaboradorDialog } from "@/components/sections/equipo/nuevo-colaborador-dialog";
import { EditarColaboradorDialog } from "@/components/sections/equipo/editar-colaborador-dialog";
import { RolPermisosDialog } from "@/components/sections/equipo/rol-permisos-dialog";
import { EquipoEmployeeGrid } from "@/components/sections/equipo/employee-grid";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function Equipo() {
  const queryClient = useQueryClient();
  const [showRolesAdmin, setShowRolesAdmin] = useState(false);
  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [roleFormEditingId, setRoleFormEditingId] = useState<number | null>(
    null,
  );
  const [roleFormInitialName, setRoleFormInitialName] = useState("");
  const { data: allPermissions = [], isLoading: permissionsLoading } =
    useGetListAllPermissions(roleFormOpen);

  const openRoleFormCreate = useCallback(() => {
    setRoleFormEditingId(null);
    setRoleFormInitialName("");
    setRoleFormOpen(true);
  }, []);

  const openRoleFormEdit = useCallback((r: RoleDto) => {
    setShowRolesAdmin(false);
    setRoleFormEditingId(r.id);
    setRoleFormInitialName(r.name);
    setRoleFormOpen(true);
  }, []);

  const onRoleFormOpenChange = useCallback((open: boolean) => {
    setRoleFormOpen(open);
    if (!open) {
      setRoleFormEditingId(null);
      setRoleFormInitialName("");
    }
  }, []);

  const roleFormEditingIdRef = useRef<number | null>(null);
  roleFormEditingIdRef.current = roleFormEditingId;

  const {
    data: employees = [],
    isPending: employeesLoading,
    isError: employeesError,
    error: employeesErrorObj,
  } = useGetListEmployees();
  const [showInvite, setShowInvite] = useState(false);
  const [editingEmployee, setEditingEmployee] =
    useState<EmployeeWithPermissions | null>(null);
  const [deletingEmployee, setDeletingEmployee] =
    useState<EmployeeWithPermissions | null>(null);
  const [deleteInFlight, setDeleteInFlight] = useState(false);
  const [rolePendingDelete, setRolePendingDelete] = useState<RoleDto | null>(
    null,
  );
  const [roleDeleteInFlight, setRoleDeleteInFlight] = useState(false);
  const [roleJustCreatedId, setRoleJustCreatedId] = useState<string | null>(
    null,
  );

  const clearRolePick = useCallback(() => setRoleJustCreatedId(null), []);

  const onRolCreadoOActualizado = useCallback(
    (payload: { creadoRoleId?: number }) => {
      if (payload.creadoRoleId != null) {
        setRoleJustCreatedId(String(payload.creadoRoleId));
      }
    },
    [],
  );

  const shouldFetchRoles =
    showInvite ||
    editingEmployee !== null ||
    showRolesAdmin ||
    roleFormOpen ||
    rolePendingDelete !== null;

  const { data: rolesList = [], isLoading: rolesLoading } =
    useGetListRoles(shouldFetchRoles);

  const activeEmployees = useMemo(
    () => employees.filter((e) => e.status === 1),
    [employees],
  );
  const adminCount = useMemo(
    () => activeEmployees.filter((e) => isAdminRoleLabel(e.roleLabel)).length,
    [activeEmployees],
  );
  const cashierCount = useMemo(
    () => activeEmployees.filter((e) => !isAdminRoleLabel(e.roleLabel)).length,
    [activeEmployees],
  );

  const openEdit = useCallback((e: EmployeeWithPermissions) => {
    setEditingEmployee(e);
  }, []);

  const openInvite = useCallback(() => setShowInvite(true), []);

  const requestDelete = useCallback((e: EmployeeWithPermissions) => {
    setDeletingEmployee(e);
  }, []);

  const closeEditEmployee = useCallback(() => setEditingEmployee(null), []);

  const employeesErrorMessage = useMemo(
    () =>
      employeesErrorObj instanceof Error
        ? employeesErrorObj.message
        : "No se pudo cargar el equipo.",
    [employeesErrorObj],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            Equipo
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Administración de usuarios y roles del sistema
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
                          <div className="flex shrink-0 items-center gap-0.5">
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
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              title={`Eliminar rol: ${r.name}`}
                              aria-label={`Eliminar rol ${r.name}`}
                              onClick={() => setRolePendingDelete(r)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>

            <NuevoColaboradorDialog
              open={showInvite}
              onOpenChange={setShowInvite}
              rolesList={rolesList}
              rolesLoading={rolesLoading}
              onNuevoRol={openRoleFormCreate}
              roleJustCreatedId={roleJustCreatedId}
              onAppliedRolePick={clearRolePick}
            />
          </div>

          <RolPermisosDialog
            open={roleFormOpen}
            onOpenChange={onRoleFormOpenChange}
            editingRoleId={roleFormEditingId}
            initialEditName={roleFormInitialName}
            allPermissions={allPermissions}
            permissionsLoading={permissionsLoading}
            onRolCreadoOActualizado={onRolCreadoOActualizado}
          />
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

      <EquipoEmployeeGrid
        employees={activeEmployees}
        employeesLoading={employeesLoading}
        employeesError={employeesError}
        employeesErrorMessage={employeesErrorMessage}
        onOpenInvite={openInvite}
        onEdit={openEdit}
        onDelete={requestDelete}
      />

      <EditarColaboradorDialog
        employee={editingEmployee}
        onClose={closeEditEmployee}
        rolesList={rolesList}
        rolesLoading={rolesLoading}
        onNuevoRol={openRoleFormCreate}
        roleJustCreatedId={roleJustCreatedId}
        onAppliedRolePick={clearRolePick}
      />

      <AlertDialog
        open={deletingEmployee !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingEmployee(null);
            setDeleteInFlight(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Dar de baja a este colaborador?</AlertDialogTitle>
            <AlertDialogDescription>
              Si tiene ventas registradas, quedará inactivo y se conservará el
              historial (el usuario de acceso se libera para uno nuevo). Si no
              tiene ventas, se eliminará por completo del sistema.
              {deletingEmployee?.fullName != null && (
                <> Colaborador: {deletingEmployee.fullName}.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteInFlight}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteInFlight}
              onClick={(e) => {
                e.preventDefault();
                const target = deletingEmployee;
                if (!target || deleteInFlight) return;
                void (async () => {
                  setDeleteInFlight(true);
                  try {
                    const { outcome } = await deleteEmployee(target.id);
                    await queryClient.invalidateQueries({
                      queryKey: ["employees", "list"],
                    });
                    toast.success(
                      outcome === "deleted"
                        ? "Colaborador eliminado del sistema."
                        : "Colaborador desactivado. Historial de ventas conservado.",
                    );
                    setDeletingEmployee(null);
                  } catch (err) {
                    toast.error(
                      err instanceof Error
                        ? err.message
                        : "No se pudo dar de baja al colaborador.",
                    );
                  } finally {
                    setDeleteInFlight(false);
                  }
                })();
              }}
            >
              {deleteInFlight ? "Procesando…" : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={rolePendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRolePendingDelete(null);
            setRoleDeleteInFlight(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar rol?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán las asignaciones de permisos de este rol. No podrás
              recuperarlo.
              {rolePendingDelete?.name != null && (
                <> Rol: {rolePendingDelete.name}.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={roleDeleteInFlight}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={roleDeleteInFlight}
              onClick={(e) => {
                e.preventDefault();
                const target = rolePendingDelete;
                if (!target || roleDeleteInFlight) return;
                void (async () => {
                  setRoleDeleteInFlight(true);
                  try {
                    await deleteRole(target.id);
                    if (roleFormEditingIdRef.current === target.id) {
                      onRoleFormOpenChange(false);
                    }
                    await queryClient.invalidateQueries({
                      queryKey: ["roles", "list"],
                    });
                    await queryClient.invalidateQueries({
                      queryKey: ["permissions", "byRole", target.id],
                    });
                    toast.success("Rol eliminado.");
                    setRolePendingDelete(null);
                  } catch (err) {
                    toast.error(
                      err instanceof Error
                        ? err.message
                        : "No se pudo eliminar el rol.",
                    );
                  } finally {
                    setRoleDeleteInFlight(false);
                  }
                })();
              }}
            >
              {roleDeleteInFlight ? "Eliminando…" : "Eliminar rol"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
