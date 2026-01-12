import { Task, ProjectList } from '../types';

/**
 * DATABASE CONNECTION INSTRUCTIONS (Supabase)
 * 
 * 1. Install supabase-js: npm install @supabase/supabase-js
 * 2. Create a 'supabaseClient.ts' file:
 *    import { createClient } from '@supabase/supabase-js';
 *    export const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_KEY);
 * 
 * 3. Replace the functions below with async Supabase calls:
 *    - loadTasks: const { data } = await supabase.from('tasks').select('*');
 *    - saveTask: await supabase.from('tasks').upsert(task);
 *    - etc.
 * 
 * This file currently uses LocalStorage for immediate demo functionality.
 */

const STORAGE_KEY_TASKS = 'zendo_tasks';
const STORAGE_KEY_LISTS = 'zendo_lists';

export const storageService = {
  loadTasks: (): Task[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TASKS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load tasks", e);
      return [];
    }
  },

  saveTasks: (tasks: Task[]) => {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  },

  loadLists: (): ProjectList[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LISTS);
      if (stored) return JSON.parse(stored);
      
      // Default lists if empty
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