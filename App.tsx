
import React, { useState } from 'react';
import { AppStep, Transformation } from './types.ts';
import FileUploader from './components/FileUploader.tsx';
import { useDataWorker } from './hooks/useDataWorker.ts';
import CleansingWorkbench from './components/CleansingWorkbench.tsx';
import DownloadStep from './components/DownloadStep.tsx';
import ProModal from './components/ProModal.tsx';
import { DataCleanseLogo } from './components/icons.tsx';

function App() {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [file, setFile] = useState<File | null>(null);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const { workerState, postMessage, resetState } = useDataWorker();

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    postMessage('parse', { file: selectedFile });
    setStep(AppStep.CLEANSE);
  };

  const handleApplyCleansing = (transformations: Transformation[]) => {
    postMessage('cleanse', { transformations });
    setStep(AppStep.DOWNLOAD);
  };
  
  const handleStartOver = () => {
      setFile(null);
      resetState();
      setStep(AppStep.UPLOAD);
  }

  return (
    <div className="min-h-screen selection:bg-plasma selection:text-obsidian flex flex-col font-sans">
        <ProModal isOpen={isProModalOpen} onClose={() => setIsProModalOpen(false)} />
        
        {/* Laboratory Orchestrator Header */}
        <header className="fixed top-0 left-0 right-0 z-50 px-12 py-8 glass-panel border-b border-white/5">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-8 cursor-pointer group" onClick={handleStartOver}>
                    <div className="relative">
                        {/* Dynamic glow effect following the logo */}
                        <div className="absolute inset-0 bg-plasma blur-2xl opacity-0 group-hover:opacity-30 transition-all duration-700"></div>
                        <DataCleanseLogo />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-extrabold tracking-tighter text-white leading-none">DATACLEANSE<span className="text-plasma italic">.</span></h1>
                        <p className="text-[10px] font-black text-slate-600 tracking-[0.5em] uppercase mt-2">Privacy-Hardened Ingestion Hub</p>
                    </div>
                </div>

                <div className="flex items-center gap-12">
                    {file && (
                        <div className="hidden lg:flex items-center gap-8 px-10 py-4.5 bg-obsidian/60 rounded-[1.75rem] border border-white/5 text-[10px] font-bold shadow-xl">
                            <span className="text-slate-700 uppercase tracking-widest font-black">ACTIVE BATCH:</span>
                            <span className="text-plasma truncate max-w-[200px] font-black">{file.name}</span>
                            <div className="w-[1px] h-4 bg-white/10"></div>
                            <span className="text-white tracking-[0.2em] font-black uppercase">{workerState.totalRows.toLocaleString()} ENTRIES</span>
                        </div>
                    )}
                    <button 
                        onClick={() => setIsProModalOpen(true)}
                        className="px-12 py-5 rounded-[1.5rem] bg-white text-slate-950 font-display font-black text-[10px] uppercase tracking-[0.3em] hover:bg-plasma transition-all duration-500 shadow-2xl active:scale-95"
                    >
                        Master Access
                    </button>
                </div>
            </div>
        </header>

        <main className="pt-48 flex-grow flex flex-col items-center px-10">
            {step === AppStep.UPLOAD && (
                <FileUploader 
                    onFileSelect={handleFileSelect} 
                    onShowProModal={() => setIsProModalOpen(true)} 
                    isProcessing={workerState.isProcessing} 
                />
            )}

            {step === AppStep.CLEANSE && !workerState.isProcessing && workerState.headers.length > 0 && (
                <CleansingWorkbench
                    headers={workerState.headers}
                    previewData={workerState.preview}
                    profile={workerState.profile}
                    totalRows={workerState.totalRows}
                    fileName={file?.name || 'input'}
                    onApplyCleansing={handleApplyCleansing}
                    onShowProModal={() => setIsProModalOpen(true)}
                    isProcessing={workerState.isProcessing}
                />
            )}

            {step === AppStep.DOWNLOAD && workerState.summary && (
                 <DownloadStep
                    summary={workerState.summary}
                    downloadUrls={workerState.downloadUrls}
                    cleansedPreview={workerState.cleansedPreview}
                    headers={workerState.headers}
                    fileName={file?.name || 'artifact_refined'}
                    onStartOver={handleStartOver}
                 />
            )}

            {workerState.isProcessing && (
                <div className="flex flex-col items-center justify-center py-64 animate-in zoom-in duration-700">
                    <div className="w-28 h-28 relative mb-16">
                        <div className="absolute inset-0 border-[6px] border-plasma/10 rounded-[2rem] rotate-45"></div>
                        <div className="absolute inset-0 border-[6px] border-plasma border-t-transparent rounded-[2rem] animate-spin rotate-45 shadow-[0_0_40px_rgba(190,242,100,0.2)]"></div>
                    </div>
                    <p className="text-plasma font-display font-black text-xs uppercase tracking-[0.6em] animate-pulse">Initializing Synthesis Pipeline</p>
                </div>
            )}
            
            {workerState.error && !workerState.isProcessing && (
                <div className="p-24 glass-panel rounded-[4.5rem] border-infrared/20 max-w-2xl text-center shadow-2xl">
                    <h3 className="text-5xl font-display font-extrabold text-infrared mb-8 uppercase tracking-tight">System Exception</h3>
                    <p className="text-chrome mb-16 font-medium text-lg leading-relaxed">{workerState.error}</p>
                    <button onClick={handleStartOver} className="px-16 py-6 bg-white/5 text-white font-display font-black text-[11px] uppercase tracking-[0.4em] rounded-[1.75rem] hover:bg-white/10 transition-all border border-white/10">
                        Reset Orchestrator &crarr;
                    </button>
                </div>
            )}
        </main>

        <footer className="py-24 px-12 border-t border-white/5 bg-slate-950 mt-40">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-16">
                <div className="flex flex-col items-center md:items-start">
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.6em]">
                        Industrial Data Synthesis • Zero-Knowledge Architecture
                    </p>
                    <p className="text-[9px] text-slate-800 font-bold mt-4 uppercase tracking-[0.3em]">© 2025 DATACLEANSE GLOBAL • ALPHA PROTOCOL</p>
                </div>
                <div className="flex gap-16 text-[11px] font-black text-slate-600 uppercase tracking-[0.4em]">
                    <a href="#" className="hover:text-plasma transition-colors duration-500">Security</a>
                    <a href="#" className="hover:text-violet transition-colors duration-500">Manifesto</a>
                    <a href="#" className="hover:text-white transition-colors duration-500">REL-3.1</a>
                </div>
            </div>
        </footer>
    </div>
  );
}

export default App;
