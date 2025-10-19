"use client";

import * as React from "react";
import { Input } from "~/components/ui/input";
import { Search } from "lucide-react";

interface NotesSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function NotesSearchBar({
  searchQuery,
  onSearchChange,
  placeholder = "Buscar notas por título ou tags...",
  className = "",
}: NotesSearchBarProps) {
  return (
    <div className={`relative w-full flex-grow ${className}`}>
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
      <Input
        type="search"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full rounded-md border-white/10 bg-white/[0.05] py-2.5 pr-4 pl-10 text-sm text-gray-100 transition-all duration-300 placeholder:text-gray-500 focus:border-white/20"
      />
    </div>
  );
}
