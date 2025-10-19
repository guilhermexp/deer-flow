"use client";

import { Home, Dumbbell, FileText, Apple } from "lucide-react";
import { cn } from "~/lib/utils";

interface HealthTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "workouts", label: "Treinos", icon: Dumbbell },
  { id: "exams", label: "Exames", icon: FileText },
  { id: "nutrition", label: "Nutrição", icon: Apple },
];

export function HealthTabs({ activeTab, onTabChange }: HealthTabsProps) {
  return (
    <nav className="scrollbar-hide mt-3 flex w-fit items-center gap-1 overflow-x-auto rounded-xl p-1 sm:mt-4">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex min-w-fit items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-200 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm",
              isActive
                ? "bg-white/10 text-gray-100"
                : "text-gray-400 hover:bg-white/[0.08] hover:text-gray-100"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="text-xs sm:hidden">{tab.label.slice(0, 3)}</span>
          </button>
        );
      })}
    </nav>
  );
}
