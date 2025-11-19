import React, { useState, useEffect } from 'react';

interface ReflectionPhaseProps {
  goal: string;
  initialCompleted: boolean;
  onSubmit: (completed: boolean, blockers: string) => void;
}

export const ReflectionPhase: React.FC<ReflectionPhaseProps> = ({
  goal,
  initialCompleted,
  onSubmit,
}) => {
  const [completed, setCompleted] = useState(initialCompleted);
  const [blockers, setBlockers] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        onSubmit(completed, blockers);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [completed, blockers, onSubmit]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 fade-in">
      <div className="max-w-lg w-full bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-2">Session Complete</h2>
        <p className="text-slate-400 mb-8 text-sm">Let's take a moment to reflect on: <span className="text-indigo-400">"{goal}"</span></p>

        <div className="space-y-8">
            {/* Completion Check */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                    Did you complete your goal?
                </label>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setCompleted(true)}
                        className={`py-3 px-4 rounded-xl border transition-all ${
                            completed 
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                    >
                        Yes, I crushed it
                    </button>
                    <button
                        onClick={() => setCompleted(false)}
                        className={`py-3 px-4 rounded-xl border transition-all ${
                            !completed 
                            ? 'bg-red-500/20 border-red-500 text-red-300' 
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                    >
                        Not quite
                    </button>
                </div>
            </div>

            {/* Blockers Input */}
            <div>
                 <label className="block text-sm font-medium text-slate-300 mb-3">
                    {completed ? "Was there anything tricky?" : "What got in your way?"}
                </label>
                <textarea
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none h-32"
                    placeholder={completed ? "Smooth sailing, or any friction?" : "Distractions, fatigue, or unexpected tasks?"}
                    value={blockers}
                    onChange={(e) => setBlockers(e.target.value)}
                    autoFocus
                />
                <div className="text-right mt-2">
                    <span className="text-[10px] text-slate-500 border border-slate-700 rounded px-1.5 py-0.5">Ctrl + Enter to submit</span>
                </div>
            </div>

            <button
                onClick={() => onSubmit(completed, blockers)}
                className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl hover:bg-slate-200 transition-colors shadow-lg shadow-white/10"
            >
                See Insights
            </button>
        </div>
      </div>
    </div>
  );
};
