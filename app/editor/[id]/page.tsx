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
    const [showPomodoro, setShowPomodoro] = useState(false);

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

    const handleSave = async () => {
        setSaving(true);
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

            // Show success message (could add a toast notification here)
            console.log('Module saved successfully');
        } catch (error) {
            console.error('Error saving module:', error);
            alert('Fehler beim Speichern. Bitte versuchen Sie es erneut.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-paper flex items-center justify-center">
                <div className="text-neutral">Laden...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-paper">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/"
                                className="text-gray-600 hover:text-primary transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                                <p className="text-xs text-neutral">Modul: {id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowPomodoro(!showPomodoro)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                            >
                                {showPomodoro ? '⏱️ Timer ausblenden' : '⏱️ Fokus-Timer'}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                <Save size={16} />
                                {saving ? 'Speichern...' : 'Speichern'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Editor */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full h-[600px] p-4 font-serif text-lg leading-relaxed border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                placeholder="Beginnen Sie zu schreiben..."
                            />
                            <div className="mt-4 flex justify-between text-sm text-neutral">
                                <span>
                                    {content.trim().split(/\s+/).filter(w => w.length > 0).length} Wörter
                                </span>
                                <span>
                                    {content.length} Zeichen
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {showPomodoro && <PomodoroTimer />}

                        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                Modul-Informationen
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <label className="block text-neutral mb-1">Status</label>
                                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                        <option>Entwurf</option>
                                        <option>Überarbeitung</option>
                                        <option>Final</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-neutral mb-1">Wichtigkeit</label>
                                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                        <option>Niedrig</option>
                                        <option>Mittel</option>
                                        <option>Hoch</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-neutral mb-1">Dringlichkeit</label>
                                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                        <option>Niedrig</option>
                                        <option>Mittel</option>
                                        <option>Hoch</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
