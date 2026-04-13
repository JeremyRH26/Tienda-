"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Pencil, Trash2, Tags } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

export type SimpleCategory = { id: number; name: string }

type CategoryAdminDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  categories: SimpleCategory[]
  onReload: () => Promise<void>
  onRename: (id: number, name: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export function CategoryAdminDialog({
  open,
  onOpenChange,
  title,
  description = "Edita el nombre o elimina categorías que no estén en uso.",
  categories,
  onReload,
  onRename,
  onDelete,
}: CategoryAdminDialogProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<SimpleCategory | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!open) {
      setEditingId(null)
      setEditName("")
      setPendingDelete(null)
      return
    }
    void onReload()
  }, [open, onReload])

  const startEdit = (c: SimpleCategory) => {
    setEditingId(c.id)
    setEditName(c.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
  }

  const saveEdit = async () => {
    if (editingId == null) return
    const name = editName.trim()
    if (!name) return
    setSaving(true)
    try {
      await onRename(editingId, name)
      toast.success("Categoría actualizada.")
      cancelEdit()
      await onReload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar el cambio.")
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await onDelete(pendingDelete.id)
      toast.success("Categoría eliminada.")
      setPendingDelete(null)
      await onReload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar la categoría.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[85vh] max-w-md flex-col gap-0 p-0 sm:max-w-lg">
          <DialogHeader className="shrink-0 border-b p-6 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5" />
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {categories.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                No hay categorías. Crea una desde el formulario principal.
              </p>
            ) : (
              <ul className="space-y-2">
                {categories.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    {editingId === c.id ? (
                      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-10 flex-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              void saveEdit()
                            }
                          }}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-9"
                            onClick={cancelEdit}
                            disabled={saving}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="h-9"
                            onClick={() => void saveEdit()}
                            disabled={saving || !editName.trim()}
                          >
                            Guardar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="min-w-0 flex-1 font-medium break-words">{c.name}</span>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-9 w-9"
                            aria-label={`Editar ${c.name}`}
                            onClick={() => startEdit(c)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 text-destructive hover:text-destructive"
                            aria-label={`Eliminar ${c.name}`}
                            onClick={() => setPendingDelete(c)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete != null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará &quot;{pendingDelete?.name}&quot;. Solo es posible si no hay registros
              que la usen (productos o gastos).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault()
                void confirmDelete()
              }}
            >
              {deleting ? "Eliminando…" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
