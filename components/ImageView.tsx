import React, { useState, useRef } from 'react';
import { analyzeReceiptImage } from '../services/geminiService';
import { ProcessingStatus, ModelProvider } from '../types';
import { UploadCloud, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, Lock, FileText, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ImageViewProps {
  session: any;
  onRequireLogin: () => void;
  modelProvider: ModelProvider;
}

const ImageView: React.FC<ImageViewProps> = ({ session, onRequireLogin, modelProvider }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [analysisText, setAnalysisText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setAnalysisText('');
      setStatus(ProcessingStatus.IDLE);

      // Handle preview based on file type
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null); // No preview for PDFs, we show an icon instead
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisText('');
    setStatus(ProcessingStatus.IDLE);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!session) {
      onRequireLogin();
      return;
    }
    if (!selectedFile) return;
    setStatus(ProcessingStatus.PROCESSING);
    try {
      const text = await analyzeReceiptImage(selectedFile, modelProvider);
      setAnalysisText(text);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (e) {
      console.error(e);
      setStatus(ProcessingStatus.ERROR);
    }
  };

  const isPdf = selectedFile?.type === 'application/pdf';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
      <div className="space-y-6">
        {!selectedFile ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center relative h-80 flex flex-col items-center justify-center">
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer group flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-slate-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all"
            >
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full mb-4 group-hover:bg-white group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-1">Upload Document</h3>
              <p className="text-slate-500 text-sm">Support for Images (JPG, PNG) or PDF</p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex flex-col items-center relative">
             <button 
                onClick={clearFile}
                className="absolute top-4 right-4 bg-white/80 hover:bg-white p-1 rounded-full shadow-sm text-slate-500 hover:text-red-500 transition-colors z-10"
                title="Remove file"
             >
                <X className="w-5 h-5" />
             </button>

             <div className="relative w-full h-80 overflow-hidden rounded-lg shadow-inner bg-slate-200 flex items-center justify-center">
                {isPdf ? (
                  <div className="flex flex-col items-center text-slate-500">
                    <FileText className="w-20 h-20 mb-4 text-red-500" />
                    <span className="font-medium text-lg text-slate-700">{selectedFile.name}</span>
                    <span className="text-sm uppercase mt-1">PDF Document</span>
                  </div>
                ) : (
                  <img src={previewUrl!} alt="Preview" className="w-full h-full object-contain bg-white" />
                )}
             </div>

             <div className="mt-4 w-full flex flex-col gap-2">
                {!session && (
                  <div className="flex items-center justify-center gap-2 text-amber-600 text-sm bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 mb-2">
                    <Lock className="w-4 h-4" />
                    Login required to analyze
                  </div>
                )}
                <button
                  onClick={handleAnalyze}
                  disabled={status === ProcessingStatus.PROCESSING}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {status === ProcessingStatus.PROCESSING ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing Forensic Audit...</>
                  ) : (
                    <><ImageIcon className="w-5 h-5" /> Analyze Document</>
                  )}
                </button>
             </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
         <div className="bg-white h-full min-h-[500px] p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Audit Results
            </h3>
            
            {status === ProcessingStatus.IDLE && !analysisText && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <FileText className="w-12 h-12 mb-2 opacity-20" />
                <p>Upload a PDF or Image to see forensic details here.</p>
              </div>
            )}

            {status === ProcessingStatus.ERROR && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Analysis failed.
              </div>
            )}

            {analysisText && (
              <div className="prose prose-sm prose-slate max-w-none overflow-y-auto pr-2">
                <ReactMarkdown>{analysisText}</ReactMarkdown>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default ImageView;