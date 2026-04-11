"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateEmployee } from "@/lib/services/employees.service";
import type { RoleDto } from "@/lib/services/roles.service";
import type { EmployeeWithPermissions } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

type FormState = {
  fullName: string;
  username: string;
  password: string;
  phone: string;
  role: string;
  status: "" | "0" | "1";
};

type Props = {
  employee: EmployeeWithPermissions | null;
  onClose: () => void;
  rolesList: RoleDto[];
  rolesLoading: boolean;
  onNuevoRol: () => void;
  roleJustCreatedId: string | null;
  onAppliedRolePick: () => void;
};

function formFromEmployee(e: EmployeeWithPermissions): FormState {
  return {
    fullName: e.fullName,
    username: e.username,
    password: "",
    phone: e.phone ?? "",
    role: String(e.roleId),
    status: e.status === 1 ? "1" : "0",
  };
}

export function EditarColaboradorDialog({
  employee,
  onClose,
  rolesList,
  rolesLoading,
  onNuevoRol,
  roleJustCreatedId,
  onAppliedRolePick,
}: Props) {
  const queryClient = useQueryClient();
  const [fields, setFields] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (employee) {
      setFields(formFromEmployee(employee));
    } else {
      setFields(null);
    }
  }, [employee]);

  useEffect(() => {
    if (!roleJustCreatedId) return;
    setFields((f) => (f ? { ...f, role: roleJustCreatedId } : f));
    onAppliedRolePick();
  }, [roleJustCreatedId, onAppliedRolePick]);

  const patch = useCallback((partial: Partial<FormState>) => {
    setFields((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  const submit = useCallback(async () => {
    if (!employee || !fields) return;
    const selectedRole = rolesList.find((r) => String(r.id) === fields.role);
    const roleId = selectedRole ? selectedRole.id : employee.roleId;
    const nextStatus: 0 | 1 = fields.status === "1" ? 1 : 0;
    const fullName = fields.fullName.trim() || employee.fullName;
    const username = fields.username.trim() || employee.username;
    if (!fields.role) {
      toast.error("Selecciona un rol.");
      return;
    }
    setSaving(true);
    try {
      await updateEmployee(employee.id, {
        fullName,
        username,
        phone: fields.phone.trim() ? fields.phone.trim() : null,
        roleId,
        status: nextStatus,
        ...(fields.password.trim()
          ? { password: fields.password.trim() }
          : {}),
      });
      await queryClient.invalidateQueries({ queryKey: ["employees", "list"] });
      toast.success("Colaborador actualizado.");
      onClose();
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "No se pudieron guardar los cambios.",
      );
    } finally {
      setSaving(false);
    }
  }, [employee, fields, onClose, queryClient, rolesList]);

  const open = employee !== null && fields !== null;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar colaborador</DialogTitle>
          <DialogDescription>
            Actualiza datos y credenciales de acceso.
          </DialogDescription>
        </DialogHeader>
        {fields ? (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={fields.fullName}
                onChange={(e) => patch({ fullName: e.target.value })}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Usuario</label>
              <Input
                value={fields.username}
                onChange={(e) => patch({ username: e.target.value })}
                className="h-12 font-mono"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contraseña</label>
              <Input
                type="password"
                value={fields.password}
                onChange={(e) => patch({ password: e.target.value })}
                className="h-12"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Teléfono</label>
              <Input
                value={fields.phone}
                onChange={(e) => patch({ phone: e.target.value })}
                className="h-12"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Rol</label>
                <div className="flex gap-2">
                  <Select
                    value={fields.role || undefined}
                    onValueChange={(v) => patch({ role: v })}
                    disabled={rolesLoading}
                  >
                    <SelectTrigger className="h-12 min-w-0 flex-1">
                      <SelectValue
                        placeholder={
                          rolesLoading ? "Cargando…" : "Seleccionar"
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
                    onClick={onNuevoRol}
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
                  value={fields.status || undefined}
                  onValueChange={(v) =>
                    patch({ status: v as "0" | "1" })
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
            <Button
              type="button"
              className="h-12 w-full"
              disabled={saving || rolesLoading}
              onClick={() => void submit()}
            >
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
