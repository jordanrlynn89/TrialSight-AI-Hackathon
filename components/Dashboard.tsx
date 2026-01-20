import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { Task, Document, ClinicalTrial } from '../types';
import { AlertTriangle, CheckCircle, Activity, Heart, Users, Pill, TrendingUp, X, ArrowRight, ClipboardList } from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  documents: Document[];
  activeTrial: ClinicalTrial;
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, documents, activeTrial }) => {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Dynamic Metrics based on Active Trial props
  const percentRecruited = Math.round((activeTrial.currentRecruitment / activeTrial.targetRecruitment) * 100);
  const totalEvents = activeTrial.endpointData.reduce((acc, curr) => acc + curr.value, 0);
  
  // Drill Down Content Generator
  const renderDetailContent = () => {
    switch(selectedMetric) {
      case 'recruitment':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="flex items-center gap-2 font-semibold text-blue-800"><Activity size={16}/> AI Insight: Recruitment Velocity</h4>
              <p className="text-sm text-blue-700 mt-1">
                Analysis for <strong>{activeTrial.protocolId}</strong>:
                Recruitment is {percentRecruited < 50 ? 'lagging' : 'on track'}. 
                {activeTrial.recruitmentData.some(d => d.actual/d.target < 0.5) 
                  ? " Certain sites are underperforming significantly." 
                  : " Consistency observed across regions."}
              </p>
            </div>
            <h4 className="font-semibold text-slate-800">Regional Breakdown</h4>
            <div className="space-y-3">
              {activeTrial.recruitmentData.map(d => (
                <div key={d.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{d.label}</span>
                    <span>{d.actual} / {d.target}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${d.actual/d.target < 0.7 ? 'bg-red-500' : 'bg-brand-600'}`} 
                      style={{width: `${Math.min((d.actual/d.target)*100, 100)}%`}}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'endpoints':
        return (
          <div className="space-y-4">
             <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h4 className="flex items-center gap-2 font-semibold text-purple-800"><ClipboardList size={16}/> Endpoint Adjudication</h4>
              <p className="text-sm text-purple-700 mt-1">
                Primary endpoint distribution for <strong>{activeTrial.name}</strong>. 
                Event rate is consistent with {activeTrial.phase} expectations.
              </p>
            </div>
            <h4 className="font-semibold text-slate-800">Event Breakdown</h4>
            <div className="space-y-2">
              {activeTrial.endpointData.map(d => (
                <div key={d.name} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full" style={{backgroundColor: d.color}}></div>
                     <span className="text-sm font-medium text-slate-700">{d.name}</span>
                   </div>
                   <span className="font-bold text-slate-900">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )
      default: return null;
    }
  };

  return (
    <div className="flex gap-6 h-full relative">
      {/* Main Dashboard Content */}
      <div className={`flex-1 space-y-6 transition-all duration-300 ${selectedMetric ? 'w-2/3' : 'w-full'}`}>
        
        {/* Protocol Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-brand-600"></div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-slate-900">{activeTrial.name}</h2>
              <span className="bg-brand-100 text-brand-800 text-xs px-2 py-1 rounded font-bold">Phase {activeTrial.phase}</span>
              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-mono">{activeTrial.protocolId}</span>
            </div>
            <p className="text-sm text-slate-500 max-w-2xl truncate">{activeTrial.description}</p>
            <p className="text-xs text-slate-400 mt-1">PI: {activeTrial.investigator}</p>
          </div>
          <div className="flex gap-4 text-right">
             <div>
               <p className="text-xs text-slate-400">Status</p>
               <p className="text-sm font-semibold text-green-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> {activeTrial.status}</p>
             </div>
             <div>
               <p className="text-xs text-slate-400">Enrolled</p>
               <p className="text-sm font-semibold text-slate-900">{activeTrial.currentRecruitment} / {activeTrial.targetRecruitment}</p>
             </div>
          </div>
        </div>

        {/* KPI Cards with Click Handlers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            onClick={() => setSelectedMetric('recruitment')}
            className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer transition-all hover:shadow-md ${selectedMetric === 'recruitment' ? 'border-brand-500 ring-1 ring-brand-500' : 'border-slate-200'}`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">Enrollment</span>
              <Users className="text-brand-600 bg-brand-50 p-1.5 rounded-lg w-8 h-8" />
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-slate-900">{percentRecruited}%</h3>
              <span className="text-xs text-slate-400">of target</span>
            </div>
            <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-brand-500 h-1.5 rounded-full" style={{width: `${percentRecruited}%`}}></div>
            </div>
            <p className="text-xs text-brand-500 mt-2 font-medium">Click to view sites</p>
          </div>

          <div 
            onClick={() => setSelectedMetric('endpoints')}
            className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer transition-all hover:shadow-md ${selectedMetric === 'endpoints' ? 'border-brand-500 ring-1 ring-brand-500' : 'border-slate-200'}`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">Clinical Endpoints</span>
              <Heart className="text-red-600 bg-red-50 p-1.5 rounded-lg w-8 h-8" />
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-slate-900">{totalEvents}</h3>
              <span className="text-xs text-slate-400">Total Events</span>
            </div>
            <p className="text-xs text-brand-600 mt-3 font-medium">Click for breakdown</p>
          </div>

          <div 
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">Pending Tasks</span>
              <Activity className="text-orange-600 bg-orange-50 p-1.5 rounded-lg w-8 h-8" />
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-slate-900">{tasks.length}</h3>
              <span className="text-xs text-slate-400">Active</span>
            </div>
            <div className="flex gap-2 mt-3 text-xs">
               <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded">High Prio: {tasks.filter(t=>t.priority === 'High' || t.priority === 'Critical').length}</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Adherence/Outcome Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Comparative Analysis (Intervention vs Control)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeTrial.adherenceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="timepoint" tick={{fontSize: 12}} />
                  <YAxis domain={[0, 100]} tick={{fontSize: 12}} />
                  <Tooltip />
                  <Line type="monotone" dataKey="armA" stroke="#0ea5e9" strokeWidth={3} name="Intervention" />
                  <Line type="monotone" dataKey="armB" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" name="Control" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recruitment Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Recruitment by Site/Region</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeTrial.recruitmentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="label" type="category" width={80} tick={{fontSize: 11}} />
                  <Tooltip />
                  <Bar dataKey="actual" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} name="Actual">
                    {activeTrial.recruitmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.actual / entry.target < 0.7 ? '#ef4444' : '#3b82f6'} />
                    ))}
                  </Bar>
                  <Bar dataKey="target" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={20} name="Target" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

      {/* Drill Down Side Panel */}
      {selectedMetric && (
        <div className="w-1/3 bg-white border-l border-slate-200 shadow-xl h-full absolute right-0 top-0 bottom-0 z-20 flex flex-col animate-slide-in-right">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800 capitalize">
              {selectedMetric === 'recruitment' ? 'Recruitment Details' : 'Endpoint Analysis'}
            </h3>
            <button onClick={() => setSelectedMetric(null)} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {renderDetailContent()}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50">
            <button className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700">
              Generate Report <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
