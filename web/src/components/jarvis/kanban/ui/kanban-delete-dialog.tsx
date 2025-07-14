"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog"
import type { Task } from "../lib/types"

interface KanbanDeleteDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  taskToDelete: Task | null
  onConfirmDelete: () => void
}

export default function KanbanDeleteDialog({
  isOpen,
  onOpenChange,
  taskToDelete,
  onConfirmDelete,
}: KanbanDeleteDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border text-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle>Deletar Tarefa</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Você tem certeza que quer deletar &quot;{taskToDelete?.title}&quot;? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-border text-muted-foreground hover:bg-muted">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmDelete}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            Deletar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
