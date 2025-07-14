"use client"
import { useState } from "react"

export interface CalendarEvent {
  id: string
  title: string
  date: Date // Using Date object
  category: string
}

export function useEventManager() {
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: "e1", title: "Reunião de Projeto Semanal", date: new Date(), category: "Trabalho" },
    {
      id: "e2",
      title: "Consulta Médica",
      date: new Date(new Date().setDate(new Date().getDate() + 2)), // Two days from now
      category: "Pessoal",
    },
    {
      id: "e3",
      title: "Workshop de Design Thinking",
      date: new Date(new Date().setDate(new Date().getDate() - 1)), // Yesterday
      category: "Desenvolvimento",
    },
  ])

  // Function to add an event (example)
  const addEvent = (event: Omit<CalendarEvent, "id">) => {
    setEvents((prevEvents) => [...prevEvents, { ...event, id: String(Date.now()) }])
  }

  return { events, setEvents, addEvent }
}
