import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { TaskPriority } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using Gemini 3 Pro for complex reasoning and analysis
const MODEL_NAME = 'gemini-3-pro-preview';
// Using Gemini 2.5 Flash Lite for low-latency responses
const FAST_MODEL_NAME = 'gemini-2.5-flash-lite';

export interface AnalyzedDocumentResult {
  summary: string;
  riskScore: number;
  risks: string[];
  tasks: {
    title: string;
    description: string;
    priority: TaskPriority;
  }[];
}

export interface SimulationResult {
  executiveSummary: string;
  overallRiskScore: number; // 0-100
  scenarios: {
    category: string;
    riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    description: string;
    mitigationStrategy: string;
  }[];
}

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "Executive summary of the document content." },
    riskScore: { type: Type.INTEGER, description: "A risk score from 0 to 100 based on compliance issues." },
    risks: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of identified operational or compliance risks."
    },
    tasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] }
        },
        required: ["title", "description", "priority"]
      },
      description: "Recommended follow-up tasks based on the findings."
    }
  },
  required: ["summary", "riskScore", "risks", "tasks"]
};

const simulationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: { type: Type.STRING, description: "A concise, high-level summary of the simulation outcome." },
    overallRiskScore: { type: Type.INTEGER, description: "Calculated aggregate risk probability (0-100)." },
    scenarios: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: "Category of risk (e.g., Operations, Safety, Recruitment)." },
          riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
          description: { type: Type.STRING, description: "Detailed description of the specific risk scenario." },
          mitigationStrategy: { type: Type.STRING, description: "Actionable step to mitigate this risk." }
        },
        required: ["category", "riskLevel", "description", "mitigationStrategy"]
      }
    }
  },
  required: ["executiveSummary", "overallRiskScore", "scenarios"]
};

// Now accepts trialContext to make analysis specific to the active protocol
export const analyzeDocument = async (textContext: string, docType: string, trialContext: string): Promise<AnalyzedDocumentResult> => {
  try {
    const prompt = `
      You are an expert Clinical Trial Assistant.
      
      CURRENT TRIAL PROTOCOL CONTEXT:
      ${trialContext}
      
      TASK:
      Analyze the following ${docType} content for compliance with the protocol above, safety risks, and operational bottlenecks.
      
      DOCUMENT CONTENT:
      ${textContext}
      
      Extract specific risks and generate actionable tasks.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        thinkingConfig: { thinkingBudget: 1024 } 
      }
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(response.text) as AnalyzedDocumentResult;
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};

export const generateEmailDraft = async (taskTitle: string, taskDescription: string, trialName: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: `Draft a professional email to the site coordinator regarding the clinical trial: ${trialName}.
            Task: ${taskTitle}
            Details: ${taskDescription}
            
            Tone should be collaborative but firm on GCP compliance.`
        });
        return response.text || "Could not generate draft.";
    } catch (e) {
        return "Error generating draft.";
    }
};

export const generateSmartReply = async (sender: string, subject: string, content: string, trialContext: string): Promise<string> => {
  try {
     const prompt = `
     You are the Clinical Trial Manager.
     
     TRIAL CONTEXT:
     ${trialContext}
     
     Draft a reply to:
     Sender: ${sender}
     Subject: ${subject}
     Message Content: ${content}
     
     If this is an SAE (Serious Adverse Event), reference the specific protocol safety reporting guidelines.
     `;
     
     const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
     });
     return response.text || "";
  } catch (e) {
      console.error("Gemini Smart Reply Failed:", e);
      return "Unable to generate draft reply.";
  }
};

export const simulateTrialRisks = async (protocolDetails: string, activeTrialContext: string): Promise<SimulationResult | null> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `
            You are a Clinical Risk Simulator Engine.
            
            Based on the following Clinical Trial Context:
            ${activeTrialContext}
            
            And these specific additional details/parameters provided by the user:
            ${protocolDetails}
            
            Perform a rigorous simulation analysis.
            1. Predict the impact on recruitment, safety, and data integrity.
            2. Assign risk levels (Low, Medium, High, Critical).
            3. Provide concrete mitigation strategies.
            `,
            config: {
                 responseMimeType: "application/json",
                 responseSchema: simulationSchema,
                 thinkingConfig: { thinkingBudget: 2048 }
            }
        });
        
        if (!response.text) return null;
        return JSON.parse(response.text) as SimulationResult;
    } catch (e) {
        console.error("Simulation failed", e);
        return null;
    }
};

// --- CHAT ASSISTANT FEATURES ---

// Uses Flash Lite for instant, low-latency greeting/suggestions
export const getAssistantSuggestions = async (trialContext: string, taskContext: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: FAST_MODEL_NAME, 
      contents: `
        You are an efficient, friendly clinical trial secretary.
        
        Context:
        ${trialContext}
        
        Current Tasks:
        ${taskContext}

        Provide a very short, friendly greeting and list 3 bullet points of high-priority focus items for the trial manager right now.
        Be concise.
      `
    });
    return response.text || "Hello! I'm ready to assist you with your trial operations.";
  } catch (e) {
    console.error("Fast AI response failed", e);
    return "Hello! I'm ready to assist you.";
  }
};

// Uses Gemini 3 Pro for competent, deep reasoning chat
export const initAssistantChat = (trialContext: string): Chat => {
  return ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: `
        You are an intelligent, competent Clinical Trial Assistant (like a high-level secretary or trial manager).
        
        Your Goal: Assist the user in managing the clinical trial efficiently.
        
        Behavior:
        - Be friendly but professional.
        - Be proactive: suggest actions based on risks or deadlines.
        - Be context-aware: You know the current protocol status, recruitment numbers, and active tasks.
        
        Context:
        ${trialContext}
        
        If asked about tasks, deadlines, or risks, refer to the provided context.
      `
    }
  });
};
