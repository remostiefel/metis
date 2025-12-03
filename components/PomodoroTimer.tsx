'use client';

import { usePomodoroTimer } from '@/hooks/usePomodoro';
import { Play, Pause, RotateCcw } from 'lucide-react';

export function PomodoroTimer() {
    const {
        timeLeft,
        isActive,
        isPaused,
        sessionType,
        startTimer,
        pauseTimer,
        resetTimer,
        setSession,
        formatTime,
    } = usePomodoroTimer();

    const progress = sessionType === 'focus'
        ? ((25 * 60 - timeLeft) / (25 * 60)) * 100
        : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Fokus-Timer</h3>
                <div className="flex gap-1 bg-gray-50 p-1 rounded-lg">
                    <button
                        onClick={() => setSession('focus')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${sessionType === 'focus'
                                ? 'bg-white text-primary-foreground shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Fokus
                    </button>
                    <button
                        onClick={() => setSession('shortBreak')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${sessionType === 'shortBreak'
                                ? 'bg-white text-secondary-foreground shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Pause
                    </button>
                </div>
            </div>

            {/* Circular Progress */}
            <div className="relative w-48 h-48 mx-auto mb-8">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="#F1F5F9"
                        strokeWidth="8"
                        fill="none"
                    />
                    <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke={sessionType === 'focus' ? '#5EEAD4' : '#FDBA74'}
                        strokeWidth="8"
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 88}`}
                        strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                        className="transition-all duration-1000"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold text-gray-800 tracking-tighter">
                        {formatTime()}
                    </span>
                    <span className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-widest">
                        {isActive ? 'Läuft' : 'Pausiert'}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-3">
                {!isActive && !isPaused && (
                    <button
                        onClick={startTimer}
                        className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all shadow-sm hover:shadow-md font-bold"
                    >
                        <Play size={18} fill="currentColor" />
                        Start
                    </button>
                )}
                {isActive && (
                    <button
                        onClick={pauseTimer}
                        className="flex items-center gap-2 px-8 py-3 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/90 transition-all shadow-sm hover:shadow-md font-bold"
                    >
                        <Pause size={18} fill="currentColor" />
                        Pause
                    </button>
                )}
                {isPaused && (
                    <button
                        onClick={startTimer}
                        className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all shadow-sm hover:shadow-md font-bold"
                    >
                        <Play size={18} fill="currentColor" />
                        Weiter
                    </button>
                )}
                <button
                    onClick={resetTimer}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                    title="Reset"
                >
                    <RotateCcw size={18} />
                </button>
            </div>

            {timeLeft === 0 && (
                <div className="mt-6 p-4 bg-success/10 border border-success/20 rounded-xl text-center animate-bounce">
                    <p className="text-success-foreground font-bold">
                        ✨ Session abgeschlossen!
                    </p>
                </div>
            )}
        </div>
    );
}
