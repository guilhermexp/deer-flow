"use client"

import { useState, useEffect, useCallback } from 'react'
import {
  type HealthData,
  loadHealthData,
  addWaterIntake,
  updateSleepData,
  updateBloodPressure,
  toggleMedication,
  addMedication,
  removeMedication,
  completeWorkout,
  resetDailyData,
  resetWeeklyData
} from '~/lib/health-data'

export function useHealthData() {
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Carregar dados ao montar - apenas no cliente
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const data = loadHealthData()
        setHealthData(data)
      }
    } catch (error) {
      console.error('Erro ao carregar dados de saúde:', error)
      // Em caso de erro, carrega dados padrão
      if (typeof window !== 'undefined') {
        const data = loadHealthData() // Função já tem fallback para dados padrão
        setHealthData(data)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Adicionar água
  const handleAddWater = useCallback((amount: number) => {
    if (!healthData) return
    const updated = addWaterIntake(amount)
    setHealthData(updated)
  }, [healthData])

  // Atualizar sono
  const handleUpdateSleep = useCallback((duration: number, quality: number) => {
    if (!healthData) return
    const updated = updateSleepData(duration, quality)
    setHealthData(updated)
  }, [healthData])

  // Atualizar pressão
  const handleUpdateBloodPressure = useCallback((systolic: number, diastolic: number, pulse: number) => {
    if (!healthData) return
    const updated = updateBloodPressure(systolic, diastolic, pulse)
    setHealthData(updated)
  }, [healthData])

  // Toggle medicamento
  const handleToggleMedication = useCallback((index: number) => {
    if (!healthData) return
    const updated = toggleMedication(index)
    setHealthData(updated)
  }, [healthData])

  // Adicionar medicamento
  const handleAddMedication = useCallback((name: string, dosage: string, time: string) => {
    if (!healthData) return
    const updated = addMedication(name, dosage, time)
    setHealthData(updated)
  }, [healthData])

  // Remover medicamento
  const handleRemoveMedication = useCallback((index: number) => {
    if (!healthData) return
    const updated = removeMedication(index)
    setHealthData(updated)
  }, [healthData])

  // Completar treino
  const handleCompleteWorkout = useCallback(() => {
    if (!healthData) return
    const updated = completeWorkout()
    setHealthData(updated)
  }, [healthData])

  // Reset diário
  const handleResetDaily = useCallback(() => {
    if (!healthData) return
    const updated = resetDailyData()
    setHealthData(updated)
  }, [healthData])

  // Reset semanal
  const handleResetWeekly = useCallback(() => {
    if (!healthData) return
    const updated = resetWeeklyData()
    setHealthData(updated)
  }, [healthData])

  return {
    healthData,
    isLoading,
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