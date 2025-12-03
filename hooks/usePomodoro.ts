import { useState, useEffect, useCallback } from 'react';

export const POMODORO_TIME = 25 * 60; // 25 minutes in seconds
export const SHORT_BREAK_TIME = 5 * 60; // 5 minutes
export const LONG_BREAK_TIME = 15 * 60; // 15 minutes

export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function usePomodoroTimer(initialTime: number = POMODORO_TIME) {
    const [timeLeft, setTimeLeft] = useState(initialTime);
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [sessionType, setSessionType] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');

    const startTimer = useCallback(() => {
        setIsActive(true);
        setIsPaused(false);
    }, []);

    const pauseTimer = useCallback(() => {
        setIsPaused(true);
        setIsActive(false);
    }, []);

    const resetTimer = useCallback(() => {
        setIsActive(false);
        setIsPaused(false);
        setTimeLeft(sessionType === 'focus' ? POMODORO_TIME : sessionType === 'shortBreak' ? SHORT_BREAK_TIME : LONG_BREAK_TIME);
    }, [sessionType]);

    const setSession = useCallback((type: 'focus' | 'shortBreak' | 'longBreak') => {
        setSessionType(type);
        setIsActive(false);
        setIsPaused(false);
        setTimeLeft(type === 'focus' ? POMODORO_TIME : type === 'shortBreak' ? SHORT_BREAK_TIME : LONG_BREAK_TIME);
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            // Play sound or notify here
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft]);

    return {
        timeLeft,
        isActive,
        isPaused,
        sessionType,
        startTimer,
        pauseTimer,
        resetTimer,
        setSession,
        formatTime: () => formatTime(timeLeft),
    };
}
