'use client';

import { useState } from 'react';
import { Scale, Brain, Lightbulb, ArrowRight, RefreshCw, MessageSquare } from 'lucide-react';

interface DialecticEngineProps {
    initialThesis?: string;
    showToast: (message: string, type: 'success' | 'error') => void;
}

interface DialecticResult {
    thesis: string;
    antithesis: string;
    synthesis: string;
    reflection_questions: string[];
}

export function DialecticEngine({ initialThesis = '', showToast }: DialecticEngineProps) {
    const [thesis, setThesis] = useState(initialThesis);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<DialecticResult | null>(null);

    const handleAnalyze = async () => {
        if (!thesis.trim()) {
            showToast('Bitte gib eine These ein!', 'error');
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/ai/dialectic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ thesis }),
            });

            if (!response.ok) throw new Error('Dialectic analysis failed');

            const data = await response.json();
            setResult(data);
            showToast('Analyse abgeschlossen', 'success');
        } catch (error: any) {
            console.error('Dialectic error:', error);
            showToast('Fehler bei der Analyse', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Input Section */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Deine These</label>
                <textarea
                    value={thesis}
                    onChange={(e) => setThesis(e.target.value)}
                    placeholder="z.B. Frontalunterricht ist veraltet..."
                    className="w-full h-24 p-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-300 outline-none resize-none"
                    disabled={isLoading}
                />
                <button
                    onClick={handleAnalyze}
                    disabled={isLoading || !thesis.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <RefreshCw size={16} className="animate-spin" />
                            Analysiere...
                        </>
                    ) : (
                        <>
                            <Scale size={16} />
                            Dialektik starten
                        </>
                    )}
                </button>
            </div>

            {/* Results Section */}
            {result && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* 1. Antithesis (Red) */}
                    <div className="bg-red-50 rounded-xl p-4 border border-red-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Scale size={100} />
                        </div>
                        <h3 className="text-sm font-bold text-red-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span className="bg-red-200 text-red-800 text-[10px] px-1.5 py-0.5 rounded">ANTITHESE</span>
                            Der Gegenwind
                        </h3>
                        <p className="text-sm text-gray-800 leading-relaxed relative z-10">
                            {result.antithesis}
                        </p>
                    </div>

                    <div className="flex justify-center">
                        <ArrowRight className="text-gray-300 rotate-90" />
                    </div>

                    {/* 2. Synthesis (Green) */}
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Brain size={100} />
                        </div>
                        <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span className="bg-emerald-200 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded">SYNTHESE</span>
                            Die Lösung
                        </h3>
                        <p className="text-sm text-gray-800 leading-relaxed relative z-10">
                            {result.synthesis}
                        </p>
                    </div>

                    {/* 3. Reflection (Blue) */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Lightbulb size={16} />
                            Reflexions-Fragen
                        </h3>
                        <ul className="space-y-2">
                            {result.reflection_questions.map((q, i) => (
                                <li key={i} className="flex gap-2 text-sm text-gray-700">
                                    <span className="text-blue-400 font-bold">•</span>
                                    {q}
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            )}
        </div>
    );
}
