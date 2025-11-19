import React, { useEffect, useState, useRef } from 'react';
import { SoundType } from '../types';
import { playSound, stopSound } from '../utils/soundGenerator';
import { XCircle, CheckCircle2, Volume2, VolumeX } from 'lucide-react';

interface FocusPhaseProps {
  goal: string;
  durationMinutes: number;
  soundType: SoundType;
  onComplete: (wasSuccessful: boolean) => void;
}

export const FocusPhase: React.FC<FocusPhaseProps> = ({
  goal,
  durationMinutes,
  soundType,
  onComplete,
}) => {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [isActive, setIsActive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<number | null>(null);

  // Prevent accidental tab closing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isActive) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isActive]);

  // Handle sound
  useEffect(() => {
    if (isActive && !isMuted) {
      playSound(soundType);
    } else {
      stopSound();
    }
    return () => stopSound();
  }, [soundType, isActive, isMuted]);

  // Timer logic
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          stopSound();
          onComplete(true); // Auto-complete when timer hits 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, onComplete]);

  // Auto-hide controls logic & Keyboard Shortcuts
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 3000); // Hide after 3 seconds of no movement
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        handleMouseMove(); // Show controls on key press too
        
        // Esc to Abort
        if (e.key === 'Escape') {
            onComplete(false);
        }
        
        // M to Mute
        if (e.key === 'm' || e.key === 'M') {
            if (soundType !== SoundType.NONE) {
                setIsMuted(prev => !prev);
            }
        }

        // Shift + Enter to Complete Early
        if (e.key === 'Enter' && e.shiftKey) {
            onComplete(true);
        }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    
    // Initial timeout
    controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
    }, 3000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [onComplete, soundType]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  // Progress calculation (0 to 1)
  const progress = 1 - timeLeft / (durationMinutes * 60);

  const formatTime = (val: number) => val.toString().padStart(2, '0');

  // SVG Circle Configuration
  const radius = 145; // Radius of the SVG circle
  const stroke = 6; // Thickness of the ring
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-slate-950 text-white transition-colors duration-1000 cursor-none hover:cursor-default fade-in">
        {/* Dynamic Background based on progress */}
        <div 
            className="absolute inset-0 z-0 transition-all duration-[2000ms]"
            style={{
                background: `radial-gradient(circle at 50% 50%, #1e1b4b ${10 + (progress * 20)}%, #020617 70%)`,
                opacity: 0.6 + (progress * 0.4)
            }}
        />
        
        {/* The Bubble */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-2xl p-8">
        
        <div className={`mb-12 text-center space-y-6 transition-all duration-1000 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-40 -translate-y-4'}`}>
            <h2 className="text-sm font-medium text-indigo-300/60 tracking-[0.2em] uppercase animate-pulse">
                Locked In
            </h2>
            <p className="text-3xl md:text-4xl font-semibold text-white/90 leading-tight max-w-xl transition-all duration-700">
                "{goal}"
            </p>
        </div>

        {/* Timer Bubble - Organic Liquid Shape + Progress Ring */}
        <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center mb-12 breathe-animation">
            
            {/* Progress Ring SVG */}
            <svg
              className="absolute inset-0 w-full h-full -rotate-90 z-20 pointer-events-none drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"
              viewBox={`0 0 ${radius * 2} ${radius * 2}`}
            >
                <defs>
                    <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#818cf8" /> {/* Indigo-400 */}
                        <stop offset="100%" stopColor="#c084fc" /> {/* Purple-400 */}
                    </linearGradient>
                </defs>
                
                {/* Background Track */}
                <circle
                    stroke="#1e293b" // Slate-800
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className="opacity-50"
                />
                
                {/* Progress Indicator */}
                <circle
                    stroke="url(#ringGradient)"
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s linear' }}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
            </svg>

            {/* Outer Glow - Intensifies with progress */}
            <div 
                className="absolute inset-0 bg-indigo-500 rounded-full pulse-glow-effect transition-all duration-1000"
                style={{ opacity: 0.1 + (progress * 0.2) }}
            ></div>

            {/* The Liquid Blob Container */}
            <div 
                className="w-[85%] h-[85%] absolute inset-0 m-auto flex items-center justify-center z-10 pointer-events-none"
                style={{ 
                    animation: `rotate ${25 - (progress * 10)}s linear infinite` // Spin faster as time passes
                }}
            >
                {/* Primary Blob */}
                <div 
                    className="blob-shape absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-600 to-purple-800 shadow-inner mix-blend-screen"
                    style={{
                        opacity: 0.9,
                        animationDuration: `${10 - (progress * 4)}s`, // Morph faster as time passes
                        transform: `scale(${1 + (progress * 0.05)})`
                    }}
                ></div>

                {/* Secondary Layer for 3D/Liquid Effect */}
                <div 
                    className="blob-shape absolute inset-0 w-[90%] h-[90%] m-auto bg-gradient-to-tl from-purple-900 to-indigo-500 opacity-70 mix-blend-overlay"
                    style={{
                        animationDirection: 'reverse', // Rotate/morph opposite
                        animationDuration: `${15 - (progress * 5)}s`,
                        transform: `rotate(90deg) scale(${0.95 + (progress * 0.1)})`
                    }}
                ></div>
            </div>
            
            <div className="relative z-30 text-7xl md:text-9xl font-mono font-bold tracking-tighter text-white drop-shadow-2xl mix-blend-overlay select-none">
                {formatTime(minutes)}:{formatTime(seconds)}
            </div>
        </div>

        {/* Minimal Controls - Fade in/out based on activity */}
        <div className={`flex items-center gap-8 transition-all duration-500 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
            <button 
                onClick={() => onComplete(false)}
                className="group flex flex-col items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors"
                title="Abort Session (Esc)"
            >
                <XCircle className="w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs uppercase tracking-widest">Abort</span>
                    <span className="text-[10px] bg-slate-800 px-1.5 rounded mt-1 text-slate-400">Esc</span>
                </div>
            </button>

             {soundType !== SoundType.NONE && (
                <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="group flex flex-col items-center gap-2 text-indigo-400/60 hover:text-indigo-300 transition-colors"
                    title={isMuted ? "Unmute (M)" : "Mute (M)"}
                >
                    {isMuted ? (
                        <VolumeX className="w-8 h-8" />
                    ) : (
                        <Volume2 className="w-8 h-8" />
                    )}
                    <div className="flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs uppercase tracking-widest">{isMuted ? 'Unmute' : 'Mute'}</span>
                        <span className="text-[10px] bg-slate-800 px-1.5 rounded mt-1 text-slate-400">M</span>
                    </div>
                </button>
            )}

             <button 
                onClick={() => onComplete(true)}
                className="group flex flex-col items-center gap-2 text-slate-500 hover:text-emerald-400 transition-colors"
                title="Complete Early (Shift + Enter)"
            >
                <CheckCircle2 className="w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs uppercase tracking-widest">Done</span>
                    <span className="text-[10px] bg-slate-800 px-1.5 rounded mt-1 text-slate-400">⇧ ↵</span>
                </div>
            </button>
        </div>

        <div className={`absolute bottom-4 text-slate-600 text-xs transition-opacity duration-1000 ${!showControls ? 'opacity-100' : 'opacity-0'}`}>
            Move mouse to show controls
        </div>

      </div>
    </div>
  );
};
