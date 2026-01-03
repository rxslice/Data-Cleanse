
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons.tsx';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  onShowProModal: () => void;
  isProcessing: boolean;
}

const FREE_TIER_LIMIT_KB = 10240; // 10MB
const FREE_TIER_LIMIT_BYTES = FREE_TIER_LIMIT_KB * 1024;

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, onShowProModal, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File | null) => {
    setError(null);
    if (file) {
      if (file.size > FREE_TIER_LIMIT_BYTES) {
        setError(`Payload size exceeds baseline security thresholds (${FREE_TIER_LIMIT_KB / 1024}MB).`);
        onShowProModal();
        return;
      }
      onFileSelect(file);
    }
  }, [onFileSelect, onShowProModal]);

  return (
    <div className="w-full max-w-5xl mx-auto py-20 px-6 animate-in fade-in slide-in-from-bottom-12 duration-1000">
      <div className="text-center mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-plasma/10 border border-plasma/20 text-[10px] font-black uppercase tracking-[0.25em] text-plasma mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-plasma animate-pulse"></span>
          Privacy-Hardened Engine
        </div>
        <h2 className="text-7xl font-display font-extrabold text-white tracking-tight leading-[0.85] text-glow-plasma">
          Transform Chaos <br/><span className="text-plasma italic">into Intelligence.</span>
        </h2>
        <p className="text-chrome text-lg max-w-xl mx-auto font-medium mt-8 leading-relaxed opacity-80">
          The industry's most secure data laboratory. Execution occurs entirely in your browser's memory—zero network footprints, zero data leaks.
        </p>
      </div>

      <div 
        className={`relative group rounded-[3.5rem] transition-all duration-700 p-[2px] ${
          dragActive 
          ? 'bg-gradient-to-tr from-plasma via-violet to-infrared scale-[1.01]' 
          : 'bg-white/10 border border-white/5'
        }`}
        onDragEnter={() => setDragActive(true)}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); }}
      >
        <div className="bg-obsidian/95 rounded-[3.4rem] p-24 flex flex-col items-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-96 h-96 bg-plasma/5 blur-[120px] pointer-events-none animate-pulse-slow"></div>
            
            <input ref={inputRef} type="file" accept=".csv,.json,.txt,.tsv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            
            <div className={`w-32 h-32 rounded-[2.5rem] mb-12 flex items-center justify-center transition-all duration-700 ${dragActive ? 'bg-plasma text-obsidian rotate-12 shadow-[0_0_50px_rgba(190,242,100,0.4)]' : 'bg-white/5 border border-white/10 text-chrome'}`}>
                <UploadIcon />
            </div>
            
            <h3 className="text-3xl font-display font-bold text-white mb-4 tracking-tight uppercase">Stage Dataset</h3>
            <p className="text-chrome mb-10 font-medium text-center">
              Drop your CSV, TSV, or JSON assets here or <button onClick={() => inputRef.current?.click()} className="text-plasma hover:text-white underline underline-offset-8 decoration-plasma/40 transition-all font-bold">access filesystem</button>
            </p>
            
            <div className="flex gap-10">
              {['CSV-STRUCTURED', 'JSON-SCHEMA', 'UTF8-NATIVE'].map((tag) => (
                <span key={tag} className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-700 hover:text-plasma transition-colors cursor-default">
                  {tag}
                </span>
              ))}
            </div>
        </div>
      </div>

      {error && (
        <div className="mt-10 p-6 rounded-3xl bg-infrared/10 border border-infrared/20 text-infrared font-bold text-xs uppercase tracking-widest text-center animate-bounce shadow-xl">
          DIAGNOSTIC ALERT: {error}
        </div>
      )}

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-16 border-t border-white/5 pt-16">
        {[
          { title: "In-Memory Logic", desc: "100% browser-side execution ensures your records never persist on any external server." },
          { title: "Neural Synthesis", desc: "Powered by Gemini 3 Flash for semantic understanding of your data's specific context." },
          { title: "Artifact Integrity", desc: "High-precision rule mapping maintains consistency across millions of data points." }
        ].map((item, i) => (
          <div key={i} className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-plasma">{item.title}</h4>
            <p className="text-xs text-chrome leading-relaxed font-medium">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileUploader;
