"use client"

import type * as React from "react"
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import type { Task, TaskWeekDay } from "../lib/types"
import {
  DAYS_FILTER_KEY,
  MOBILE_COLUMN_KEY,
  getWeekDayDefinitions,
  getColumnsWithTasks,
  createTransparentDragImage,
  saveToLocalStorage,
  getFromLocalStorage,
} from "~/lib/kanban-utils"
import KanbanDayColumn from "./kanban-day-column"

interface KanbanWeekViewProps {
  tasks: Task[]
  onEditTask: (task: Task) => void
  onDeleteTask: (task: Task) => void
  onUpdateTask: (updatedTask: Task) => void // For drag-and-drop updates
  onAddTaskToDay: (day: TaskWeekDay) => void
  visibleDaysCount?: number
}

export default function KanbanWeekView({
  tasks,
  onEditTask,
  onDeleteTask,
  onUpdateTask,
  onAddTaskToDay,
  visibleDaysCount = 5,
}: KanbanWeekViewProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [currentMobileColumnIdx, setCurrentMobileColumnIdx] = useState<number>(0)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null)
  const [showScrollButtons, setShowScrollButtons] = useState({ left: false, right: false })
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    // Removed local storage for days count as it's now controlled from parent
    const storedCol = getFromLocalStorage(MOBILE_COLUMN_KEY, '0')
    setCurrentMobileColumnIdx(Number.parseInt(storedCol))
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Removed local storage effect for visibleDaysCount
  useEffect(() => saveToLocalStorage(MOBILE_COLUMN_KEY, currentMobileColumnIdx.toString()), [currentMobileColumnIdx])

  useEffect(() => {
    if (!isMobile && scrollContainerRef.current) {
      const checkScroll = () => {
        const container = scrollContainerRef.current!
        const { scrollLeft, scrollWidth, clientWidth } = container
        const atStart = scrollLeft <= 10
        const atEnd = scrollLeft + clientWidth >= scrollWidth - 10
        const hasOverflow = scrollWidth > clientWidth
        
        setShowScrollButtons({
          left: hasOverflow && !atStart,
          right: hasOverflow && !atEnd
        })
      }
      
      checkScroll()
      const container = scrollContainerRef.current
      container.addEventListener("scroll", checkScroll)
      window.addEventListener("resize", checkScroll)
      
      return () => {
        container.removeEventListener("scroll", checkScroll)
        window.removeEventListener("resize", checkScroll)
      }
    }
  }, [tasks, visibleDaysCount, isMobile])

  const weekDayDefinitions = useMemo(() => getWeekDayDefinitions(), [])

  const visibleColumns = useMemo(
    () => weekDayDefinitions.slice(0, visibleDaysCount),
    [weekDayDefinitions, visibleDaysCount],
  )

  const columnsWithTasks = useMemo(
    () => getColumnsWithTasks(tasks, visibleColumns),
    [tasks, visibleColumns]
  )

  const handleDragStart = useCallback((e: React.DragEvent | MouseEvent | TouchEvent | PointerEvent, task: Task) => {
    setDraggedTask(task)
    
    if ('dataTransfer' in e && e.dataTransfer) {
      const dragImage = createTransparentDragImage()
      e.dataTransfer.setDragImage(dragImage, 0, 0)
      e.dataTransfer.setData('text/plain', task.id)
      e.dataTransfer.setData('application/json', JSON.stringify(task))
      e.dataTransfer.effectAllowed = "move"
    }
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null)
    setDragOverColumnId(null)
  }, [])
  
  const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move"
    if (columnId !== dragOverColumnId) setDragOverColumnId(columnId)
  }, [dragOverColumnId])
  
  const handleDragLeave = useCallback(() => {
    setDragOverColumnId(null)
  }, [])
  


  const goToPrevCol = () => setCurrentMobileColumnIdx((prev) => Math.max(0, prev - 1))
  const goToNextCol = () => setCurrentMobileColumnIdx((prev) => Math.min(columnsWithTasks.length - 1, prev + 1))
  const handlePanEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 50) goToPrevCol()
    else if (info.offset.x < -50) goToNextCol()
  }
  const scrollToNext = () =>
    scrollContainerRef.current?.scrollBy({ left: scrollContainerRef.current.clientWidth * 0.8, behavior: "smooth" })
  
  const scrollToPrev = () =>
    scrollContainerRef.current?.scrollBy({ left: -scrollContainerRef.current.clientWidth * 0.8, behavior: "smooth" })

  const handleDropOnWeekColumn = useCallback((e: React.DragEvent, day: TaskWeekDay) => {
    e.preventDefault()
    e.stopPropagation()
    
    
    if (draggedTask && draggedTask.weekDay !== day) {
      const updatedTask = { ...draggedTask, weekDay: day }
      onUpdateTask(updatedTask)
    }
    
    setDraggedTask(null)
    setDragOverColumnId(null)
    document.body.classList.remove('dragging-active')
  }, [draggedTask, onUpdateTask])


  return (
    <div className="kanban-week-view-container flex flex-col bg-[#0a0a0a] text-gray-100 h-full">
      {isMobile ? (
        <div className="flex-1 flex flex-col overflow-hidden px-2">
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevCol}
              disabled={currentMobileColumnIdx === 0}
              className="bg-white/[0.05] border-white/10 text-gray-400 hover:bg-white/[0.08] hover:text-gray-100 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">
                {currentMobileColumnIdx + 1} de {columnsWithTasks.length}
              </span>
              <div className="flex gap-1">
                {columnsWithTasks.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentMobileColumnIdx(idx)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      idx === currentMobileColumnIdx ? "bg-blue-500" : "bg-gray-600",
                    )}
                    aria-label={`Ir para coluna ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextCol}
              disabled={currentMobileColumnIdx === columnsWithTasks.length - 1}
              className="bg-white/[0.05] border-white/10 text-gray-400 hover:bg-white/[0.08] hover:text-gray-100 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <motion.div
            className="overflow-hidden flex-1"
            onPanEnd={handlePanEnd}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentMobileColumnIdx}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="h-full"
              >
                {columnsWithTasks.length > 0 && columnsWithTasks[currentMobileColumnIdx] && (
                  <KanbanDayColumn
                    column={columnsWithTasks[currentMobileColumnIdx]!}
                    isDragOver={dragOverColumnId === columnsWithTasks[currentMobileColumnIdx]?.id}
                    draggedTask={draggedTask}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDropOnWeekColumn}
                    onAddTaskToDay={onAddTaskToDay}
                    onEditTask={onEditTask}
                    onDeleteTask={onDeleteTask}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      ) : (
        <div className="relative flex-1 overflow-hidden px-2">
          <div
            ref={scrollContainerRef}
            className="kanban-week-scroll-container flex gap-3 overflow-x-auto pb-2 h-full"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {columnsWithTasks.map((column) => (
              <KanbanDayColumn
                key={column.id}
                column={column}
                isDragOver={dragOverColumnId === column.id}
                draggedTask={draggedTask}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDropOnWeekColumn}
                onAddTaskToDay={onAddTaskToDay}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>
          {/* Botão de navegação esquerda */}
          {showScrollButtons.left && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 ml-2"
            >
              <Button
                onClick={scrollToPrev}
                size="icon"
                className="h-10 w-10 rounded-full bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 shadow-lg backdrop-blur-sm"
                aria-label="Rolar para colunas anteriores"
              >
                <ChevronLeft className="h-5 w-5 text-gray-100" />
              </Button>
            </motion.div>
          )}
          
          {/* Botão de navegação direita */}
          {showScrollButtons.right && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 mr-2"
            >
              <Button
                onClick={scrollToNext}
                size="icon"
                className="h-10 w-10 rounded-full bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 shadow-lg backdrop-blur-sm"
                aria-label="Rolar para próximas colunas"
              >
                <ChevronRight className="h-5 w-5 text-gray-100" />
              </Button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
