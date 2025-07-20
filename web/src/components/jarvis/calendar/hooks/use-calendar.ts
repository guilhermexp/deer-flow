"use client"

import { useCallback } from "react"
import { useCalendarEventsApi } from "./useCalendarEventsApi"
import { useCalendarDateNavigation } from "./useCalendarDateNavigation"
import { useCalendarDisplayLogic } from "./useCalendarDisplayLogic"
import { useCalendarDialogs } from "./useCalendarDialogs"
import type { NewEventFormData } from "../lib/types" // Importar NewEventFormData

export const useCalendar = () => {
  const { events, addEvent, deleteEvent, isLoading } = useCalendarEventsApi()
  const dateNavigation = useCalendarDateNavigation()
  const displayLogic = useCalendarDisplayLogic(
    events,
    dateNavigation.currentDate,
    dateNavigation.monthDisplayDate,
    dateNavigation.startOfWeekDate,
  )
  // useCalendarDialogs não precisa mais de currentDate, monthDisplayDate, viewMode para o AddEventDialog
  const dialogs = useCalendarDialogs()

  // handleAddNewEvent agora recebe os dados do evento diretamente do AddEventDialog
  const handleAddNewEvent = useCallback(
    async (eventData: NewEventFormData) => {
      addEvent(eventData)
      // dialogs.handleCloseAddEventDialog() // O diálogo já se fecha e reseta
    },
    [addEvent], // dialogs.handleCloseAddEventDialog não é mais necessário aqui
  )

  const handleConfirmDelete = useCallback(() => {
    if (dialogs.confirmDeleteAction) {
      const eventIdToDelete = dialogs.confirmDeleteAction()
      if (eventIdToDelete) {
        deleteEvent(eventIdToDelete)
      }
    }
    dialogs.handleCloseDeleteDialog()
  }, [deleteEvent, dialogs])

  return {
    // Do useCalendarEvents
    allEvents: events,
    isLoading,
    // Do useCalendarDateNavigation
    currentDate: dateNavigation.currentDate,
    setCurrentDate: dateNavigation.setCurrentDate,
    monthDisplayDate: dateNavigation.monthDisplayDate,
    setMonthDisplayDate: dateNavigation.setMonthDisplayDate,
    handleGoToToday: dateNavigation.handleGoToToday,
    navigateDay: dateNavigation.navigateDay,
    navigateWeek: dateNavigation.navigateWeek,
    navigateMonth: dateNavigation.navigateMonth,
    startOfWeekDate: dateNavigation.startOfWeekDate,
    daysInWeekViewArray: dateNavigation.daysInWeekViewArray,
    // Do useCalendarDisplayLogic
    liveTime: displayLogic.liveTime,
    activeFilter: displayLogic.activeFilter,
    setActiveFilter: displayLogic.setActiveFilter,
    viewMode: displayLogic.viewMode,
    setViewMode: displayLogic.setViewMode,
    filteredEvents: displayLogic.filteredEvents,
    formatHourForDisplay: displayLogic.formatHourForDisplay,
    getEventsForSpecificDate: displayLogic.getEventsForSpecificDate,
    getEventsForDayOfWeek: displayLogic.getEventsForDayOfWeek,
    isCurrentEventActive: displayLogic.isCurrentEventActive,
    isDateToday: displayLogic.isDateToday,
    eventsForSelectedDayInDayView: displayLogic.eventsForSelectedDayInDayView,
    relevantHoursForDayViewDisplay: displayLogic.relevantHoursForDayViewDisplay,
    currentTimePositionInDayViewDisplay: displayLogic.currentTimePositionInDayViewDisplay,
    getDaysForMonthView: displayLogic.getDaysForMonthView,
    // Do useCalendarDialogs
    isAddEventDialogOpen: dialogs.isAddEventDialogOpen,
    setIsAddEventDialogOpen: dialogs.setIsAddEventDialogOpen,
    handleOpenAddEventDialog: dialogs.handleOpenAddEventDialog,
    // newEventData e setNewEventData foram removidos
    isDeleteConfirmOpen: dialogs.isDeleteConfirmOpen,
    eventToDelete: dialogs.eventToDelete,
    handleOpenDeleteDialog: dialogs.handleOpenDeleteDialog,
    handleCloseDeleteDialog: dialogs.handleCloseDeleteDialog,
    // Handlers combinados
    handleAddNewEvent, // Agora aceita NewEventFormData
    handleConfirmDelete,
  }
}
