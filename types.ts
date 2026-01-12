export interface Task {
  id: string;
  content: string;
  isCompleted: boolean;
  date?: string; // ISO date string YYYY-MM-DD for calendar tasks
  time?: string; // HH:mm string (24h)
  listId?: string; // ID for custom project lists
  order: number;
}

export interface ProjectList {
  id: string;
  title: string;
  order: number;
}

export interface DayColumnData {
  date: string; // ISO string
  label: string;
  isToday: boolean;
  isPast: boolean;
}

export type DragItemType = 'TASK' | 'LIST';
export type TimeBlock = 'morning' | 'evening';
