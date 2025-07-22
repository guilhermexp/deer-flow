"use client"

import { useHealthSupabase } from '~/hooks/use-health-supabase'

// Alias para compatibilidade - usa Supabase diretamente
export function useHealthData() {
  return useHealthSupabase()
}

// Manter useHealthDataJWT como alias também para compatibilidade
export function useHealthDataJWT() {
  return useHealthSupabase()
}