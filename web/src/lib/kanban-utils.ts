import type { Task, TaskWeekDay } from "~/components/jarvis/kanban/lib/types";

export const DAYS_FILTER_KEY = "kanban-week-days-filter-v2";
export const MOBILE_COLUMN_KEY = "kanban-week-mobile-column-v2";

export interface WeekDayDefinition {
  id: TaskWeekDay;
  title: string;
  icon: string;
  color: string;
  progressColor: string;
}

export const getWeekDayDefinitions = (): WeekDayDefinition[] => [
  {
    id: "segunda" as TaskWeekDay,
    title: "Segunda",
    icon: "Calendar",
    color: "text-cyan-400",
    progressColor: "bg-cyan-500",
  },
  {
    id: "terca" as TaskWeekDay,
    title: "Terça",
    icon: "Clock",
    color: "text-yellow-400",
    progressColor: "bg-yellow-500",
  },
  {
    id: "quarta" as TaskWeekDay,
    title: "Quarta",
    icon: "Target",
    color: "text-purple-400",
    progressColor: "bg-purple-500",
  },
  {
    id: "quinta" as TaskWeekDay,
    title: "Quinta",
    icon: "Zap",
    color: "text-blue-400",
    progressColor: "bg-blue-500",
  },
  {
    id: "sexta" as TaskWeekDay,
    title: "Sexta",
    icon: "CheckCircle",
    color: "text-green-400",
    progressColor: "bg-green-500",
  },
  {
    id: "sabado" as TaskWeekDay,
    title: "Sábado",
    icon: "Sun",
    color: "text-orange-400",
    progressColor: "bg-orange-500",
  },
  {
    id: "domingo" as TaskWeekDay,
    title: "Domingo",
    icon: "Moon",
    color: "text-indigo-400",
    progressColor: "bg-indigo-500",
  },
];

export const getColumnsWithTasks = (
  tasks: Task[],
  visibleColumns: WeekDayDefinition[]
): Array<WeekDayDefinition & { tasks: Task[] }> => {
  return visibleColumns.map((colDef) => ({
    ...colDef,
    tasks: tasks.filter((task) => task.weekDay === colDef.id),
  }));
};

export const createTransparentDragImage = (): HTMLImageElement => {
  const dragImage = new Image();
  dragImage.src =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";
  return dragImage;
};

export const saveToLocalStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Failed to save to localStorage: ${key}`, error);
  }
};

export const getFromLocalStorage = (
  key: string,
  defaultValue: string
): string => {
  try {
    return localStorage.getItem(key) ?? defaultValue;
  } catch (error) {
    console.error(`Failed to get from localStorage: ${key}`, error);
    return defaultValue;
  }
};
