'use client';

import { useState } from 'react';
import { Loader2, MessageSquare, ThumbsUp, ThumbsDown, Lightbulb, User, AlertCircle } from 'lucide-react';

type PersonaId = 'pragmatist' | 'skeptic' | 'novice' | 'relationship' | 'structured';

interface Persona {
    id: PersonaId;
    name: string;
    role: string;
    emoji: string;
    color: string;
}

const PERSONAS: Persona[] = [
    { id: 'pragmatist', name: 'Der Pragmatiker', role: 'Praxisorientiert', emoji: '🛠️', color: 'orange' },
    { id: 'skeptic', name: 'Der Skeptiker', role: 'Kritisch', emoji: '🤨', color: 'gray' },
    { id: 'novice', name: 'Der Neuling', role: 'Unsicher', emoji: '🌱', color: 'green' },
    { id: 'relationship', name: 'Der Beziehungsmensch', role: 'Empathisch', emoji: '❤️', color: 'rose' },
    { id: 'structured', name: 'Der Strukturierte', role: 'Ordnungsliebend', emoji: '📏', color: 'blue' },
];

interface Feedback {
    reaction: string;
    critique: string;
    praise: string;
    suggestion: string;
}

interface PersonaTesterProps {
    content: string;
    showToast: (message: string, type: 'success' | 'error') => void;
}

export function PersonaTester({ content, showToast }: PersonaTesterProps) {
    const [selectedPersona, setSelectedPersona] = useState<PersonaId | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<Feedback | null>(null);

    const handleTest = async (personaId: PersonaId) => {
        if (!content.trim()) {
            showToast('Bitte schreibe erst etwas Text!', 'error');
            return;
        }

        setSelectedPersona(personaId);
        setIsLoading(true);
        setFeedback(null);

        try {
            const response = await fetch('/api/ai/persona-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, personaId }),
            });

            if (!response.ok) throw new Error('Feedback failed');

            const data = await response.json();
            setFeedback(data.feedback);

        } catch (error: any) {
            console.error('Persona error:', error);
            showToast('Fehler beim Abrufen des Feedbacks', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Persona Selection */}
            <div className="grid grid-cols-5 gap-2">
                {PERSONAS.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => handleTest(p.id)}
                        disabled={isLoading}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${selectedPersona === p.id
                                ? `bg-${p.color}-100 ring-2 ring-${p.color}-400 scale-105 shadow-md`
                                : 'bg-white hover:bg-gray-50 border border-gray-100 hover:scale-105'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={`${p.name} - ${p.role}`}
                    >
                        <span className="text-2xl filter drop-shadow-sm">{p.emoji}</span>
                        <span className="text-[10px] font-medium text-gray-600 truncate w-full text-center">{p.name}</span>
                    </button>
                ))}
            </div>

            {/* Feedback Display */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400 animate-pulse">
                    <Loader2 size={32} className="animate-spin mb-2" />
                    <p className="text-xs">Persona liest dein Kapitel...</p>
                </div>
            )}

            {feedback && selectedPersona && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Header */}
                    <div className={`bg-${PERSONAS.find(p => p.id === selectedPersona)?.color}-50 p-4 border-b border-gray-100 flex items-center gap-3`}>
                        <span className="text-3xl">{PERSONAS.find(p => p.id === selectedPersona)?.emoji}</span>
                        <div>
                            <h3 className="font-bold text-gray-800 text-sm">{PERSONAS.find(p => p.id === selectedPersona)?.name}</h3>
                            <p className="text-xs text-gray-500">{PERSONAS.find(p => p.id === selectedPersona)?.role}</p>
                        </div>
                    </div>

                    {/* Chat Bubble Content */}
                    <div className="p-5 space-y-4">
                        {/* Reaction */}
                        <div className="bg-gray-50 rounded-tl-none rounded-2xl p-3 text-sm text-gray-700 italic border border-gray-100">
                            "{feedback.reaction}"
                        </div>

                        {/* Praise */}
                        <div className="flex gap-3 items-start">
                            <div className="mt-1 p-1.5 bg-green-100 text-green-600 rounded-full">
                                <ThumbsUp size={14} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Das gefällt mir</p>
                                <p className="text-sm text-gray-700">{feedback.praise}</p>
                            </div>
                        </div>

                        {/* Critique */}
                        <div className="flex gap-3 items-start">
                            <div className="mt-1 p-1.5 bg-red-100 text-red-600 rounded-full">
                                <ThumbsDown size={14} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Das stört mich</p>
                                <p className="text-sm text-gray-700">{feedback.critique}</p>
                            </div>
                        </div>

                        {/* Suggestion */}
                        <div className="flex gap-3 items-start bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                            <div className="mt-1 p-1.5 bg-yellow-200 text-yellow-700 rounded-full">
                                <Lightbulb size={14} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-yellow-700 uppercase tracking-wider mb-1">Mein Wunsch</p>
                                <p className="text-sm text-gray-800 font-medium">{feedback.suggestion}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!feedback && !isLoading && (
                <div className="text-center py-8 text-gray-400 text-xs">
                    <User size={24} className="mx-auto mb-2 opacity-20" />
                    <p>Wähle eine Persona, um Feedback zu erhalten.</p>
                </div>
            )}
        </div>
    );
}
