import { Task, ProjectList } from '../types';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

const STORAGE_KEY_LISTS = 'zendo_lists';
const STORAGE_KEY_TASKS = 'zendo_tasks';

export const storageService = {
  // --- TASKS ---

  fetchTasks: async (): Promise<Task[]> => {
    // FALLBACK: Use LocalStorage if Supabase is not configured to prevent errors
    if (!isSupabaseConfigured) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_TASKS);
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    }

    try {
      const { data, error } = await supabase
        .from('task')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching tasks:', error.message || error);
        return [];
      }

      // Map DB columns to Frontend Interface
      return (data || []).map((row: any) => ({
        id: row.id,
        content: row.title,           // Mapped content -> title
        isCompleted: row.is_completed,// Mapped isCompleted -> is_completed
        date: row.schedule,           // Mapped date -> schedule
        time: row.time,               
        listId: row.list_id,
        order: row.order_index
      }));
    } catch (e: any) {
      console.error("Unexpected error fetching tasks:", e.message || e);
      return [];
    }
  },

  addTask: async (task: Task) => {
    // FALLBACK
    if (!isSupabaseConfigured) {
      const tasks = JSON.parse(localStorage.getItem(STORAGE_KEY_TASKS) || '[]');
      tasks.push(task);
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
      return;
    }

    const { error } = await supabase.from('task').insert({
      id: task.id,
      title: task.content,
      is_completed: task.isCompleted,
      schedule: task.date || null, // send null if undefined
      time: task.time || null,
      list_id: task.listId || null,
      order_index: task.order
    });

    if (error) console.error('Error adding task:', error.message || error);
  },

  updateTask: async (task: Task) => {
    // FALLBACK
    if (!isSupabaseConfigured) {
      const tasks: Task[] = JSON.parse(localStorage.getItem(STORAGE_KEY_TASKS) || '[]');
      const index = tasks.findIndex(t => t.id === task.id);
      if (index !== -1) {
        tasks[index] = task;
        localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
      }
      return;
    }

    const { error } = await supabase.from('task').update({
      title: task.content,
      is_completed: task.isCompleted,
      schedule: task.date || null,
      time: task.time || null,
      list_id: task.listId || null,
      order_index: task.order
    }).eq('id', task.id);

    if (error) console.error('Error updating task:', error.message || error);
  },

  deleteTask: async (taskId: string) => {
    // FALLBACK
    if (!isSupabaseConfigured) {
      const tasks: Task[] = JSON.parse(localStorage.getItem(STORAGE_KEY_TASKS) || '[]');
      const newTasks = tasks.filter(t => t.id !== taskId);
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(newTasks));
      return;
    }

    const { error } = await supabase.from('task').delete().eq('id', taskId);
    if (error) console.error('Error deleting task:', error.message || error);
  },

  // --- LISTS (Keeping LocalStorage for simplicity as user only specified Task table) ---
  // If you want lists in Supabase, create a 'lists' table and replicate the logic above.

  loadLists: (): ProjectList[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LISTS);
      if (stored) return JSON.parse(stored);
      
      const defaults = [
        { id: 'list-1', title: 'Ideas', order: 0 },
        { id: 'list-2', title: 'Someday', order: 1 }
      ];
      localStorage.setItem(STORAGE_KEY_LISTS, JSON.stringify(defaults));
      return defaults;
    } catch (e) {
      return [];
    }
  },

  saveLists: (lists: ProjectList[]) => {
    localStorage.setItem(STORAGE_KEY_LISTS, JSON.stringify(lists));
  }
};