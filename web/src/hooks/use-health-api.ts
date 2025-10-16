"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { createHealthApiService, type HealthData, type HealthStats, type HealthDataCreate, type HealthDataUpdate } from "~/services/api/health"
import { useAuthenticatedApi } from "~/hooks/use-authenticated-api"

export const useHealthApi = () => {
  const [healthData, setHealthData] = useState<HealthData[]>([])
  const [todayData, setTodayData] = useState<HealthData | null>(null)
  const [stats, setStats] = useState<HealthStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(true)

  // Use authenticated API client
  const authApi = useAuthenticatedApi()
  const healthApiService = useMemo(() => createHealthApiService(authApi), [authApi])

  const loadHealthData = useCallback(async (params?: {
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }) => {
    try {
      setLoading(true)
      setError(null)
      const data = await healthApiService.list(params)
      setHealthData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load health data')
      console.error('Error loading health data:', err)
    } finally {
      setLoading(false)
    }
  }, [healthApiService])

  const loadTodayData = useCallback(async () => {
    try {
      setError(null)
      const data = await healthApiService.getToday()
      setTodayData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load today data')
      console.error('Error loading today data:', err)
    }
  }, [healthApiService])

  const loadStats = useCallback(async (days: number = 30) => {
    try {
      setError(null)
      const data = await healthApiService.getStats(days)
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats')
      console.error('Error loading stats:', err)
    }
  }, [healthApiService])

  const createHealthData = useCallback(async (data: HealthDataCreate) => {
    try {
      const result = await healthApiService.create(data)
      setHealthData(prev => [...prev, result])
      setTodayData(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create health data'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [healthApiService])

  const updateHealthData = useCallback(async (id: number, data: HealthDataUpdate) => {
    try {
      const result = await healthApiService.update(id, data)
      setHealthData(prev => prev.map(item => item.id === id ? result : item))
      if (todayData && todayData.id === id) {
        setTodayData(result)
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update health data'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [todayData, healthApiService])

  const deleteHealthData = useCallback(async (id: number) => {
    try {
      await healthApiService.delete(id)
      setHealthData(prev => prev.filter(item => item.id !== id))
      if (todayData && todayData.id === id) {
        setTodayData(null)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete health data'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [todayData, healthApiService])

  const getByDate = useCallback(async (date: string) => {
    try {
      setError(null)
      return await healthApiService.getByDate(date)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get data by date')
      console.error('Error getting data by date:', err)
      return null
    }
  }, [healthApiService])

  // Load initial data
  useEffect(() => {
    loadHealthData()
    loadTodayData()
    loadStats()
  }, [loadHealthData, loadTodayData, loadStats])

  return {
    healthData,
    todayData,
    stats,
    loading,
    error,
    isAuthenticated,
    loadHealthData,
    loadTodayData,
    loadStats,
    createHealthData,
    updateHealthData,
    deleteHealthData,
    getByDate
  }
}
