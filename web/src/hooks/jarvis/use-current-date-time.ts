"use client"
import { useState, useEffect } from "react"

export function useCurrentDateTime() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000 * 60) // Update every minute
    return () => clearInterval(timer)
  }, [])

  const formattedDate = currentDateTime.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  const formattedTime = currentDateTime.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return { currentDateTime, formattedDate, formattedTime }
}
