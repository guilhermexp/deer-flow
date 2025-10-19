"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Kanban } from "lucide-react";

import { useKanbanBoard } from "../hooks/use-kanban-board";
import type { TaskStatus } from "../lib/types";
import KanbanBoardHeader from "./kanban-board-header";
import ProjectListView from "./project-list-view";
import KanbanView from "./kanban-view";
import KanbanWeekView from "./kanban-week-view";
import KanbanTaskDialog from "./kanban-task-dialog";
import KanbanDeleteDialog from "./kanban-delete-dialog";
import CreateProjectDialog from "./create-project-dialog";

export default function KanbanDeskBoard() {
  const {
    projects,
    currentProject,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    isTaskDialogOpen,
    setIsTaskDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    editingTask,
    deletingTask,
    draggedTask,
    dragOverColumn,
    isDragging,
    isCreateProjectDialogOpen,
    setIsCreateProjectDialogOpen,
    newProjectFormData,
    setNewProjectFormData,
    taskFormData,
    currentProjectTasks,
    handleSaveNewProject,
    handleSelectProject,
    toggleProjectPriority,
    handleAddTaskToColumn,
    handleAddTaskToDay,
    handleEditTask,
    handleDeleteTask,
    confirmDeleteTask,
    handleSaveTask,
    handleTaskFormChange,
    handleTaskSliderChange,
    addAssigneeToTask,
    removeAssigneeFromTask,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    // handleDropOnWeekColumn, // Not used currently
    handleUpdateTask,
  } = useKanbanBoard();

  const [visibleDaysCount, setVisibleDaysCount] = useState(5);

  // Wrapper function to match KanbanView interface
  const handleAddTaskWrapper = (columnId: TaskStatus) => {
    // This just opens the task dialog with the column pre-selected
    // The actual task creation happens when the user fills the form
    handleAddTaskToColumn(columnId, "");
  };

  return (
    <div className="flex h-full flex-col bg-[#0a0a0a] text-gray-100">
      <KanbanBoardHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isProjectSelected={!!currentProject}
        onTriggerCreateProject={() => setIsCreateProjectDialogOpen(true)}
        onCustomizeBoard={() => {
          /* TODO: Implementar customização */
        }}
      />
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "projectList" | "kanbanBoard" | "weekBoard")
        }
        className="flex h-full min-h-0 flex-1 flex-col"
      >
        <div className="shrink-0 px-0 md:px-0">
          <div className="mb-2 flex items-center justify-between px-2">
            <TabsList className="grid w-full max-w-lg grid-cols-3 border-white/10 bg-white/[0.05]">
              <TabsTrigger
                value="projectList"
                className="text-gray-400 data-[state=active]:bg-white/10 data-[state=active]:text-gray-100"
              >
                Meus Projetos
              </TabsTrigger>
              <TabsTrigger
                value="kanbanBoard"
                disabled={!currentProject}
                className="text-gray-400 data-[state=active]:bg-white/10 data-[state=active]:text-gray-100"
              >
                Quadro Kanban
              </TabsTrigger>
              <TabsTrigger
                value="weekBoard"
                disabled={!currentProject}
                className="text-gray-400 data-[state=active]:bg-white/10 data-[state=active]:text-gray-100"
              >
                Quadro Semanal
              </TabsTrigger>
            </TabsList>
            {activeTab === "weekBoard" && (
              <div className="ml-4 flex items-center gap-2">
                <Label htmlFor="days-select" className="text-sm text-gray-400">
                  Quantos dias mostrar?
                </Label>
                <Select
                  value={visibleDaysCount.toString()}
                  onValueChange={(v) => setVisibleDaysCount(Number.parseInt(v))}
                >
                  <SelectTrigger
                    id="days-select"
                    className="h-8 w-20 border-white/10 bg-white/[0.05] text-sm text-gray-100 hover:bg-white/[0.08]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#0a0a0a]">
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <SelectItem
                        key={num}
                        value={num.toString()}
                        className="text-gray-100 hover:bg-white/[0.08]"
                      >
                        {num} {num === 1 ? "dia" : "dias"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <TabsContent
          value="projectList"
          className="mt-2 h-full min-h-0 flex-1 overflow-hidden"
        >
          <ProjectListView
            projects={projects}
            onSelectProject={handleSelectProject}
            onTriggerCreateProject={() => setIsCreateProjectDialogOpen(true)}
            onToggleProjectPriority={toggleProjectPriority}
          />
        </TabsContent>
        <TabsContent value="kanbanBoard" className="mt-2 h-full min-h-0 flex-1">
          {currentProject ? (
            <KanbanView
              tasks={currentProjectTasks}
              searchQuery={searchQuery}
              onAddTask={handleAddTaskWrapper}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onDragStartTask={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              dragOverColumn={dragOverColumn}
              isDragging={isDragging}
              draggedTask={draggedTask}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-10 text-center">
              <Kanban className="mx-auto mb-6 h-24 w-24 text-gray-400 opacity-30" />
              <h2 className="mb-2 text-xl font-semibold text-white">
                Nenhum projeto selecionado
              </h2>
              <p className="mb-6 text-gray-400">
                Por favor, selecione um projeto na aba &quot;Meus Projetos&quot;
                ou crie um novo.
              </p>
              <Button
                onClick={() => setActiveTab("projectList")}
                className="border border-blue-500/50 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
              >
                Ver Projetos
              </Button>
            </div>
          )}
        </TabsContent>
        <TabsContent
          value="weekBoard"
          className="mt-2 h-full min-h-0 flex-1 overflow-hidden"
        >
          {currentProject ? (
            <KanbanWeekView
              tasks={currentProjectTasks}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onUpdateTask={handleUpdateTask}
              onAddTaskToDay={handleAddTaskToDay}
              visibleDaysCount={visibleDaysCount}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-10 text-center">
              <Kanban className="mx-auto mb-6 h-24 w-24 text-gray-400 opacity-30" />
              <h2 className="mb-2 text-xl font-semibold text-white">
                Nenhum projeto selecionado
              </h2>
              <p className="mb-6 text-gray-400">
                Por favor, selecione um projeto para visualizar o quadro
                semanal.
              </p>
              <Button
                onClick={() => setActiveTab("projectList")}
                className="border border-blue-500/50 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
              >
                Ver Projetos
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateProjectDialog
        isOpen={isCreateProjectDialogOpen}
        onOpenChange={setIsCreateProjectDialogOpen}
        formData={newProjectFormData}
        onFormChange={(field, value) =>
          setNewProjectFormData((prev) => ({ ...prev, [field]: value }))
        }
        onSave={handleSaveNewProject}
      />

      {currentProject && (
        <KanbanTaskDialog
          isOpen={isTaskDialogOpen}
          onOpenChange={setIsTaskDialogOpen}
          editingTask={editingTask}
          formData={taskFormData}
          onFormChange={handleTaskFormChange}
          onSliderChange={handleTaskSliderChange}
          onSaveTask={handleSaveTask}
          onAddAssignee={addAssigneeToTask}
          onRemoveAssignee={removeAssigneeFromTask}
          isWeekBoardActive={activeTab === "weekBoard"}
        />
      )}
      <KanbanDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        taskToDelete={deletingTask}
        onConfirmDelete={confirmDeleteTask}
      />
    </div>
  );
}
