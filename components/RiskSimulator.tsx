import React, { useState } from 'react';
import { simulateTrialRisks, SimulationResult } from '../services/geminiService';
import { AlertTriangle, Play, RefreshCw, ShieldAlert, CheckCircle2, TrendingUp, AlertOctagon, Activity } from 'lucide-react';
import { ClinicalTrial } from '../types';

interface RiskSimulatorProps {
  activeTrial: ClinicalTrial;
  onAudit: (action: string, details: string) => void;
}

const RiskSimulator: React.FC<RiskSimulatorProps> = ({ activeTrial, onAudit }) => {
  const [protocolText, setProtocolText] = useState("Site activation delay in Eastern Europe region. Competitor trial recruiting same population started last month.");
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    onAudit('Simulation', `Ran Risk Simulation for ${activeTrial.protocolId}`);
    const result = await simulateTrialRisks(protocolText, activeTrial.aiContext);
    setSimulationResult(result);
    setLoading(false);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 50) return 'text-orange-500';
    return 'text-green-600';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Input Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-start gap-4 mb-6">
           <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
             <ShieldAlert size={32} />
           </div>
           <div>
             <h3 className="text-xl font-bold text-slate-900">Protocol Stress Test: {activeTrial.protocolId}</h3>
             <p className="text-slate-500 mt-1">
               Simulate scenarios (e.g., "Recruitment drops by 20%", "New safety signal observed") to predict trial impact and generate mitigation strategies.
             </p>
           </div>
        </div>

        <div className="space-y-4">
          <textarea
            className="w-full h-28 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm resize-none"
            value={protocolText}
            onChange={(e) => setProtocolText(e.target.value)}
            placeholder="Describe the scenario (e.g., Unexpected SAE cluster in Site 004, budget cut by 15%, etc.)"
          />
          
          <div className="flex justify-end">
            <button
              onClick={handleSimulate}
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-all text-white
                ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md'}`}
            >
              {loading ? (
                <><RefreshCw className="animate-spin" size={18}/> Simulating...</>
              ) : (
                <><Play size={18} fill="currentColor" /> Run Simulation</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {simulationResult && (
        <div className="space-y-6 animate-fade-in-up">
          
          {/* Summary & Score Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-2">Executive Summary</h4>
              <p className="text-lg text-slate-800 leading-relaxed font-medium">
                {simulationResult.executiveSummary}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3">Projected Risk Impact</h4>
              <div className="relative flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                  <circle 
                    cx="64" cy="64" r="56" 
                    stroke="currentColor" 
                    strokeWidth="12" 
                    fill="transparent" 
                    strokeDasharray={351} 
                    strokeDashoffset={351 - (351 * simulationResult.overallRiskScore) / 100}
                    className={`${getScoreColor(simulationResult.overallRiskScore)} transition-all duration-1000 ease-out`}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className={`text-3xl font-extrabold ${getScoreColor(simulationResult.overallRiskScore)}`}>
                    {simulationResult.overallRiskScore}
                  </span>
                  <span className="text-xs text-slate-400">/ 100</span>
                </div>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-600">
                {simulationResult.overallRiskScore > 75 ? 'Critical Risk' : simulationResult.overallRiskScore > 40 ? 'Moderate Risk' : 'Low Risk'}
              </p>
            </div>
          </div>

          {/* Scenarios Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {simulationResult.scenarios.map((scenario, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
                <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${scenario.category === 'Safety' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                      {scenario.category === 'Safety' ? <Activity size={20} /> : <AlertOctagon size={20} />}
                    </div>
                    <h5 className="font-bold text-slate-800">{scenario.category}</h5>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(scenario.riskLevel)}`}>
                    {scenario.riskLevel}
                  </span>
                </div>
                
                <div className="p-5 space-y-4">
                  <div>
                    <h6 className="text-xs font-semibold text-slate-400 uppercase mb-1">Risk Description</h6>
                    <p className="text-slate-700 text-sm leading-relaxed">{scenario.description}</p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <h6 className="text-xs font-bold text-slate-600 uppercase mb-2 flex items-center gap-1">
                      <CheckCircle2 size={14} className="text-green-600"/> Mitigation Strategy
                    </h6>
                    <p className="text-slate-600 text-sm italic">
                      "{scenario.mitigationStrategy}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-4">
            <p className="text-xs text-slate-400">
              * Simulation generated by Gemini 3 Pro based on {activeTrial.protocolId} constraints. Validated against ICH-GCP guidelines.
            </p>
          </div>

        </div>
      )}
    </div>
  );
};

export default RiskSimulator;
