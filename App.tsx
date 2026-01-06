import React, { useState, useEffect } from 'react';
import { ViewState, ChatMessage, ModelProvider } from './types';
import AuditView from './components/AuditView';
import ImageView from './components/ImageView';
import LoginModal from './components/LoginView';
import { sendChatMessage } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { 
  LayoutDashboard, 
  FileSearch, 
  ScanLine, 
  MessageSquareText, 
  ShieldCheck, 
  Menu,
  X,
  Send,
  User,
  Bot,
  LogOut,
  LogIn,
  Loader2,
  Cpu,
  FileText
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [modelProvider, setModelProvider] = useState<ModelProvider>('gemini');
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: 'Hello! I am your Financial Audit Assistant. Ask me about accounting standards, tax compliance, or help interpreting your financial data.',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
      } catch (error) {
        console.warn("Error checking session:", error);
      } finally {
        setIsLoadingSession(false);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setIsLoginModalOpen(false); // Close modal on successful login
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const requireLogin = () => {
    setIsLoginModalOpen(true);
  };

  const getBotIconColor = () => {
    switch(modelProvider) {
      case 'deepseek': return 'bg-blue-700';
      case 'gpt': return 'bg-green-600';
      case 'qwen': return 'bg-purple-600';
      default: return 'bg-emerald-600'; // Gemini
    }
  };

  const getBotName = () => {
    switch(modelProvider) {
      case 'deepseek': return 'DeepSeek';
      case 'gpt': return 'GPT-4o';
      case 'qwen': return 'Qwen';
      default: return 'Gemini';
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      requireLogin();
      return;
    }
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: chatInput,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const responseText = await sendChatMessage(chatHistory, userMsg.text, modelProvider);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsChatLoading(false);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.AUDIT_TEXT:
        return <AuditView session={session} onRequireLogin={requireLogin} modelProvider={modelProvider} />;
      case ViewState.AUDIT_IMAGE:
        return <ImageView session={session} onRequireLogin={requireLogin} modelProvider={modelProvider} />;
      case ViewState.CHAT:
        return (
          <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
              {chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-600' : getBotIconColor()}`}>
                      {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                    }`}>
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                   <div className="flex gap-3 max-w-[80%]">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getBotIconColor()}`}>
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                   </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-white border-t border-slate-200">
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={session ? `Ask ${getBotName()} a question...` : "Log in to chat with the assistant..."}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={!session}
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg transition-colors disabled:opacity-50"
                  title={!session ? "Login required" : "Send"}
                  onClick={(e) => {
                    if (!session) {
                      e.preventDefault();
                      requireLogin();
                    }
                  }}
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        );
      case ViewState.DASHBOARD:
      default:
        return (
          <div className="animate-fade-in space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div 
                onClick={() => setCurrentView(ViewState.AUDIT_TEXT)}
                className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl shadow-lg text-white cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all group"
              >
                <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                  <FileSearch className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Analyze Data</h3>
                <p className="text-indigo-100 text-sm">Paste CSV or financial text for instant anomaly detection and risk assessment.</p>
              </div>

              <div 
                onClick={() => setCurrentView(ViewState.AUDIT_IMAGE)}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group"
              >
                <div className="bg-emerald-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                  <FileText className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Document Scan</h3>
                <p className="text-slate-500 text-sm">Upload invoices, receipts, or PDF documents for forensic integrity checks.</p>
              </div>

              <div 
                onClick={() => setCurrentView(ViewState.CHAT)}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group"
              >
                <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                  <MessageSquareText className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Consult Assistant</h3>
                <p className="text-slate-500 text-sm">Chat with the AI about accounting standards, compliance, and regulations.</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                 <ShieldCheck className="w-8 h-8 text-indigo-600" />
                 <h2 className="text-2xl font-bold text-slate-800">Ready to Audit</h2>
              </div>
              <p className="text-slate-600 max-w-2xl leading-relaxed">
                Welcome to AuditAI. This tool leverages advanced reasoning models to assist financial professionals. 
                Start by selecting a module above. Ensure all data provided is anonymized where possible for security best practices.
              </p>
              
              {!session && (
                 <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-indigo-900">Sign in to get started</p>
                      <p className="text-sm text-indigo-700">Authentication is required to use AI features.</p>
                    </div>
                    <button 
                      onClick={requireLogin}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Sign In
                    </button>
                 </div>
              )}
            </div>
          </div>
        );
    }
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      
      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-xl">
             <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
               <ShieldCheck className="w-5 h-5 text-white" />
             </div>
             AuditAI
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="px-4 py-4 space-y-2">
          <button 
            onClick={() => { setCurrentView(ViewState.DASHBOARD); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === ViewState.DASHBOARD ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button 
            onClick={() => { setCurrentView(ViewState.AUDIT_TEXT); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === ViewState.AUDIT_TEXT ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <FileSearch className="w-5 h-5" />
            Data Analysis
          </button>
          <button 
            onClick={() => { setCurrentView(ViewState.AUDIT_IMAGE); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === ViewState.AUDIT_IMAGE ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <ScanLine className="w-5 h-5" />
            Document Scan
          </button>
          <button 
            onClick={() => { setCurrentView(ViewState.CHAT); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === ViewState.CHAT ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <MessageSquareText className="w-5 h-5" />
            AI Assistant
          </button>
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-slate-800">
          {session ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold">{session.user.email?.[0].toUpperCase() || 'U'}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{session.user.email?.split('@')[0] || 'Auditor'}</p>
                  <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-white transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={requireLogin}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg transition-colors border border-slate-700"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-slate-600">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-slate-800">
              {currentView === ViewState.DASHBOARD && 'Overview'}
              {currentView === ViewState.AUDIT_TEXT && 'Financial Data Audit'}
              {currentView === ViewState.AUDIT_IMAGE && 'Document Forensic Audit'}
              {currentView === ViewState.CHAT && 'Consultation Assistant'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Model Selector */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Cpu className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-medium text-slate-500">Model:</span>
              <select 
                value={modelProvider}
                onChange={(e) => setModelProvider(e.target.value as ModelProvider)}
                className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="gemini">Gemini 3 Flash</option>
                <option value="gpt">GPT-4o</option>
                <option value="deepseek">DeepSeek V3</option>
                <option value="qwen">Qwen Max</option>
              </select>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
             {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;