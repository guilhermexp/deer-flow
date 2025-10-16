"use client"

import { useHealthApi } from '~/hooks/use-health-api'

// Alias para compatibilidade - usa API hook
export function useHealthData() {
  return useHealthApi()
}

// Manter useHealthDataJWT como alias também para compatibilidade
export function useHealthDataJWT() {
  return useHealthApi()
}
