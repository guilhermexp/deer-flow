"use client"

import { useState, useEffect, useCallback } from 'react'
import { getTodayHealthData, createHealthData, updateHealthData } from '~/core/api/health'
import type { HealthData } from '~/lib/health-data'

// Convert API health data to local format
function convertApiToLocal(data: any): HealthData | null {
  if (!data) return null;
  
  return {
    score: data.health_score || 85,
    hydration: {
      current: data.hydration_ml || 0,
      goal: data.hydration_goal_ml || 2000,
      history: []
    },
    sleep: {
      duration: data.sleep_hours || 0,
      quality: data.sleep_quality || 0,
      bedTime: '23:00',
      wakeTime: '06:30',
      phases: data.sleep_phases || {
        deep: 0,
        light: 0,
        rem: 0,
        awake: 0
      }
    },
    bloodPressure: {
      systolic: data.blood_pressure_systolic || 120,
      diastolic: data.blood_pressure_diastolic || 80,
      pulse: data.pulse || 72,
      history: []
    },
    workout: {
      nextWorkout: {
        time: '18:00',
        type: 'Treino de Força',
        duration: 60,
        intensity: 'Moderada'
      },
      weeklyGoal: data.workouts_goal || 5,
      weeklyCompleted: data.workouts_completed || 0
    },
    medications: data.medications || []
  };
}

export function useHealthDataJWT() {
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Try to get today's health data
      const data = await getTodayHealthData()
      const convertedData = convertApiToLocal(data)
      
      // If no data exists for today, create default data
      if (!convertedData) {
        const defaultData: HealthData = {
          score: 85,
          hydration: {
            current: 0,
            goal: 2000,
            history: []
          },
          sleep: {
            duration: 0,
            quality: 0,
            bedTime: '23:00',
            wakeTime: '06:30',
            phases: {
              deep: 0,
              light: 0,
              rem: 0,
              awake: 0
            }
          },
          bloodPressure: {
            systolic: 120,
            diastolic: 80,
            pulse: 72,
            history: []
          },
          workout: {
            nextWorkout: {
              time: '18:00',
              type: 'Treino de Força',
              duration: 60,
              intensity: 'Moderada'
            },
            weeklyGoal: 5,
            weeklyCompleted: 0
          },
          medications: []
        }
        setHealthData(defaultData)
      } else {
        setHealthData(convertedData)
      }
    } catch (err) {
      console.error('Error loading health data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load health data')
      
      // Set default data on error
      const defaultData: HealthData = {
        score: 85,
        hydration: {
          current: 0,
          goal: 2000,
          history: []
        },
        sleep: {
          duration: 0,
          quality: 0,
          bedTime: '23:00',
          wakeTime: '06:30',
          phases: {
            deep: 0,
            light: 0,
            rem: 0,
            awake: 0
          }
        },
        bloodPressure: {
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          history: []
        },
        workout: {
          nextWorkout: {
            time: '18:00',
            type: 'Treino de Força',
            duration: 60,
            intensity: 'Moderada'
          },
          weeklyGoal: 5,
          weeklyCompleted: 0
        },
        medications: []
      }
      setHealthData(defaultData)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateData = useCallback(async (updates: Partial<HealthData>) => {
    try {
      setLoading(true)
      setError(null)
      
      // Convert local format back to API format
      const apiUpdates = {
        health_score: updates.score,
        hydration_ml: updates.hydration?.current,
        hydration_goal_ml: updates.hydration?.goal,
        sleep_hours: updates.sleep?.duration,
        sleep_quality: updates.sleep?.quality,
        blood_pressure_systolic: updates.bloodPressure?.systolic,
        blood_pressure_diastolic: updates.bloodPressure?.diastolic,
        pulse: updates.bloodPressure?.pulse,
        workouts_goal: updates.workout?.weeklyGoal,
        workouts_completed: updates.workout?.weeklyCompleted,
        sleep_phases: updates.sleep?.phases,
        medications: updates.medications
      }
      
      // Remove undefined values
      const cleanUpdates = Object.fromEntries(
        Object.entries(apiUpdates).filter(([_, value]) => value !== undefined)
      )
      
      if (Object.keys(cleanUpdates).length > 0) {
        // Try to update existing data, or create new if none exists
        try {
          const today = new Date().toISOString().split('T')[0] as string;
          await updateHealthData(today, cleanUpdates)
        } catch (updateError) {
          // If update fails, try to create new entry
          await createHealthData({
            date: new Date().toISOString().split('T')[0],
            ...cleanUpdates
          })
        }
      }
      
      // Reload data after update
      await loadData()
    } catch (err) {
      console.error('Error updating health data:', err)
      setError(err instanceof Error ? err.message : 'Failed to update health data')
    } finally {
      setLoading(false)
    }
  }, [loadData])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Helper methods for specific updates
  const handleAddWater = useCallback(async (amount: number) => {
    if (!healthData) return;
    const newCurrent = healthData.hydration.current + amount;
    await updateData({ 
      hydration: {
        ...healthData.hydration,
        current: newCurrent
      }
    });
  }, [healthData, updateData]);

  const handleUpdateSleep = useCallback(async (sleepData: any) => {
    await updateData({ sleep: sleepData });
  }, [updateData]);

  const handleUpdateBloodPressure = useCallback(async (bpData: any) => {
    await updateData({ bloodPressure: bpData });
  }, [updateData]);

  const handleToggleMedication = useCallback(async (index: number) => {
    if (!healthData || !healthData.medications[index]) return;
    const medication = healthData.medications[index];
    if (!medication) return;
    const updatedMeds = [...healthData.medications];
    updatedMeds[index] = { ...medication, taken: !medication.taken };
    await updateData({ medications: updatedMeds });
  }, [healthData, updateData]);

  const handleAddMedication = useCallback(async (name: string, dosage: string, time: string) => {
    if (!healthData) return;
    const newMedication = { name, dosage, time, taken: false };
    const updatedMeds = [...healthData.medications, newMedication];
    await updateData({ medications: updatedMeds });
  }, [healthData, updateData]);

  const handleRemoveMedication = useCallback(async (index: number) => {
    if (!healthData || !healthData.medications[index]) return;
    const updatedMeds = healthData.medications.filter((_, i) => i !== index);
    await updateData({ medications: updatedMeds });
  }, [healthData, updateData]);

  const handleCompleteWorkout = useCallback(async () => {
    if (!healthData) return;
    const completed = healthData.workout.weeklyCompleted + 1;
    await updateData({ 
      workout: {
        ...healthData.workout,
        weeklyCompleted: completed
      }
    });
  }, [healthData, updateData]);

  return {
    healthData,
    isLoading: loading,
    error,
    refetch: loadData,
    updateData,
    handleAddWater,
    handleUpdateSleep,
    handleUpdateBloodPressure,
    handleToggleMedication,
    handleAddMedication,
    handleRemoveMedication,
    handleCompleteWorkout
  }
}