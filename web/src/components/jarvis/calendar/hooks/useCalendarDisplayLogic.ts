"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import type {
  CalendarEvent,
  CalendarViewMode,
  CalendarFilter,
} from "../lib/types";
import { CALENDAR_HOURS } from "../lib/constants"; // Importa a nova constante

/**
 * Converte uma string de data ISO para um objeto Date.
 * @param dateString A data no formato ISO (pode incluir timestamp).
 * @returns Um objeto Date.
 */
const parseLocalDate = (dateString: string): Date => {
  return new Date(dateString);
};

export const useCalendarDisplayLogic = (
  allEvents: CalendarEvent[],
  currentDate: Date, // Para DayView e WeekView (para saber o dia/semana atual)
  monthDisplayDate: Date, // Para MonthView
  startOfWeekDateForWeekView: Date // Para WeekView
) => {
  console.log(
    "🎯 useCalendarDisplayLogic - Total de eventos recebidos:",
    allEvents.length
  );
  if (allEvents.length > 0) {
    console.log("📅 Primeiro evento:", allEvents[0]);
  }

  const [liveTime, setLiveTime] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState<CalendarFilter>("all");
  const [viewMode, setViewMode] = useState<CalendarViewMode>("day");

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 60000); // Atualiza a cada minuto
    return () => clearInterval(timer);
  }, []);

  const filteredEvents = useMemo(
    () =>
      allEvents.filter(
        (event) => activeFilter === "all" || event.category === activeFilter
      ),
    [allEvents, activeFilter]
  );

  const formatHourForDisplay = useCallback((hour: number) => {
    if (hour === 0 || hour === 24) return "12 AM";
    if (hour === 12) return "12 PM";
    if (hour > 12) return `${hour - 12} PM`;
    return `${hour} AM`;
  }, []);

  const getEventsForSpecificDate = useCallback(
    (date: Date) => {
      console.log(
        "🔍 getEventsForSpecificDate chamado para:",
        date.toDateString()
      );
      console.log("📋 Total de eventos filtrados:", filteredEvents.length);

      // Considera eventos que iniciam/terminam dentro do dia OU que cruzam o dia selecionado
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const eventsForDate = filteredEvents.filter((event) => {
        if (!event.date) return false;
        const eventStart = parseLocalDate(event.date);
        const eventEnd = new Date(eventStart);
        eventEnd.setHours(eventStart.getHours() + event.duration);

        const overlaps = eventEnd > dayStart && eventStart < dayEnd;

        if (overlaps) {
          console.log("✅ Evento encontrado para a data:", {
            title: event.title,
            eventStart: eventStart.toString(),
            eventEnd: eventEnd.toString(),
            targetDate: date.toDateString(),
          });
        }

        return overlaps;
      });

      console.log(
        `📊 ${eventsForDate.length} eventos encontrados para ${date.toDateString()}`
      );
      return eventsForDate;
    },
    [filteredEvents]
  );

  // Específico para WeekView, usa startOfWeekDateForWeekView
  const getEventsForDayOfWeek = useCallback(
    (dayIndex: number) => {
      // Removido weekStartDate como parâmetro, usa o do hook
      const targetDate = new Date(startOfWeekDateForWeekView);
      targetDate.setDate(startOfWeekDateForWeekView.getDate() + dayIndex);
      return getEventsForSpecificDate(targetDate);
    },
    [startOfWeekDateForWeekView, getEventsForSpecificDate]
  );

  const isCurrentEventActive = useCallback(
    (event: CalendarEvent) => {
      const now = liveTime;
      // CORREÇÃO: Usa a função de parsing local.
      const eventDate = parseLocalDate(event.date);
      if (now.toDateString() !== eventDate.toDateString()) return false;
      const currentHour = now.getHours();
      return (
        currentHour >= event.startHour &&
        currentHour < event.startHour + event.duration
      );
    },
    [liveTime]
  );

  const isDateToday = useCallback((date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  }, []);

  // Lógica para DayView
  const eventsForSelectedDayInDayView = useMemo(() => {
    return getEventsForSpecificDate(currentDate);
  }, [currentDate, getEventsForSpecificDate]);

  // CORREÇÃO: Simplificado para sempre retornar o intervalo padrão de 6h-23h.
  const relevantHoursForDayViewDisplay = useMemo(() => {
    return CALENDAR_HOURS;
  }, []);

  const currentTimePositionInDayViewDisplay = useMemo(() => {
    const currentHour = liveTime.getHours();
    const currentMinutes = liveTime.getMinutes();
    // Usa CALENDAR_HOURS para verificar se a hora atual está no intervalo visível
    if (!CALENDAR_HOURS.includes(currentHour)) return null;
    // O índice é a hora atual menos a hora de início (6)
    const hourIndex = currentHour - (CALENDAR_HOURS[0] ?? 0);
    const minuteOffset = currentMinutes / 60;
    return (hourIndex + minuteOffset) * 120; // 120px por hora
  }, [liveTime]);

  // Lógica para MonthView
  const getDaysForMonthView = useCallback((dateToDisplay: Date) => {
    // Renomeado parâmetro para clareza
    const year = dateToDisplay.getFullYear();
    const month = dateToDisplay.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonthCount = lastDayOfMonth.getDate();
    let startingDayOfWeek = firstDayOfMonth.getDay(); // Sunday is 0
    startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1; // Monday is 0
    const daysArray: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) daysArray.push(null);
    for (let day = 1; day <= daysInMonthCount; day++)
      daysArray.push(new Date(year, month, day));
    const totalCells = Math.ceil(daysArray.length / 7) * 7;
    const cellsToAdd =
      totalCells > daysArray.length
        ? totalCells - daysArray.length
        : daysArray.length % 7 === 0
          ? 0
          : 7 - (daysArray.length % 7);
    for (let i = 0; i < cellsToAdd; i++) daysArray.push(null);
    return daysArray;
  }, []);

  return {
    liveTime,
    activeFilter,
    setActiveFilter,
    viewMode,
    setViewMode,
    filteredEvents, // Eventos já filtrados por categoria
    formatHourForDisplay,
    getEventsForSpecificDate, // Usado por MonthView e internamente
    getEventsForDayOfWeek, // Usado por WeekView
    isCurrentEventActive,
    isDateToday,
    // DayView specific logic
    eventsForSelectedDayInDayView,
    relevantHoursForDayViewDisplay,
    currentTimePositionInDayViewDisplay,
    // MonthView specific logic
    getDaysForMonthView, // Passa monthDisplayDate para ele na página
  };
};
