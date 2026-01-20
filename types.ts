
export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  REVIEW = 'In Review',
  DONE = 'Completed'
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum DocType {
  PROTOCOL = 'Protocol',
  MONITORING_REPORT = 'Monitoring Report',
  CONSENT_FORM = 'Informed Consent',
  LAB_RESULT = 'Lab Result',
  REGULATORY = 'Regulatory'
}

export interface ClinicalTrial {
  id: string;
  protocolId: string;
  name: string;
  phase: string;
  description: string;
  investigator: string;
  status: 'Recruiting' | 'Active' | 'Analysis';
  targetRecruitment: number;
  currentRecruitment: number;
  
  // Protocol Specific Data for Dashboard
  recruitmentData: { label: string; actual: number; target: number }[];
  endpointData: { name: string; value: number; color: string }[];
  adherenceData: { timepoint: string; armA: number; armB: number }[];
  
  // Context for AI
  aiContext: string;
}

export interface Task {
  id: string;
  trialId: string; // Linked to specific trial
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignee: string;
  source: 'User' | 'AI' | 'System';
  relatedDocId?: string;
}

export interface Document {
  id: string;
  trialId: string; // Linked to specific trial
  name: string;
  type: DocType;
  uploadDate: string;
  size: string;
  status: 'Analyzed' | 'Pending' | 'Error';
  riskScore: number; // 0-100
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: 'User' | 'AI';
  action: string;
  details: string;
  entityId?: string;
}

export interface Message {
  id: string;
  trialId?: string; // Optional, can be system wide
  sender: string;
  subject: string;
  preview: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: 'Email' | 'System';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isTyping?: boolean;
}