import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'zh';

export const translations = {
  en: {
    appTitle: "AuditAI",
    nav: {
      dashboard: "Dashboard",
      auditText: "Data Analysis",
      auditImage: "Document Scan",
      chat: "AI Assistant",
      signIn: "Sign In",
      signOut: "Sign Out",
      loginRequired: "Login required"
    },
    dashboard: {
      overview: "Overview",
      analyzeDataTitle: "Analyze Data",
      analyzeDataDesc: "Paste CSV or financial text for instant anomaly detection.",
      docScanTitle: "Document Scan",
      docScanDesc: "Upload invoices, receipts, or PDF documents for forensic integrity checks.",
      consultTitle: "Consult Assistant",
      consultDesc: "Chat with the AI about accounting standards and compliance.",
      readyToAudit: "Ready to Audit",
      welcomeText: "Welcome to AuditAI. This tool leverages advanced reasoning models to assist financial professionals. Start by selecting a module above. Ensure all data provided is anonymized where possible for security best practices.",
      loginPromptTitle: "Sign in to get started",
      loginPromptDesc: "Authentication is required to use AI features.",
      modelLabel: "Model:"
    },
    auditView: {
      title: "Financial Data Analysis",
      desc: "Paste financial statements, transaction logs (CSV format), or ledger entries below.",
      placeholder: "Date, Description, Amount, Category\n2024-01-01, Office Supplies, -120.50, Operations...",
      runAudit: "Run Audit",
      processing: "Processing...",
      execSummary: "Executive Summary",
      risks: "Detected Risks",
      visuals: "Visuals",
      noChart: "No chart data available",
      error: "An error occurred during analysis. Please try again.",
      riskLabel: "Risk",
      fixLabel: "Fix:"
    },
    imageView: {
      uploadTitle: "Upload Document",
      uploadDesc: "Tap to select Image or PDF",
      cameraTitle: "Use Camera",
      cameraDesc: "Take a photo of a receipt",
      selectedDoc: "Selected Document",
      analyzeNow: "Analyze Now",
      analyzing: "Analyzing...",
      auditResults: "Audit Results",
      emptyState: "Upload a file or take a photo to see forensic details here.",
      error: "Analysis failed. Try a different file.",
      pdfLabel: "PDF",
      startCamera: "Open Camera",
      capture: "Capture",
      cancel: "Cancel",
      cameraError: "Camera access denied or unavailable."
    },
    login: {
      title: "Sign in to AuditAI",
      desc: "Authentication is required to perform audits and save data.",
      google: "Continue with Google",
      github: "Continue with GitHub",
      terms: "By signing in, you agree to our Terms of Service.",
      securedBy: "Secured by Supabase Authentication."
    },
    chat: {
      placeholder: "Ask...",
      loginPlaceholder: "Log in to chat...",
      initialMessage: "Hello! I am your Financial Audit Assistant. Ask me about accounting standards, tax compliance, or help interpreting your financial data.",
      modelName: "Assistant"
    }
  },
  zh: {
    appTitle: "AuditAI 审计助手",
    nav: {
      dashboard: "仪表盘",
      auditText: "数据分析",
      auditImage: "凭证扫描",
      chat: "AI 助手",
      signIn: "登录",
      signOut: "退出",
      loginRequired: "需要登录"
    },
    dashboard: {
      overview: "概览",
      analyzeDataTitle: "数据分析",
      analyzeDataDesc: "粘贴 CSV 或财务文本以进行即时异常检测。",
      docScanTitle: "文档扫描",
      docScanDesc: "上传发票、收据或 PDF 文档进行取证完整性检查。",
      consultTitle: "咨询助手",
      consultDesc: "与 AI 聊聊会计准则和合规性问题。",
      readyToAudit: "准备审计",
      welcomeText: "欢迎使用 AuditAI。该工具利用先进的推理模型来协助财务专业人员。请从上面的模块开始。为了安全起见，请确保提供的所有数据均已匿名化。",
      loginPromptTitle: "登录以开始",
      loginPromptDesc: "使用 AI 功能需要验证身份。",
      modelLabel: "模型:"
    },
    auditView: {
      title: "财务数据分析",
      desc: "在下方粘贴财务报表、交易日志（CSV 格式）或分类账条目。",
      placeholder: "日期, 描述, 金额, 类别\n2024-01-01, 办公用品, -120.50, 运营...",
      runAudit: "运行审计",
      processing: "处理中...",
      execSummary: "执行摘要",
      risks: "检测到的风险",
      visuals: "可视化",
      noChart: "暂无图表数据",
      error: "分析过程中发生错误，请重试。",
      riskLabel: "风险",
      fixLabel: "建议:"
    },
    imageView: {
      uploadTitle: "上传文档",
      uploadDesc: "点击选择图片或 PDF",
      cameraTitle: "使用相机",
      cameraDesc: "直接拍摄发票或收据",
      selectedDoc: "已选文档",
      analyzeNow: "立即分析",
      analyzing: "分析中...",
      auditResults: "审计结果",
      emptyState: "上传文件或拍照以在此处查看取证详情。",
      error: "分析失败，请尝试其他文件。",
      pdfLabel: "PDF文档",
      startCamera: "打开相机",
      capture: "拍摄",
      cancel: "取消",
      cameraError: "无法访问相机或权限被拒绝。"
    },
    login: {
      title: "登录 AuditAI",
      desc: "执行审计和保存数据需要身份验证。",
      google: "使用 Google 继续",
      github: "使用 GitHub 继续",
      terms: "登录即表示您同意我们的服务条款。",
      securedBy: "由 Supabase 提供安全认证。"
    },
    chat: {
      placeholder: "提问...",
      loginPlaceholder: "登录后聊天...",
      initialMessage: "你好！我是你的财务审计助手。你可以问我关于会计准则、税务合规的问题，或者让我帮你解读财务数据。",
      modelName: "助手"
    }
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('auditai-lang') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'zh')) {
      setLanguage(savedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('auditai-lang', lang);
  };

  const t = (path: string) => {
    const keys = path.split('.');
    let current: any = translations[language];
    for (const key of keys) {
      if (current[key] === undefined) return path;
      current = current[key];
    }
    return current;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};