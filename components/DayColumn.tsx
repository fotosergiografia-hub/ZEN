import React, { useState } from 'react';
import { Task, DayColumnData, ProjectList, TimeBlock } from '../types';
import { TaskItem } from './TaskItem';
import { audioService } from '../services/audioService';

interface DayColumnProps {
  dayInfo: DayColumnData;
  tasks: Task[];
  lists: ProjectList[];
  onAddTask: (content: string, date: string, time?: string, listId?: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (id: string, content: string) => void;
  onDropTask: (taskId: string, targetDate: string, timeBlock?: TimeBlock) => void;
}

export const DayColumn: React.FC<DayColumnProps> = ({
  dayInfo,
  tasks,
  lists,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdateTask,
  onDropTask,
}) => {
  const [newTaskInput, setNewTaskInput] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [dragOverBlock, setDragOverBlock] = useState<TimeBlock | null>(null);

  const handleAddTask = () => {
    if (newTaskInput.trim()) {
      // If user selected a specific time, use it. 
      // If user selected no time, but input was in "Evening" context? 
      // For now, simpler to just rely on the explicit time input.
      onAddTask(newTaskInput.trim(), dayInfo.date, selectedTime || undefined, selectedListId || undefined);
      setNewTaskInput('');
      setSelectedTime('');
      setSelectedListId('');
      setIsInputFocused(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  const handleDrop = (e: React.DragEvent, block: TimeBlock) => {
    e.preventDefault();
    setDragOverBlock(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onDropTask(taskId, dayInfo.date, block);
      audioService.play('DRAG_END');
    }
  };

  // Format date display
  const dateObj = new Date(dayInfo.date);
  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(dateObj);
  const dateNum = new Intl.DateTimeFormat('en-US', { month: 'numeric', day: 'numeric' }).format(dateObj);

  // Split tasks into Morning (07:00 - 13:59) and Evening (14:00 - 21:00+)
  // If no time is set, default to morning for now unless moved explicitly
  const morningTasks = tasks.filter(t => !t.time || parseInt(t.time.split(':')[0]) < 14);
  const eveningTasks = tasks.filter(t => t.time && parseInt(t.time.split(':')[0]) >= 14);

  return (
    <div className={`
      flex-1 min-w-[300px] md:min-w-0 flex flex-col h-full
      border-r border-white/5 last:border-r-0
      transition-colors duration-300
      ${dayInfo.isToday ? 'bg-white/[0.02]' : ''}
    `}>
      {/* Header */}
      <div className={`
        p-4 border-b border-white/5 text-center
        ${dayInfo.isToday ? 'text-neon-blue font-medium drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]' : 'text-subtle'}
        ${dayInfo.isPast ? 'opacity-40' : ''}
      `}>
        <div className="text-lg tracking-tight font-normal">{dayName}</div>
        <div className="text-xs mt-1 font-light opacity-70">{dateNum}</div>
      </div>

      {/* Task Input Area */}
      <div className="px-3 py-3 border-b border-white/5 bg-slate-900/50">
        <input
          type="text"
          value={newTaskInput}
          onChange={(e) => setNewTaskInput(e.target.value)}
          onFocus={() => setIsInputFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Add a task..."
          className="w-full text-sm font-light bg-transparent text-ink placeholder-subtle/50 py-1 focus:placeholder-ink/50 transition-colors"
        />
        
        {/* Expanded Options when focused or has content */}
        {(isInputFocused || newTaskInput) && (
          <div className="flex items-center gap-2 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <input 
              type="time" 
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="bg-white/5 text-xs text-ink rounded px-2 py-1 border border-white/10 focus:border-neon-blue/50"
            />
            <select
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="bg-white/5 text-xs text-ink rounded px-2 py-1 border border-white/10 focus:border-neon-blue/50 max-w-[100px]"
            >
              <option value="">No Project</option>
              {lists.map(l => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
            <div className="flex-1"></div>
            <button 
              onClick={handleAddTask}
              className="text-xs bg-neon-blue/20 text-neon-blue px-2 py-1 rounded hover:bg-neon-blue/30"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Morning Block */}
      <div 
        onDragOver={(e) => { e.preventDefault(); setDragOverBlock('morning'); }}
        onDragLeave={() => setDragOverBlock(null)}
        onDrop={(e) => handleDrop(e, 'morning')}
        className={`
          flex-1 overflow-y-auto px-2 py-2 scrollbar-thin flex flex-col gap-1
          transition-colors duration-200 border-b border-white/5 border-dashed
          ${dragOverBlock === 'morning' ? 'bg-neon-blue/5' : ''}
        `}
      >
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="w-1.5 h-1.5 rounded-full bg-neon-blue shadow-[0_0_5px_rgba(34,211,238,0.5)]"></div>
          <span className="text-[10px] uppercase tracking-widest text-subtle font-medium">Morning (7AM - 2PM)</span>
        </div>
        {morningTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            project={lists.find(l => l.id === task.listId)}
            onToggle={onToggleTask}
            onDelete={onDeleteTask}
            onContentChange={onUpdateTask}
          />
        ))}
      </div>

      {/* Evening Block */}
      <div 
        onDragOver={(e) => { e.preventDefault(); setDragOverBlock('evening'); }}
        onDragLeave={() => setDragOverBlock(null)}
        onDrop={(e) => handleDrop(e, 'evening')}
        className={`
          flex-1 overflow-y-auto px-2 py-2 scrollbar-thin flex flex-col gap-1
          transition-colors duration-200
          ${dragOverBlock === 'evening' ? 'bg-neon-pink/5' : ''}
        `}
      >
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="w-1.5 h-1.5 rounded-full bg-neon-pink shadow-[0_0_5px_rgba(232,121,249,0.5)]"></div>
          <span className="text-[10px] uppercase tracking-widest text-subtle font-medium">Evening (2PM - 9PM)</span>
        </div>
        {eveningTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            project={lists.find(l => l.id === task.listId)}
            onToggle={onToggleTask}
            onDelete={onDeleteTask}
            onContentChange={onUpdateTask}
          />
        ))}
      </div>
    </div>
  );
};