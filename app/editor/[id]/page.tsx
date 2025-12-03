'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { Save, ArrowLeft } from 'lucide-react';

interface EditorPageProps {
    params: Promise<{ id: string }>;
}

import { useToast } from '@/components/ui/Toast';

export default function EditorPage({ params }: EditorPageProps) {
    const { showToast } = useToast();
    const [id, setId] = useState<string>('');
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [showPomodoro, setShowPomodoro] = useState(false);
    const [focusMode, setFocusMode] = useState(false);

    // Frontmatter state
    const [status, setStatus] = useState<'entwurf' | 'überarbeitung' | 'final'>('entwurf');
    const [importance, setImportance] = useState<'low' | 'medium' | 'high'>('medium');
    const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('low');

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+S or Ctrl+S to save
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                handleSave(false);
            }
            // Cmd+K or Ctrl+K to toggle timer
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setShowPomodoro(prev => !prev);
            }
            // Cmd+Shift+F to toggle focus mode
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
                e.preventDefault();
                setFocusMode(prev => !prev);
                if (!focusMode) {
                    showToast('Fokus-Modus aktiviert', 'info');
                } else {
                    showToast('Fokus-Modus deaktiviert', 'info');
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [content, status, importance, urgency, id, focusMode]); // Dependencies for save function

    // Auto-save logic - now includes frontmatter
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (content && id && !loading) {
                handleSave(true);
            }
        }, 30000); // Auto-save every 30 seconds if changes made

        return () => clearTimeout(timeoutId);
    }, [content, status, importance, urgency, id, loading]);

    useEffect(() => {
        params.then((resolvedParams) => {
            setId(resolvedParams.id);
            // Load module content
            fetch(`/api/modules/${resolvedParams.id}`)
                .then(res => res.json())
                .then(data => {
                    setContent(data.content || '');
                    setTitle(data.title || 'Neues Modul');
                    setStatus(data.status || 'entwurf');
                    setImportance(data.importance || 'medium');
                    setUrgency(data.urgency || 'low');
                    setLoading(false);
                })
                .catch(() => {
                    setLoading(false);
                });
        });
    }, [params]);

    const handleSave = async (isAutoSave = false) => {
        if (!isAutoSave) setSaving(true);
        try {
            const response = await fetch(`/api/modules/${id}/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content,
                    frontmatter: {
                        id,
                        title,
                        status,
                        importance,
                        urgency,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save');
            }

            setLastSaved(new Date());
            if (!isAutoSave) showToast('Modul erfolgreich gespeichert!', 'success');
        } catch (error) {
            console.error('Error saving module:', error);
            if (!isAutoSave) showToast('Fehler beim Speichern.', 'error');
        } finally {
            if (!isAutoSave) setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-gray-500 animate-pulse">Lade dein Studio...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background font-sans transition-colors duration-500">
            {/* Header - Hidden in Focus Mode */}
            <header className={`
                bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10 transition-all duration-500
                ${focusMode ? '-translate-y-full opacity-0 absolute w-full' : 'translate-y-0 opacity-100'}
            `}>
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/"
                                className="text-gray-400 hover:text-primary transition-colors p-2 hover:bg-gray-50 rounded-full"
                            >
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <h1 className="text-lg font-bold text-gray-800 tracking-tight">{title}</h1>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>Modul: {id}</span>
                                    {lastSaved && (
                                        <span className="text-success-foreground flex items-center gap-1">
                                            • Gespeichert {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setFocusMode(!focusMode)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-full transition-all"
                                title="Fokus-Modus (Cmd+Shift+F)"
                            >
                                👁️ Fokus
                            </button>
                            <button
                                onClick={() => setShowPomodoro(!showPomodoro)}
                                className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${showPomodoro
                                    ? 'bg-secondary/10 text-secondary-foreground'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {showPomodoro ? 'Timer aktiv' : '⏱️ Timer'}
                            </button>
                            <button
                                onClick={() => handleSave(false)}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all shadow-sm hover:shadow-md disabled:opacity-50 font-medium text-sm"
                            >
                                <Save size={16} />
                                {saving ? 'Speichert...' : 'Speichern'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Floating Exit Focus Button */}
            <button
                onClick={() => setFocusMode(false)}
                className={`
                    fixed top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 text-gray-400 hover:text-gray-600 rounded-full transition-all duration-300 backdrop-blur-sm
                    ${focusMode ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}
                `}
                title="Fokus-Modus beenden (Esc oder Cmd+Shift+F)"
            >
                <ArrowLeft size={20} />
            </button>

            <div className={`max-w-5xl mx-auto px-6 py-8 transition-all duration-500 ${focusMode ? 'max-w-3xl' : ''}`}>
                <div className={`grid grid-cols-1 gap-8 transition-all duration-500 ${focusMode ? 'lg:grid-cols-1' : 'lg:grid-cols-12'}`}>
                    {/* Editor */}
                    <div className={`transition-all duration-500 ${focusMode ? 'lg:col-span-1' : 'lg:col-span-8'}`}>
                        <div className={`
                            bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[calc(100vh-12rem)] transition-all duration-500
                            ${focusMode ? 'shadow-none border-none' : ''}
                        `}>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full h-full min-h-[600px] font-serif text-lg leading-relaxed text-gray-700 border-none focus:outline-none focus:ring-0 resize-none placeholder-gray-300"
                                placeholder="Hier beginnt deine Geschichte..."
                                spellCheck={false}
                            />
                        </div>
                        <div className={`mt-4 flex justify-end text-xs text-gray-400 font-medium px-4 transition-opacity duration-300 ${focusMode ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                            {content.trim().split(/\s+/).filter(w => w.length > 0).length} Wörter
                        </div>
                    </div>

                    {/* Sidebar - Hidden in Focus Mode */}
                    <div className={`
                        lg:col-span-4 space-y-6 transition-all duration-500
                        ${focusMode ? 'opacity-0 translate-x-20 hidden' : 'opacity-100 translate-x-0 block'}
                    `}>
                        {showPomodoro && (
                            <div className="animate-in slide-in-from-right-4 duration-300">
                                <PomodoroTimer />
                            </div>
                        )}

                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                                Einstellungen
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                                    <div className="relative">
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value as 'entwurf' | 'überarbeitung' | 'final')}
                                            className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none"
                                        >
                                            <option value="entwurf">Entwurf</option>
                                            <option value="überarbeitung">Überarbeitung</option>
                                            <option value="final">Final</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            ▼
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Wichtigkeit</label>
                                    <div className="flex gap-2">
                                        {[
                                            { label: 'Niedrig', value: 'low' },
                                            { label: 'Mittel', value: 'medium' },
                                            { label: 'Hoch', value: 'high' }
                                        ].map(({ label, value }) => (
                                            <button
                                                key={value}
                                                onClick={() => setImportance(value as 'low' | 'medium' | 'high')}
                                                className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${importance === value
                                                    ? 'bg-primary/10 border-primary/30 text-primary-foreground'
                                                    : 'border-gray-100 hover:bg-gray-50 hover:border-gray-200 text-gray-600'
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Dringlichkeit</label>
                                    <div className="flex gap-2">
                                        {[
                                            { label: 'Niedrig', value: 'low' },
                                            { label: 'Mittel', value: 'medium' },
                                            { label: 'Hoch', value: 'high' }
                                        ].map(({ label, value }) => (
                                            <button
                                                key={value}
                                                onClick={() => setUrgency(value as 'low' | 'medium' | 'high')}
                                                className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${urgency === value
                                                    ? 'bg-secondary/10 border-secondary/30 text-secondary-foreground'
                                                    : 'border-gray-100 hover:bg-gray-50 hover:border-gray-200 text-gray-600'
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
