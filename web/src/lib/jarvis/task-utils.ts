import type React from "react";

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  assignee?: string;
  tags?: string[];
  priority?: "low" | "medium" | "high";
}

export interface TaskAction {
  id: string;
  label: string;
  description?: string;
  icon:
    | React.ComponentType<{ className?: string }>
    | (() => React.ReactElement);
  action?: () => void;
  hasSubmitButton?: boolean;
  isExpandable?: boolean;
  isExpanded?: boolean;
}

const TASKS_STORAGE_KEY = "jarvis-tasks";
const RECENT_TASKS_LIMIT = 5;

export const taskStorage = {
  getTasks: (): Task[] => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(TASKS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  saveTasks: (tasks: Task[]): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  },

  addTask: (task: Omit<Task, "id" | "createdAt">): Task => {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };
    const tasks = taskStorage.getTasks();
    tasks.unshift(newTask);
    taskStorage.saveTasks(tasks);
    return newTask;
  },

  updateTask: (id: string, updates: Partial<Task>): Task | null => {
    const tasks = taskStorage.getTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const existingTask = tasks[index];
    if (!existingTask) return null;
    tasks[index] = { ...existingTask, ...updates } as Task;
    taskStorage.saveTasks(tasks);
    return tasks[index];
  },

  deleteTask: (id: string): boolean => {
    const tasks = taskStorage.getTasks();
    const filtered = tasks.filter((t) => t.id !== id);
    if (filtered.length === tasks.length) return false;

    taskStorage.saveTasks(filtered);
    return true;
  },

  getRecentTasks: (limit: number = RECENT_TASKS_LIMIT): Task[] => {
    return taskStorage.getTasks().slice(0, limit);
  },

  completeTask: (id: string): Task | null => {
    return taskStorage.updateTask(id, {
      completed: true,
      completedAt: new Date(),
    });
  },

  uncompleteTask: (id: string): Task | null => {
    return taskStorage.updateTask(id, {
      completed: false,
      completedAt: undefined,
    });
  },
};

export const parseTaskInput = (input: string): Partial<Task> => {
  const assigneeMatch = /@(\w+)/.exec(input);
  const tagMatches = input.matchAll(/#(\w+)/g);

  let title = input;
  const assignee = assigneeMatch?.[1];
  const tags: string[] = [];

  if (assigneeMatch) {
    title = title.replace(assigneeMatch[0], "").trim();
  }

  for (const match of tagMatches) {
    if (match[1]) tags.push(match[1]);
    title = title.replace(match[0], "").trim();
  }

  return {
    title,
    assignee,
    tags: tags.length > 0 ? tags : undefined,
  };
};
