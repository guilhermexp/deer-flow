"use client"
import { useState, useCallback } from "react"
import type { CalendarEvent } from "../lib/types"
// NewEventFormData não é mais necessário aqui, pois o diálogo gerencia seu próprio formulário.
// CalendarViewMode também não é mais necessário aqui para determinar a data inicial.

export const useCalendarDialogs = () => {
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null)

  const handleOpenAddEventDialog = useCallback(() => {
    // A lógica de determinar a data inicial foi movida para app/calendar/page.tsx
    // para ser passada como prop 'initialDate' para AddEventDialog.
    setIsAddEventDialogOpen(true)
  }, [])

  const handleCloseAddEventDialog = useCallback(() => {
    setIsAddEventDialogOpen(false)
    // O reset do formulário agora é feito dentro do AddEventDialog.
  }, [])

  const handleOpenDeleteDialog = useCallback((event: CalendarEvent) => {
    setEventToDelete(event)
    setIsDeleteConfirmOpen(true)
  }, [])

  const handleCloseDeleteDialog = useCallback(() => {
    setEventToDelete(null)
    setIsDeleteConfirmOpen(false)
  }, [])

  return {
    isAddEventDialogOpen,
    setIsAddEventDialogOpen, // Para controle externo se necessário
    handleOpenAddEventDialog,
    handleCloseAddEventDialog, // Expor para o AlertDialog no AddEventDialog se necessário (embora ele use setOpen)
    // newEventData e setNewEventData foram removidos
    isDeleteConfirmOpen,
    eventToDelete,
    handleOpenDeleteDialog,
    handleCloseDeleteDialog,
    confirmDeleteAction: eventToDelete ? () => eventToDelete.id : null,
  }
}
