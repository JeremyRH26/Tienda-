"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { PermissionDto } from "@/lib/services/permissions.service";
import {
  createRoleWithPermissions,
  fetchRolePermissions,
  updateRoleWithPermissions,
} from "@/lib/services/roles.service";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRoleId: number | null;
  initialEditName: string;
  allPermissions: PermissionDto[];
  permissionsLoading: boolean;
  onRolCreadoOActualizado: (payload: { creadoRoleId?: number }) => void;
};

export function RolPermisosDialog({
  open,
  onOpenChange,
  editingRoleId,
  initialEditName,
  allPermissions,
  permissionsLoading,
  onRolCreadoOActualizado,
}: Props) {
  const queryClient = useQueryClient();
  const [roleName, setRoleName] = useState("");
  const [permIds, setPermIds] = useState<number[]>([]);
  const [loadingEditPerms, setLoadingEditPerms] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setRoleName("");
      setPermIds([]);
      setLoadingEditPerms(false);
      return;
    }
    if (editingRoleId == null) {
      setRoleName("");
      setPermIds([]);
      setLoadingEditPerms(false);
      return;
    }
    setRoleName(initialEditName);
    setPermIds([]);
    setLoadingEditPerms(true);
    let cancelled = false;
    void (async () => {
      try {
        const perms = await fetchRolePermissions(editingRoleId);
        if (cancelled) return;
        setPermIds(perms.map((p) => p.id));
      } catch (e) {
        if (!cancelled) {
          toast.error(
            e instanceof Error
              ? e.message
              : "No se pudieron cargar los permisos del rol.",
          );
          onOpenChange(false);
        }
      } finally {
        if (!cancelled) setLoadingEditPerms(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, editingRoleId, initialEditName, onOpenChange]);

  const togglePerm = useCallback((id: number, checked: boolean) => {
    setPermIds((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((x) => x !== id);
    });
  }, []);

  const submit = useCallback(async () => {
    const name = roleName.trim();
    if (!name) {
      toast.error("Indica el nombre del rol.");
      return;
    }
    setSaving(true);
    try {
      if (editingRoleId == null) {
        const created = await createRoleWithPermissions(name, permIds);
        onRolCreadoOActualizado({ creadoRoleId: created.id });
        toast.success("Rol creado y permisos asignados.");
      } else {
        await updateRoleWithPermissions(editingRoleId, name, permIds);
        await queryClient.invalidateQueries({
          queryKey: ["permissions", "byRole", editingRoleId],
        });
        onRolCreadoOActualizado({});
        toast.success("Rol y permisos actualizados.");
      }
      await queryClient.invalidateQueries({ queryKey: ["roles", "list"] });
      onOpenChange(false);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudo guardar el rol.",
      );
    } finally {
      setSaving(false);
    }
  }, [
    roleName,
    permIds,
    editingRoleId,
    onOpenChange,
    onRolCreadoOActualizado,
    queryClient,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,560px)] flex-col gap-0 overflow-hidden sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {editingRoleId == null ? "Nuevo rol" : "Editar rol"}
          </DialogTitle>
          <DialogDescription>
            {editingRoleId == null
              ? "Define el nombre y los permisos del nuevo rol."
              : "Modifica el nombre y los permisos de este rol."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden py-4">
          <div className="shrink-0 space-y-2">
            <Label htmlFor="new-role-name">Nombre del rol</Label>
            <Input
              id="new-role-name"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className="h-12"
              placeholder="Ej. Vendedor"
              autoComplete="off"
            />
          </div>
          <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden">
            <Label className="shrink-0">Permisos</Label>
            <ScrollArea className="min-h-0 rounded-md border p-3 pr-4">
              {permissionsLoading || loadingEditPerms ? (
                <p className="text-sm text-muted-foreground">
                  {loadingEditPerms
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
                        checked={permIds.includes(p.id)}
                        disabled={loadingEditPerms}
                        onCheckedChange={(checked) =>
                          togglePerm(p.id, checked === true)
                        }
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
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="h-11 gap-2 sm:h-10"
            onClick={() => void submit()}
            disabled={
              saving || permissionsLoading || loadingEditPerms
            }
          >
            {saving
              ? "Guardando…"
              : editingRoleId == null
                ? "Crear rol"
                : "Guardar cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
