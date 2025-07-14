// Define Task type locally since types/tasks doesn't exist
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  day: string;
  isRunning: boolean;
  isFavorite: boolean;
  timeSpent: number;
}

export const defaultTasks: Task[] = [
  {
    id: "1",
    title: "Review monthly report",
    description: "Go through the monthly sales report",
    priority: "high",
    day: "monday",
    isRunning: false,
    isFavorite: false,
    timeSpent: 0,
  },
  {
    id: "2",
    title: "Team meeting",
    description: "Weekly sync with the team",
    priority: "medium",
    day: "tuesday",
    isRunning: false,
    isFavorite: false,
    timeSpent: 0,
  },
  {
    id: "3",
    title: "Code review",
    description: "Review pull requests",
    priority: "low",
    day: "wednesday",
    isRunning: false,
    isFavorite: false,
    timeSpent: 0,
  },
];