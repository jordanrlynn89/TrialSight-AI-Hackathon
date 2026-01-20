import React, { useState } from 'react';
import { Task, TaskPriority, TaskStatus } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ExternalLink, Clock, AlertCircle } from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  onAudit: (action: string, details: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onAudit }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const handleOpenGoogleCalendar = () => {
    onAudit('Navigation', 'Opened Google Calendar from Calendar View');
    window.open('https://calendar.google.com', '_blank');
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  // Generate calendar grid
  const days = [];
  // Empty slots for days before start of month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getTasksForDay = (day: number) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getDate() === day &&
        taskDate.getMonth() === currentDate.getMonth() &&
        taskDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const getPriorityColor = (p: TaskPriority) => {
    switch(p) {
      case TaskPriority.CRITICAL: return 'bg-red-100 text-red-800 border-l-4 border-l-red-500';
      case TaskPriority.HIGH: return 'bg-orange-100 text-orange-800 border-l-4 border-l-orange-500';
      case TaskPriority.MEDIUM: return 'bg-yellow-100 text-yellow-800 border-l-4 border-l-yellow-500';
      default: return 'bg-blue-100 text-blue-800 border-l-4 border-l-blue-500';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-md shadow-sm transition-all text-slate-600">
              <ChevronLeft size={20} />
            </button>
            <span className="px-4 font-bold text-slate-800 w-32 text-center select-none">
              {monthName} {year}
            </span>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-md shadow-sm transition-all text-slate-600">
              <ChevronRight size={20} />
            </button>
          </div>
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Today
          </button>
        </div>

        <button 
          onClick={handleOpenGoogleCalendar}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors shadow-sm"
        >
          <CalendarIcon size={18} className="text-brand-600" />
          <span>Open Google Calendar</span>
          <ExternalLink size={14} className="text-slate-400" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
          {days.map((day, index) => {
            const dayTasks = day ? getTasksForDay(day) : [];
            const isToday = day === new Date().getDate() && 
                            currentDate.getMonth() === new Date().getMonth() && 
                            currentDate.getFullYear() === new Date().getFullYear();

            return (
              <div 
                key={index} 
                className={`min-h-[120px] border-b border-r border-slate-100 p-2 transition-colors hover:bg-slate-50 ${!day ? 'bg-slate-50/50' : ''}`}
              >
                {day && (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`
                        w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium
                        ${isToday ? 'bg-brand-600 text-white' : 'text-slate-700'}
                      `}>
                        {day}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                          {dayTasks.length} tasks
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1.5 overflow-y-auto max-h-[100px] custom-scrollbar">
                      {dayTasks.map(task => (
                        <div 
                          key={task.id}
                          className={`text-[10px] p-1.5 rounded border-l-2 truncate cursor-pointer hover:opacity-80 flex items-center gap-1.5 shadow-sm
                            ${task.status === TaskStatus.DONE ? 'bg-slate-100 text-slate-500 border-slate-300 line-through' : getPriorityColor(task.priority)}
                          `}
                          title={task.title}
                        >
                          {task.priority === 'Critical' && <AlertCircle size={10} className="shrink-0" />}
                          <span className="truncate">{task.title}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
