// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client"
import { useState, useEffect, useCallback } from "react"
import { useCalendarSupabase } from "~/hooks/use-calendar-supabase"
import type { CalendarEvent, NewEventFormData } from "../lib/types"
import { useAuth } from "~/core/contexts/auth-context"

// Helper para formatar a hora
const formatHourForDisplay = (hour: number): string => {
  if (hour === 0 || hour === 24) return "12 AM"
  if (hour === 12) return "12 PM"
  if (hour > 12) return `${hour - 12} PM`
  return `${hour} AM`
}


export const useCalendarEventsApi = () => {
  // Usar o hook do Supabase diretamente
  const {
    events,
    loading: isLoading,
    error,
    addEvent: addEventSupabase,
    updateEvent: updateEventSupabase,
    deleteEvent: deleteEventSupabase,
    loadEvents
  } = useCalendarSupabase()

  // Wrapper para manter a compatibilidade com a interface existente
  const addEvent = useCallback(async (newEventData: NewEventFormData) => {
    const result = await addEventSupabase(newEventData)
    if (!result) {
      throw new Error('Failed to add event')
    }
    return result
  }, [addEventSupabase])

  const deleteEvent = useCallback(async (eventId: string) => {
    const success = await deleteEventSupabase(eventId)
    if (!success) {
      throw new Error('Failed to delete event')
    }
  }, [deleteEventSupabase])

  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    const result = await updateEventSupabase(eventId, updates)
    if (!result) {
      throw new Error('Failed to update event')
    }
    return result
  }, [updateEventSupabase])

  return { 
    events, 
    addEvent, 
    deleteEvent, 
    updateEvent,
    isLoading,
    error: error || null,
    reloadEvents: loadEvents 
  }
}