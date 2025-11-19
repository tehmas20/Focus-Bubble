import React, { useState, useEffect } from 'react';
import { AppPhase, SessionData, SetupFormData, SoundType, Priority } from './types';
import { SetupPhase } from './components/SetupPhase';
import { FocusPhase } from './components/FocusPhase';
import { ReflectionPhase } from './components/ReflectionPhase';
import { InsightPhase } from './components/InsightPhase';
import { HistoryPhase } from './components/HistoryPhase';

const App: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>(AppPhase.SETUP);
  
  // Session State
  const [currentGoal, setCurrentGoal] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [soundType, setSoundType] = useState<SoundType>(SoundType.BROWN_NOISE);
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [sessionResult, setSessionResult] = useState<{ completed: boolean; blockers: string } | null>(null);
  
  // History
  const [history, setHistory] = useState<SessionData[]>([]);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('focus_bubble_history');
    if (saved) {
        try {
            setHistory(JSON.parse(saved));
        } catch (e) {
            console.error("Failed to parse history", e);
        }
    }
  }, []);

  const handleStart = (data: SetupFormData) => {
    setCurrentGoal(data.goal);
    setDurationMinutes(data.durationMinutes);
    setSoundType(data.soundType);
    setPriority(data.priority);
    setPhase(AppPhase.FOCUS);
  };

  const handleFocusComplete = (wasSuccessful: boolean) => {
    // Temporarily store partial result to pass to reflection
    setSessionResult({ completed: wasSuccessful, blockers: '' });
    setPhase(AppPhase.REFLECTION);
  };

  const handleReflectionSubmit = (completed: boolean, blockers: string) => {
    const newSession: SessionData = {
        id: Date.now().toString(),
        goal: currentGoal,
        durationSeconds: durationMinutes * 60,
        timestamp: Date.now(),
        completed,
        blockers,
        priority: priority // Store priority in history
    };

    const updatedHistory = [...history, newSession];
    setHistory(updatedHistory);
    localStorage.setItem('focus_bubble_history', JSON.stringify(updatedHistory));
    
    setSessionResult({ completed, blockers }); // Update with final details
    setPhase(AppPhase.INSIGHTS);
  };

  const handleNewSession = () => {
    setPhase(AppPhase.SETUP);
    setSessionResult(null);
    setCurrentGoal('');
    setPriority(Priority.MEDIUM);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('focus_bubble_history');
  };

  return (
    <div className="text-white antialiased selection:bg-indigo-500 selection:text-white">
      {phase === AppPhase.SETUP && (
        <SetupPhase 
          onStart={handleStart} 
          onViewHistory={() => setPhase(AppPhase.HISTORY)}
          history={history} 
        />
      )}
      
      {phase === AppPhase.FOCUS && (
        <FocusPhase 
            goal={currentGoal}
            durationMinutes={durationMinutes}
            soundType={soundType}
            onComplete={handleFocusComplete}
        />
      )}

      {phase === AppPhase.REFLECTION && sessionResult && (
        <ReflectionPhase 
            goal={currentGoal}
            initialCompleted={sessionResult.completed}
            onSubmit={handleReflectionSubmit}
        />
      )}

      {phase === AppPhase.INSIGHTS && sessionResult && (
        <InsightPhase 
            currentSession={{
                id: 'temp',
                goal: currentGoal,
                durationSeconds: durationMinutes * 60,
                timestamp: Date.now(),
                completed: sessionResult.completed,
                blockers: sessionResult.blockers,
                priority: priority
            }}
            history={history}
            onNewSession={handleNewSession}
        />
      )}

      {phase === AppPhase.HISTORY && (
        <HistoryPhase 
          history={history} 
          onBack={() => setPhase(AppPhase.SETUP)}
          onClear={handleClearHistory}
        />
      )}
    </div>
  );
};

export default App;
