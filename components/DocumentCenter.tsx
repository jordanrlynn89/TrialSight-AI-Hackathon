import React, { useState } from 'react';
import { Upload, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import { DocType, Document, Task, TaskPriority, TaskStatus, ClinicalTrial } from '../types';
import { analyzeDocument } from '../services/geminiService';

interface DocumentCenterProps {
  documents: Document[];
  activeTrial: ClinicalTrial;
  onUpload: (doc: Document) => void;
  onTasksGenerated: (tasks: Task[]) => void;
  onAudit: (action: string, details: string) => void;
}

const DocumentCenter: React.FC<DocumentCenterProps> = ({ documents, activeTrial, onUpload, onTasksGenerated, onAudit }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocType>(DocType.MONITORING_REPORT);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    
    // Simulate File Upload
    const newDoc: Document = {
      id: crypto.randomUUID(),
      trialId: activeTrial.id,
      name: selectedFile.name,
      type: docType,
      uploadDate: new Date().toISOString(),
      size: `${(selectedFile.size / 1024).toFixed(1)} KB`,
      status: 'Pending',
      riskScore: 0
    };

    onAudit('Document Upload', `Uploaded ${newDoc.name} for ${activeTrial.protocolId}`);

    try {
      // Mock text content - in real app, perform OCR
      const simulatedText = `
        ${docType} for Site 004 (${activeTrial.protocolId})
        Date: ${new Date().toLocaleDateString()}
        Context: ${activeTrial.name}
        Findings:
        1. Minor deviation in dosing schedule for Patient 102.
        2. Site staff pending GCP refresher.
        3. Freezer log temperature excursion (0.5C deviation).
      `;

      const analysis = await analyzeDocument(simulatedText, docType, activeTrial.aiContext);
      
      const updatedDoc: Document = {
        ...newDoc,
        status: 'Analyzed',
        riskScore: analysis.riskScore
      };

      onUpload(updatedDoc);
      onAudit('AI Analysis', `Analyzed ${newDoc.name} in context of ${activeTrial.protocolId}. Risk: ${analysis.riskScore}`);

      const newTasks: Task[] = analysis.tasks.map(t => ({
        id: crypto.randomUUID(),
        trialId: activeTrial.id,
        title: t.title,
        description: t.description,
        priority: t.priority as TaskPriority,
        status: TaskStatus.TODO,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 days
        assignee: 'CRA',
        source: 'AI',
        relatedDocId: updatedDoc.id
      }));

      onTasksGenerated(newTasks);

    } catch (err) {
      console.error(err);
      onAudit('Error', 'Analysis failed for document');
    } finally {
      setIsAnalyzing(false);
      setSelectedFile(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Upload Section */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Upload to eTMF ({activeTrial.protocolId})</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Document Type</label>
              <select 
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocType)}
                className="w-full border-slate-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 p-2 border"
              >
                {Object.values(DocType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors">
               <Upload className="text-slate-400 mb-3" size={32} />
               <input type="file" onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"/>
               <p className="text-xs text-slate-400 mt-2 text-center">Supported: PDF, DOCX</p>
            </div>

            <button 
              onClick={handleUploadAndAnalyze}
              disabled={!selectedFile || isAnalyzing}
              className={`w-full py-2 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 ${
                !selectedFile || isAnalyzing ? 'bg-slate-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 shadow-md'
              }`}
            >
              {isAnalyzing ? (
                <><Loader2 className="animate-spin" size={18} /> Analyzing...</>
              ) : (
                'Upload & Analyze'
              )}
            </button>
          </div>
        </div>

        {/* AI Insight Placeholder */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100">
          <div className="flex items-start gap-3">
             <div className="mt-1 bg-indigo-100 p-1.5 rounded-full"><AlertCircle size={16} className="text-indigo-600"/></div>
             <div>
               <h4 className="text-sm font-semibold text-indigo-900">Active Protocol Context</h4>
               <p className="text-xs text-indigo-700 mt-1">
                 Docs are analyzed against <strong>{activeTrial.protocolId}</strong> guidelines.
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">Recent Documents ({activeTrial.protocolId})</h3>
            <span className="text-sm text-slate-500">{documents.length} files</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Risk Score</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 flex items-center gap-2 font-medium text-slate-900">
                      <FileText size={16} className="text-slate-400" />
                      {doc.name}
                    </td>
                    <td className="px-6 py-3 text-slate-600">{doc.type}</td>
                    <td className="px-6 py-3">
                      {doc.status === 'Analyzed' ? (
                         <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                           doc.riskScore < 30 ? 'bg-green-100 text-green-700' : 
                           doc.riskScore < 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                         }`}>
                           {doc.riskScore}/100
                         </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${doc.status === 'Analyzed' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}
                      `}>
                        {doc.status === 'Analyzed' && <Check size={12} />}
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      No documents for this trial yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DocumentCenter;
