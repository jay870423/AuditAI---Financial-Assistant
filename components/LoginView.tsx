import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { ShieldCheck, Github, Chrome, Loader2, X } from 'lucide-react';
import { useLanguage } from '../i18n';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (provider: 'google' | 'github') => {
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