"use client"

import dynamic from "next/dynamic"

import AnimatedPageWrapperOptimized from "~/components/jarvis/animated-page-wrapper-optimized"

const KanbanDeskBoard = dynamic(
  () => import("~/components/jarvis/kanban/ui/kanban-desk-board"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-gray-400">Carregando quadro kanban...</div>
      </div>
    )
  }
)

export default function ProjectsPage() {
  return (
    <AnimatedPageWrapperOptimized className="h-screen overflow-hidden">
      <div className="w-full h-full flex flex-col">
        <KanbanDeskBoard />
      </div>
    </AnimatedPageWrapperOptimized>
  )
}