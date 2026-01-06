import React, { useState, useRef } from 'react';
import { analyzeReceiptImage } from '../services/geminiService';
import { ProcessingStatus, ModelProvider } from '../types';
import { UploadCloud, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, Lock, FileText, X, ChevronRight } from 'lucide-react';
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 animate-fade-in pb-12">
      <div className="space-y-4 md:space-y-6">
        {!selectedFile ? (
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 text-center relative h-64 md:h-80 flex flex-col items-center justify-center">
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer group flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 active:bg-indigo-50 active:scale-[0.98] transition-all touch-manipulation"
            >
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full mb-4 group-hover:bg-white group-hover:scale-110 transition-transform shadow-sm">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Upload Document</h3>
              <p className="text-slate-500 text-sm px-4">Tap to select Image or PDF</p>
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden">
             <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                <h3 className="font-semibold text-slate-700 text-sm">Selected Document</h3>
                <button 
                  onClick={clearFile}
                  className="bg-slate-100 hover:bg-slate-200 p-2 rounded-full text-slate-500 hover:text-red-500 transition-colors"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
             </div>

             <div className="relative w-full h-56 md:h-80 overflow-hidden rounded-xl bg-slate-100 flex items-center justify-center border border-slate-100">
                {isPdf ? (
                  <div className="flex flex-col items-center text-slate-500 p-4 text-center">
                    <FileText className="w-16 h-16 mb-2 text-red-500 drop-shadow-sm" />
                    <span className="font-medium text-slate-700 truncate max-w-[200px]">{selectedFile.name}</span>
                    <span className="text-xs uppercase mt-1 bg-slate-200 px-2 py-0.5 rounded text-slate-600">PDF</span>
                  </div>
                ) : (
                  <img src={previewUrl!} alt="Preview" className="w-full h-full object-contain" />
                )}
             </div>

             <div className="mt-4 w-full flex flex-col gap-3">
                {!session && (
                  <div className="flex items-center justify-center gap-2 text-amber-600 text-sm bg-amber-50 px-3 py-2.5 rounded-lg border border-amber-100">
                    <Lock className="w-4 h-4" />
                    Login required
                  </div>
                )}
                <button
                  onClick={handleAnalyze}
                  disabled={status === ProcessingStatus.PROCESSING}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-sm"
                >
                  {status === ProcessingStatus.PROCESSING ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</>
                  ) : (
                    <><ImageIcon className="w-5 h-5" /> Analyze Now</>
                  )}
                </button>
             </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
         <div className="bg-white h-full min-h-[300px] md:min-h-[500px] p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Audit Results
            </h3>
            
            {status === ProcessingStatus.IDLE && !analysisText && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <FileText className="w-12 h-12 mb-3 opacity-20" />
                <p>Upload a file and tap analyze to see forensic details here.</p>
              </div>
            )}

            {status === ProcessingStatus.ERROR && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" /> 
                <span className="text-sm font-medium">Analysis failed. Try a different file.</span>
              </div>
            )}

            {analysisText && (
              <div className="prose prose-sm prose-slate max-w-none overflow-y-auto pr-1 leading-relaxed">
                <ReactMarkdown>{analysisText}</ReactMarkdown>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default ImageView;