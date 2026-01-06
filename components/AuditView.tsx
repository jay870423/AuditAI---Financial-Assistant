import React, { useState } from 'react';
import { analyzeFinancialData } from '../services/geminiService';
import { AuditAnalysisResult, ProcessingStatus, ModelProvider } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, TrendingUp, AlertCircle, FileText, Loader2, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AuditViewProps {
  session: any;
  onRequireLogin: () => void;
  modelProvider: ModelProvider;
}

const AuditView: React.FC<AuditViewProps> = ({ session, onRequireLogin, modelProvider }) => {
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [result, setResult] = useState<AuditAnalysisResult | null>(null);

  const handleAudit = async () => {
    if (!session) {
      onRequireLogin();
      return;
    }
    if (!inputText.trim()) return;
    setStatus(ProcessingStatus.PROCESSING);
    setResult(null);
    try {
      const data = await analyzeFinancialData(inputText, modelProvider);
      setResult(data);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (e) {
      console.error(e);
      setStatus(ProcessingStatus.ERROR);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-12">
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
        <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          Financial Data Analysis
        </h2>
        <p className="text-slate-500 mb-4 text-sm leading-relaxed">
          Paste financial statements, transaction logs (CSV format), or ledger entries below.
        </p>
        <textarea
          className="w-full h-40 md:h-48 p-4 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm resize-none transition-all"
          placeholder="Date, Description, Amount, Category&#10;2024-01-01, Office Supplies, -120.50, Operations..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          style={{ fontSize: '16px' }} // Prevent iOS Zoom
        />
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          {!session && (
            <div className="w-full sm:w-auto flex items-center justify-center gap-2 text-amber-600 text-sm bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
              <Lock className="w-4 h-4" />
              Login required
            </div>
          )}
          <button
            onClick={handleAudit}
            disabled={status === ProcessingStatus.PROCESSING || (!inputText.trim() && !!session)}
            className={`w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-sm ${modelProvider === 'deepseek' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {status === ProcessingStatus.PROCESSING ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
            ) : (
              'Run Audit'
            )}
          </button>
        </div>
      </div>

      {status === ProcessingStatus.ERROR && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">An error occurred during analysis. Please try again.</span>
        </div>
      )}

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary & Metrics */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-3 border-b border-slate-100 pb-2">Executive Summary</h3>
              <div className="prose prose-sm prose-slate max-w-none text-slate-600 leading-relaxed">
                <ReactMarkdown>{result.summary}</ReactMarkdown>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {result.keyMetrics.map((metric, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-full">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{metric.label}</span>
                  <div className="flex items-end justify-between mt-3">
                    <span className="text-xl md:text-2xl font-bold text-slate-800 break-all">{metric.value}</span>
                    {metric.change && (
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex-shrink-0 ml-2">
                        {metric.change}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Detected Risks
              </h3>
              <div className="space-y-4">
                {result.risks.map((risk, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border ${getSeverityColor(risk.severity)}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/60 border border-black/5 tracking-wide">
                        {risk.severity} Risk
                      </span>
                    </div>
                    <p className="font-medium text-sm mb-2 leading-snug">{risk.description}</p>
                    <p className="text-xs opacity-90"><span className="font-bold opacity-100">Fix:</span> {risk.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Visualization */}
          <div className="lg:col-span-1">
            <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-slate-200 lg:sticky lg:top-6">
              <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Visuals
              </h3>
              {result.chartData && result.chartData.length > 0 ? (
                <div className="h-56 md:h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="category" 
                        tick={{ fontSize: 10, fill: '#64748b' }} 
                        axisLine={false} 
                        tickLine={false}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={30} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{fill: '#f1f5f9'}}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {result.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4f46e5' : '#818cf8'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-slate-400 text-sm italic border-2 border-dashed border-slate-200 rounded-lg">
                  No chart data available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditView;