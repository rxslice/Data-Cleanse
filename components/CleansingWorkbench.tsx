
import React, { useState, useMemo } from 'react';
import { DataRow, Transformation, TransformationType, ColumnProfile } from '../types.ts';
import { XCircleIcon, SparklesIcon } from './icons.tsx';
import AiSuggestionsModal from './AiSuggestionsModal.tsx';
import { GoogleGenAI, Type } from "@google/genai";

interface CleansingWorkbenchProps {
  headers: string[];
  previewData: DataRow[];
  profile: ColumnProfile[];
  totalRows: number;
  fileName: string;
  onApplyCleansing: (transformations: Transformation[]) => void;
  onShowProModal: () => void;
  isProcessing: boolean;
}

const TRANSFORMATION_OPTIONS = [
    { label: 'Deduplicate Entropy', type: TransformationType.DEDUPLICATE },
    { label: 'Normalize Morphology', type: TransformationType.CASE },
    { label: 'Purge Whitespace', type: TransformationType.TRIM },
    { label: 'Pattern Replacement', type: TransformationType.FIND_REPLACE },
    { label: 'Identity Masking (PII)', type: TransformationType.MASK },
    { label: 'Schema Validation', type: TransformationType.VALIDATE_FORMAT },
];

const CleansingWorkbench: React.FC<CleansingWorkbenchProps> = ({ headers, previewData, profile, totalRows, fileName, onApplyCleansing, onShowProModal, isProcessing }) => {
    const [transformations, setTransformations] = useState<Transformation[]>([]);
    const [selectedColumn, setSelectedColumn] = useState<string>(headers[0] || '');
    const [selectedType, setSelectedType] = useState<TransformationType>(TransformationType.DEDUPLICATE);
    const [aiQuery, setAiQuery] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAiModalOpen, setAiModalOpen] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<Transformation[]>([]);

    const activeProfile = useMemo(() => profile.find(p => p.name === selectedColumn), [profile, selectedColumn]);

    const integrityScore = useMemo(() => {
        if (!profile.length) return 0;
        const totalNulls = profile.reduce((acc, p) => acc + p.nullCount, 0);
        const totalCells = totalRows * profile.length;
        const baseScore = ((totalCells - totalNulls) / totalCells) * 100;
        const ruleBonus = transformations.length * 2;
        return Math.min(100, Math.round(baseScore + ruleBonus));
    }, [profile, totalRows, transformations]);

    const handleAddRule = () => {
        const rule: Transformation = {
            id: Math.random().toString(36).substring(2, 11),
            type: selectedType,
            column: selectedColumn,
            options: selectedType === TransformationType.CASE ? { caseType: 'UPPERCASE' } : {},
            isPro: false
        };
        setTransformations([...transformations, rule]);
    };

    const handleAiCommand = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiQuery.trim()) return;
        setIsGenerating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Synthesize these data instructions into a logical pipeline: "${aiQuery}". Available Attributes: ${headers.join(', ')}. Return a JSON array of transformation objects.`;
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                type: { type: Type.STRING },
                                column: { type: Type.STRING },
                                options: { type: Type.OBJECT },
                                explanation: { type: Type.STRING }
                            },
                            required: ['type', 'column', 'explanation']
                        }
                    }
                }
            });
            const rules = JSON.parse(response.text).map((r: any) => ({ ...r, id: Math.random().toString(36).substring(2, 11), isPro: false }));
            setAiSuggestions(rules);
            setAiModalOpen(true);
            setAiQuery('');
        } catch (error) { console.error("Synthesis error:", error); }
        finally { setIsGenerating(false); }
    };

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-10 pb-32 px-6">
            <AiSuggestionsModal 
                isOpen={isAiModalOpen} 
                onClose={() => setAiModalOpen(false)} 
                suggestions={aiSuggestions} 
                onAddSuggestions={s => setTransformations([...transformations, ...s])}
                transformationLimit={30}
                currentTransformationCount={transformations.length}
            />

            {/* AI Command Interface */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-plasma via-violet to-plasma opacity-10 group-focus-within:opacity-40 blur-3xl transition duration-1000"></div>
                <form onSubmit={handleAiCommand} className="relative flex glass-panel rounded-[2.5rem] p-2 shadow-2xl focus-within:border-plasma/30 transition-all border border-white/5">
                    <div className="flex items-center pl-8 text-plasma">
                        <SparklesIcon />
                    </div>
                    <input 
                        type="text" 
                        value={aiQuery}
                        onChange={e => setAiQuery(e.target.value)}
                        placeholder="Instruct the engine... (e.g., 'Lower-case all emails and scrub private phone numbers')" 
                        className="flex-grow bg-transparent border-none focus:ring-0 text-white py-6 px-4 font-display font-bold placeholder:text-slate-700 text-xl tracking-tight"
                    />
                    <button 
                        type="submit"
                        disabled={isGenerating || !aiQuery.trim()}
                        className="bg-plasma text-obsidian px-12 rounded-[2rem] font-display font-black text-xs tracking-[0.2em] hover:bg-white transition-all disabled:opacity-30 uppercase"
                    >
                        {isGenerating ? 'Synthesizing...' : 'Commit Sequence'}
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Anatomy Analysis Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="glass-panel p-10 rounded-[3rem] relative overflow-hidden shadow-inner">
                        <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-r from-transparent via-plasma/20 to-transparent"></div>
                        
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-chrome flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-plasma animate-pulse"></span>
                                Diagnostic Profiler
                            </h3>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-600 uppercase mb-1">Integrity Index</p>
                                <p className="text-3xl font-display font-bold text-plasma tracking-tighter text-glow-plasma">{integrityScore}%</p>
                            </div>
                        </div>
                        
                        <div className="space-y-10">
                            <div>
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4 block">Focus Attribute</label>
                                <div className="relative">
                                    <select 
                                        value={selectedColumn}
                                        onChange={e => setSelectedColumn(e.target.value)}
                                        className="w-full bg-obsidian border border-white/5 rounded-2xl text-sm font-bold text-white py-5 px-6 outline-none appearance-none cursor-pointer focus:border-plasma/40 transition-colors"
                                    >
                                        {/* Fix: use correct key={h} syntax instead of key(h} */}
                                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 text-xs">▼</div>
                                </div>
                            </div>

                            {activeProfile && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-left-6 duration-700">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5 hover:border-plasma/10 transition-colors">
                                            <span className="text-[9px] text-slate-600 uppercase font-black block mb-2 tracking-widest">Cardinality</span>
                                            <span className="text-2xl font-mono text-plasma font-bold tracking-tighter">{activeProfile.uniqueCount}</span>
                                        </div>
                                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5 hover:border-infrared/10 transition-colors">
                                            <span className="text-[9px] text-slate-600 uppercase font-black block mb-2 tracking-widest">Null Density</span>
                                            <span className={`text-2xl font-mono font-bold tracking-tighter ${activeProfile.nullCount > 0 ? 'text-infrared' : 'text-emerald-400'}`}>{activeProfile.nullCount}</span>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <span className="text-[10px] text-slate-500 font-black uppercase mb-6 block tracking-[0.35em]">Entropy Distribution</span>
                                        <div className="space-y-4">
                                            {activeProfile.distribution?.map((d: any, i: number) => (
                                                <div key={i} className="group cursor-default">
                                                    <div className="flex justify-between text-[11px] mb-2 font-mono">
                                                        <span className="text-chrome truncate max-w-[220px] group-hover:text-white transition-colors">{String(d.value) || '[EMPTY]'}</span>
                                                        <span className="text-slate-600 group-hover:text-plasma font-bold transition-colors">{Math.round(d.percentage)}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-slate-800 group-hover:bg-plasma transition-all duration-700 ease-out shadow-[0_0_10px_rgba(190,242,100,0.2)]" style={{ width: `${d.percentage}%` }}></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="glass-panel p-10 rounded-[3rem] shadow-inner">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 mb-8">Refinement Modules</h3>
                        <div className="space-y-5">
                            <select 
                                value={selectedType}
                                onChange={e => setSelectedType(e.target.value as TransformationType)}
                                className="w-full bg-obsidian border border-white/5 rounded-2xl text-[11px] font-bold text-slate-500 py-5 px-6 outline-none"
                            >
                                {TRANSFORMATION_OPTIONS.map(o => <option key={o.type} value={o.type}>{o.label}</option>)}
                            </select>
                            <button 
                                onClick={handleAddRule}
                                className="w-full py-5 rounded-2xl bg-white/5 text-white font-display font-black text-[10px] uppercase tracking-[0.4em] hover:bg-white/10 transition-all border border-white/10 shadow-lg active:scale-95"
                            >
                                Register Directive
                            </button>
                        </div>
                    </div>
                </div>

                {/* Synthesis Pipeline & Real-Time Flow */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Vertical Logic Pipeline */}
                        <div className="glass-panel p-10 rounded-[3.5rem] flex flex-col h-[650px] relative">
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <h3 className="text-3xl font-display font-bold text-white tracking-tight">Logic Pipeline</h3>
                                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.25em] mt-2">Active Sequential Modules</p>
                                </div>
                                <span className="text-[10px] font-black px-5 py-2.5 bg-slate-950 text-plasma border border-plasma/20 rounded-full tracking-[0.1em] uppercase">
                                    {transformations.length} STEPS ACTIVE
                                </span>
                            </div>
                            
                            <div className="flex-grow overflow-y-auto custom-scrollbar space-y-6 pr-4">
                                {transformations.map((t, i) => (
                                    <div key={t.id} className="relative pl-14 group animate-in slide-in-from-top-4 duration-500" style={{ animationDelay: `${i * 120}ms` }}>
                                        <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/5 ml-[24px]"></div>
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-obsidian border border-white/10 flex items-center justify-center text-[11px] font-mono font-bold text-slate-700 group-hover:text-plasma transition-all shadow-xl group-hover:border-plasma/40">
                                            {String(i + 1).padStart(2, '0')}
                                        </div>
                                        
                                        <div className="flex items-center justify-between p-7 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-plasma/40 transition-all duration-700 shadow-lg">
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-black uppercase text-plasma mb-1.5 tracking-[0.2em]">
                                                    {TRANSFORMATION_OPTIONS.find(o => o.type === t.type)?.label || t.type}
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-mono truncate">
                                                   ANATOMY: <span className="text-chrome font-bold">{t.column}</span>
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => setTransformations(transformations.filter(rule => rule.id !== t.id))}
                                                className="p-3 text-slate-800 hover:text-infrared transition-colors"
                                            >
                                                <XCircleIcon />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                
                                {transformations.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-10 py-24 grayscale">
                                        <div className="w-24 h-24 bg-white/10 rounded-full mb-8 flex items-center justify-center">
                                            <SparklesIcon />
                                        </div>
                                        <p className="text-xs font-black text-white uppercase tracking-[0.5em]">Awaiting Instruction</p>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={() => onApplyCleansing(transformations)}
                                disabled={transformations.length === 0 || isProcessing}
                                className="mt-10 w-full py-8 rounded-[2.5rem] bg-plasma text-obsidian font-display font-black text-sm uppercase tracking-[0.4em] shadow-[0_20px_60px_-12px_rgba(190,242,100,0.3)] hover:bg-white transition-all duration-700 disabled:opacity-20 disabled:grayscale active:scale-[0.98]"
                            >
                                {isProcessing ? 'Synchronizing Layers...' : 'Execute Transformation'}
                            </button>
                        </div>

                        {/* Real-Time Stream Monitor */}
                        <div className="glass-panel p-10 rounded-[3.5rem] flex flex-col h-[650px] shadow-inner">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h3 className="text-3xl font-display font-bold text-white tracking-tight">Stream Monitor</h3>
                                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.25em] mt-2">Active Data Flow Analysis</p>
                                </div>
                                <div className="flex items-center gap-2 bg-plasma/5 px-5 py-2.5 rounded-full border border-plasma/10">
                                    <span className="w-2.5 h-2.5 rounded-full bg-plasma animate-pulse shadow-[0_0_8px_rgba(190,242,100,0.6)]"></span>
                                    <span className="text-[10px] font-black text-plasma uppercase tracking-[0.1em]">LIVE BUFFER</span>
                                </div>
                            </div>
                            
                            <div className="flex-grow overflow-auto font-mono text-[10px] text-chrome custom-scrollbar leading-relaxed">
                                <table className="w-full border-separate border-spacing-y-4">
                                    <thead className="sticky top-0 bg-obsidian/90 backdrop-blur z-10">
                                        <tr>
                                            {headers.slice(0, 3).map(h => <th key={h} className="text-left py-4 pr-6 font-black text-slate-600 border-b border-white/5 uppercase tracking-tighter">{h}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {previewData.slice(0, 25).map((row, i) => (
                                            <tr key={i} className="group hover:bg-white/[0.03] transition-colors">
                                                {headers.slice(0, 3).map(h => <td key={h} className="py-4 pr-6 truncate max-w-[150px] text-slate-500 group-hover:text-plasma transition-colors">{String(row[h])}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Meta Performance Insights */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { label: 'Ingested Cells', val: (totalRows * headers.length).toLocaleString(), color: 'text-white' },
                            { label: 'Memory Pressure', val: 'Minimal', color: 'text-plasma' },
                            { label: 'Active Pipeline', val: transformations.length, color: 'text-violet' },
                            { label: 'Worker Latency', val: '< 1ms', color: 'text-emerald-400' }
                        ].map((stat, i) => (
                            <div key={i} className="p-8 rounded-[2.25rem] glass-panel border-white/5 group hover:border-white/20 transition-all duration-700">
                                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-700 mb-4 group-hover:text-slate-400 transition-colors">{stat.label}</p>
                                <p className={`text-2xl font-mono font-bold tracking-tighter ${stat.color}`}>{stat.val}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CleansingWorkbench;
