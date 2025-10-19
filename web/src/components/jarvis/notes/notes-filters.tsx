"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "~/components/ui/select";
import {
  FilterIcon,
  Youtube,
  Instagram,
  Music,
  ImageIcon,
  FileText,
} from "lucide-react";

export const FILTER_OPTIONS = [
  { label: "Todas as Fontes", icon: FilterIcon, value: "all" },
  { label: "YouTube", icon: Youtube, value: "YouTube" },
  { label: "Instagram", icon: Instagram, value: "Instagram" },
  { label: "TikTok", icon: Music, value: "TikTok" },
  { label: "Imagens", icon: ImageIcon, value: "Imagens" },
  { label: "Arquivos", icon: FileText, value: "Arquivos" },
];

interface NotesFiltersProps {
  activeFilter: string;
  onFilterChange: (value: string) => void;
  className?: string;
}

export function NotesFilters({
  activeFilter,
  onFilterChange,
  className = "",
}: NotesFiltersProps) {
  return (
    <div className={`w-full sm:w-auto sm:min-w-[200px] ${className}`}>
      <Select value={activeFilter} onValueChange={onFilterChange}>
        <SelectTrigger className="w-full rounded-md border-white/10 bg-white/[0.05] py-2.5 text-sm text-gray-100 transition-all duration-300 hover:bg-white/[0.08] focus:border-white/20">
          <div className="flex items-center gap-2 truncate">
            {React.createElement(
              FILTER_OPTIONS.find((opt) => opt.value === activeFilter)?.icon ||
                FilterIcon,
              {
                className: "h-4 w-4 text-gray-400 flex-shrink-0",
              }
            )}
            <span className="truncate">
              {FILTER_OPTIONS.find((opt) => opt.value === activeFilter)
                ?.label || "Filtrar por fonte..."}
            </span>
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-md border-white/10 bg-[#0a0a0a]">
          {FILTER_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="py-2 text-sm text-gray-100 hover:bg-white/[0.08]"
            >
              <div className="flex items-center gap-2.5">
                <option.icon className="h-4 w-4 text-gray-400" />
                {option.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
