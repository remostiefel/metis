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
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Fokus-Timer</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSession('focus')}
                        className={`px-3 py-1 text-xs rounded ${sessionType === 'focus'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Fokus
                    </button>
                    <button
                        onClick={() => setSession('shortBreak')}
                        className={`px-3 py-1 text-xs rounded ${sessionType === 'shortBreak'
                                ? 'bg-secondary text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Pause
                    </button>
                </div>
            </div>

            {/* Circular Progress */}
            <div className="relative w-48 h-48 mx-auto mb-6">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="#E5E7EB"
                        strokeWidth="8"
                        fill="none"
                    />
                    <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke={sessionType === 'focus' ? '#0D9488' : '#F59E0B'}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 88}`}
                        strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                        className="transition-all duration-1000"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold text-gray-800">
                        {formatTime()}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-3">
                {!isActive && !isPaused && (
                    <button
                        onClick={startTimer}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Play size={20} />
                        Start
                    </button>
                )}
                {isActive && (
                    <button
                        onClick={pauseTimer}
                        className="flex items-center gap-2 px-6 py-3 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors"
                    >
                        <Pause size={20} />
                        Pause
                    </button>
                )}
                {isPaused && (
                    <button
                        onClick={startTimer}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Play size={20} />
                        Fortsetzen
                    </button>
                )}
                <button
                    onClick={resetTimer}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                    <RotateCcw size={20} />
                    Reset
                </button>
            </div>

            {timeLeft === 0 && (
                <div className="mt-4 p-3 bg-success/10 border border-success rounded-lg text-center">
                    <p className="text-success font-medium">
                        ✨ Session abgeschlossen! Zeit für eine Pause.
                    </p>
                </div>
            )}
        </div>
    );
}
