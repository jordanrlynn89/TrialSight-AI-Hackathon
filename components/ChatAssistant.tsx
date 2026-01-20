import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Sparkles, Bot, User } from 'lucide-react';
import { ChatMessage, ClinicalTrial, Task } from '../types';
import { initAssistantChat, getAssistantSuggestions } from '../services/geminiService';
import { Chat } from '@google/genai';

interface ChatAssistantProps {
  activeTrial: ClinicalTrial;
  tasks: Task[];
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ activeTrial, tasks }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);

  // Construct context string for the AI
  const getContextString = () => {
    const highPrioTasks = tasks.filter(t => t.priority === 'High' || t.priority === 'Critical');
    return `
      Active Protocol: ${activeTrial.name} (${activeTrial.protocolId})
      Phase: ${activeTrial.phase}
      Status: ${activeTrial.status}
      Recruitment: ${activeTrial.currentRecruitment} / ${activeTrial.targetRecruitment}
      Investigator: ${activeTrial.investigator}
      
      Current High Priority Tasks (${highPrioTasks.length}):
      ${highPrioTasks.map(t => `- ${t.title} (${t.status})`).join('\n')}
      
      General Context:
      ${activeTrial.aiContext}
    `;
  };

  useEffect(() => {
    if (isOpen && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      initializeAssistant();
    }
  }, [isOpen, activeTrial.id]); 

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const initializeAssistant = async () => {
    setIsTyping(true);
    const context = getContextString();
    
    // 1. Initialize the Chat Session (Gemini 3 Pro)
    chatSessionRef.current = initAssistantChat(context);

    // 2. Get Fast Initial Suggestions (Gemini 2.5 Flash Lite)
    try {
      const taskContext = tasks.slice(0, 5).map(t => t.title).join(', ');
      const suggestion = await getAssistantSuggestions(context, taskContext);
      
      setMessages([{
        id: 'init',
        role: 'model',
        text: suggestion,
        timestamp: new Date()
      }]);
    } catch (e) {
      // Fallback
      setMessages([{
        id: 'init',
        role: 'model',
        text: `Hello! I'm your TrialSight assistant for ${activeTrial.name}. How can I help you today?`,
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !chatSessionRef.current) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Send to Gemini 3 Pro
      const response = await chatSessionRef.current.sendMessage({ message: userMsg.text });
      
      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: response.text || "I didn't catch that, could you rephrase?",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'model',
        text: "I'm having trouble connecting to the network right now. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all z-50 flex items-center justify-center ${
          isOpen ? 'bg-slate-800 rotate-90' : 'bg-brand-600 hover:bg-brand-700 hover:scale-105'
        }`}
      >
        {isOpen ? <X className="text-white" size={24} /> : <MessageCircle className="text-white" size={28} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col animate-fade-in-up overflow-hidden font-sans">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-600 to-indigo-600 p-4 flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Bot className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Trial Assistant</h3>
              <p className="text-brand-100 text-xs flex items-center gap-1">
                <Sparkles size={10} /> Powered by Gemini
              </p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-slate-200' : 'bg-brand-100'
                }`}>
                  {msg.role === 'user' ? <User size={16} className="text-slate-600"/> : <Bot size={16} className="text-brand-600"/>}
                </div>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-brand-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                  <div className={`text-[10px] mt-1 text-right ${msg.role === 'user' ? 'text-brand-200' : 'text-slate-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-brand-600"/>
                </div>
                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 flex items-center gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about tasks, protocols, risks..."
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
              />
              <button 
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
                className="absolute right-2 p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:hover:bg-brand-600 transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="text-center mt-2">
                <p className="text-[10px] text-slate-400">AI can make mistakes. Verify critical trial data.</p>
            </div>
          </div>

        </div>
      )}
    </>
  );
};

export default ChatAssistant;
