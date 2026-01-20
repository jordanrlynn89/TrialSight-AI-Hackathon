import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, CheckSquare, Settings, Activity, 
  Menu, Bell, Search, UserCircle, ShieldCheck, MessageSquare, ChevronDown, PlusCircle, Calendar
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import DocumentCenter from './components/DocumentCenter';
import TaskBoard from './components/TaskBoard';
import RiskSimulator from './components/RiskSimulator';
import MessageCenter from './components/MessageCenter';
import ChatAssistant from './components/ChatAssistant';
import CalendarView from './components/CalendarView';
import { Task, Document, AuditLogEntry, TaskStatus, TaskPriority, DocType, Message, ClinicalTrial } from './types';

// Sidebar Navigation
const NavLink = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
      <Icon size={20} />
      {label}
    </Link>
  );
};

// --- MOCK DATA FOR MULTIPLE TRIALS ---

const TRIALS: ClinicalTrial[] = [
  {
    id: 'trial_1',
    protocolId: '633765',
    name: 'SECURE',
    phase: 'III',
    description: 'Secondary Prevention of Cardiovascular Disease in the Elderly',
    investigator: 'Dr. Valentin Fuster',
    status: 'Recruiting',
    targetRecruitment: 2514,
    currentRecruitment: 1450,
    recruitmentData: [
      { label: 'Spain', actual: 450, target: 500 },
      { label: 'Italy', actual: 320, target: 400 },
      { label: 'Germany', actual: 210, target: 350 },
      { label: 'Poland', actual: 180, target: 200 },
      { label: 'Hungary', actual: 150, target: 150 },
      { label: 'France', actual: 90, target: 150 },
      { label: 'Czech', actual: 80, target: 100 },
    ],
    endpointData: [
      { name: 'CV Death', value: 12, color: '#ef4444' },
      { name: 'Non-fatal MI', value: 28, color: '#f97316' },
      { name: 'Ischemic Stroke', value: 15, color: '#eab308' },
      { name: 'Revasc', value: 45, color: '#3b82f6' },
    ],
    adherenceData: [
      { timepoint: 'M6', armA: 78, armB: 62 },
      { timepoint: 'M12', armA: 75, armB: 58 },
      { timepoint: 'M18', armA: 74, armB: 55 },
      { timepoint: 'M24', armA: 72, armB: 50 },
    ],
    aiContext: "Protocol: SECURE (Secondary Prevention of CVD in Elderly). Drug: Polypill (Aspirin/Atorvastatin/Ramipril) vs Usual Care. Pop: >65yo, Post-MI. Key Risks: Hypotension, Renal Dysfunction, Bleeding. Adherence Measure: Morisky-8."
  },
  {
    id: 'trial_2',
    protocolId: 'NCT07286578',
    name: 'AF-PREVENT',
    phase: 'II',
    description: 'Impact of Early Ablation in Atrial Fibrillation - Spain Cohort',
    investigator: 'Dr. Maria Gonzalez',
    status: 'Recruiting',
    targetRecruitment: 300,
    currentRecruitment: 45,
    recruitmentData: [
      { label: 'Madrid', actual: 20, target: 100 },
      { label: 'Barcelona', actual: 15, target: 100 },
      { label: 'Valencia', actual: 10, target: 100 },
    ],
    endpointData: [
      { name: 'AF Recurrence', value: 5, color: '#ef4444' },
      { name: 'Bleeding', value: 2, color: '#f97316' },
      { name: 'Stroke', value: 0, color: '#eab308' },
    ],
    adherenceData: [
      { timepoint: 'M1', armA: 98, armB: 95 },
      { timepoint: 'M3', armA: 95, armB: 90 },
      { timepoint: 'M6', armA: 92, armB: 85 },
    ],
    aiContext: "Protocol: AF-PREVENT (NCT07286578). Intervention: Cryoablation vs Antiarrhythmic Drugs. Pop: Paroxysmal AF, Naive. Key Risks: Tamponade, Pulmonary Vein Stenosis. Primary Endpoint: Freedom from Atrial Arrhythmia >30s."
  }
];

