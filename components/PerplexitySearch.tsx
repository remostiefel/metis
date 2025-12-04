'use client';

import { useState } from 'react';
import { Loader2, BookOpen, ExternalLink, Copy, ChevronDown, ChevronRight, Key, MessageCircle, Scale, User, Book, CheckCircle, Sparkles, LucideIcon } from 'lucide-react';

interface PerplexitySearchProps {
    onInsertContent: (content: string) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

interface SearchResult {
    answer: string;
    citations: string[];
}

type ResearchMode = 'keywords' | 'question' | 'dialectic' | 'author' | 'work' | 'factcheck';

const MODES: { id: ResearchMode; icon: LucideIcon; label: string; placeholder: string; color: string }[] = [
    { id: 'keywords', icon: Key, label: 'Keywords', placeholder: 'z.B. Motivation Schueler Hausaufgaben', color: 'orange' },
    { id: 'question', icon: MessageCircle, label: 'Frage', placeholder: 'z.B. Sind Hausaufgaben sinnvoll?', color: 'blue' },
    { id: 'dialectic', icon: Scale, label: 'Dialektik', placeholder: 'z.B. Hausaufgaben foerdern Selbststaendigkeit', color: 'purple' },
    { id: 'author', icon: User, label: 'Autor', placeholder: 'z.B. John Hattie', color: 'green' },
    { id: 'work', icon: Book, label: 'Werk', placeholder: 'z.B. Visible Learning (2009)', color: 'indigo' },
    { id: 'factcheck', icon: CheckCircle, label: 'Faktencheck', placeholder: 'z.B. 10 Min pro Klassenstufe ist optimal', color: 'red' },
];

export function PerplexitySearch({ onInsertContent, showToast }: PerplexitySearchProps) {
    const [input, setInput] = useState('');
    const [mode, setMode] = useState<ResearchMode>('question');
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [optimizedPrompt, setOptimizedPrompt] = useState<string | null>(null);
    const [result, setResult] = useState<SearchResult | null>(null);
    const [showResult, setShowResult] = useState(true);

    const currentMode = MODES.find(m => m.id === mode)!;

    const handleOptimizeAndSearch = async () => {
        if (!input.trim()) return;

        setIsOptimizing(true);
        setOptimizedPrompt(null);
        setResult(null);

        try {
            // Step 1: Optimize prompt with OpenAI
            const optimizeRes = await fetch('/api/research/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input, mode }),
            });

            if (!optimizeRes.ok) throw new Error('Optimization failed');

            const { optimized } = await optimizeRes.json();
            setOptimizedPrompt(optimized);
            setIsOptimizing(false);
            setIsSearching(true);

            // Step 2: Search with Perplexity using optimized prompt
            const searchRes = await fetch('/api/research/perplexity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: optimized, focus: 'academic' }),
            });

            if (!searchRes.ok) throw new Error('Search failed');

            const data = await searchRes.json();
            setResult({
                answer: data.answer,
                citations: data.citations || []
            });
            setShowResult(true);
            showToast('Recherche abgeschlossen!', 'success');

        } catch (error: unknown) {
            console.error('Research error:', error);
            showToast(error instanceof Error ? error.message : 'Fehler bei der Recherche', 'error');
        } finally {
            setIsOptimizing(false);
            setIsSearching(false);
        }
    };

    const handleInsertAnswer = () => {
        if (result?.answer) {
            onInsertContent(`\n\n---\n\n**Recherche-Ergebnis:**\n\n${result.answer}\n\n---\n`);
            showToast('In Editor eingefuegt', 'success');
        }
    };

    const copyToClipboard = async () => {
        if (result?.answer) {
            await navigator.clipboard.writeText(result.answer);
            showToast('In Zwischenablage kopiert', 'success');
        }
    };

    const isLoading = isOptimizing || isSearching;

    return (
        <div className="space-y-4">
            {/* Mode Selector */}
            <div className="grid grid-cols-3 gap-1.5">
                {MODES.map((m) => {
                    const Icon = m.icon;
                    const isActive = mode === m.id;
                    return (
                        <button
                            key={m.id}
                            onClick={() => setMode(m.id)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium transition-all ${isActive
                                ? `bg-${m.color}-100 text-${m.color}-700 border border-${m.color}-200 shadow-sm`
                                : 'bg-gray-50 text-gray-500 border border-transparent hover:bg-gray-100'
                                }`}
                            style={isActive ? { backgroundColor: `var(--${m.color}-100, #f3e8ff)`, color: `var(--${m.color}-700, #7c3aed)` } : {}}
                        >
                            <Icon size={16} />
                            <span>{m.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Input */}
            <div className="space-y-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={currentMode.placeholder}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-300 outline-none"
                    disabled={isLoading}
                    onKeyDown={(e) => e.key === 'Enter' && handleOptimizeAndSearch()}
                />

                {/* Search Button */}
                <button
                    onClick={handleOptimizeAndSearch}
                    disabled={isLoading || !input.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            {isOptimizing ? 'Optimiere Anfrage...' : 'Recherchiere...'}
                        </>
                    ) : (
                        <>
                            <Sparkles size={16} />
                            Smart Research starten
                        </>
                    )}
                </button>
            </div>

            {/* Optimized Prompt Preview */}
            {optimizedPrompt && (
                <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 rounded-lg p-3 border border-purple-100">
                    <p className="text-xs font-medium text-purple-600 mb-1 flex items-center gap-1">
                        <Sparkles size={12} /> Optimierte Anfrage:
                    </p>
                    <p className="text-xs text-purple-800 italic">&quot;{optimizedPrompt}&quot;</p>
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="bg-white rounded-xl border border-purple-100 overflow-hidden">
                    <button
                        onClick={() => setShowResult(!showResult)}
                        className="w-full flex items-center gap-2 p-3 text-left hover:bg-purple-50 transition-colors border-b border-purple-50"
                    >
                        {showResult ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <BookOpen size={14} className="text-purple-500" />
                        <span className="flex-1 text-sm font-medium text-purple-800">Recherche-Ergebnis</span>
                    </button>

                    {showResult && (
                        <div className="p-4">
                            <div className="prose prose-sm max-w-none text-gray-700 text-sm whitespace-pre-wrap mb-4">
                                {result.answer}
                            </div>

                            {result.citations.length > 0 && (
                                <div className="mb-4 pt-3 border-t border-purple-50">
                                    <p className="text-xs font-medium text-purple-600 mb-2">Quellen ({result.citations.length}):</p>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {result.citations.slice(0, 5).map((citation, i) => (
                                            <a
                                                key={i}
                                                href={citation}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-xs text-blue-600 hover:underline truncate"
                                            >
                                                <ExternalLink size={10} />
                                                {citation}
                                            </a>
                                        ))}
                                        {result.citations.length > 5 && (
                                            <p className="text-xs text-gray-400">+{result.citations.length - 5} weitere</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 pt-3 border-t border-purple-50">
                                <button
                                    onClick={handleInsertAnswer}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100 transition-colors"
                                >
                                    <Copy size={12} />
                                    In Editor einfuegen
                                </button>
                                <button
                                    onClick={copyToClipboard}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors"
                                >
                                    <Copy size={12} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="text-center">
                <span className="text-xs text-gray-400">OpenAI + Perplexity AI</span>
            </div>
        </div>
    );
}
