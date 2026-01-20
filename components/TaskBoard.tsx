
import React, { useState } from 'react';
import { Task, TaskPriority, TaskStatus } from '../types';
import { Calendar, Mail, CheckCircle, Clock, AlertOctagon, Sparkles } from 'lucide-react';
import { generateEmailDraft } from '../services/geminiService';

interface TaskBoardProps {
  tasks: Task[];
  trialName: string;
  onUpdateTask: (taskId: string, status: TaskStatus) => void;
  onAudit: (action: string, details: string) => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, trialName, onUpdateTask, onAudit }) => {
  const [activeTab, setActiveTab] = useState<TaskStatus | 'ALL'>('ALL');
  const [generatingDraft, setGeneratingDraft] = useState<string | null>(null);

  const filteredTasks = activeTab === 'ALL' ? tasks : tasks.filter(t => t.status === activeTab);

  const handleCreateCalendar = (task: Task) => {
    // Format dates for Google Calendar URL (YYYYMMDDTHHmmSSZ)
    const startDate = new Date(task.dueDate);
    // Default to 1 hour duration
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const formatDateForGoogle = (date: Date) => {
       // Remove hyphens, colons, and milliseconds from ISO string
       return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const startStr = formatDateForGoogle(startDate);
    const endStr = formatDateForGoogle(endDate);
    
    // Construct Google Calendar URL
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(task.title)}&details=${encodeURIComponent(task.description + '\n\nTrial: ' + trialName)}&dates=${startStr}/${endStr}`;
    
    onAudit('Integration', `Opened Google Calendar for task: ${task.title}`);
    window.open(url, '_blank');
  };

  const handleDraftEmail = async (task: Task) => {
    setGeneratingDraft(task.id);
    const draft = await generateEmailDraft(task.title, task.description, trialName);
    setGeneratingDraft(null);
    onAudit('Integration', `Drafted Gmail for task: ${task.title}`);
    alert(`📧 Draft Saved to Gmail:\n\nSubject: Action Required - ${task.title}\n\nBody:\n${draft}`);
  };

  const getPriorityColor = (p: TaskPriority) => {
    switch(p) {
      case TaskPriority.CRITICAL: return 'bg-red-100 text-red-700 border-red-200';
      case TaskPriority.HIGH: return 'bg-orange-100 text-orange-700 border-orange-200';
      case TaskPriority.MEDIUM: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0">
          {['ALL', ...Object.values(TaskStatus)].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab 
                  ? 'bg-brand-600 text-white shadow-md' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {tab === 'ALL' ? 'All Tasks' : tab}
            </button>
          ))}
        </div>
        
        <div className="flex gap-2">
            <button 
                onClick={() => window.open('https://calendar.google.com', '_blank')}
                className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-slate-50 flex items-center gap-2"
            >
                <Calendar size={16} /> Check Calendar
            </button>
            <button className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-brand-700">
              + New Manual Task
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <div key={task.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
                {task.source === 'AI' && (
                  <span className="flex items-center gap-1 text-xs text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                    <Sparkles size={10} /> Gemini AI
                  </span>
                )}
              </div>
              
              <h4 className="text-base font-semibold text-slate-900 mb-2 leading-tight">{task.title}</h4>
              <p className="text-sm text-slate-500 mb-4 line-clamp-3">{task.description}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs text-slate-500 mb-4">
                <span className="flex items-center gap-1">
                  <Clock size={12} /> Due: {new Date(task.dueDate).toLocaleDateString()}
                </span>
                <span>{task.assignee}</span>
              </div>

              <div className="flex gap-2">
                {task.status !== TaskStatus.DONE && (
                   <button 
                    onClick={() => onUpdateTask(task.id, TaskStatus.DONE)}
                    className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors"
                  >
                    <CheckCircle size={14} /> Complete
                  </button>
                )}
                
                <button 
                  onClick={() => handleDraftEmail(task)}
                  disabled={generatingDraft === task.id}
                  className="p-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200" title="Draft Email with AI"
                >
                  {generatingDraft === task.id ? <Sparkles className="animate-pulse" size={16}/> : <Mail size={16} />}
                </button>
                
                <button 
                   onClick={() => handleCreateCalendar(task)}
                   className="p-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200" title="Add to Google Calendar"
                >
                  <Calendar size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {filteredTasks.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            No tasks found in this view.
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskBoard;
    