const INITIAL_TASKS: Task[] = [
  // SECURE Tasks
  { id: '1', trialId: 'trial_1', title: 'Verify Ramipril Titration - Site 002', description: 'Subject 1002-004 blood pressure drop noted. Confirm down-titration to 2.5mg.', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, dueDate: new Date().toISOString(), assignee: 'CRA', source: 'User' },
  { id: '2', trialId: 'trial_1', title: 'Polypill Supply Reshipment', description: 'Batch 445 expiring at German depot.', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, dueDate: new Date().toISOString(), assignee: 'Logistics', source: 'System' },
  // AF-PREVENT Tasks
  { id: '3', trialId: 'trial_2', title: 'Collect Ablation Procedure Reports', description: 'Site Madrid-01 missing 3 procedure logs.', status: TaskStatus.TODO, priority: TaskPriority.HIGH, dueDate: new Date().toISOString(), assignee: 'CRA', source: 'System' },
];

const INITIAL_DOCS: Document[] = [
  { id: '1', trialId: 'trial_1', name: 'SECURE_Protocol_v5.0.pdf', type: DocType.PROTOCOL, uploadDate: new Date().toISOString(), size: '2.4 MB', status: 'Analyzed', riskScore: 0 },
  { id: '2', trialId: 'trial_2', name: 'AF_Informed_Consent_ES.pdf', type: DocType.CONSENT_FORM, uploadDate: new Date().toISOString(), size: '0.8 MB', status: 'Analyzed', riskScore: 15 }
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    trialId: 'trial_1',
    sender: 'Dr. Valentin Fuster',
    subject: 'Recruitment lag in Germany',
    preview: 'We need to discuss the recruitment numbers...',
    content: 'Dear Team, recruitment in Berlin is lagging.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), 
    read: false,
    type: 'Email'
  },
  {
    id: '2',
    trialId: 'trial_2',
    sender: 'Dr. Maria Gonzalez',
    subject: 'New Site Activation',
    preview: 'Valencia site is ready to recruit...',
    content: 'Good news, the Valencia site has passed SIV and is ready to screen.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), 
    read: true,
    type: 'Email'
  }
];

