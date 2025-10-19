"use client";

import React from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Search, Plus, Settings } from "lucide-react";
// CreateProjectDialog is now a separate component, so DialogTrigger is used here.

interface KanbanBoardHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isProjectSelected: boolean;
  onTriggerCreateProject: () => void; // Changed to trigger dialog
  onCustomizeBoard: () => void;
}

export default function KanbanBoardHeader({
  searchQuery,
  onSearchChange,
  isProjectSelected,
  onTriggerCreateProject,
  onCustomizeBoard,
}: KanbanBoardHeaderProps) {
  const [isCustomizeDialogOpen, setIsCustomizeDialogOpen] =
    React.useState(false); // Placeholder state

  return (
    <header className="border-b border-white/10 px-4 py-2 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-400">
            {isProjectSelected
              ? "Gerencie as tarefas do seu projeto."
              : "Selecione ou crie um projeto para começar."}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {isProjectSelected && (
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Buscar tarefas..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full border-white/10 bg-white/[0.05] pl-10 text-gray-100 placeholder:text-gray-500 focus:border-white/20 sm:w-64"
                aria-label="Search tasks"
                disabled={!isProjectSelected}
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={onTriggerCreateProject} // Use the passed trigger function
              className="border border-blue-500/50 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
              aria-label="Create new project"
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Projeto
            </Button>

            {isProjectSelected && (
              // Placeholder for Customize Dialog Trigger if needed
              <Button
                variant="outline"
                onClick={() => {
                  setIsCustomizeDialogOpen(true); // Example: manage local state for a simple dialog
                  onCustomizeBoard();
                }}
                className="border-white/10 text-gray-400 hover:bg-white/[0.08] hover:text-gray-100"
                aria-label="Customize board"
                disabled={!isProjectSelected}
              >
                <Settings className="mr-2 h-4 w-4" />
                Customizar
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* Example of a simple customize dialog, can be extracted too */}
      {isCustomizeDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setIsCustomizeDialogOpen(false)}
        >
          <div
            className="bg-card rounded-lg p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-lg font-semibold">Customizar Quadro</h3>
            <p className="text-muted-foreground">
              Opções de customização (placeholder).
            </p>
            <Button
              onClick={() => setIsCustomizeDialogOpen(false)}
              className="mt-4"
            >
              Fechar
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
