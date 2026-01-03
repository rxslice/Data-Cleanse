
import React from 'react';
import { CleanseSummary, DataRow } from '../types.ts';
import { CheckCircleIcon } from './icons.tsx';

interface DownloadStepProps {
  summary: CleanseSummary | null;
  downloadUrls: { csv: string; json: string } | null;
  cleansedPreview: DataRow[];
  headers: string[];
  fileName: string;
  onStartOver: () => void;
}

const DownloadStep: React.FC<DownloadStepProps> = ({ summary, downloadUrls, cleansedPreview, headers, fileName, onStartOver }) => {
  return (
    <div className="w-full max-w-5xl mx-auto py-10 animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center text-center mb-20">
            <div className="w-24 h-24 bg-emerald/10 rounded-[3rem] flex items-center justify-center text-emerald mb-8 border border-emerald/20">
                <CheckCircleIcon />
            </div>
            <h2 className="text-6xl font-display font-extrabold text-white tracking-tight mb-4">Refinement <span className="text-emerald italic">Finalized.</span></h2>
            <p className="text-slate-400 font-medium text-xl max-w-md mx-auto">The transformation cycle is complete. Your purified dataset is ready for export.</p>
        </div>
    
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16">
        {/* Transformation Audit */}
        <div className="lg:col-span-2 glass-panel p-12 rounded-[4rem] space-y-12">
            <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 mb-10">Operational Audit</h3>
                <div className="grid grid-cols-2 gap-10">
                    <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-white/5">
                        <span className="text-[10px] text-slate-600 uppercase font-black block mb-3 tracking-widest">Invariants Dropped</span>
                        <span className="text-4xl font-mono text-red-400 font-bold tracking-tighter">{summary?.rowsRemoved || 0}</span>
                    </div>
                    <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-white/5">
                        <span className="text-[10px] text-slate-600 uppercase font-black block mb-3 tracking-widest">Cells Mutated</span>
                        <span className="text-4xl font-mono text-indigo font-bold tracking-tighter">{summary?.cellsModified || 0}</span>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-[2.5rem] border border-white/5">
                <div className="bg-slate-900/50 px-8 py-5 border-b border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Export Sample (Artifact)</span>
                    <span className="text-[10px] font-bold text-slate-700 font-mono tracking-tighter">{fileName}</span>
                </div>
                <div className="max-h-60 overflow-auto custom-scrollbar font-mono text-[10px] p-6 text-slate-500 bg-slate-950/40">
                    <table className="w-full border-separate border-spacing-x-4 border-spacing-y-2">
                        <tbody>
                            {cleansedPreview.slice(0, 5).map((row, i) => (
                                <tr key={i} className="opacity-60">
                                    {headers.slice(0, 3).map(h => <td key={h} className="truncate max-w-[120px]">{String(row[h])}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Dispatch Hub */}
        <div className="glass-panel p-12 rounded-[4rem] flex flex-col justify-between border-emerald/10">
            <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 mb-10">Dispatch Channels</h3>
                <div className="space-y-6">
                    <a href={downloadUrls?.csv} download={`refined_${fileName}.csv`} className="group flex items-center justify-between w-full p-6 bg-indigo/10 border border-indigo/20 rounded-3xl hover:bg-white hover:border-white transition-all duration-500">
                        <span className="text-xs font-black text-indigo group-hover:text-indigo uppercase tracking-[0.2em]">Flat File (CSV)</span>
                        <span className="text-indigo group-hover:translate-x-1 transition-transform">&rarr;</span>
                    </a>
                    <a href={downloadUrls?.json} download={`refined_${fileName}.json`} className="group flex items-center justify-between w-full p-6 bg-emerald/10 border border-emerald/20 rounded-3xl hover:bg-white hover:border-white transition-all duration-500">
                        <span className="text-xs font-black text-emerald group-hover:text-emerald uppercase tracking-[0.2em]">Data Object (JSON)</span>
                        <span className="text-emerald group-hover:translate-x-1 transition-transform">&rarr;</span>
                    </a>
                </div>
            </div>

            <div className="mt-16 text-center">
                <button onClick={onStartOver} className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] hover:text-indigo transition-colors duration-300">
                    Initialize New Batch &crarr;
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadStep;
