'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { Save, ArrowLeft } from 'lucide-react';

interface EditorPageProps {
    params: Promise<{ id: string }>;
}

export default function EditorPage({ params }: EditorPageProps) {
    const [id, setId] = useState<string>('');
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [showPomodoro, setShowPomodoro] = useState(false);

    // Auto-save logic
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (content && id && !loading) {
                handleSave(true);
            }
        }, 30000); // Auto-save every 30 seconds if changes made

        return () => clearTimeout(timeoutId);
    }, [content, id, loading]);

    useEffect(() => {
        params.then((resolvedParams) => {
            setId(resolvedParams.id);
            // Load module content
            fetch(`/api/modules/${resolvedParams.id}`)
                .then(res => res.json())
                .then(data => {
                    setContent(data.content || '');
                    setTitle(data.title || 'Neues Modul');
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
                        // Add other frontmatter fields as needed
                    },
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save');
            }

            setLastSaved(new Date());
            if (!isAutoSave) console.log('Module saved successfully');
        } catch (error) {
            console.error('Error saving module:', error);
            if (!isAutoSave) alert('Fehler beim Speichern. Bitte versuchen Sie es erneut.');
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
        <div className="min-h-screen bg-background font-sans">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10 transition-all">
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
                                onClick={() => setShowPomodoro(!showPomodoro)}
                                className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${showPomodoro
                                        ? 'bg-secondary/10 text-secondary-foreground'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {showPomodoro ? 'Timer aktiv' : '⏱️ Fokus'}
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

            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Editor */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[calc(100vh-12rem)]">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full h-full min-h-[600px] font-serif text-lg leading-relaxed text-gray-700 border-none focus:outline-none focus:ring-0 resize-none placeholder-gray-300"
                                placeholder="Hier beginnt deine Geschichte..."
                                spellCheck={false}
                            />
                        </div>
                        <div className="mt-4 flex justify-end text-xs text-gray-400 font-medium px-4">
                            {content.trim().split(/\s+/).filter(w => w.length > 0).length} Wörter
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
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
                                        <select className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none">
                                            <option>Entwurf</option>
                                            <option>Überarbeitung</option>
                                            <option>Final</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            ▼
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Wichtigkeit</label>
                                    <div className="flex gap-2">
                                        {['Niedrig', 'Mittel', 'Hoch'].map((level) => (
                                            <button
                                                key={level}
                                                className="flex-1 py-2 text-xs font-medium rounded-lg border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-colors text-gray-600"
                                            >
                                                {level}
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
