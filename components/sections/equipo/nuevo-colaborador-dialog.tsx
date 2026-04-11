"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createEmployee } from "@/lib/services/employees.service";
import type { RoleDto } from "@/lib/services/roles.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KeyRound, Plus, UserPlus } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rolesList: RoleDto[];
  rolesLoading: boolean;
  onNuevoRol: () => void;
  /** Tras crear un rol desde el formulario de permisos, el id para preseleccionar. */
  roleJustCreatedId: string | null;
  onAppliedRolePick: () => void;
};

const emptyFields = {
  fullName: "",
  username: "",
  password: "",
  phone: "",
  role: "",
};

export function NuevoColaboradorDialog({
  open,
  onOpenChange,
  rolesList,
  rolesLoading,
  onNuevoRol,
  roleJustCreatedId,
  onAppliedRolePick,
}: Props) {
  const queryClient = useQueryClient();
  const [fields, setFields] = useState(emptyFields);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setFields(emptyFields);
    }
  }, [open]);

  useEffect(() => {
    if (!roleJustCreatedId) return;
    setFields((f) => ({ ...f, role: roleJustCreatedId }));
    onAppliedRolePick();
  }, [roleJustCreatedId, onAppliedRolePick]);

  const patch = useCallback((partial: Partial<typeof emptyFields>) => {
    setFields((prev) => ({ ...prev, ...partial }));
  }, []);

  const submit = useCallback(async () => {
    if (
      !fields.fullName.trim() ||
      !fields.username.trim() ||
      !fields.password
    ) {
      toast.error("Completa nombre, usuario y contraseña.");
      return;
    }
    if (!fields.role) {
      toast.error("Selecciona un rol.");
      return;
    }
    const roleId = Number(fields.role);
    if (!Number.isInteger(roleId) || roleId < 1) {
      toast.error("Rol no válido.");
      return;
    }
    setSaving(true);
    try {
      await createEmployee({
        fullName: fields.fullName.trim(),
        username: fields.username.trim(),
        password: fields.password,
        phone: fields.phone.trim() || null,
        roleId,
      });
      await queryClient.invalidateQueries({ queryKey: ["employees", "list"] });
      toast.success("Empleado creado correctamente.");
      onOpenChange(false);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudo crear el empleado.",
      );
    } finally {
      setSaving(false);
    }
  }, [fields, onOpenChange, queryClient]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              value={fields.fullName}
              onChange={(e) => patch({ fullName: e.target.value })}
              className="h-12"
              placeholder="Nombre del colaborador"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Usuario</label>
            <Input
              value={fields.username}
              onChange={(e) => patch({ username: e.target.value })}
              className="h-12"
              autoComplete="username"
              placeholder="ej. maria.caja"
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
              placeholder="Contraseña de acceso"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Teléfono</label>
            <Input
              value={fields.phone}
              onChange={(e) => patch({ phone: e.target.value })}
              className="h-12"
              placeholder="555-1234"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Rol</label>
            <div className="flex gap-2">
              <Select
                value={fields.role || undefined}
                onValueChange={(value) => patch({ role: value })}
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
          <Button
            type="button"
            className="mt-2 h-12 w-full gap-2"
            disabled={saving || rolesLoading}
            onClick={() => void submit()}
          >
            <KeyRound className="h-4 w-4" />
            {saving ? "Guardando…" : "Crear acceso"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
