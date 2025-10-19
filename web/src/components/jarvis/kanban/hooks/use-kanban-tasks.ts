"use client";

import { useState, useCallback, useMemo } from "react";
import type {
  Task,
  Project,
  TaskStatus,
  TaskWeekDay,
  Assignee,
} from "../lib/types";
import { deepEqual } from "~/lib/deep-equal";
import {
  createTask,
  updateTaskInList,
  removeTaskFromList,
  filterTasksByQuery,
  formatTaskDate,
  createRandomAssignee,
  getDefaultTaskFormData,
} from "~/lib/kanban-operations";

export function useKanbanTasks(
  currentProject: Project | null,
  tasksByProject: { [projectId: string]: Task[] },
  setTasksByProject: React.Dispatch<
    React.SetStateAction<{ [projectId: string]: Task[] }>
  >
) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [taskFormData, setTaskFormData] = useState(getDefaultTaskFormData());

  // Filtered tasks for current project
  const currentProjectTasks = useMemo(() => {
    if (!currentProject) return [];
    const tasks = tasksByProject[currentProject.id] || [];
    return filterTasksByQuery(tasks, searchQuery);
  }, [currentProject, tasksByProject, searchQuery]);

  // Reset task form
  const resetTaskForm = useCallback(() => {
    setTaskFormData(getDefaultTaskFormData());
  }, []);

  // Update existing task
  const handleUpdateTask = useCallback(
    (updatedTask: Task) => {
      if (!currentProject) return;
      setTasksByProject((prev) => {
        const projectTasks = prev[currentProject.id] || [];
        // Check if task actually changed to avoid duplication
        const existingTask = projectTasks.find(
          (task) => task.id === updatedTask.id
        );
        if (existingTask && deepEqual(existingTask, updatedTask)) {
          return prev; // Don't update if task hasn't changed
        }
        const updatedTasks = updateTaskInList(projectTasks, updatedTask);
        return { ...prev, [currentProject.id]: updatedTasks };
      });
    },
    [currentProject, setTasksByProject]
  );

  // Add task to column
  const handleAddTaskToColumn = useCallback(
    (columnId: TaskStatus) => {
      if (!currentProject) return;
      setEditingTask(null);
      resetTaskForm();
      setTaskFormData((prev) => ({
        ...prev,
        status: columnId,
        weekDay: "none",
      }));
      setIsTaskDialogOpen(true);
    },
    [currentProject, resetTaskForm]
  );

  // Add task to day
  const handleAddTaskToDay = useCallback(
    (day: TaskWeekDay) => {
      if (!currentProject || !day) return;
      setEditingTask(null);
      resetTaskForm();
      setTaskFormData((prev) => ({
        ...prev,
        weekDay: day,
        status: "not-started",
      }));
      setIsTaskDialogOpen(true);
    },
    [currentProject, resetTaskForm]
  );

  // Edit task
  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setTaskFormData({
      title: task.title,
      description: task.description || "",
      date: task.date,
      progress: [task.progress],
      assignees: task.assignees,
      status: task.status,
      weekDay: task.weekDay || "none",
    });
    setIsTaskDialogOpen(true);
  }, []);

  // Delete task
  const handleDeleteTask = useCallback((task: Task) => {
    setDeletingTask(task);
    setIsDeleteDialogOpen(true);
  }, []);

  // Confirm delete
  const confirmDeleteTask = useCallback(() => {
    if (deletingTask && currentProject) {
      setTasksByProject((prev) => ({
        ...prev,
        [currentProject.id]: removeTaskFromList(
          prev[currentProject.id] || [],
          deletingTask.id
        ),
      }));
      setDeletingTask(null);
      setIsDeleteDialogOpen(false);
    }
  }, [deletingTask, currentProject, setTasksByProject]);

  // Save task
  const handleSaveTask = useCallback(() => {
    if (!taskFormData.title.trim() || !currentProject) return;

    const taskToSave = createTask(
      currentProject.id,
      taskFormData.title,
      taskFormData.description,
      taskFormData.status,
      taskFormData.weekDay === "none" ? undefined : taskFormData.weekDay,
      editingTask || undefined
    );

    // Apply form data to the task
    taskToSave.progress = taskFormData.progress[0] ?? 0;
    taskToSave.assignees = taskFormData.assignees;
    if (taskFormData.date) {
      taskToSave.date = formatTaskDate(taskFormData.date);
    }

    if (editingTask) {
      handleUpdateTask(taskToSave);
    } else {
      setTasksByProject((prev) => ({
        ...prev,
        [currentProject.id]: [taskToSave, ...(prev[currentProject.id] || [])],
      }));
    }
    setIsTaskDialogOpen(false);
    resetTaskForm();
    setEditingTask(null);
  }, [
    taskFormData,
    currentProject,
    editingTask,
    handleUpdateTask,
    setTasksByProject,
    resetTaskForm,
  ]);

  // Handle form changes
  const handleTaskFormChange = useCallback(
    (
      field: keyof typeof taskFormData,
      value: string | TaskWeekDay | TaskStatus | Assignee[]
    ) => {
      setTaskFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleTaskSliderChange = useCallback((value: number[]) => {
    setTaskFormData((prev) => ({ ...prev, progress: value }));
  }, []);

  const addAssigneeToTask = useCallback(() => {
    const newAssignee = createRandomAssignee();
    if (!taskFormData.assignees.find((a) => a.name === newAssignee.name)) {
      setTaskFormData((prev) => ({
        ...prev,
        assignees: [...prev.assignees, newAssignee],
      }));
    }
  }, [taskFormData.assignees]);

  const removeAssigneeFromTask = useCallback((index: number) => {
    setTaskFormData((prev) => ({
      ...prev,
      assignees: prev.assignees.filter((_, i) => i !== index),
    }));
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    isTaskDialogOpen,
    setIsTaskDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    editingTask,
    deletingTask,
    taskFormData,
    currentProjectTasks,
    resetTaskForm,
    handleUpdateTask,
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
  };
}
