import React, { useEffect, useState } from 'react';
import { SessionData } from '../types';
import { generateInsight } from '../services/geminiService';
import { Sparkles, ArrowRight, Copy, Check } from 'lucide-react';

interface InsightPhaseProps {
  currentSession: SessionData;
  history: SessionData[];
  onNewSession: () => void;
}

export const InsightPhase: React.FC<InsightPhaseProps> = ({
  currentSession,
  history,
  onNewSession,
}) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchInsight = async () => {
      const result = await generateInsight(currentSession, history);
      if (isMounted) {
        setInsight(result);
        setLoading(false);
      }
    };
    fetchInsight();
    return () => { isMounted = false; };
  }, [currentSession, history]);

  const handleCopy = () => {
    if (insight) {
      navigator.clipboard.writeText(insight);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!loading) {
            if (e.key === 'c' || e.key === 'C') {
                handleCopy();
            }
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onNewSession();
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, insight, onNewSession]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 to-slate-950 fade-in">
      <div className="max-w-md w-full">
        
        {/* Loading State */}
        {loading && (
             <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-8 text-center animate-pulse">
                <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-4 animate-spin-slow" />
                <h3 className="text-xl font-semibold text-white mb-2">Analyzing your flow...</h3>
                <p className="text-slate-400">Generating tiny wisdom.</p>
             </div>
        )}

        {/* Content */}
        {!loading && (
            <div className="space-y-6">
                {/* The Insight Card */}
                <div 
                    onClick={handleCopy}
                    className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    title="Click or press 'C' to copy"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sparkles className="w-24 h-24 text-white" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4 text-indigo-100">
                            <h2 className="font-medium flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Tiny Insight
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] border border-white/20 rounded px-1 opacity-0 group-hover:opacity-70 transition-opacity">Press C</span>
                                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 opacity-50 group-hover:opacity-100" />}
                            </div>
                        </div>
                        <p className="text-2xl md:text-3xl font-bold text-white leading-snug">
                            "{insight}"
                        </p>
                    </div>
                </div>

                {/* Stats / Summary */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 flex items-center justify-between">
                     <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">This Session</p>
                        <p className={`text-lg font-bold ${currentSession.completed ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {currentSession.completed ? 'Completed' : 'Incomplete'}
                        </p>
                     </div>
                     <div className="text-right">
                        <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Duration</p>
                        <p className="text-lg font-bold text-white">
                            {Math.floor(currentSession.durationSeconds / 60)}m
                        </p>
                     </div>
                </div>

                {/* Action */}
                <button
                    onClick={onNewSession}
                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all group"
                >
                    Start New Bubble
                    <span className="hidden group-hover:inline-block text-xs bg-white/10 px-1.5 rounded ml-1 text-slate-400">↵</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
