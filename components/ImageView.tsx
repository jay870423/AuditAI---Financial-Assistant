import React, { useState, useRef, useEffect } from 'react';
import { analyzeReceiptImage } from '../services/geminiService';
import { ProcessingStatus, ModelProvider, AuditScenario } from '../types';
import { UploadCloud, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, Lock, FileText, X, Camera, Aperture, ScanSearch, Printer } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../i18n';

interface ImageViewProps {
  session: any;
  onRequireLogin: () => void;
  modelProvider: ModelProvider;
}

const ImageView: React.FC<ImageViewProps> = ({ session, onRequireLogin, modelProvider }) => {
  const { t, language } = useLanguage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [analysisText, setAnalysisText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [scenario, setScenario] = useState<AuditScenario>('general');
  const printRef = useRef<HTMLDivElement>(null);

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      processFile(event.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    setAnalysisText('');
    setErrorMessage('');
    setStatus(ProcessingStatus.IDLE);

    // Handle preview based on file type
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null); // No preview for PDFs
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisText('');
    setErrorMessage('');
    setStatus(ProcessingStatus.IDLE);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startCamera = async () => {
    setCameraError('');
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera API not supported in this context. Please use HTTPS or localhost.");
      return;
    }

    try {
      // Try with environment facing mode first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch (err: any) {
      console.warn("Camera environment mode failed, trying default:", err);
      // Fallback to any video device if environment fails (e.g. laptop)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        setIsCameraOpen(true);
      } catch (fallbackErr: any) {
        console.error("Camera access error:", fallbackErr);
        if (fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError') {
             setCameraError("Permission denied. Please allow camera access in your browser settings.");
        } else {
             setCameraError(t('imageView.cameraError'));
        }
      }
    }
  };

  // Effect to attach stream to video element when camera opens
  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
            processFile(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const handleAnalyze = async () => {
    // Login check removed to allow public access
    if (!selectedFile) return;
    setStatus(ProcessingStatus.PROCESSING);
    setErrorMessage('');
    try {
      const text = await analyzeReceiptImage(selectedFile, modelProvider, language, scenario);
      setAnalysisText(text);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (e: any) {
      console.error(e);
      setStatus(ProcessingStatus.ERROR);
      setErrorMessage(e.message || t('imageView.error'));
    }
  };

  const handleExport = () => {
    window.print();
  };

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const isPdf = selectedFile?.type === 'application/pdf';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 animate-fade-in pb-12 relative">
      
      {/* Camera Overlay */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col h-safe-screen">
           <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
             <video 
               ref={videoRef} 
               autoPlay 
               playsInline
               muted
               className="w-full h-full object-cover"
             />
             <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-full border-[50px] border-black/40 relative">
                   <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/80 m-4"></div>
                   <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/80 m-4"></div>
                   <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/80 m-4"></div>
                   <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/80 m-4"></div>
                </div>
             </div>
           </div>
           
           <div className="bg-black flex items-center justify-between px-8 py-6 pb-safe">
              <button 
                onClick={stopCamera}
                className="text-white font-medium px-4 py-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
              >
                {t('imageView.cancel')}
              </button>
              
              <button 
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
                title={t('imageView.capture')}
              >
                 <div className="w-14 h-14 bg-white rounded-full border-2 border-black"></div>
              </button>

              <div className="w-16 text-right"></div>
           </div>
        </div>
      )}

      {/* Input Section - Hidden on Print */}
      <div className="space-y-4 md:space-y-6 print:hidden">
        {cameraError && (
          <div className="p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{cameraError}</span>
          </div>
        )}

        {!selectedFile ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-auto md:h-80">
            {/* Upload Option */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center flex flex-col items-center justify-center relative touch-manipulation">
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer group flex flex-col items-center justify-center w-full h-full p-4 rounded-xl hover:bg-indigo-50 active:scale-[0.98] transition-all"
              >
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full mb-4 group-hover:bg-white group-hover:scale-110 transition-transform shadow-sm">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">{t('imageView.uploadTitle')}</h3>
                <p className="text-slate-500 text-sm">{t('imageView.uploadDesc')}</p>
              </div>
            </div>

            {/* Camera Option */}
            <div 
              onClick={startCamera}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center flex flex-col items-center justify-center cursor-pointer group hover:border-emerald-500 hover:bg-emerald-50 active:scale-[0.98] transition-all touch-manipulation"
            >
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full mb-4 group-hover:bg-white group-hover:scale-110 transition-transform shadow-sm">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">{t('imageView.cameraTitle')}</h3>
              <p className="text-slate-500 text-sm">{t('imageView.cameraDesc')}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden">
             <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                <h3 className="font-semibold text-slate-700 text-sm">{t('imageView.selectedDoc')}</h3>
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
                    <span className="text-xs uppercase mt-1 bg-slate-200 px-2 py-0.5 rounded text-slate-600">{t('imageView.pdfLabel')}</span>
                  </div>
                ) : (
                  <img src={previewUrl!} alt="Preview" className="w-full h-full object-contain" />
                )}
             </div>

             <div className="mt-4 w-full flex flex-col gap-3">
                <div className="flex items-center gap-2 w-full">
                     <div className="relative w-full">
                       <select 
                         value={scenario}
                         onChange={(e) => setScenario(e.target.value as AuditScenario)}
                         className="appearance-none w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg pl-3 pr-8 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                       >
                         <option value="general">{t('imageView.scenarios.general')}</option>
                         <option value="fraud">{t('imageView.scenarios.fraud')}</option>
                         <option value="tax">{t('imageView.scenarios.tax')}</option>
                         <option value="compliance">{t('imageView.scenarios.compliance')}</option>
                       </select>
                       <ScanSearch className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                     </div>
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={status === ProcessingStatus.PROCESSING}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-sm"
                >
                  {status === ProcessingStatus.PROCESSING ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> {t('imageView.analyzing')}</>
                  ) : (
                    <><Aperture className="w-5 h-5" /> {t('imageView.analyzeNow')}</>
                  )}
                </button>
             </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
         <div className="bg-white h-full min-h-[300px] md:min-h-[500px] p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col print:shadow-none print:border-none print:p-0">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4 print:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 print:text-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 print:hidden" />
                {t('imageView.auditResults')}
              </h3>
              {analysisText && (
                <button 
                 onClick={handleExport}
                 className="flex items-center gap-2 text-slate-600 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors print:hidden"
                >
                 <Printer className="w-3.5 h-3.5" />
                 {t('imageView.exportReport')}
                </button>
              )}
            </div>
            
            {status === ProcessingStatus.IDLE && !analysisText && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-4 text-center print:hidden">
                <FileText className="w-12 h-12 mb-3 opacity-20" />
                <p>{t('imageView.emptyState')}</p>
              </div>
            )}

            {status === ProcessingStatus.ERROR && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 print:hidden">
                <AlertCircle className="w-5 h-5 flex-shrink-0" /> 
                <span className="text-sm font-medium">{errorMessage}</span>
              </div>
            )}

            {analysisText && (
              <div className="prose prose-sm prose-slate max-w-none overflow-y-auto pr-1 leading-relaxed print:text-black">
                {/* Print Header inside result area */}
                <div className="hidden print:block mb-4">
                  <h1 className="text-xl font-bold">Document Audit Report</h1>
                  <p className="text-xs text-slate-500">Mode: {t(`imageView.scenarios.${scenario}`)} | Date: {new Date().toLocaleDateString()}</p>
                </div>
                
                {/* Image Print Preview */}
                {selectedFile && !isPdf && previewUrl && (
                  <div className="hidden print:block mb-6 w-1/2 mx-auto border border-slate-300 rounded-lg p-2">
                    <img src={previewUrl} className="w-full object-contain max-h-60" alt="Audit Evidence" />
                    <p className="text-center text-xs text-slate-500 mt-1">Audit Evidence: {selectedFile.name}</p>
                  </div>
                )}
                
                <ReactMarkdown>{analysisText}</ReactMarkdown>
                
                <div className="hidden print:block mt-8 pt-4 border-t text-xs text-slate-400 text-center">
                  Generated by AuditAI
                </div>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default ImageView;