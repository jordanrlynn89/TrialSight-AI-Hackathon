import React, { useState } from 'react';
import { ClinicalTrial, Message } from '../types';
import { Mail, MessageSquare, Search, Star, Archive, Trash2, Reply, Send, Sparkles, MoreVertical, Paperclip } from 'lucide-react';
import { generateSmartReply } from '../services/geminiService';

interface MessageCenterProps {
  messages: Message[];
  activeTrial: ClinicalTrial;
  onMarkRead: (id: string) => void;
  onAudit: (action: string, details: string) => void;
}

const MessageCenter: React.FC<MessageCenterProps> = ({ messages, activeTrial, onMarkRead, onAudit }) => {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(messages.length > 0 ? messages[0].id : null);
  const [replyDraft, setReplyDraft] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedMessage = messages.find(m => m.id === selectedMessageId);

  const handleSelectMessage = (id: string) => {
    setSelectedMessageId(id);
    onMarkRead(id);
    setReplyDraft('');
    setIsDrafting(false);
  };

  const handleSmartReply = async () => {
    if (!selectedMessage) return;
    setIsGenerating(true);
    setIsDrafting(true);
    
    // Pass trial context to AI
    const draft = await generateSmartReply(
      selectedMessage.sender, 
      selectedMessage.subject, 
      selectedMessage.content,
      `Trial: ${activeTrial.name}. Protocol ID: ${activeTrial.protocolId}. Description: ${activeTrial.description}`
    );
    
    setReplyDraft(draft);
    setIsGenerating(false);
    onAudit('AI Assistance', `Generated smart reply for message from ${selectedMessage.sender}`);
  };

  const handleSend = () => {
    onAudit('Communication', `Sent reply to ${selectedMessage?.sender}`);
    alert(`Message Sent to ${selectedMessage?.sender}`);
    setReplyDraft('');
    setIsDrafting(false);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Message List */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
               type="text" 
               placeholder={`Search inbox (${activeTrial.protocolId})...`}
               className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
             />
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
             <div className="p-8 text-center text-slate-400 text-sm">No messages for this trial.</div>
          ) : messages.map((msg) => (
            <div 
              key={msg.id} 
              onClick={() => handleSelectMessage(msg.id)}
              className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${
                selectedMessageId === msg.id ? 'bg-brand-50 border-l-4 border-l-brand-600' : 
                !msg.read ? 'bg-white border-l-4 border-l-brand-200' : 'bg-white border-l-4 border-l-transparent'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-sm truncate max-w-[70%] ${!msg.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                  {msg.sender}
                </span>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {new Date(msg.timestamp).toLocaleDateString()}
                </span>
              </div>
              <div className={`text-sm mb-1 truncate ${!msg.read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                {msg.subject}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {msg.preview}
              </div>
              <div className="mt-2 flex gap-2">
                 {msg.type === 'Email' ? (
                   <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                     <Mail size={10} className="mr-1" /> Email
                   </span>
                 ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800">
                     <MessageSquare size={10} className="mr-1" /> System
                   </span>
                 )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message Detail */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedMessage ? (
          <>
            {/* Toolbar */}
            <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white">
              <div className="flex items-center gap-2">
                 <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500" title="Archive"><Archive size={18} /></button>
                 <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500" title="Delete"><Trash2 size={18} /></button>
                 <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500" title="Mark Important"><Star size={18} /></button>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><MoreVertical size={18} /></button>
              </div>
            </div>

            {/* Header */}
            <div className="p-6 border-b border-slate-100">
               <h2 className="text-xl font-bold text-slate-900 mb-4">{selectedMessage.subject}</h2>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
                      {selectedMessage.sender.substring(0,2).toUpperCase()}
                   </div>
                   <div>
                     <div className="font-semibold text-slate-900">{selectedMessage.sender}</div>
                     <div className="text-xs text-slate-500">to Me, Clinical Team</div>
                   </div>
                 </div>
                 <div className="text-sm text-slate-400">
                   {new Date(selectedMessage.timestamp).toLocaleString()}
                 </div>
               </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-line leading-relaxed">
                {selectedMessage.content}
              </div>
            </div>

            {/* Action/Reply Area */}
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              {isDrafting ? (
                <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden animate-fade-in">
                  <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-2 text-xs text-slate-500">
                    <Reply size={14} /> Replying to {selectedMessage.sender}...
                  </div>
                  <textarea 
                    className="w-full h-40 p-4 text-sm focus:outline-none resize-none"
                    placeholder="Type your reply here..."
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                  />
                  <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                    <div className="flex gap-2">
                      <button className="p-2 text-slate-500 hover:bg-slate-200 rounded"><Paperclip size={18}/></button>
                      <button 
                        onClick={handleSmartReply}
                        disabled={isGenerating}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                      >
                         <Sparkles size={14} className={isGenerating ? "animate-spin" : ""} />
                         {isGenerating ? "Drafting..." : "Gemini Rewrite"}
                      </button>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => setIsDrafting(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Discard</button>
                       <button onClick={handleSend} className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 flex items-center gap-2 shadow-sm">
                         <Send size={16} /> Send Reply
                       </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsDrafting(true)}
                    className="flex-1 py-3 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-white hover:border-slate-400 hover:shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Reply size={18} /> Reply
                  </button>
                  <button 
                    onClick={handleSmartReply}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg text-indigo-700 font-medium hover:from-indigo-100 hover:to-purple-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles size={18} /> AI Smart Reply
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <Mail size={48} className="mb-4 opacity-20" />
            <p>Select a message to view</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default MessageCenter;
