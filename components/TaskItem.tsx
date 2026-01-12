import React, { useState, useRef } from 'react';
import { Task, ProjectList } from '../types';
import { audioService } from '../services/audioService';

interface TaskItemProps {
  task: Task;
  project?: ProjectList; // Pass the linked project info
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onContentChange: (id: string, newContent: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, project, onToggle, onDelete, onContentChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioService.play('CHECK');
    onToggle(task.id);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
    audioService.play('DRAG_START');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
    }
  };

  return (
    <div
      draggable={!isEditing}
      onDragStart={handleDragStart}
      className={`
        group relative flex items-start py-2 px-2 mb-2
        transition-all duration-300 ease-out
        border border-transparent hover:border-white/10 hover:bg-white/5 rounded-md
        cursor-grab active:cursor-grabbing
        ${task.isCompleted ? 'opacity-40' : 'opacity-100'}
      `}
    >
      {/* Custom Neon Checkbox */}
      <button
        onClick={handleToggle}
        className={`
          flex-shrink-0 w-4 h-4 mr-3 mt-1 rounded-full border 
          transition-all duration-200 flex items-center justify-center
          ${task.isCompleted 
            ? 'bg-neon-green/20 border-neon-green text-neon-green shadow-neon' 
            : 'border-slate-600 hover:border-neon-blue hover:shadow-neon'}
        `}
      >
        {task.isCompleted && (
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content & Metadata */}
      <div className="flex-grow min-w-0 flex flex-col">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={task.content}
            onChange={(e) => onContentChange(task.id, e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full bg-transparent text-sm text-ink focus:outline-none font-light"
          />
        ) : (
          <div onClick={() => setIsEditing(true)}>
            <span className={`
              block w-full text-sm font-light text-ink truncate select-none
              transition-all duration-300
              ${task.isCompleted ? 'line-through text-subtle' : ''}
            `}>
              {task.content}
            </span>
            
            {/* Metadata Row */}
            <div className="flex items-center gap-2 mt-1">
              {task.time && (
                <span className="text-[10px] tracking-wide font-mono text-neon-blue/80 bg-neon-blue/10 px-1 rounded">
                  {task.time}
                </span>
              )}
              {project && (
                <span className="text-[10px] uppercase tracking-wider text-neon-pink/80 border border-neon-pink/20 px-1 rounded">
                  {project.title}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Action */}
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 ml-2 text-subtle hover:text-red-400 transition-opacity"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};