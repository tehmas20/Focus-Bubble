import React, { useState, useEffect } from 'react';
import { SoundType, SetupFormData, DurationPreset, Priority, SessionData } from '../types';
import { Play, Zap, Music, Volume2, VolumeX, Info, Plus, X, Sparkles, Loader2, History, Waves, Trees } from 'lucide-react';
import { analyzeGoal } from '../services/geminiService';

interface SetupPhaseProps {
  onStart: (data: SetupFormData) => void;
  onViewHistory: () => void;
  history: SessionData[];
}

const DEFAULT_PRESETS: DurationPreset[] = [
  { id: 'p1', name: 'Quick', minutes: 15 },
  { id: 'p2', name: 'Focus', minutes: 25 },
  { id: 'p3', name: 'Deep', minutes: 45 },
  { id: 'p4', name: 'Hour', minutes: 60 },
];

export const SetupPhase: React.FC<SetupPhaseProps> = ({ onStart, onViewHistory, history }) => {
  const [goal, setGoal] = useState('');
  const [duration, setDuration] = useState(25);
  const [sound, setSound] = useState<SoundType>(SoundType.BROWN_NOISE);
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  
  // Custom Preset State
  const [presets, setPresets] = useState<DurationPreset[]>(DEFAULT_PRESETS);
  const [showAddPreset, setShowAddPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDuration, setNewPresetDuration] = useState('30');

  // AI State
  const [isRefining, setIsRefining] = useState(false);

  useEffect(() => {
    const savedPresets = localStorage.getItem('focus_bubble_presets');
    if (savedPresets) {
        try {
            const parsed = JSON.parse(savedPresets);
            setPresets([...DEFAULT_PRESETS, ...parsed]);
        } catch(e) {
            console.error("Error loading presets");
        }
    }
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + H for History
      if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        onViewHistory();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onViewHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;
    onStart({ goal, durationMinutes: duration, soundType: sound, priority });
  };

  const handleAddPreset = () => {
    if (!newPresetName || !newPresetDuration) return;
    const mins = parseInt(newPresetDuration);
    if (isNaN(mins) || mins <= 0) return;

    const newPreset: DurationPreset = {
        id: Date.now().toString(),
        name: newPresetName,
        minutes: mins,
        isCustom: true
    };

    const customPresets = presets.filter(p => p.isCustom);
    const updatedCustoms = [...customPresets, newPreset];
    
    localStorage.setItem('focus_bubble_presets', JSON.stringify(updatedCustoms));
    setPresets([...DEFAULT_PRESETS, ...updatedCustoms]);
    
    setNewPresetName('');
    setNewPresetDuration('30');
    setShowAddPreset(false);
    setDuration(mins); // Auto select the new one
  };

  const handleDeletePreset = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const customPresets = presets.filter(p => p.isCustom && p.id !== id);
    localStorage.setItem('focus_bubble_presets', JSON.stringify(customPresets));
    setPresets([...DEFAULT_PRESETS, ...customPresets]);
    
    if (duration === presets.find(p => p.id === id)?.minutes) {
        setDuration(25); // Reset to default if selected was deleted
    }
  };

  const handleAiRefine = async () => {
    if (!goal.trim()) return;
    setIsRefining(true);
    // Analyze goal returns both polished text and suggested priority based on history
    const result = await analyzeGoal(goal, history);
    setGoal(result.refined);
    setPriority(result.priority);
    setIsRefining(false);
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.HIGH: return 'bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30';
      case Priority.MEDIUM: return 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30';
      case Priority.LOW: return 'bg-blue-500/20 text-blue-300 border-blue-500/50 hover:bg-blue-500/30';
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 fade-in relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        {/* Top Right History Button */}
        <button 
            onClick={onViewHistory}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full backdrop-blur-sm transition-all group relative hover:-translate-y-0.5 hover:shadow-lg active:scale-95 duration-200"
            title="View History (Alt + H)"
        >
            <History className="w-6 h-6" />
            <span className="absolute -bottom-8 right-0 text-[10px] bg-slate-800 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none text-slate-400">
              Alt + H
            </span>
        </button>

      <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-8 rounded-3xl shadow-2xl relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full mb-4 shadow-lg">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
            Focus Bubble
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Enter a distraction-free zone.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Goal Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              What is your single goal?
            </label>
            <div className="relative group">
                <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., Write the intro paragraph..."
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                autoFocus
                />
                <button
                    type="button"
                    onClick={handleAiRefine}
                    disabled={isRefining || !goal.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-400 hover:text-indigo-300 disabled:opacity-30 transition-all hover:scale-110 active:scale-90"
                    title="Refine & Prioritize with AI"
                >
                    {isRefining ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Sparkles className="w-5 h-5" />
                    )}
                </button>
            </div>
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {[Priority.LOW, Priority.MEDIUM, Priority.HIGH].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold border transition-all uppercase tracking-wider ${
                    priority === p 
                      ? getPriorityColor(p) + ' shadow-md scale-105'
                      : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Selection */}
          <div>
            <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-medium text-slate-300">
                Duration
                </label>
                <button 
                    type="button"
                    onClick={() => setShowAddPreset(true)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors hover:underline"
                >
                    <Plus className="w-3 h-3" /> New Preset
                </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setDuration(preset.minutes)}
                  className={`relative group py-3 px-3 rounded-xl text-sm font-medium transition-all duration-200 flex-grow border flex flex-col items-center justify-center transform active:scale-95 ${
                    duration === preset.minutes
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 hover:shadow-indigo-500/40 hover:-translate-y-1'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-700 hover:border-slate-500 hover:text-slate-200 hover:shadow-md hover:-translate-y-1'
                  }`}
                >
                  <div className="flex flex-col items-center gap-0.5">
                      <span>{preset.name}</span>
                      <span className={`text-[10px] ${duration === preset.minutes ? 'opacity-80' : 'opacity-50 group-hover:opacity-70'}`}>{preset.minutes}m</span>
                  </div>
                  
                  {preset.isCustom && (
                      <div 
                        onClick={(e) => handleDeletePreset(e, preset.id)}
                        className="absolute -top-2 -right-2 bg-red-500/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:scale-110"
                      >
                          <X className="w-3 h-3" />
                      </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Add Preset Modal Overlay */}
          {showAddPreset && (
              <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm z-50 rounded-3xl flex items-center justify-center p-6 fade-in">
                  <div className="w-full space-y-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Create Preset</h3>
                      <div>
                          <label className="text-xs text-slate-400">Name</label>
                          <input 
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            placeholder="e.g. Nap"
                            maxLength={10}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
                          />
                      </div>
                      <div>
                          <label className="text-xs text-slate-400">Minutes</label>
                          <input 
                            type="number"
                            value={newPresetDuration}
                            onChange={(e) => setNewPresetDuration(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
                          />
                      </div>
                      <div className="flex gap-3 pt-2">
                          <button type="button" onClick={() => setShowAddPreset(false)} className="flex-1 py-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                          <button type="button" onClick={handleAddPreset} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors shadow-lg hover:shadow-indigo-500/25">Save</button>
                      </div>
                  </div>
              </div>
          )}

          {/* Sound Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Sound Environment
            </label>
            <div className="grid grid-cols-3 gap-2 bg-slate-900/50 p-1.5 rounded-2xl">
              {[
                { type: SoundType.NONE, icon: VolumeX, label: 'Silent' },
                { type: SoundType.BROWN_NOISE, icon: Music, label: 'Deep' },
                { type: SoundType.WHITE_NOISE, icon: Volume2, label: 'Crisp' },
                { type: SoundType.OCEAN, icon: Waves, label: 'Ocean' },
                { type: SoundType.FOREST, icon: Trees, label: 'Forest' },
              ].map((s) => (
                <button
                  key={s.type}
                  type="button"
                  onClick={() => setSound(s.type)}
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl text-xs font-medium transition-all duration-200 transform active:scale-95 ${
                    sound === s.type
                      ? 'bg-slate-700 text-white shadow-md ring-1 ring-slate-500 hover:bg-slate-600 hover:-translate-y-0.5 hover:shadow-xl'
                      : 'text-slate-500 hover:text-indigo-300 hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-lg'
                  }`}
                >
                    <s.icon className={`w-4 h-4 mb-1 ${sound === s.type ? 'text-indigo-300' : ''}`} />
                    {s.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!goal.trim()}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-4 rounded-xl shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-indigo-500/30 group"
          >
            <Play className="w-5 h-5 fill-current" />
            Enter Bubble
            <span className="hidden group-hover:inline-block text-xs bg-white/20 px-1.5 rounded ml-1">↵</span>
          </button>
        </form>
      </div>
      
      <div className="mt-8 text-center text-slate-500 text-xs flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity cursor-help">
         <Info className="w-3 h-3" />
         <span>AI polishes goals & suggests priority</span>
      </div>
    </div>
  );
};
