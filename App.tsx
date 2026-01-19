import React, { useState, useEffect, useRef } from 'react';
import { ViewState, ChatMessage, ModelProvider } from './types';
import AuditView from './components/AuditView';
import ImageView from './components/ImageView';
import LoginModal from './components/LoginView';
import ManualView from './components/ManualView';
import { sendChatMessage } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { LanguageProvider, useLanguage } from './i18n';
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
  FileText,
  Globe,
  BookOpen
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Create a wrapper component to handle the inner logic that needs useLanguage
const MainApp: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const [session, setSession] = useState<any>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [modelProvider, setModelProvider] = useState<ModelProvider>('gemini');
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat History based on language
  // If the user hasn't started chatting (history empty or only has the welcome msg), update the welcome msg when language changes.
  useEffect(() => {
    const isInitialState = chatHistory.length === 0 || (chatHistory.length === 1 && chatHistory[0].id === 'init-welcome');
    
    if (isInitialState) {
      setChatHistory([
        {
          id: 'init-welcome',
          role: 'model',
          text: t('chat.initialMessage'),
          timestamp: new Date()
        }
      ]);
    }
  }, [language, t]); 

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

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (currentView === ViewState.CHAT) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, currentView, isChatLoading]);

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
    // Login check removed to allow public access
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: chatInput,
      timestamp: new Date()
    };

    // 1. Add User Message
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    // 2. Add Placeholder Bot Message immediately
    const botMsgId = (Date.now() + 1).toString();
    const botPlaceholderMsg: ChatMessage = {
      id: botMsgId,
      role: 'model',
      text: '', // Start empty
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, botPlaceholderMsg]);

    try {
      // 3. Call Service with onChunk callback
      await sendChatMessage(
        chatHistory, 
        userMsg.text, 
        modelProvider, 
        language,
        (streamedText) => {
          // Update the specific message in history with new text
          setChatHistory(prev => {
            const newHistory = [...prev];
            const msgIndex = newHistory.findIndex(m => m.id === botMsgId);
            if (msgIndex !== -1) {
              newHistory[msgIndex] = { ...newHistory[msgIndex], text: streamedText };
            }
            return newHistory;
          });
        }
      );
    } catch (error) {
      console.error(error);
      // Optional: Update message to show error
      setChatHistory(prev => {
        const newHistory = [...prev];
        const msgIndex = newHistory.findIndex(m => m.id === botMsgId);
        if (msgIndex !== -1) {
          newHistory[msgIndex] = { ...newHistory[msgIndex], text: "Sorry, something went wrong." };
        }
        return newHistory;
      });
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
      case ViewState.MANUAL:
        return <ManualView />;
      case ViewState.CHAT:
        return (
          <div className="flex flex-col h-full bg-slate-50 md:bg-white md:rounded-xl md:shadow-sm md:border md:border-slate-200 overflow-hidden absolute inset-0 md:relative">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] md:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-600' : getBotIconColor()}`}>
                      {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                    </div>
                    <div className={`p-3 md:p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                    }`}>
                      {/* Only use ReactMarkdown if text is complete or substantial to avoid flicker on small chunks */}
                      <ReactMarkdown>{msg.text || (msg.role === 'model' && isChatLoading && msg.id === chatHistory[chatHistory.length-1].id ? '...' : '')}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              
              <div ref={chatEndRef} />
            </div>
            
            {/* Chat Input - Sticky Bottom */}
            <div className="p-3 md:p-4 bg-white border-t border-slate-200 sticky bottom-0 left-0 right-0 z-10 pb-safe">
              <form onSubmit={handleChatSubmit} className="flex gap-2 items-end">
                <input
                  type="text"
                  className="flex-1 border border-slate-300 bg-slate-50 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-base md:text-sm"
                  placeholder={`${t('chat.placeholder')} (${getBotName()})...`}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  // Prevent iOS zoom on focus
                  style={{ fontSize: '16px' }} 
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white p-3 rounded-full transition-all disabled:opacity-50 flex-shrink-0 shadow-sm"
                  title="Send"
                >
                  {isChatLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </div>
          </div>
        );
      case ViewState.DASHBOARD:
      default:
        return (
          <div className="animate-fade-in space-y-6 md:space-y-8 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div 
                onClick={() => setCurrentView(ViewState.AUDIT_TEXT)}
                className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-5 md:p-6 rounded-2xl shadow-lg text-white cursor-pointer hover:shadow-xl active:scale-95 transition-all group touch-manipulation"
              >
                <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                  <FileSearch className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t('dashboard.analyzeDataTitle')}</h3>
                <p className="text-indigo-100 text-sm">{t('dashboard.analyzeDataDesc')}</p>
              </div>

              <div 
                onClick={() => setCurrentView(ViewState.AUDIT_IMAGE)}
                className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:border-indigo-300 hover:shadow-md active:scale-95 transition-all group touch-manipulation"
              >
                <div className="bg-emerald-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                  <FileText className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{t('dashboard.docScanTitle')}</h3>
                <p className="text-slate-500 text-sm">{t('dashboard.docScanDesc')}</p>
              </div>

              <div 
                onClick={() => setCurrentView(ViewState.CHAT)}
                className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:border-indigo-300 hover:shadow-md active:scale-95 transition-all group touch-manipulation"
              >
                <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                  <MessageSquareText className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{t('dashboard.consultTitle')}</h3>
                <p className="text-slate-500 text-sm">{t('dashboard.consultDesc')}</p>
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                 <ShieldCheck className="w-8 h-8 text-indigo-600" />
                 <h2 className="text-2xl font-bold text-slate-800">{t('dashboard.readyToAudit')}</h2>
              </div>
              <p className="text-slate-600 max-w-2xl leading-relaxed">
                {t('dashboard.welcomeText')}
              </p>
            </div>
          </div>
        );
    }
  };

  if (isLoadingSession) {
    return (
      <div className="h-[100dvh] bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    // Use dvh (dynamic viewport height) for better mobile browser support
    <div className="h-[100dvh] bg-slate-50 flex overflow-hidden">
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white font-bold text-xl">
             <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
               <ShieldCheck className="w-6 h-6 text-white" />
             </div>
             {t('appTitle')}
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="md:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="px-4 py-4 space-y-2">
          {[
            { view: ViewState.DASHBOARD, icon: LayoutDashboard, label: t('nav.dashboard') },
            { view: ViewState.AUDIT_TEXT, icon: FileSearch, label: t('nav.auditText') },
            { view: ViewState.AUDIT_IMAGE, icon: ScanLine, label: t('nav.auditImage') },
            { view: ViewState.CHAT, icon: MessageSquareText, label: t('nav.chat') },
            { view: ViewState.MANUAL, icon: BookOpen, label: t('nav.manual') },
          ].map((item) => (
            <button 
              key={item.view}
              onClick={() => { setCurrentView(item.view); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium ${
                currentView === item.view 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 translate-x-1' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-slate-800 bg-slate-900">
          {session ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <span className="text-white font-semibold text-sm">{session.user.email?.[0].toUpperCase() || 'U'}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{session.user.email?.split('@')[0] || 'Auditor'}</p>
                  <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors"
                title={t('nav.signOut')}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={requireLogin}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-3.5 rounded-xl transition-colors border border-slate-700 font-medium active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              {t('nav.signIn')}
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-6 z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="md:hidden text-slate-600 p-2 -ml-2 hover:bg-slate-100 rounded-lg active:scale-90 transition-transform"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-slate-800 truncate max-w-[180px] sm:max-w-none">
              {currentView === ViewState.DASHBOARD && t('dashboard.overview')}
              {currentView === ViewState.AUDIT_TEXT && t('nav.auditText')}
              {currentView === ViewState.AUDIT_IMAGE && t('nav.auditImage')}
              {currentView === ViewState.CHAT && t('nav.chat')}
              {currentView === ViewState.MANUAL && t('nav.manual')}
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {/* Language Toggle */}
             <button
              onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
              title="Switch Language"
            >
              <Globe className="w-4 h-4" />
              <span className="text-xs font-semibold">{language === 'en' ? 'EN' : '中文'}</span>
            </button>

            {/* Model Selector */}
            <div className="flex items-center gap-2 bg-slate-50 px-2 md:px-3 py-1.5 rounded-lg border border-slate-200">
              <Cpu className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-medium text-slate-500 hidden sm:inline">{t('dashboard.modelLabel')}</span>
              <select 
                value={modelProvider}
                onChange={(e) => setModelProvider(e.target.value as ModelProvider)}
                className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer max-w-[100px] sm:max-w-none"
              >
                <option value="gemini">Gemini</option>
                <option value="gpt">GPT-4o</option>
                <option value="deepseek">DeepSeek</option>
                <option value="qwen">Qwen</option>
              </select>
            </div>
          </div>
        </header>

        {/* Content Area - Uses h-full relative to flex container */}
        <div className="flex-1 overflow-auto relative w-full">
          {currentView === ViewState.CHAT ? (
            renderContent()
          ) : (
             <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-full">
               {renderContent()}
             </div>
          )}
        </div>
      </main>
    </div>
  );
};

// Export the App wrapped in LanguageProvider
const App: React.FC = () => {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
};

export default App;