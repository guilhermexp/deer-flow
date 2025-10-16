// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { createCalendarApiService } from "~/services/api/calendar"
import { useAuthenticatedApi } from "~/hooks/use-authenticated-api"
import type { CalendarEvent, NewEventFormData } from "../lib/types"
import type { CalendarEvent as ApiCalendarEvent } from "~/services/api/calendar"

// Helper para formatar a hora
const formatHourForDisplay = (hour: number): string => {
  if (hour === 0 || hour === 24) return "12 AM"
  if (hour === 12) return "12 PM"
  if (hour > 12) return `${hour - 12} PM`
  return `${hour} AM`
}

// Converter API Event para Component Event
const apiEventToComponentEvent = (apiEvent: ApiCalendarEvent): CalendarEvent => {
  const date = new Date(apiEvent.date)
  const endDate = apiEvent.end_date ? new Date(apiEvent.end_date) : new Date(date.getTime() + 60 * 60 * 1000)
  const duration = (endDate.getTime() - date.getTime()) / (1000 * 60 * 60) // duration in hours
  
  return {
    id: apiEvent.id.toString(),
    title: apiEvent.title,
    subtitle: apiEvent.description || undefined,
    time: formatHourForDisplay(date.getHours()),
    duration: duration,
    color: (apiEvent.color as CalendarEvent["color"]) || "blue",
    category: (apiEvent.category as CalendarEvent["category"]) || "all",
    day: date.getDay(),
    startHour: date.getHours(),
    date: apiEvent.date
  }
}

// Converter Component Event para API Event Create
const componentEventToApiCreate = (formData: NewEventFormData) => {
  const date = new Date(formData.eventDate)
  date.setHours(formData.startHour, 0, 0, 0)
  
  const endDate = new Date(date)
  endDate.setHours(date.getHours() + formData.duration)
  
  return {
    title: formData.title,
    description: formData.subtitle || null,
    date: date.toISOString(),
    end_date: endDate.toISOString(),
    category: formData.category,
    color: formData.color,
    location: null,
    is_all_day: false
  }
}

export const useCalendarEventsApi = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use authenticated API client
  const authApi = useAuthenticatedApi()
  const calendarApiService = useMemo(() => createCalendarApiService(authApi), [authApi])

  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await calendarApiService.list()
      const convertedEvents = data.map(apiEventToComponentEvent)
      setEvents(convertedEvents)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events')
      console.error('Error loading events:', err)
    } finally {
      setIsLoading(false)
    }
  }, [calendarApiService])

  const addEvent = useCallback(async (newEventData: NewEventFormData) => {
    try {
      const apiData = componentEventToApiCreate(newEventData)
      const result = await calendarApiService.create(apiData)
      const convertedResult = apiEventToComponentEvent(result)
      setEvents(prev => [...prev, convertedResult])
      return convertedResult
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add event'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [calendarApiService])

  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      await calendarApiService.delete(parseInt(eventId))
      setEvents(prev => prev.filter(event => event.id !== eventId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete event'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [calendarApiService])

  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    try {
      // Para atualização, precisamos converter apenas os campos relevantes
      const apiUpdates: any = {}
      if (updates.title) apiUpdates.title = updates.title
      if (updates.subtitle !== undefined) apiUpdates.description = updates.subtitle
      if (updates.color) apiUpdates.color = updates.color
      if (updates.category) apiUpdates.category = updates.category

      const result = await calendarApiService.update(parseInt(eventId), apiUpdates)
      const convertedResult = apiEventToComponentEvent(result)
      setEvents(prev => prev.map(event =>
        event.id === eventId ? convertedResult : event
      ))
      return convertedResult
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update event'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [calendarApiService])

  // Load events on mount
  useEffect(() => {
    loadEvents()
  }, [loadEvents])

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