const App: React.FC = () => {
  // Global State
  const [selectedTrialId, setSelectedTrialId] = useState<string>('trial_1');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [documents, setDocuments] = useState<Document[]>(INITIAL_DOCS);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);

  // Derived State
  const activeTrial = TRIALS.find(t => t.id === selectedTrialId) || TRIALS[0];
  const activeTasks = tasks.filter(t => t.trialId === selectedTrialId);
  const activeDocs = documents.filter(d => d.trialId === selectedTrialId);
  const activeMessages = messages.filter(m => m.trialId === selectedTrialId);
  const unreadMessagesCount = activeMessages.filter(m => !m.read).length;

  // Helpers
  const addAuditLog = (action: string, details: string) => {
    setAuditLog(prev => [{
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      actor: 'User', 
      action,
      details,
      entityId: activeTrial.protocolId
    }, ...prev]);
  };

  const handleUpdateTask = (id: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    addAuditLog('Task Update', `Task ${id} status changed to ${status}`);
  };

  const handleMarkMessageRead = (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
  };

  return (
    <HashRouter>
      <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
        
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2 text-brand-700 font-bold text-xl mb-4">
              <Activity size={28} className="text-brand-600" />
              TrialSight
            </div>
            
            {/* Trial Selector */}
            <div className="relative">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">Active Protocol</label>
              <div className="relative group">
                <select 
                  value={selectedTrialId}
                  onChange={(e) => setSelectedTrialId(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg pl-3 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium truncate cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  {TRIALS.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.protocolId})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            <NavLink to="/" icon={LayoutDashboard} label="Dashboard" />
            <div className="relative">
              <NavLink to="/messages" icon={MessageSquare} label="Messaging" />
              {unreadMessagesCount > 0 && (
                <span className="absolute right-4 top-3 bg-red-500 text-white text-[10px] px-1.5 rounded-full border border-white">
                  {unreadMessagesCount}
                </span>
              )}
            </div>
            <NavLink to="/calendar" icon={Calendar} label="Calendar" />
            <NavLink to="/tasks" icon={CheckSquare} label="Tasks & Actions" />
            <NavLink to="/documents" icon={FileText} label="eTMF / Docs" />
            <NavLink to="/risks" icon={ShieldCheck} label="Risk Simulator" />
            <div className="pt-4 mt-4 border-t border-slate-100">
               <NavLink to="/audit" icon={Settings} label="Audit Log" />
            </div>
          </nav>

          <div className="p-4 border-t border-slate-100">
             <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <UserCircle className="text-slate-400" size={32} />
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-slate-900 truncate">Dr. Sarah Chen</p>
                  <p className="text-xs text-slate-500 truncate">Global CTM</p>
                </div>
             </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Header */}
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
            <div className="flex items-center gap-4">
              <button className="md:hidden text-slate-500"><Menu /></button>
              <div className="hidden md:flex relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder={`Search ${activeTrial.name}...`} 
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-64"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
               <button 
                 className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-700 text-sm font-medium rounded-lg hover:bg-brand-100 transition-colors"
                 onClick={() => alert("This would open the 'Add New Trial' wizard.")}
               >
                 <PlusCircle size={16} />
                 New Trial
               </button>
               <button className="relative text-slate-500 hover:text-slate-700">
                 <Bell size={20} />
                 {unreadMessagesCount > 0 && (
                   <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                 )}
               </button>
            </div>
          </header>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-auto p-6">
            <Routes>
              <Route path="/" element={<Dashboard tasks={activeTasks} documents={activeDocs} activeTrial={activeTrial} />} />
              <Route path="/messages" element={
                <MessageCenter 
                  messages={activeMessages} 
                  activeTrial={activeTrial}
                  onMarkRead={handleMarkMessageRead}
                  onAudit={addAuditLog}
                />
              } />
              <Route path="/calendar" element={
                <CalendarView 
                  tasks={activeTasks} 
                  onAudit={addAuditLog}
                />
              } />
              <Route path="/tasks" element={
                <TaskBoard 
                  tasks={activeTasks} 
                  trialName={activeTrial.name}
                  onUpdateTask={handleUpdateTask} 
                  onAudit={addAuditLog}
                />
              } />
              <Route path="/documents" element={
                <DocumentCenter 
                  documents={activeDocs} 
                  activeTrial={activeTrial}
                  onUpload={(doc) => setDocuments(prev => [doc, ...prev])} 
                  onTasksGenerated={(newTasks) => {
                    setTasks(prev => [...newTasks, ...prev]);
                    addAuditLog('AI Generation', `Generated ${newTasks.length} tasks from document analysis.`);
                  }}
                  onAudit={addAuditLog}
                />
              } />
              <Route path="/risks" element={<RiskSimulator activeTrial={activeTrial} onAudit={addAuditLog} />} />
              <Route path="/audit" element={
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                     <h3 className="font-semibold text-slate-800">System Audit Log</h3>
                     <p className="text-xs text-slate-500">Immutable record of all system activities.</p>
                  </div>
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3">Timestamp</th>
                        <th className="px-6 py-3">Actor</th>
                        <th className="px-6 py-3">Action</th>
                        <th className="px-6 py-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditLog.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-4 text-center text-slate-400">No events yet.</td></tr>
                      ) : (
                        auditLog.map(log => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="px-6 py-3 font-mono text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="px-6 py-3 text-slate-700 font-medium">{log.actor}</td>
                            <td className="px-6 py-3 text-slate-700">{log.action}</td>
                            <td className="px-6 py-3 text-slate-500">{log.details}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              } />
            </Routes>
          </div>
          
          {/* AI Chat Assistant */}
          <ChatAssistant activeTrial={activeTrial} tasks={activeTasks} />

        </main>
      </div>
    </HashRouter>
  );
};

export default App;