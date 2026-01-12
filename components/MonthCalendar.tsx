import React, { useState } from 'react';
import { Task } from '../types';

interface MonthCalendarProps {
  tasks: Task[];
  onAddTask: (content: string, date: string) => void;
}

export const MonthCalendar: React.FC<MonthCalendarProps> = ({ tasks, onAddTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [taskInput, setTaskInput] = useState('');

  // Calendar Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  
  // Adjust for Monday start (Zen work week)
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (selectedDate === dateStr) {
      setSelectedDate(null); // Deselect
    } else {
      setSelectedDate(dateStr);
      setTaskInput('');
    }
  };

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskInput.trim() && selectedDate) {
      onAddTask(taskInput.trim(), selectedDate);
      setTaskInput('');
      // Keep date selected to add more, or deselect? Let's keep selected for flow.
    }
  };

  const renderDays = () => {
    const days = [];
    // Empty padding for start of month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasTasks = tasks.some(t => t.date === dateStr && !t.isCompleted);
      const isSelected = selectedDate === dateStr;
      const isToday = dateStr === new Date().toISOString().split('T')[0];

      days.push(
        <div 
          key={day}
          onClick={() => handleDayClick(day)}
          className={`
            h-10 flex flex-col items-center justify-center relative cursor-pointer rounded
            transition-all duration-200
            ${isSelected ? 'bg-neon-blue/20 text-neon-blue font-bold shadow-neon' : 'hover:bg-white/10 text-white/80'}
            ${isToday ? 'border border-neon-pink/50' : ''}
          `}
        >
          <span className="text-xs z-10">{day}</span>
          {hasTasks && (
            <div className="w-1 h-1 rounded-full bg-neon-pink mt-1 shadow-[0_0_4px_rgba(252,165,165,0.8)]"></div>
          )}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="max-w-md mx-auto mt-12 mb-20 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-crystal">
      <div className="flex justify-between items-center mb-6">
        <button onClick={handlePrevMonth} className="text-white/50 hover:text-white transition-colors">&lt;</button>
        <h3 className="text-sm font-medium uppercase tracking-widest text-white/90">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={handleNextMonth} className="text-white/50 hover:text-white transition-colors">&gt;</button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2 text-center">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-[10px] text-white/40 font-bold">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-6">
        {renderDays()}
      </div>

      {/* Input Area for Selected Date */}
      <div className={`
        overflow-hidden transition-all duration-300 ease-in-out
        ${selectedDate ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}
      `}>
        {selectedDate && (
          <div className="bg-black/20 rounded-lg p-3 border border-white/5">
            <div className="text-[10px] text-neon-blue mb-2 uppercase tracking-wide">
              Planning for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            <form onSubmit={handleSubmitTask} className="flex gap-2">
              <input 
                autoFocus
                type="text" 
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Add future task..."
                className="flex-1 bg-transparent text-sm text-white focus:outline-none border-b border-white/20 focus:border-neon-blue/50 pb-1"
              />
              <button 
                type="submit"
                className="text-xs text-neon-blue hover:text-white transition-colors"
              >
                +
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};