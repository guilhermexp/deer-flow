"use client"
import { useState, useCallback } from "react"
import { useCalendar } from "~/components/jarvis/calendar/hooks/use-calendar"
import { CalendarHeader } from "~/components/jarvis/calendar/ui/calendar-header"
import dynamic from "next/dynamic"

const DayView = dynamic(() => import("~/components/jarvis/calendar/ui/day-view"), {
  loading: () => <div className="h-full w-full animate-pulse bg-white/[0.05]" />,
  ssr: false,
})
const WeekView = dynamic(() => import("~/components/jarvis/calendar/ui/week-view"), {
  loading: () => <div className="h-full w-full animate-pulse bg-white/[0.05]" />,
  ssr: false,
})
const MonthView = dynamic(() => import("~/components/jarvis/calendar/ui/month-view"), {
  loading: () => <div className="h-full w-full animate-pulse bg-white/[0.05]" />,
  ssr: false,
})
import { AddEventDialog } from "~/components/jarvis/calendar/ui/add-event-dialog"
import DeleteEventDialog from "~/components/jarvis/calendar/ui/delete-event-dialog"
import { cn } from "~/lib/utils"
import type { CalendarViewMode } from "~/components/jarvis/calendar/lib/types"
import AnimatedPageWrapperOptimized from "~/components/jarvis/animated-page-wrapper-optimized"

export default function CalendarPage({ className }: { className?: string }) {
  const {
    // State & Data
    viewMode,
    activeFilter,
    currentDate,
    monthDisplayDate,
    isAddEventDialogOpen,
    isDeleteConfirmOpen,
    eventToDelete,
    startOfWeekDate,
    daysInWeekViewArray,
    eventsForSelectedDayInDayView,
    relevantHoursForDayViewDisplay,
    currentTimePositionInDayViewDisplay,
    // Setters & Handlers
    setViewMode,
    setActiveFilter,
    setIsAddEventDialogOpen,
    handleGoToToday,
    handleAddNewEvent,
    handleOpenDeleteDialog,
    handleConfirmDelete,
    handleCloseDeleteDialog,
    handleOpenAddEventDialog: openDialog,
    navigateDay,
    navigateWeek,
    navigateMonth,
    // Helpers & Getters
    getEventsForSpecificDate,
    getEventsForDayOfWeek,
    isCurrentEventActive,
    formatHourForDisplay,
    isDateToday,
    getDaysForMonthView,
  } = useCalendar()

  const [addEventInitialDate, setAddEventInitialDate] = useState<Date | undefined>(undefined)

  const determineInitialDateForDialog = useCallback(
    (currentViewMode: CalendarViewMode, dateForDialog: Date, monthDateForDialog: Date): Date => {
      let defaultDate = new Date()
      if (currentViewMode === "day") {
        defaultDate = new Date(dateForDialog)
      } else if (currentViewMode === "week") {
        defaultDate = new Date(dateForDialog)
      } else if (currentViewMode === "month") {
        const today = new Date()
        if (
          dateForDialog.getFullYear() === monthDateForDialog.getFullYear() &&
          dateForDialog.getMonth() === monthDateForDialog.getMonth()
        ) {
          defaultDate = new Date(dateForDialog)
        } else if (
          today.getFullYear() === monthDateForDialog.getFullYear() &&
          today.getMonth() === monthDateForDialog.getMonth()
        ) {
          defaultDate = today
        } else {
          defaultDate = new Date(monthDateForDialog.getFullYear(), monthDateForDialog.getMonth(), 1)
        }
      }
      return defaultDate
    },
    [],
  )

  const handleOpenAddEventDialogWithDate = useCallback(() => {
    const initialDate = determineInitialDateForDialog(viewMode, currentDate, monthDisplayDate)
    setAddEventInitialDate(initialDate)
    openDialog()
  }, [viewMode, currentDate, monthDisplayDate, openDialog, determineInitialDateForDialog])

  return (
    <AnimatedPageWrapperOptimized className="min-h-full">
      <div className={cn("w-full h-full flex flex-col", className)}>
        <CalendarHeader
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onTodayClick={handleGoToToday}
          onNewEventClick={handleOpenAddEventDialogWithDate}
          onNavigate={(direction) => {
            if (viewMode === "day") navigateDay(direction)
            else if (viewMode === "week") navigateWeek(direction)
            else navigateMonth(direction)
          }}
          currentDate={currentDate}
          monthDisplayDate={monthDisplayDate}
          eventCount={
            viewMode === "day" ? eventsForSelectedDayInDayView.length :
            viewMode === "week" ? daysInWeekViewArray.reduce((acc, day, index) => acc + getEventsForDayOfWeek(index).length, 0) :
            getDaysForMonthView(monthDisplayDate).reduce((total, day) => {
              if (day) {
                const events = getEventsForSpecificDate(day)
                return total + events.length
              }
              return total
            }, 0)
          }
        />

        <main className="flex-grow overflow-y-auto">
          {viewMode === "day" && (
            <DayView
              currentDate={currentDate}
              eventsForSelectedDay={eventsForSelectedDayInDayView}
              relevantHours={relevantHoursForDayViewDisplay}
              currentTimePosition={currentTimePositionInDayViewDisplay}
              isCurrentEventActive={isCurrentEventActive}
              formatHourForDisplay={formatHourForDisplay}
              onNavigate={navigateDay}
              onDeleteEvent={handleOpenDeleteDialog}
              onAddEventClick={(date) => {
                setAddEventInitialDate(date)
                openDialog()
              }}
            />
          )}
          {viewMode === "week" && (
            <WeekView
              startOfWeek={startOfWeekDate}
              daysInWeek={daysInWeekViewArray}
              getEventsForDayOfWeek={getEventsForDayOfWeek}
              isCurrentEventActive={isCurrentEventActive}
              formatHourForDisplay={formatHourForDisplay}
              isDateToday={isDateToday}
              onNavigate={navigateWeek}
              onDeleteEvent={handleOpenDeleteDialog}
              onAddEventClick={(date) => {
                setAddEventInitialDate(date)
                openDialog()
              }}
            />
          )}
          {viewMode === "month" && (
            <MonthView
              monthDisplayDate={monthDisplayDate}
              getDaysInMonth={() => getDaysForMonthView(monthDisplayDate)}
              getEventsForSpecificDate={getEventsForSpecificDate}
              isCurrentEventActive={isCurrentEventActive}
              isDateToday={isDateToday}
              onNavigate={navigateMonth}
              onDeleteEvent={handleOpenDeleteDialog}
              onAddEventClick={(date) => {
                setAddEventInitialDate(date)
                openDialog()
              }}
            />
          )}
        </main>

        <AddEventDialog
          open={isAddEventDialogOpen}
          setOpen={setIsAddEventDialogOpen}
          onAddEvent={handleAddNewEvent}
          initialDate={addEventInitialDate}
        />

        <DeleteEventDialog
          isOpen={isDeleteConfirmOpen}
          onOpenChange={handleCloseDeleteDialog}
          onConfirmDelete={handleConfirmDelete}
          eventTitle={eventToDelete?.title}
        />
      </div>
    </AnimatedPageWrapperOptimized>
  )
}