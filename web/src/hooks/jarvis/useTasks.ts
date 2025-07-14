"use client"
import { useState } from "react"
import { defaultTasks } from "~/data/tasks"
import type { Task } from "~/data/tasks"

export function useTasks() {
  const [tasksByDay, setTasksByDay] = useState<Task[]>(defaultTasks)

  const [currentDay, setCurrentDay] = useState<string>(() => {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    // Ensure getDay() is correct for your 'day' string convention (e.g. if monday is 0 or 1)
    // JS Date().getDay() is Sunday = 0, Monday = 1, ..., Saturday = 6
    // If your 'day' strings match this (e.g. "monday" for index 1), this is fine.
    // The defaultTasks use lowercase day names.
    return days[new Date().getDay()] ?? "monday"
  })

  return { tasksByDay, setTasksByDay, currentDay, setCurrentDay }
}
