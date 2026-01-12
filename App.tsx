import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Task, ProjectList, DayColumnData, TimeBlock } from './types';
import { DayColumn } from './components/DayColumn';
import { ProjectSection } from './components/ProjectSection';
import { MonthCalendar } from './components/MonthCalendar';
import { storageService } from './services/storageService';
import { WEEK_DAYS } from './constants';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<ProjectList[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());
  const [todayDateFormatted, setTodayDateFormatted] = useState('');

  // --- Initialization ---
  useEffect(() => {
    const now = new Date();
    
    // Format Header Date
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    setTodayDateFormatted(now.toLocaleDateString('en-US', options));

    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);

    // Initial Load
    const loadData = async () => {
      const loadedTasks = await storageService.fetchTasks();
      setTasks(loadedTasks);
      setLists(storageService.loadLists());
    };
    loadData();
  }, []);

  // Removed useEffect for saving tasks to avoid overwriting DB on load or creating loops.
  // We now use explicit CRUD calls in handlers.

  useEffect(() => {
    if (lists.length > 0) storageService.saveLists(lists);
  }, [lists]);

  // --- Helpers ---
  const getWeekDays = useCallback(() => {
    const days: DayColumnData[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < WEEK_DAYS; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      const isoDate = d.toISOString().split('T')[0];
      
      days.push({
        date: isoDate,
        label: d.toLocaleDateString('en-US', { weekday: 'long' }),
        isToday: isoDate === todayStr,
        isPast: isoDate < todayStr
      });
    }
    return days;
  }, [currentWeekStart]);

  // --- Task Actions (Optimistic UI + DB Sync) ---
  
  const addTask = (content: string, dateOrListId: string, time?: string, listId?: string) => {
    const isDate = dateOrListId.match(/^\d{4}-\d{2}-\d{2}$/);
    
    const newTask: Task = {
      id: uuidv4(),
      content,
      isCompleted: false,
      date: isDate ? dateOrListId : undefined,
      listId: listId || (isDate ? undefined : dateOrListId),
      time: time,
      order: Date.now(),
    };
    
    // Optimistic Update
    setTasks(prev => [...prev, newTask]);
    
    // DB Sync
    storageService.addTask(newTask);
  };

  const toggleTask = (id: string) => {
    // Find task to update for DB
    const taskToUpdate = tasks.find(t => t.id === id);
    
    // Optimistic Update
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, isCompleted: !t.isCompleted } : t
    ));

    // DB Sync
    if (taskToUpdate) {
      storageService.updateTask({ ...taskToUpdate, isCompleted: !taskToUpdate.isCompleted });
    }
  };

  const deleteTask = (id: string) => {
    // Optimistic Update
    setTasks(prev => prev.filter(t => t.id !== id));
    
    // DB Sync
    storageService.deleteTask(id);
  };

  const updateTask = (id: string, content: string) => {
    const taskToUpdate = tasks.find(t => t.id === id);

    setTasks(prev => prev.map(t => t.id === id ? { ...t, content } : t));

    if (taskToUpdate) {
      storageService.updateTask({ ...taskToUpdate, content });
    }
  };

  const moveTask = (taskId: string, destinationId: string, timeBlock?: TimeBlock) => {
    const isDate = destinationId.match(/^\d{4}-\d{2}-\d{2}$/);
    
    let updatedTask: Task | null = null;

    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      
      const updates: Partial<Task> = {
        date: isDate ? destinationId : undefined,
        listId: isDate ? t.listId : destinationId
      };

      if (isDate && timeBlock) {
        if (timeBlock === 'morning') {
           const currentHour = t.time ? parseInt(t.time.split(':')[0]) : 9;
           if (currentHour >= 14) {
             updates.time = '09:00';
           } else if (!t.time) {
             updates.time = '09:00';
           }
        } else if (timeBlock === 'evening') {
           const currentHour = t.time ? parseInt(t.time.split(':')[0]) : 9;
           if (currentHour < 14) {
             updates.time = '14:00';
           } else if (!t.time) {
             updates.time = '16:00';
           }
        }
      }

      if (!isDate) {
        updates.date = undefined;
        updates.time = undefined;
      }

      updatedTask = { ...t, ...updates };
      return updatedTask;
    }));

    // DB Sync
    // We use setTimeout to allow the state to settle or just fire it, 
    // but since we captured 'updatedTask' in the closure, we can send it.
    if (updatedTask) {
      storageService.updateTask(updatedTask);
    }
  };

  // --- List Actions (Still LocalStorage for now) ---
  const addList = (title: string) => {
    const newList: ProjectList = {
      id: uuidv4(),
      title,
      order: lists.length
    };
    setLists(prev => [...prev, newList]);
  };

  const deleteList = (id: string) => {
    setLists(prev => prev.filter(l => l.id !== id));
    // When deleting a list, we should probably update tasks in that list to have no listId
    // But for now, we just remove them from view or keep them?
    // Let's clear the listId for tasks in that list in DB
    const tasksInList = tasks.filter(t => t.listId === id);
    tasksInList.forEach(t => {
      storageService.updateTask({ ...t, listId: undefined });
    });
    setTasks(prev => prev.map(t => t.listId === id ? { ...t, listId: undefined } : t));
  };

  // --- Special Features ---
  
  const pushUnfinishedToToday = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updates: Task[] = [];

    setTasks(prev => prev.map(t => {
      if (t.date && t.date < todayStr && !t.isCompleted) {
        const updated = { ...t, date: todayStr };
        updates.push(updated);
        return updated;
      }
      return t;
    }));

    // Batch update DB
    updates.forEach(t => storageService.updateTask(t));
  };

  const hasUnfinishedPastTasks = tasks.some(t => {
    const todayStr = new Date().toISOString().split('T')[0];
    return t.date && t.date < todayStr && !t.isCompleted;
  });

  return (
    <div className="min-h-screen flex flex-col font-sans text-ink selection:bg-neon-pink selection:text-white">
      {/* Top Bar / Navigation */}
      <header className="px-6 py-8 flex flex-col md:flex-row justify-between items-center border-b border-white/5 bg-gradient-to-b from-black/40 to-transparent">
        <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
          <div className="flex items-baseline space-x-3">
             <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
              Zen<span className="text-neon-blue">Do</span>
            </h1>
            <span className="text-sm font-light text-white/80">{todayDateFormatted}</span>
          </div>
        </div>

        {hasUnfinishedPastTasks && (
          <button 
            onClick={pushUnfinishedToToday}
            className="text-xs bg-neon-pink/10 border border-neon-pink/50 text-neon-pink px-4 py-1.5 rounded-sm hover:bg-neon-pink/20 transition-all shadow-neon-pink"
          >
            Push incomplete to Today ↵
          </button>
        )}
      </header>

      {/* Week View */}
      <div className="flex-1 flex flex-col md:flex-row overflow-x-auto bg-black/10 backdrop-blur-sm">
        {getWeekDays().map(day => (
          <DayColumn
            key={day.date}
            dayInfo={day}
            tasks={tasks.filter(t => t.date === day.date)}
            lists={lists} 
            onAddTask={addTask}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
            onUpdateTask={updateTask}
            onDropTask={moveTask}
          />
        ))}
      </div>

      {/* Projects View */}
      <ProjectSection 
        lists={lists}
        tasks={tasks}
        onAddList={addList}
        onDeleteList={deleteList}
        onAddTask={addTask}
        onToggleTask={toggleTask}
        onDeleteTask={deleteTask}
        onUpdateTask={updateTask}
        onDropTask={moveTask}
      />
      
      {/* Footer / Monthly Planning */}
      <div className="border-t border-white/5 bg-black/30 pb-10">
        <MonthCalendar tasks={tasks} onAddTask={addTask} />
      </div>
    </div>
  );
};

export default App;