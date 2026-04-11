"use client";

import { memo } from "react";
import type { EmployeeWithPermissions } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Phone, KeyRound, Pencil, Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function roleBadge(roleLabel?: string) {
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
}

function statusBadge(status: 0 | 1) {
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
}

type Props = {
  employees: EmployeeWithPermissions[];
  employeesLoading: boolean;
  employeesError: boolean;
  employeesErrorMessage: string;
  onOpenInvite: () => void;
  onEdit: (e: EmployeeWithPermissions) => void;
  onDelete: (e: EmployeeWithPermissions) => void;
};

export const EquipoEmployeeGrid = memo(function EquipoEmployeeGrid({
  employees,
  employeesLoading,
  employeesError,
  employeesErrorMessage,
  onOpenInvite,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
      {employeesLoading ? (
        <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
          Cargando colaboradores…
        </p>
      ) : employeesError ? (
        <p className="col-span-full py-10 text-center text-sm text-destructive">
          {employeesErrorMessage}
        </p>
      ) : null}
      {!employeesLoading &&
        !employeesError &&
        employees.map((employee) => (
          <Card key={employee.id} className="relative shadow-sm">
            <CardContent className="p-6">
              <div className="absolute right-2 top-2 flex gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Editar"
                  onClick={() => onEdit(employee)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  aria-label="Dar de baja colaborador"
                  onClick={() => onDelete(employee)}
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
                      {roleBadge(employee.roleLabel)}
                      {statusBadge(employee.status)}
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

      {!employeesLoading && !employeesError ? (
        <Card
          className="flex cursor-pointer items-center justify-center border-dashed shadow-sm transition-colors hover:bg-muted/50"
          onClick={onOpenInvite}
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
      ) : null}
    </div>
  );
});
