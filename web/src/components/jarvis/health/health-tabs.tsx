"use client"

import { Home, Dumbbell, FileText, Apple } from "lucide-react"
import { cn } from "~/lib/utils"

interface HealthTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "workouts", label: "Treinos", icon: Dumbbell },
  { id: "exams", label: "Exames", icon: FileText },
  { id: "nutrition", label: "Nutrição", icon: Apple },
]

export function HealthTabs({ activeTab, onTabChange }: HealthTabsProps) {
  return (
    <nav className="flex items-center gap-1 mt-3 sm:mt-4 p-1 rounded-xl w-fit overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1 sm:gap-2 whitespace-nowrap min-w-fit",
              isActive
                ? "bg-white/10 text-gray-100"
                : "text-gray-400 hover:text-gray-100 hover:bg-white/[0.08]"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden text-xs">{tab.label.slice(0, 3)}</span>
          </button>
        )
      })}
    </nav>
  )
}