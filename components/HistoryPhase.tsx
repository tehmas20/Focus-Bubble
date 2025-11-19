import React, { useEffect } from 'react';
import { SessionData, Priority } from '../types';
import { ArrowLeft, Calendar, Clock, CheckCircle2, XCircle, Sparkles, Trash2, Ban, AlertCircle } from 'lucide-react';

interface HistoryPhaseProps {
  history: SessionData[];
  onBack: () => void;
  onClear: () => void;
}

export const HistoryPhase: React.FC<HistoryPhaseProps> = ({ history, onBack, onClear }) => {
  const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(new Date(timestamp));
  };

  const getPriorityBadge = (priority?: Priority) => {
    if (!priority) return null;
    let colorClass = 'bg-slate-800 text-slate-400 border-slate-700';
    if (priority === Priority.HIGH) colorClass = 'bg-red-500/10 text-red-400 border-red-500/20';
    if (priority === Priority.MEDIUM) colorClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (priority === Priority.LOW) colorClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';

    return (
        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${colorClass}`}>
            {priority}
        </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-slate-950 fade-in text-white relative">
      <div className="max-w-2xl w-full space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-md py-4 z-10 border-b border-slate-800">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
            title="Go Back (Esc)"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back
            <span className="text-[10px] bg-slate-800 px-1.5 rounded ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500">Esc</span>
          </button>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
            Session Log
          </h1>
          {history.length > 0 ? (
            <button 
              onClick={() => {
                if(window.confirm('Are you sure you want to clear all history?')) onClear();
              }}
              className="text-slate-500 hover:text-red-400 transition-colors"
              title="Clear History"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-5" /> // Spacer
          )}
        </div>

        {/* Empty State */}
        {sortedHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <div className="bg-slate-900 p-4 rounded-full mb-4">
                <Calendar className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-lg">No sessions recorded yet.</p>
            <p className="text-sm opacity-60">Time to enter the bubble.</p>
          </div>
        )}

        {/* Feed */}
        <div className="space-y-4 pb-12">
          {sortedHistory.map((session) => (
            <div 
              key={session.id} 
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:bg-slate-800/50 hover:border-slate-700 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-1">
                   <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-lg text-white">{session.goal}</h3>
                        {getPriorityBadge(session.priority)}
                   </div>
                   <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(session.timestamp)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.floor(session.durationSeconds / 60)}m</span>
                   </div>
                </div>
                
                <div className={`p-2 rounded-full ${session.completed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {session.completed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>
              </div>

              {/* Blockers/Notes */}
              {session.blockers && (
                <div className="mt-3 text-sm text-slate-400 bg-slate-950/50 p-3 rounded-lg flex items-start gap-2">
                   <Ban className="w-4 h-4 mt-0.5 text-red-400/60 shrink-0" />
                   <span>{session.blockers}</span>
                </div>
              )}

              {/* AI Insight */}
              {session.aiInsight && (
                  <div className="mt-3 text-sm text-indigo-200 bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/10 p-3 rounded-lg flex items-start gap-2">
                      <Sparkles className="w-4 h-4 mt-0.5 text-indigo-400 shrink-0" />
                      <span className="italic">"{session.aiInsight}"</span>
                  </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
