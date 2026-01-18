import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { ShieldCheck, Github, Chrome, Loader2, X } from 'lucide-react';
import { useLanguage } from '../i18n';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Simple WeChat Icon Component since it's not in Lucide
const WeChatIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M8.69 16.59C8.69 16.59 5.8 19.34 3.32 19.53C3.32 19.53 4.29 18.25 4.51 17.38C2.56 16.03 1.25 14.12 1.25 12C1.25 7.91 5.31 4.58 10.32 4.58C11.53 4.58 12.69 4.79 13.78 5.17C13.62 5.71 13.53 6.28 13.53 6.87C13.53 10.59 17.15 13.61 21.61 13.61C22.06 13.61 22.5 13.58 22.92 13.52C22.84 16.32 19.66 18.53 15.86 18.53C15.42 18.53 15 18.49 14.59 18.42C14.12 19.46 12.87 21.34 12.87 21.34C12.87 21.34 9.4 20.84 8.69 16.59ZM6.9 9.69C7.39 9.69 7.78 9.29 7.78 8.8C7.78 8.31 7.39 7.91 6.9 7.91C6.41 7.91 6.01 8.31 6.01 8.8C6.01 9.29 6.41 9.69 6.9 9.69ZM11.13 9.69C11.62 9.69 12.01 9.29 12.01 8.8C12.01 8.31 11.62 7.91 11.13 7.91C10.64 7.91 10.25 8.31 10.25 8.8C10.25 9.29 10.64 9.69 11.13 9.69ZM21.92 6.87C21.92 9.4 18.17 11.45 13.53 11.45C8.9 11.45 5.14 9.4 5.14 6.87C5.14 4.34 8.9 2.29 13.53 2.29C18.17 2.29 21.92 4.34 21.92 6.87ZM17.28 5.67C16.94 5.67 16.66 5.95 16.66 6.29C16.66 6.63 16.94 6.91 17.28 6.91C17.62 6.91 17.9 6.63 17.9 6.29C17.9 5.95 17.62 5.67 17.28 5.67ZM19.89 5.67C19.55 5.67 19.27 5.95 19.27 6.29C19.27 6.63 19.55 6.91 19.89 6.91C20.23 6.91 20.51 6.63 20.51 6.29C20.51 5.95 20.23 5.67 19.89 5.67Z" />
  </svg>
);

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (provider: 'google' | 'github' | 'wechat') => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Login error:", error);
      setErrorMsg(error.message || 'Failed to login');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white p-8 rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full text-center space-y-8 transform transition-all scale-100">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('login.title')}</h1>
            <p className="text-slate-500 mt-2">{t('login.desc')}</p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => handleLogin('wechat')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-[#07C160] text-white hover:bg-[#06ad56] px-6 py-3.5 rounded-xl font-medium transition-all focus:ring-2 focus:ring-green-400 disabled:opacity-50 shadow-sm"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <WeChatIcon className="w-5 h-5" />}
            {t('login.wechat')}
          </button>

          <button
            onClick={() => handleLogin('google')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 px-6 py-3.5 rounded-xl font-medium transition-all focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Chrome className="w-5 h-5 text-red-500" />}
            {t('login.google')}
          </button>

          <button
            onClick={() => handleLogin('github')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-[#24292F] text-white hover:bg-[#24292F]/90 px-6 py-3.5 rounded-xl font-medium transition-all focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Github className="w-5 h-5" />}
            {t('login.github')}
          </button>
        </div>

        <p className="text-xs text-slate-400">
          {t('login.terms')}<br/>
          {t('login.securedBy')}
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
