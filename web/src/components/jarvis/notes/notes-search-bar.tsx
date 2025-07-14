"use client"

import * as React from "react"
import { Input } from "~/components/ui/input"
import { Search } from "lucide-react"

interface NotesSearchBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function NotesSearchBar({ 
  searchQuery, 
  onSearchChange, 
  placeholder = "Buscar notas por título ou tags...",
  className = ""
}: NotesSearchBarProps) {
  return (
    <div className={`relative flex-grow w-full ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        type="search"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 pr-4 py-2.5 text-sm rounded-md bg-white/[0.05] border-white/10 text-gray-100 placeholder:text-gray-500 focus:border-white/20 transition-all duration-300 w-full"
      />
    </div>
  )
}