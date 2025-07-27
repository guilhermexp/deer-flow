"use client"

import { useState, useEffect, useCallback } from 'react'
import { healthService, type HealthData as SupabaseHealthData } from '~/services/supabase/health'
import type { HealthData } from '~/lib/health-data'

// Convert Supabase health data to local format
function convertSupabaseToLocal(data: SupabaseHealthData | null): HealthData | null {
  if (!data) return null;
  
  // The SupabaseHealthData is already in the correct format from the service
  return data;
}

export function useHealthDataSupabase() {
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load data on mount
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await healthService.getTodayHealthData()
      const localData = convertSupabaseToLocal(data)
      setHealthData(localData)
    } catch (err) {
      console.error('Error loading health data:', err)
      setError('Failed to load health data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Add water
  const handleAddWater = useCallback(async (amount: number) => {
    try {
      const updated = await healthService.addWaterIntake(amount)
      const localData = convertSupabaseToLocal(updated)
      setHealthData(localData)
      
      // Calculate and update health score
      await healthService.calculateHealthScore()
      await loadData() // Reload to get updated score
    } catch (err) {
      console.error('Error adding water:', err)
    }
  }, [loadData])

  // Update sleep
  const handleUpdateSleep = useCallback(async (duration: number, quality: number) => {
    try {
      const updated = await healthService.updateSleepData(duration, quality)
      const localData = convertSupabaseToLocal(updated)
      setHealthData(localData)
      
      // Calculate and update health score
      await healthService.calculateHealthScore()
      await loadData() // Reload to get updated score
    } catch (err) {
      console.error('Error updating sleep:', err)
    }
  }, [loadData])

  // Update blood pressure
  const handleUpdateBloodPressure = useCallback(async (systolic: number, diastolic: number, pulse: number) => {
    try {
      const updated = await healthService.updateBloodPressure(systolic, diastolic, pulse)
      const localData = convertSupabaseToLocal(updated)
      setHealthData(localData)
    } catch (err) {
      console.error('Error updating blood pressure:', err)
    }
  }, [])

  // Toggle medication
  const handleToggleMedication = useCallback(async (medicationName: string) => {
    try {
      const updated = await healthService.toggleMedication(medicationName)
      const localData = convertSupabaseToLocal(updated)
      setHealthData(localData)
    } catch (err) {
      console.error('Error toggling medication:', err)
    }
  }, [])

  // Add medication
  const handleAddMedication = useCallback(async (name: string, time: string) => {
    try {
      const updated = await healthService.addMedication(name, time)
      const localData = convertSupabaseToLocal(updated)
      setHealthData(localData)
    } catch (err) {
      console.error('Error adding medication:', err)
    }
  }, [])

  // Remove medication
  const handleRemoveMedication = useCallback(async (medicationName: string) => {
    try {
      const updated = await healthService.removeMedication(medicationName)
      const localData = convertSupabaseToLocal(updated)
      setHealthData(localData)
    } catch (err) {
      console.error('Error removing medication:', err)
    }
  }, [])

  // Complete workout
  const handleCompleteWorkout = useCallback(async () => {
    try {
      const updated = await healthService.completeWorkout()
      const localData = convertSupabaseToLocal(updated)
      setHealthData(localData)
      
      // Calculate and update health score
      await healthService.calculateHealthScore()
      await loadData() // Reload to get updated score
    } catch (err) {
      console.error('Error completing workout:', err)
    }
  }, [loadData])

  // Reset daily data - not implemented for Supabase yet
  const handleResetDaily = useCallback(() => {
    console.log('Reset daily not implemented for Supabase')
  }, [])

  // Reset weekly data - not implemented for Supabase yet
  const handleResetWeekly = useCallback(() => {
    console.log('Reset weekly not implemented for Supabase')
  }, [])

  return {
    healthData,
    isLoading,
    error,
    handleAddWater,
    handleUpdateSleep,
    handleUpdateBloodPressure,
    handleToggleMedication,
    handleAddMedication,
    handleRemoveMedication,
    handleCompleteWorkout,
    handleResetDaily,
    handleResetWeekly
  }
}