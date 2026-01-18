
export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  AUDIT_TEXT = 'AUDIT_TEXT',
  AUDIT_IMAGE = 'AUDIT_IMAGE',
  CHAT = 'CHAT'
}

export type ModelProvider = 'gemini' | 'deepseek' | 'gpt' | 'qwen';

export type AuditScenario = 'general' | 'fraud' | 'tax' | 'compliance';

export interface ChartDataPoint {
  category: string;
  value: number;
}

export interface RiskItem {
  severity: 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
}

export interface AuditAnalysisResult {
  summary: string;
  risks: RiskItem[];
  keyMetrics: { label: string; value: string; change?: string }[];
  chartData?: ChartDataPoint[]; // Optional chart data for visualization
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
