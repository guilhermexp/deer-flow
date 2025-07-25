"use client"

import * as React from "react"
import { memo } from "react"
import { Label } from "~/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"

interface KanbanWeekHeaderProps {
  visibleDaysCount: number
  onVisibleDaysChange: (count: number) => void
}

const KanbanWeekHeader = memo(function KanbanWeekHeader({
  visibleDaysCount,
  onVisibleDaysChange,
}: KanbanWeekHeaderProps) {
  return (
    <div className="mb-2 px-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Projetos da Semana</h2>
        <div className="flex items-center gap-2">
          <Label htmlFor="days-select" className="text-gray-400 text-sm">
            Quantos dias mostrar?
          </Label>
          <Select
            value={visibleDaysCount.toString()}
            onValueChange={(v) => onVisibleDaysChange(Number.parseInt(v))}
          >
            <SelectTrigger id="days-select" className="w-20 h-8 bg-white/[0.05] border-white/10 text-gray-100 hover:bg-white/[0.08] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0a0a0a] border-white/10">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <SelectItem key={num} value={num.toString()} className="text-gray-100 hover:bg-white/[0.08]">
                  {num} {num === 1 ? "dia" : "dias"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
})

export default KanbanWeekHeader