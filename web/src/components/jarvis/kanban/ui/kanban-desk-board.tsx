"use client"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Label } from "~/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Kanban } from "lucide-react"

import { useKanbanBoard } from "../hooks/use-kanban-board"
import KanbanBoardHeader from "./kanban-board-header"
import ProjectListView from "./project-list-view"
import KanbanView from "./kanban-view"
import KanbanWeekView from "./kanban-week-view"
import KanbanTaskDialog from "./kanban-task-dialog"
import KanbanDeleteDialog from "./kanban-delete-dialog"
import CreateProjectDialog from "./create-project-dialog"

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
  } = useKanbanBoard()

  const [visibleDaysCount, setVisibleDaysCount] = useState(5)

  return (
    <div className="bg-[#0a0a0a] text-gray-100 h-full flex flex-col">
      <KanbanBoardHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isProjectSelected={!!currentProject}
        onTriggerCreateProject={() => setIsCreateProjectDialogOpen(true)}
        onCustomizeBoard={() => {/* TODO: Implementar customização */}}
      />
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "projectList" | "kanbanBoard" | "weekBoard")} className="flex-1 flex flex-col h-full min-h-0">
        <div className="px-0 md:px-0 shrink-0">
          <div className="flex items-center justify-between px-2 mb-2">
            <TabsList className="grid w-full grid-cols-3 max-w-lg bg-white/[0.05] border-white/10">
              <TabsTrigger value="projectList" className="text-gray-400 data-[state=active]:bg-white/10 data-[state=active]:text-gray-100">
                Meus Projetos
              </TabsTrigger>
              <TabsTrigger value="kanbanBoard" disabled={!currentProject} className="text-gray-400 data-[state=active]:bg-white/10 data-[state=active]:text-gray-100">
                Quadro Kanban
              </TabsTrigger>
              <TabsTrigger value="weekBoard" disabled={!currentProject} className="text-gray-400 data-[state=active]:bg-white/10 data-[state=active]:text-gray-100">
                Quadro Semanal
              </TabsTrigger>
            </TabsList>
            {activeTab === "weekBoard" && (
              <div className="flex items-center gap-2 ml-4">
                <Label htmlFor="days-select" className="text-gray-400 text-sm">
                  Quantos dias mostrar?
                </Label>
                <Select
                  value={visibleDaysCount.toString()}
                  onValueChange={(v) => setVisibleDaysCount(Number.parseInt(v))}
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
            )}
          </div>
        </div>

        <TabsContent value="projectList" className="flex-1 mt-2 h-full min-h-0 overflow-hidden">
          <ProjectListView
            projects={projects}
            onSelectProject={handleSelectProject}
            onTriggerCreateProject={() => setIsCreateProjectDialogOpen(true)}
            onToggleProjectPriority={toggleProjectPriority}
          />
        </TabsContent>
        <TabsContent value="kanbanBoard" className="flex-1 mt-2 h-full min-h-0">
          {currentProject ? (
            <KanbanView
              tasks={currentProjectTasks}
              searchQuery={searchQuery}
              onAddTask={handleAddTaskToColumn}
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
            <div className="flex flex-col items-center justify-center h-full text-center p-10">
              <Kanban className="w-24 h-24 mx-auto mb-6 text-gray-400 opacity-30" />
              <h2 className="text-xl font-semibold text-white mb-2">Nenhum projeto selecionado</h2>
              <p className="text-gray-400 mb-6">
                Por favor, selecione um projeto na aba &quot;Meus Projetos&quot; ou crie um novo.
              </p>
              <Button onClick={() => setActiveTab("projectList")} className="bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30">Ver Projetos</Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="weekBoard" className="flex-1 mt-2 h-full min-h-0 overflow-hidden">
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
            <div className="flex flex-col items-center justify-center h-full text-center p-10">
              <Kanban className="w-24 h-24 mx-auto mb-6 text-gray-400 opacity-30" />
              <h2 className="text-xl font-semibold text-white mb-2">Nenhum projeto selecionado</h2>
              <p className="text-gray-400 mb-6">
                Por favor, selecione um projeto para visualizar o quadro semanal.
              </p>
              <Button onClick={() => setActiveTab("projectList")} className="bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30">Ver Projetos</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateProjectDialog
        isOpen={isCreateProjectDialogOpen}
        onOpenChange={setIsCreateProjectDialogOpen}
        formData={newProjectFormData}
        onFormChange={(field, value) => setNewProjectFormData((prev) => ({ ...prev, [field]: value }))}
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
  )
}
