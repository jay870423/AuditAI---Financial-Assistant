import React from 'react';
import { useLanguage } from '../i18n';
import { 
  BookOpen, 
  FileText, 
  Camera, 
  MessageSquareText, 
  ShieldCheck, 
  Download, 
  Upload, 
  Play, 
  Cpu, 
  Globe, 
  HelpCircle,
  ChevronRight,
  FileSpreadsheet,
  ScanLine,
  Search,
  Zap
} from 'lucide-react';

const ManualView: React.FC = () => {
  const { language } = useLanguage();

  const content = {
    en: {
      hero: {
        title: "AuditAI User Manual",
        subtitle: "Master your intelligent financial assistant. Analyze data, detect risks, and audit documents with the power of Generative AI.",
        badge: "v1.0 Documentation"
      },
      quickStart: {
        title: "Quick Start Workflow",
        steps: [
          { title: "Sign In", desc: "Log in via WeChat or Google to unlock AI features." },
          { title: "Select Module", desc: "Choose Data Analysis, Doc Scan, or Chat." },
          { title: "Input Data", desc: "Upload Excel, photos, or ask questions." },
          { title: "Get Results", desc: "View risks, charts, and export reports." }
        ]
      },
      features: [
        {
          id: 'analysis',
          icon: FileSpreadsheet,
          color: 'text-indigo-600',
          bg: 'bg-indigo-50',
          title: "Financial Data Analysis",
          desc: "Deep dive into ledgers and transaction logs to find anomalies.",
          steps: [
            "Download the Excel Template or prepare your CSV.",
            "Paste data or import the file.",
            "Select an 'Audit Focus' (e.g., Fraud, Tax).",
            "Click 'Run Audit' to generate insights."
          ]
        },
        {
          id: 'scan',
          icon: ScanLine,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
          title: "Document Scanning",
          desc: "Forensic analysis of physical receipts, invoices, and contracts.",
          steps: [
            "Upload a PDF/Image or use the Camera.",
            "Select the document type (Receipt, Contract).",
            "AI extracts amounts, dates, and checks for forgery.",
            "Export the forensic report."
          ]
        },
        {
          id: 'chat',
          icon: MessageSquareText,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          title: "AI Consultant",
          desc: "Real-time Q&A with an AI trained on accounting standards.",
          steps: [
            "Ask about IFRS/GAAP standards.",
            "Clarify tax regulations.",
            "Ask for help interpreting analysis results.",
            "Switch models (Gemini/GPT) for second opinions."
          ]
        }
      ],
      settings: {
        title: "Settings & Configuration",
        items: [
          { icon: Globe, label: "Language", desc: "Toggle between English and Chinese via the top bar." },
          { icon: Cpu, label: "AI Model", desc: "Switch engines (Gemini, GPT-4o, DeepSeek) based on task complexity." },
          { icon: ShieldCheck, label: "Privacy", desc: "Data is used for inference only. Please anonymize sensitive info." }
        ]
      },
      tips: {
        title: "Pro Tips",
        list: [
          "For best results in Data Analysis, ensure your CSV headers are clear (Date, Amount, Category).",
          "Use 'Fraud Detection' mode on weekend transaction logs to find hidden risks.",
          "If the Camera is blurry, ensure good lighting for better OCR accuracy."
        ]
      }
    },
    zh: {
      hero: {
        title: "AuditAI 使用手册",
        subtitle: "掌握您的智能财务助手。利用生成式 AI 的力量分析数据、识别风险并审核凭证。",
        badge: "v1.0 文档"
      },
      quickStart: {
        title: "快速上手流程",
        steps: [
          { title: "登录账户", desc: "使用微信或 Google 登录以解锁 AI 功能。" },
          { title: "选择模块", desc: "选择数据分析、凭证扫描或 AI 助手。" },
          { title: "输入数据", desc: "上传 Excel、拍摄单据或提问。" },
          { title: "获取结果", desc: "查看风险提示、图表并导出报告。" }
        ]
      },
      features: [
        {
          id: 'analysis',
          icon: FileSpreadsheet,
          color: 'text-indigo-600',
          bg: 'bg-indigo-50',
          title: "财务数据分析",
          desc: "深入分析分类账和交易日志，快速发现异常情况。",
          steps: [
            "下载 Excel 模板或准备 CSV 数据。",
            "粘贴数据或直接导入 Excel 文件。",
            "选择“审计重点”（如：反欺诈、税务）。",
            "点击“运行审计”生成洞察报告。"
          ]
        },
        {
          id: 'scan',
          icon: ScanLine,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
          title: "凭证文档扫描",
          desc: "对物理收据、发票和合同进行取证分析。",
          steps: [
            "上传 PDF/图片或直接使用相机拍照。",
            "选择凭证类型（收据、合同、发票）。",
            "AI 提取金额、日期并检查篡改痕迹。",
            "导出取证分析报告。"
          ]
        },
        {
          id: 'chat',
          icon: MessageSquareText,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          title: "AI 智能咨询",
          desc: "与精通会计准则的 AI 进行实时问答。",
          steps: [
            "询问关于 IFRS/GAAP 会计准则的问题。",
            "咨询税务法规和合规性政策。",
            "让 AI 协助解读刚才的审计结果。",
            "切换模型（Gemini/GPT）获取不同视角的建议。"
          ]
        }
      ],
      settings: {
        title: "设置与配置",
        items: [
          { icon: Globe, label: "多语言支持", desc: "通过顶部导航栏切换中英文界面。" },
          { icon: Cpu, label: "AI 模型切换", desc: "根据任务复杂度切换引擎 (Gemini, GPT-4o, DeepSeek)。" },
          { icon: ShieldCheck, label: "隐私安全", desc: "数据仅用于推理。上传前请对敏感信息进行脱敏。" }
        ]
      },
      tips: {
        title: "使用小贴士",
        list: [
          "在数据分析中，确保 CSV 表头清晰（日期、金额、类别），效果最佳。",
          "对周末交易日志使用“反欺诈检测”模式，更容易发现隐藏风险。",
          "如果相机拍摄模糊，请确保光线充足，以提高 OCR 识别准确率。"
        ]
      }
    }
  };

  const t = content[language];

  return (
    <div className="animate-fade-in pb-12">
      <div className="max-w-5xl mx-auto space-y-8 md:space-y-12">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium text-indigo-200 mb-6">
              <BookOpen className="w-3 h-3" />
              {t.hero.badge}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight leading-tight">
              {t.hero.title}
            </h1>
            <p className="text-indigo-100 text-lg md:text-xl max-w-2xl leading-relaxed opacity-90">
              {t.hero.subtitle}
            </p>
          </div>
        </div>

        {/* Quick Start Workflow */}
        <div className="px-2">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-bold text-slate-800">{t.quickStart.title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {t.quickStart.steps.map((step, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group hover:shadow-md transition-all hover:border-indigo-200">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  {idx + 1}
                </div>
                <h3 className="font-bold text-slate-800 mb-1">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-snug">{step.desc}</p>
                {/* Connector Arrow (Desktop only) */}
                {idx < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10 text-slate-300">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Features Grid */}
        <div className="px-2">
           <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
             <Search className="w-6 h-6 text-indigo-600" />
             {language === 'zh' ? '核心功能详解' : 'Core Features'}
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {t.features.map((feature) => (
               <div key={feature.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-300">
                 <div className={`p-6 ${feature.bg} border-b border-slate-100`}>
                   <feature.icon className={`w-10 h-10 ${feature.color} mb-4`} />
                   <h3 className="text-xl font-bold text-slate-800">{feature.title}</h3>
                   <p className="text-slate-600 mt-2 text-sm">{feature.desc}</p>
                 </div>
                 <div className="p-6 bg-white flex-1">
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                     {language === 'zh' ? '使用步骤' : 'How to use'}
                   </h4>
                   <ul className="space-y-3">
                     {feature.steps.map((step, i) => (
                       <li key={i} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0"></div>
                         {step}
                       </li>
                     ))}
                   </ul>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* Settings & Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
          
          {/* Settings List */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Cpu className="w-6 h-6 text-slate-600" />
              {t.settings.title}
            </h3>
            <div className="space-y-6">
              {t.settings.items.map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{item.label}</h4>
                    <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Tips */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 md:p-8 rounded-2xl border border-amber-100 shadow-sm">
            <h3 className="text-xl font-bold text-amber-900 mb-6 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-amber-600" />
              {t.tips.title}
            </h3>
            <div className="space-y-4">
              {t.tips.list.map((tip, idx) => (
                <div key={idx} className="flex gap-3 bg-white/60 p-3 rounded-lg border border-amber-100/50">
                  <span className="text-amber-500 font-bold">💡</span>
                  <p className="text-sm text-amber-900/80 leading-relaxed font-medium">{tip}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="text-center text-slate-400 text-sm py-8 border-t border-slate-200 mx-2">
          AuditAI Documentation &copy; {new Date().getFullYear()}
        </div>

      </div>
    </div>
  );
};

export default ManualView;
