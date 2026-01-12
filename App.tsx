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
    // Determine the Monday of the current week
    const now = new Date();
    
    // Format Header Date
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    setTodayDateFormatted(now.toLocaleDateString('en-US', options));

    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);

    setTasks(storageService.loadTasks());
    setLists(storageService.loadLists());
  }, []);

  // --- Persistence ---
  useEffect(() => {
    if (tasks.length > 0) storageService.saveTasks(tasks);
  }, [tasks]);

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

  // --- Task Actions ---
  const addTask = (content: string, dateOrListId: string, time?: string, listId?: string) => {
    const isDate = dateOrListId.match(/^\d{4}-\d{2}-\d{2}$/);
    
    // Automatic logic: If specific time chosen, use it.
    // If user adds to "Project List" directly (ProjectSection), date is undefined.
    
    const newTask: Task = {
      id: uuidv4(),
      content,
      isCompleted: false,
      date: isDate ? dateOrListId : undefined,
      listId: listId || (isDate ? undefined : dateOrListId), // If first arg is listId, use it. If arg 4 is provided, use that.
      time: time,
      order: Date.now(),
    };
    
    setTasks(prev => [...prev, newTask]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, isCompleted: !t.isCompleted } : t
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const updateTask = (id: string, content: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, content } : t));
  };

  const moveTask = (taskId: string, destinationId: string, timeBlock?: TimeBlock) => {
    const isDate = destinationId.match(/^\d{4}-\d{2}-\d{2}$/);
    
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      
      const updates: Partial<Task> = {
        date: isDate ? destinationId : undefined,
        listId: isDate ? t.listId : destinationId // Keep existing listId if moving between days, else set to new list
      };

      // Handle dragging to specific Morning/Evening blocks
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

      // If moving to a Project List (not date), clear the date and time
      if (!isDate) {
        updates.date = undefined;
        updates.time = undefined;
      }

      return { ...t, ...updates };
    }));
  };

  // --- List Actions ---
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
    setTasks(prev => prev.map(t => t.listId === id ? { ...t, listId: undefined } : t));
  };

  // --- Special Features ---
  
  const pushUnfinishedToToday = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setTasks(prev => prev.map(t => {
      if (t.date && t.date < todayStr && !t.isCompleted) {
        return { ...t, date: todayStr };
      }
      return t;
    }));
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
            lists={lists} // Pass lists for dropdown
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