"use client"
import { useState, useEffect, useCallback } from "react"
import type { CalendarEvent, NewEventFormData } from "../lib/types"
import { SAMPLE_EVENTS_DATA, CALENDAR_STORAGE_KEY } from "../lib/constants"

// Helper para formatar a hora, já que será usado ao adicionar evento
const formatHourForDisplayInternal = (hour: number): string => {
  if (hour === 0 || hour === 24) return "12 AM"
  if (hour === 12) return "12 PM"
  if (hour > 12) return `${hour - 12} PM`
  return `${hour} AM`
}

export const useCalendarEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    try {
      const storedEvents = localStorage.getItem(CALENDAR_STORAGE_KEY)
      if (storedEvents) {
        setEvents(JSON.parse(storedEvents))
      } else {
        setEvents(
          SAMPLE_EVENTS_DATA.map((event, index) => {
            const eventDate = new Date(event.date);
            let dayOfWeek = eventDate.getDay() - 1; // Mon=0, Sun=6
            if (dayOfWeek === -1) dayOfWeek = 6; // Ajusta Sunday
            
            return {
              ...event,
              id: `sample-${index}`,
              day: dayOfWeek,
              time: formatHourForDisplayInternal(event.startHour),
              date: event.date,
            };
          }),
        )
      }
    } catch (error) {
      console.error("Failed to load calendar events from localStorage", error)
      setEvents(
        SAMPLE_EVENTS_DATA.map((event, index) => {
          const eventDate = new Date(event.date);
          let dayOfWeek = eventDate.getDay() - 1; // Mon=0, Sun=6
          if (dayOfWeek === -1) dayOfWeek = 6; // Ajusta Sunday
          
          return {
            ...event,
            id: `sample-${index}`,
            day: dayOfWeek,
            time: formatHourForDisplayInternal(event.startHour),
            date: event.date,
          };
        }),
      )
    }
  }, [])

  useEffect(() => {
    try {
      if (events.length > 0 || localStorage.getItem(CALENDAR_STORAGE_KEY)) {
        // Evita salvar array vazio na primeira carga se não houver nada
        localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(events))
      }
    } catch (error) {
      console.error("Failed to save calendar events to localStorage", error)
    }
  }, [events])

  const addEvent = useCallback((newEventData: NewEventFormData) => {
    if (!newEventData.title.trim() || !newEventData.eventDate) return

    const parts = newEventData.eventDate.split("-").map(Number)
    const year = parts[0] ?? new Date().getFullYear()
    const month = parts[1] ?? 1
    const day = parts[2] ?? 1
    const eventDateObj = new Date(year, month - 1, day, newEventData.startHour, 0, 0)

    let dayOfWeek = eventDateObj.getDay() - 1 // Mon=0, Sun=6
    if (dayOfWeek === -1) dayOfWeek = 6 // Ajusta Sunday

    const eventToAdd: CalendarEvent = {
      id: Date.now().toString(),
      title: newEventData.title,
      subtitle: newEventData.subtitle,
      time: formatHourForDisplayInternal(newEventData.startHour),
      duration: newEventData.duration,
      color: newEventData.color,
      category: newEventData.category,
      day: dayOfWeek,
      startHour: newEventData.startHour,
      date: eventDateObj.toISOString(),
    }
    setEvents((prev) => [...prev, eventToAdd].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
  }, [])

  const deleteEvent = useCallback((eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId))
  }, [])

  return { events, addEvent, deleteEvent, setEvents }
}
