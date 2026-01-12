import React, { useState } from 'react';
import { Task, ProjectList } from '../types';
import { TaskItem } from './TaskItem';
import { audioService } from '../services/audioService';

interface ProjectSectionProps {
  lists: ProjectList[];
  tasks: Task[];
  onAddList: (title: string) => void;
  onDeleteList: (id: string) => void;
  onAddTask: (content: string, listId: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (id: string, content: string) => void;
  onDropTask: (taskId: string, listId: string) => void;
}

export const ProjectSection: React.FC<ProjectSectionProps> = ({
  lists,
  tasks,
  onAddList,
  onDeleteList,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdateTask,
  onDropTask
}) => {
  const [newListTitle, setNewListTitle] = useState('');

  const handleAddList = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListTitle.trim()) {
      onAddList(newListTitle.trim());
      setNewListTitle('');
    }
  };

  return (
    <div className="mt-12 px-6 pb-20 border-t border-white/5 pt-8 bg-black/20">
      <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-2">
        <h2 className="text-sm uppercase tracking-widest text-subtle font-medium">Projects & Lists</h2>
        <form onSubmit={handleAddList} className="flex">
          <input
            type="text"
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            placeholder="+ New Project"
            className="text-xs bg-transparent text-right focus:outline-none text-subtle hover:text-neon-green transition-colors placeholder-subtle/30"
          />
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {lists.map((list) => (
          <SingleProjectList
            key={list.id}
            list={list}
            tasks={tasks.filter(t => t.listId === list.id && !t.date)} // Only show tasks that are NOT scheduled
            onDeleteList={onDeleteList}
            onAddTask={onAddTask}
            onToggleTask={onToggleTask}
            onDeleteTask={onDeleteTask}
            onUpdateTask={onUpdateTask}
            onDropTask={onDropTask}
          />
        ))}
      </div>
    </div>
  );
};

const SingleProjectList: React.FC<any> = ({ list, tasks, onDeleteList, onAddTask, onToggleTask, onDeleteTask, onUpdateTask, onDropTask }) => {
  const [input, setInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onDropTask(taskId, list.id);
      audioService.play('DRAG_END');
    }
  };

  return (
    <div 
      className={`
        flex flex-col rounded-lg transition-colors duration-300 min-h-[200px] border border-transparent
        ${isDragOver ? 'bg-white/5 border-white/10' : ''}
      `}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="flex justify-between items-center mb-3 group">
        <h3 className="font-medium text-ink/80">{list.title}</h3>
        <button onClick={() => onDeleteList(list.id)} className="opacity-0 group-hover:opacity-100 text-subtle hover:text-red-400">
          ×
        </button>
      </div>
      
      {tasks.map((task: Task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggleTask}
          onDelete={onDeleteTask}
          onContentChange={onUpdateTask}
        />
      ))}

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && input.trim()) {
            onAddTask(input.trim(), list.id);
            setInput('');
          }
        }}
        placeholder="Add item..."
        className="mt-2 text-sm italic text-subtle/50 bg-transparent focus:outline-none hover:text-subtle"
      />
    </div>
  );
};