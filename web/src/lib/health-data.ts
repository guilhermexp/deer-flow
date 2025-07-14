// Tipos de dados de saúde
export interface HealthData {
  score: number
  hydration: {
    current: number
    goal: number
    history: { time: string; amount: number }[]
  }
  sleep: {
    duration: number
    quality: number
    bedTime: string
    wakeTime: string
    phases: {
      deep: number
      light: number
      rem: number
      awake: number
    }
  }
  bloodPressure: {
    systolic: number
    diastolic: number
    pulse: number
    history: { date: string; systolic: number; diastolic: number }[]
  }
  workout: {
    nextWorkout: {
      time: string
      type: string
      duration: number
      intensity: string
    }
    weeklyGoal: number
    weeklyCompleted: number
  }
  medications: {
    name: string
    dosage: string
    time: string
    taken: boolean
  }[]
}

// Chave do localStorage
const HEALTH_DATA_KEY = 'jarvis-health-data'

// Dados padrão
const defaultHealthData: HealthData = {
  score: 85,
  hydration: {
    current: 1200,
    goal: 2000,
    history: [
      { time: '08:00', amount: 250 },
      { time: '10:00', amount: 200 },
      { time: '12:00', amount: 350 },
      { time: '14:00', amount: 200 },
      { time: '16:00', amount: 200 },
    ]
  },
  sleep: {
    duration: 7.5,
    quality: 82,
    bedTime: '23:00',
    wakeTime: '06:30',
    phases: {
      deep: 1.5,
      light: 3.5,
      rem: 2,
      awake: 0.5
    }
  },
  bloodPressure: {
    systolic: 120,
    diastolic: 80,
    pulse: 72,
    history: [
      { date: '2025-06-23', systolic: 120, diastolic: 80 },
      { date: '2025-06-22', systolic: 118, diastolic: 78 },
      { date: '2025-06-21', systolic: 122, diastolic: 82 },
      { date: '2025-06-20', systolic: 119, diastolic: 79 },
      { date: '2025-06-19', systolic: 121, diastolic: 81 },
    ]
  },
  workout: {
    nextWorkout: {
      time: '18:00',
      type: 'Treino de Força',
      duration: 60,
      intensity: 'Moderada'
    },
    weeklyGoal: 5,
    weeklyCompleted: 3
  },
  medications: [
    { name: 'Vitamina D', dosage: '1000 UI', time: '08:00', taken: true },
    { name: 'Ômega 3', dosage: '1000mg', time: '08:00', taken: true },
    { name: 'Magnésio', dosage: '400mg', time: '20:00', taken: false },
  ]
}

// Carregar dados do localStorage
export const loadHealthData = (): HealthData => {
  if (typeof window === 'undefined') return defaultHealthData
  
  try {
    const stored = localStorage.getItem(HEALTH_DATA_KEY)
    return stored ? JSON.parse(stored) : defaultHealthData
  } catch (error) {
    console.error('Erro ao carregar dados de saúde:', error)
    return defaultHealthData
  }
}

// Salvar dados no localStorage
export const saveHealthData = (data: HealthData) => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(HEALTH_DATA_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Erro ao salvar dados de saúde:', error)
  }
}

// Função para calcular o score de saúde
const calculateHealthScore = (data: HealthData): number => {
  const hydrationPercent = data.hydration.goal > 0 ? (data.hydration.current / data.hydration.goal) * 100 : 0
  const hydrationScore = Math.min(hydrationPercent, 100)

  const workoutScoreValue = data.workout.weeklyGoal > 0 ? (data.workout.weeklyCompleted / data.workout.weeklyGoal) * 100 : 0
  const workoutScore = Math.min(workoutScoreValue, 100)
  
  // Placeholders: assumindo que o score de nutrição é 90 se não houver dados.
  // O placeholder de exercício (85) é usado se weeklyGoal for 0.
  const exerciseContribution = data.workout.weeklyGoal > 0 ? workoutScore : 85;

  return Math.round(
    (hydrationScore * 0.2) +
    (data.sleep.quality * 0.3) +
    (exerciseContribution * 0.3) + // Usa workoutScore calculado ou placeholder
    (90 * 0.2) // Placeholder para nutrição
  )
}

// Adicionar água
export const addWaterIntake = (amount: number) => {
  const data = loadHealthData()
  data.hydration.current += amount
  data.hydration.history.push({
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    amount
  })
  
  data.score = calculateHealthScore(data)
  
  saveHealthData(data)
  return data
}

// Atualizar sono
export const updateSleepData = (duration: number, quality: number) => {
  const data = loadHealthData()
  data.sleep.duration = duration
  data.sleep.quality = quality
  
  data.score = calculateHealthScore(data)
  
  saveHealthData(data)
  return data
}

// Atualizar pressão arterial
export const updateBloodPressure = (systolic: number, diastolic: number, pulse: number) => {
  const data = loadHealthData()
  data.bloodPressure.systolic = systolic
  data.bloodPressure.diastolic = diastolic
  data.bloodPressure.pulse = pulse
  
  // Adicionar ao histórico
  data.bloodPressure.history.unshift({
    date: new Date().toISOString().split('T')[0] ?? '',
    systolic,
    diastolic
  })
  
  // Manter apenas os últimos 7 dias
  data.bloodPressure.history = data.bloodPressure.history.slice(0, 7)
  
  saveHealthData(data)
  return data
}

// Marcar medicamento como tomado
export const toggleMedication = (index: number) => {
  const data = loadHealthData()
  if (data.medications[index]) {
    data.medications[index].taken = !data.medications[index].taken
    saveHealthData(data)
  }
  return data
}

// Adicionar medicamento
export const addMedication = (name: string, dosage: string, time: string) => {
  const data = loadHealthData()
  data.medications.push({
    name,
    dosage,
    time,
    taken: false
  })
  saveHealthData(data)
  return data
}

// Remover medicamento
export const removeMedication = (index: number) => {
  const data = loadHealthData()
  data.medications.splice(index, 1)
  saveHealthData(data)
  return data
}

// Completar treino
export const completeWorkout = () => {
  const data = loadHealthData()
  data.workout.weeklyCompleted += 1
  
  data.score = calculateHealthScore(data)
  
  saveHealthData(data)
  return data
}

// Resetar dados diários
export const resetDailyData = () => {
  const data = loadHealthData()
  data.hydration.current = 0
  data.hydration.history = []
  data.medications.forEach(med => med.taken = false)
  saveHealthData(data)
  return data
}

// Resetar dados semanais
export const resetWeeklyData = () => {
  const data = loadHealthData()
  data.workout.weeklyCompleted = 0
  saveHealthData(data)
  return data
}