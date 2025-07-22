// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client"
import { useState, useEffect, useCallback } from "react"
import { calendarApi } from "~/core/api/calendar"
import type { CalendarEvent as ApiEvent } from "~/core/api/calendar"
import type { CalendarEvent, NewEventFormData } from "../lib/types"
import { useAuth } from "~/core/contexts/auth-context"

// Helper para formatar a hora
const formatHourForDisplay = (hour: number): string => {
  if (hour === 0 || hour === 24) return "12 AM"
  if (hour === 12) return "12 PM"
  if (hour > 12) return `${hour - 12} PM`
  return `${hour} AM`
}

// Convert API event to local calendar event format
function convertApiEventToLocal(apiEvent: ApiEvent): CalendarEvent {
  const eventDate = new Date(apiEvent.date)
  let dayOfWeek = eventDate.getDay() - 1 // Mon=0, Sun=6
  if (dayOfWeek === -1) dayOfWeek = 6 // Adjust Sunday
  
  const startHour = eventDate.getHours()
  
  // Calculate duration if end_date is provided
  let duration = 1 // Default 1 hour
  if (apiEvent.end_date) {
    const endDate = new Date(apiEvent.end_date)
    duration = Math.max(1, Math.round((endDate.getTime() - eventDate.getTime()) / (1000 * 60 * 60)))
  }
  
  return {
    id: apiEvent.id.toString(),
    title: apiEvent.title,
    subtitle: apiEvent.description,
    time: formatHourForDisplay(startHour),
    duration,
    color: (apiEvent.color || "blue") as "blue" | "green" | "purple" | "orange" | "red",
    category: (apiEvent.category || "all") as "all" | "rotina" | "habitos" | "workout" | "lembretes",
    day: dayOfWeek,
    startHour,
    date: apiEvent.date,
  }
}

// Convert local event data to API format
function convertLocalEventToApi(eventData: NewEventFormData): any {
  const parts = eventData.eventDate.split("-").map(Number)
  const year = parts[0] ?? new Date().getFullYear()
  const month = parts[1] ?? 1
  const day = parts[2] ?? 1
  
  const startDate = new Date(year, month - 1, day, eventData.startHour, 0, 0)
  const endDate = new Date(startDate)
  endDate.setHours(startDate.getHours() + eventData.duration)
  
  return {
    title: eventData.title,
    description: eventData.subtitle,
    date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    category: eventData.category,
    color: eventData.color,
    is_all_day: false,
  }
}

export const useCalendarEventsApi = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()

  // Load events from API
  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Get events for the current month and surrounding months
      const now = new Date()
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0)
      
      const apiEvents = await calendarApi.getEvents({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        limit: 500
      })
      
      const localEvents = apiEvents.map(convertApiEventToLocal)
      setEvents(localEvents)
    } catch (err) {
      console.error("Failed to load calendar events:", err)
      setError("Failed to load events")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load events on mount, but only after authentication is ready
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      loadEvents()
    } else if (!isAuthLoading && !isAuthenticated) {
      setIsLoading(false)
    }
  }, [loadEvents, isAuthLoading, isAuthenticated])

  // Add event
  const addEvent = useCallback(async (newEventData: NewEventFormData) => {
    if (!newEventData.title.trim() || !newEventData.eventDate) return

    try {
      const apiData = convertLocalEventToApi(newEventData)
      const apiEvent = await calendarApi.createEvent(apiData)
      const localEvent = convertApiEventToLocal(apiEvent)
      
      setEvents((prev) => [...prev, localEvent].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ))
    } catch (err) {
      console.error("Failed to add event:", err)
      throw err
    }
  }, [])

  // Delete event
  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      const id = parseInt(eventId)
      await calendarApi.deleteEvent(id)
      setEvents((prev) => prev.filter((e) => e.id !== eventId))
    } catch (err) {
      console.error("Failed to delete event:", err)
      throw err
    }
  }, [])

  // Update event
  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    try {
      const id = parseInt(eventId)
      const event = events.find(e => e.id === eventId)
      if (!event) return
      
      const apiUpdates: any = {}
      if (updates.title !== undefined) apiUpdates.title = updates.title
      if (updates.subtitle !== undefined) apiUpdates.description = updates.subtitle
      if (updates.color !== undefined) apiUpdates.color = updates.color
      if (updates.category !== undefined) apiUpdates.category = updates.category
      
      const apiEvent = await calendarApi.updateEvent(id, apiUpdates)
      const localEvent = convertApiEventToLocal(apiEvent)
      
      setEvents((prev) => prev.map(e => e.id === eventId ? localEvent : e))
    } catch (err) {
      console.error("Failed to update event:", err)
      throw err
    }
  }, [events])

  return { 
    events, 
    addEvent, 
    deleteEvent, 
    updateEvent,
    isLoading,
    error,
    reloadEvents: loadEvents 
  }
}