import React, { useState, useRef } from 'react';
import { analyzeFinancialData } from '../services/geminiService';
import { AuditAnalysisResult, ProcessingStatus, ModelProvider, AuditScenario } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, TrendingUp, AlertCircle, FileText, Loader2, Lock, Printer, Download, ScanSearch, FileSpreadsheet, Upload } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../i18n';
import * as XLSX from 'xlsx';

interface AuditViewProps {
  session: any;
  onRequireLogin: () => void;
  modelProvider: ModelProvider;
}

const AuditView: React.FC<AuditViewProps> = ({ session, onRequireLogin, modelProvider }) => {
  const { t, language } = useLanguage();
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [result, setResult] = useState<AuditAnalysisResult | null>(null);
  const [scenario, setScenario] = useState<AuditScenario>('general');
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAudit = async () => {
    if (!session) {
      onRequireLogin();
      return;
    }
    if (!inputText.trim()) return;
    setStatus(ProcessingStatus.PROCESSING);
    setResult(null);
    try {
      const data = await analyzeFinancialData(inputText, modelProvider, language, scenario);
      setResult(data);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (e) {
      console.error(e);
      setStatus(ProcessingStatus.ERROR);
    }
  };

  const handleExport = () => {
    if (printRef.current) {
      window.print();
    }
  };

  // Function to generate and download Excel template
  const handleDownloadTemplate = () => {
    const headers = [
      { 
        Date: '2024-03-01', 
        Description: 'Office Rent March', 
        Amount: -2500.00, 
        Category: 'Rent',
        Note: 'Recurring'
      },
      { 
        Date: '2024-03-05', 
        Description: 'Client Payment - ACME Corp', 
        Amount: 5000.00, 
        Category: 'Revenue',
        Note: 'Invoice #1024'
      },
      { 
        Date: '2024-03-10', 
        Description: 'Team Lunch', 
        Amount: -150.50, 
        Category: 'Meals',
        Note: 'Project Kickoff'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(headers);
    
    // Set column widths for better UX
    const wscols = [
      {wch: 12}, // Date
      {wch: 30}, // Description
      {wch: 12}, // Amount
      {wch: 15}, // Category
      {wch: 20}  // Note
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Financial Data");
    XLSX.writeFile(wb, t('auditView.templateFileName'));
  };

  // Function to handle Excel file upload and parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Convert to CSV for the AI model (AI handles CSV string better than raw JSON mostly for token efficiency in prompt)
        const csvData = XLSX.utils.sheet_to_csv(ws);
        setInputText(csvData);
        
        // Clear input to allow re-uploading same file if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
        console.error("Error parsing Excel:", error);
        alert(t('auditView.error'));
      }
    };
    reader.readAsBinaryString(file);
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
      {/* Input Section (Hidden when printing) */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              {t('auditView.title')}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {t('auditView.desc')}
            </p>
          </div>
          
          {/* Template Actions */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors border border-emerald-100"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">{t('auditView.downloadTemplate')}</span>
              <span className="sm:hidden">Template</span>
            </button>
            
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors border border-indigo-100"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">{t('auditView.importExcel')}</span>
              <span className="sm:hidden">Import</span>
            </button>
          </div>
        </div>
        
        <textarea
          className="w-full h-40 md:h-48 p-4 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm resize-none transition-all"
          placeholder={t('auditView.placeholder')}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          style={{ fontSize: '16px' }} // Prevent iOS Zoom
        />
        
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">{t('auditView.scenarioLabel')}</span>
             <div className="relative w-full sm:w-48">
               <select 
                 value={scenario}
                 onChange={(e) => setScenario(e.target.value as AuditScenario)}
                 className="appearance-none w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-lg pl-3 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
               >
                 <option value="general">{t('auditView.scenarios.general')}</option>
                 <option value="fraud">{t('auditView.scenarios.fraud')}</option>
                 <option value="tax">{t('auditView.scenarios.tax')}</option>
                 <option value="compliance">{t('auditView.scenarios.compliance')}</option>
               </select>
               <ScanSearch className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
             </div>
          </div>

          {!session && (
            <div className="w-full sm:w-auto flex items-center justify-center gap-2 text-amber-600 text-sm bg-amber-50 px-3 py-2.5 rounded-lg border border-amber-100">
              <Lock className="w-4 h-4" />
              {t('nav.loginRequired')}
            </div>
          )}
          
          <button
            onClick={handleAudit}
            disabled={status === ProcessingStatus.PROCESSING || (!inputText.trim() && !!session)}
            className={`w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-sm ${modelProvider === 'deepseek' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {status === ProcessingStatus.PROCESSING ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {t('auditView.processing')}</>
            ) : (
              t('auditView.runAudit')
            )}
          </button>
        </div>
      </div>

      {status === ProcessingStatus.ERROR && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{t('auditView.error')}</span>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div ref={printRef} className="print:p-8 print:bg-white print:text-black">
          {/* Print Header - Only visible when printing */}
          <div className="hidden print:block mb-8 border-b-2 border-slate-800 pb-4">
            <h1 className="text-2xl font-bold">AuditAI - Financial Audit Report</h1>
            <div className="flex justify-between mt-2 text-sm text-slate-600">
              <span>Date: {new Date().toLocaleDateString()}</span>
              <span>Scenario: {t(`auditView.scenarios.${scenario}`)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4 print:hidden">
             <h3 className="font-bold text-slate-700 text-lg">Analysis Result</h3>
             <button 
               onClick={handleExport}
               className="flex items-center gap-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
             >
               <Printer className="w-4 h-4" />
               {t('auditView.exportReport')}
             </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
            {/* Summary & Metrics */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6 print:space-y-8">
              <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0">
                <h3 className="font-semibold text-slate-800 mb-3 border-b border-slate-100 pb-2 print:text-xl print:border-slate-800 print:mb-4">{t('auditView.execSummary')}</h3>
                <div className="prose prose-sm prose-slate max-w-none text-slate-600 leading-relaxed print:text-black">
                  <ReactMarkdown>{result.summary}</ReactMarkdown>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-3 print:gap-8">
                {result.keyMetrics.map((metric, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-full print:border print:border-slate-300 print:shadow-none">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 print:text-slate-600">{metric.label}</span>
                    <div className="flex items-end justify-between mt-3">
                      <span className="text-xl md:text-2xl font-bold text-slate-800 break-all print:text-black">{metric.value}</span>
                      {metric.change && (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex-shrink-0 ml-2 print:border print:border-emerald-200">
                          {metric.change}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0 print:mt-8">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 print:text-xl print:border-b print:border-slate-800 print:pb-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  {t('auditView.risks')}
                </h3>
                <div className="space-y-4">
                  {result.risks.map((risk, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border ${getSeverityColor(risk.severity)} print:border-slate-300 print:bg-white print:text-black`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/60 border border-black/5 tracking-wide print:border-slate-400">
                          {risk.severity} {t('auditView.riskLabel')}
                        </span>
                      </div>
                      <p className="font-medium text-sm mb-2 leading-snug">{risk.description}</p>
                      <p className="text-xs opacity-90"><span className="font-bold opacity-100">{t('auditView.fixLabel')}</span> {risk.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Visualization */}
            <div className="lg:col-span-1 print:mt-8 print:break-inside-avoid">
              <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-slate-200 lg:sticky lg:top-6 print:shadow-none print:border-none print:p-0">
                <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2 print:text-xl print:border-b print:border-slate-800 print:pb-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  {t('auditView.visuals')}
                </h3>
                {result.chartData && result.chartData.length > 0 ? (
                  <div className="h-56 md:h-64 w-full print:h-96">
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
                    {t('auditView.noChart')}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="hidden print:block mt-12 text-center text-xs text-slate-400 border-t pt-4">
             Generated by AuditAI - Powered by Advanced Generative Models
          </div>
        </div>
      )}
      
      {/* Global Print Styles to Hide UI Elements */}
      <style>{`
        @media print {
          @page { margin: 1.5cm; }
          body { background: white; -webkit-print-color-adjust: exact; }
          nav, aside, header, button, .no-print { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:hidden { display: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:text-black { color: black !important; }
        }
      `}</style>
    </div>
  );
};

export default AuditView;