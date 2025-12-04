'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { Save, ArrowLeft, Download, Copy, Sparkles, Tag, MessageSquare, Type, Link as LinkIcon, Brain, Quote, HelpCircle, Search, CheckCircle, FileDown } from 'lucide-react';

interface EditorPageProps {
    params: Promise<{ id: string }>;
}

import { useToast } from '@/components/ui/Toast';
import { exportToPDF } from '@/lib/pdfExport';

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

    // AI State
    const [tags, setTags] = useState<string[]>([]);
    const [isGeneratingTags, setIsGeneratingTags] = useState(false);
    const [styleAnalysis, setStyleAnalysis] = useState<{ critique?: string; suggestions?: string[] } | null>(null);
    const [isCheckingStyle, setIsCheckingStyle] = useState(false);

    const [feedback, setFeedback] = useState<{ summary?: string; points?: string[] } | null>(null);
    const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

    const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
    const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);

    const [references, setReferences] = useState<{ targetId: string; targetTitle: string; reason: string }[]>([]);
    const [isGeneratingReferences, setIsGeneratingReferences] = useState(false);

    const [smartMetadata, setSmartMetadata] = useState<{ summary?: string; quotes?: string[]; questions?: string[] } | null>(null);
    const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);

    const [quoteQuery, setQuoteQuery] = useState('');
    const [foundQuotes, setFoundQuotes] = useState<{ text: string; author: string; context: string }[]>([]);
    const [isSearchingQuotes, setIsSearchingQuotes] = useState(false);
    const [quoteVerification, setQuoteVerification] = useState<{ isCorrect: boolean; correction: string; author: string; origin: string } | null>(null);
    const [isVerifyingQuote, setIsVerifyingQuote] = useState(false);

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
                        tags, // Save tags
                        summary: smartMetadata?.summary,
                        quotes: smartMetadata?.quotes,
                        questions: smartMetadata?.questions,
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

    const handleExportMarkdown = () => {
        const element = document.createElement("a");
        const file = new Blob([content], { type: 'text/markdown' });
        element.href = URL.createObjectURL(file);

        // Create unique filename with timestamp: module-id_YYYY-MM-DD_HH-MM-SS.md
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');

        element.download = `${id.replace(/\//g, '-')}_${dateStr}_${timeStr}.md`;

        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
        document.body.removeChild(element);
        showToast('Markdown-Datei heruntergeladen', 'success');
    };

    const handleCopyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(content);
            showToast('Text in die Zwischenablage kopiert', 'success');
        } catch (err) {
            console.error('Failed to copy: ', err);
            showToast('Fehler beim Kopieren', 'error');
        }
    };

    const handleExportPDF = () => {
        try {
            exportToPDF({
                title: title || 'Unbenanntes Kapitel',
                content: content
            });
            showToast('PDF erfolgreich exportiert', 'success');
        } catch (err) {
            console.error('Failed to export PDF: ', err);
            showToast('Fehler beim PDF-Export', 'error');
        }
    };

    const handleGenerateTags = async () => {
        setIsGeneratingTags(true);
        try {
            const response = await fetch('/api/ai/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });
            const data = await response.json();
            if (data.tags) {
                setTags(data.tags);
                showToast('Tags generiert!', 'success');
            }
        } catch (error) {
            console.error('Error generating tags:', error);
            showToast('Fehler bei der Tag-Generierung', 'error');
        } finally {
            setIsGeneratingTags(false);
        }
    };

    const handleCheckStyle = async () => {
        setIsCheckingStyle(true);
        try {
            const response = await fetch('/api/ai/style', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });
            const data = await response.json();
            if (data.critique) {
                setStyleAnalysis(data);
                showToast('Stil-Analyse fertig!', 'success');
            }
        } catch (error) {
            console.error('Error checking style:', error);
            showToast('Fehler bei der Stil-Analyse', 'error');
        } finally {
            setIsCheckingStyle(false);
        }
    };

    const handleGenerateFeedback = async () => {
        setIsGeneratingFeedback(true);
        try {
            const response = await fetch('/api/ai/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });
            const data = await response.json();
            if (data.summary) {
                setFeedback(data);
                showToast('Feedback erhalten!', 'success');
            }
        } catch (error) {
            console.error('Error generating feedback:', error);
            showToast('Fehler beim Feedback', 'error');
        } finally {
            setIsGeneratingFeedback(false);
        }
    };

    const handleGenerateTitles = async () => {
        setIsGeneratingTitles(true);
        try {
            const response = await fetch('/api/ai/titles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });
            const data = await response.json();
            if (data.titles) {
                setSuggestedTitles(data.titles);
                showToast('Titel-Vorschläge generiert!', 'success');
            }
        } catch (error) {
            console.error('Error generating titles:', error);
            showToast('Fehler bei Titeln', 'error');
        } finally {
            setIsGeneratingTitles(false);
        }
    };

    const handleGenerateReferences = async () => {
        setIsGeneratingReferences(true);
        try {
            const response = await fetch('/api/ai/references', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, currentId: id }),
            });
            const data = await response.json();
            if (data.references) {
                setReferences(data.references);
                showToast('Querbezüge gefunden!', 'success');
            }
        } catch (error) {
            console.error('Error generating references:', error);
            showToast('Fehler bei Querbezügen', 'error');
        } finally {
            setIsGeneratingReferences(false);
        }
    };

    const handleGenerateMetadata = async () => {
        setIsGeneratingMetadata(true);
        try {
            const response = await fetch('/api/ai/metadata', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });
            const data = await response.json();

            if (data.tags) setTags(prev => [...new Set([...prev, ...data.tags])]);

            setSmartMetadata({
                summary: data.summary,
                quotes: data.quotes,
                questions: data.questions
            });

            showToast('Smarte Metadaten generiert!', 'success');
        } catch (error) {
            console.error('Error generating metadata:', error);
            showToast('Fehler bei Metadaten', 'error');
        } finally {
            setIsGeneratingMetadata(false);
        }
    };

    const handleSearchQuotes = async () => {
        if (!quoteQuery.trim()) return;
        setIsSearchingQuotes(true);
        try {
            const response = await fetch('/api/ai/quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'search', query: quoteQuery }),
            });
            const data = await response.json();
            if (data.quotes) {
                setFoundQuotes(data.quotes);
                showToast('Zitate gefunden!', 'success');
            }
        } catch (error) {
            console.error('Error searching quotes:', error);
            showToast('Fehler bei der Zitat-Suche', 'error');
        } finally {
            setIsSearchingQuotes(false);
        }
    };

    const handleVerifyQuote = async (quoteText: string) => {
        setIsVerifyingQuote(true);
        try {
            const response = await fetch('/api/ai/quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verify', quote: quoteText }),
            });
            const data = await response.json();
            setQuoteVerification(data);
            showToast('Zitat geprüft!', 'success');
        } catch (error) {
            console.error('Error verifying quote:', error);
            showToast('Fehler bei der Prüfung', 'error');
        } finally {
            setIsVerifyingQuote(false);
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

                        {/* Export Actions */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                                Export
                            </h3>
                            <div className="space-y-3">
                                <button
                                    onClick={handleExportMarkdown}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-blue-50 text-blue-600 rounded-xl transition-colors text-sm font-medium border border-blue-100 shadow-sm"
                                >
                                    <Download size={16} />
                                    Markdown (.md)
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-red-50 text-red-600 rounded-xl transition-colors text-sm font-medium border border-red-100 shadow-sm"
                                >
                                    <FileDown size={16} />
                                    PDF Export
                                </button>
                                <button
                                    onClick={handleCopyToClipboard}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-600 rounded-xl transition-colors text-sm font-medium border border-gray-100 shadow-sm"
                                >
                                    <Copy size={16} />
                                    Kopieren
                                </button>
                            </div>
                        </div>

                        {/* AI Assistant */}
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-sm p-6 border border-indigo-100">
                            <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Sparkles size={16} className="text-indigo-500" />
                                AI Assistant
                            </h3>

                            <div className="space-y-4">
                                {/* Tagging */}
                                <div>
                                    <button
                                        onClick={handleGenerateTags}
                                        disabled={isGeneratingTags}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-indigo-50 text-indigo-700 rounded-xl transition-colors text-sm font-medium border border-indigo-100 shadow-sm"
                                    >
                                        <Tag size={16} />
                                        {isGeneratingTags ? 'Analysiere...' : 'Tags generieren'}
                                    </button>
                                    {tags.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {tags.map((tag, i) => (
                                                <span key={i} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md font-medium">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Style Check */}
                                <div>
                                    <button
                                        onClick={handleCheckStyle}
                                        disabled={isCheckingStyle}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-purple-50 text-purple-700 rounded-xl transition-colors text-sm font-medium border border-purple-100 shadow-sm"
                                    >
                                        <Sparkles size={16} />
                                        {isCheckingStyle ? 'Prüfe Stil...' : 'Stil-Check'}
                                    </button>
                                    {styleAnalysis && (
                                        <div className="mt-3 p-3 bg-white rounded-xl border border-purple-100 text-sm">
                                            <p className="text-gray-700 font-medium mb-2">{styleAnalysis.critique}</p>
                                            {styleAnalysis.suggestions && styleAnalysis.suggestions.length > 0 && (
                                                <ul className="list-disc list-inside text-gray-600 space-y-1 text-xs">
                                                    {styleAnalysis.suggestions.map((suggestion, i) => (
                                                        <li key={i}>{suggestion}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Chapter Feedback */}
                                <div>
                                    <button
                                        onClick={handleGenerateFeedback}
                                        disabled={isGeneratingFeedback}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-blue-50 text-blue-700 rounded-xl transition-colors text-sm font-medium border border-blue-100 shadow-sm"
                                    >
                                        <MessageSquare size={16} />
                                        {isGeneratingFeedback ? 'Analysiere...' : 'Kapitel-Feedback'}
                                    </button>
                                    {feedback && (
                                        <div className="mt-3 p-3 bg-white rounded-xl border border-blue-100 text-sm">
                                            <p className="text-gray-700 font-medium mb-2">{feedback.summary}</p>
                                            {feedback.points && feedback.points.length > 0 && (
                                                <ul className="list-disc list-inside text-gray-600 space-y-1 text-xs">
                                                    {feedback.points.map((point, i) => (
                                                        <li key={i}>{point}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Title Suggestions */}
                                <div>
                                    <button
                                        onClick={handleGenerateTitles}
                                        disabled={isGeneratingTitles}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-green-50 text-green-700 rounded-xl transition-colors text-sm font-medium border border-green-100 shadow-sm"
                                    >
                                        <Type size={16} />
                                        {isGeneratingTitles ? 'Denke nach...' : 'Titel-Ideen'}
                                    </button>
                                    {suggestedTitles.length > 0 && (
                                        <ul className="mt-3 space-y-2">
                                            {suggestedTitles.map((title, i) => (
                                                <li key={i} className="p-2 bg-white rounded-lg border border-green-100 text-xs text-gray-700 font-medium cursor-pointer hover:bg-green-50 hover:text-green-800 transition-colors" onClick={() => setTitle(title)}>
                                                    {title}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Smart Cross-References */}
                                <div>
                                    <button
                                        onClick={handleGenerateReferences}
                                        disabled={isGeneratingReferences}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-amber-50 text-amber-700 rounded-xl transition-colors text-sm font-medium border border-amber-100 shadow-sm"
                                    >
                                        <LinkIcon size={16} />
                                        {isGeneratingReferences ? 'Suche...' : 'Querbezüge finden'}
                                    </button>
                                    {references.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {references.map((ref, i) => (
                                                <div key={i} className="p-2 bg-white rounded-lg border border-amber-100 text-xs">
                                                    <div className="font-bold text-gray-800 mb-1">Zu: {ref.targetTitle}</div>
                                                    <div className="text-gray-600">{ref.reason}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Smart Metadata */}
                                <div>
                                    <button
                                        onClick={handleGenerateMetadata}
                                        disabled={isGeneratingMetadata}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-teal-50 text-teal-700 rounded-xl transition-colors text-sm font-medium border border-teal-100 shadow-sm"
                                    >
                                        <Brain size={16} />
                                        {isGeneratingMetadata ? 'Analysiere...' : 'Smart Metadata'}
                                    </button>
                                    {smartMetadata && (
                                        <div className="mt-3 space-y-3">
                                            {smartMetadata.summary && (
                                                <div className="p-3 bg-white rounded-xl border border-teal-100 text-sm">
                                                    <div className="font-bold text-teal-800 mb-1 flex items-center gap-1"><Brain size={12} /> Summary</div>
                                                    <p className="text-gray-600 text-xs">{smartMetadata.summary}</p>
                                                </div>
                                            )}
                                            {smartMetadata.quotes && smartMetadata.quotes.length > 0 && (
                                                <div className="p-3 bg-white rounded-xl border border-teal-100 text-sm">
                                                    <div className="font-bold text-teal-800 mb-1 flex items-center gap-1"><Quote size={12} /> Zitate</div>
                                                    <ul className="list-disc list-inside text-gray-600 space-y-1 text-xs italic">
                                                        {smartMetadata.quotes.map((q, i) => <li key={i}>"{q}"</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                            {smartMetadata.questions && smartMetadata.questions.length > 0 && (
                                                <div className="p-3 bg-white rounded-xl border border-teal-100 text-sm">
                                                    <div className="font-bold text-teal-800 mb-1 flex items-center gap-1"><HelpCircle size={12} /> Fragen</div>
                                                    <ul className="list-disc list-inside text-gray-600 space-y-1 text-xs">
                                                        {smartMetadata.questions.map((q, i) => <li key={i}>{q}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Quote Manager */}
                                <div>
                                    <div className="p-4 bg-white rounded-2xl border border-orange-100 shadow-sm">
                                        <h4 className="text-xs font-bold text-orange-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Quote size={14} className="text-orange-500" />
                                            Zitat-Manager
                                        </h4>

                                        {/* Search */}
                                        <div className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                value={quoteQuery}
                                                onChange={(e) => setQuoteQuery(e.target.value)}
                                                placeholder="Thema (z.B. Mut)"
                                                className="flex-1 px-3 py-2 bg-gray-50 border-none rounded-lg text-xs focus:ring-1 focus:ring-orange-200"
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearchQuotes()}
                                            />
                                            <button
                                                onClick={handleSearchQuotes}
                                                disabled={isSearchingQuotes}
                                                className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
                                            >
                                                <Search size={14} />
                                            </button>
                                        </div>

                                        {/* Results */}
                                        {foundQuotes.length > 0 && (
                                            <div className="space-y-2 mb-4">
                                                {foundQuotes.map((q, i) => (
                                                    <div key={i} className="p-2 bg-orange-50/50 rounded-lg border border-orange-100 text-xs group relative">
                                                        <p className="italic text-gray-700 mb-1">"{q.text}"</p>
                                                        <p className="text-gray-500 font-medium">— {q.author}</p>
                                                        <button
                                                            onClick={() => {
                                                                setContent(prev => prev + `\n\n> "${q.text}"\n> — *${q.author}*`);
                                                                showToast('Zitat eingefügt', 'success');
                                                            }}
                                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-white rounded shadow-sm text-orange-600 hover:text-orange-800"
                                                            title="Einfügen"
                                                        >
                                                            <Copy size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Verify Button (Contextual) */}
                                        <button
                                            onClick={() => {
                                                const selection = window.getSelection()?.toString();
                                                if (selection) handleVerifyQuote(selection);
                                                else showToast('Markiere zuerst ein Zitat!', 'error');
                                            }}
                                            disabled={isVerifyingQuote}
                                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-orange-50 text-orange-700 rounded-lg transition-colors text-xs font-medium border border-orange-100 border-dashed"
                                        >
                                            <CheckCircle size={14} />
                                            Markiertes Zitat prüfen
                                        </button>

                                        {/* Verification Result */}
                                        {quoteVerification && (
                                            <div className={`mt-3 p-3 rounded-xl border text-xs ${quoteVerification.isCorrect ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                                                <div className="font-bold mb-1 flex items-center gap-1">
                                                    {quoteVerification.isCorrect ? <CheckCircle size={12} /> : <HelpCircle size={12} />}
                                                    {quoteVerification.isCorrect ? 'Korrekt!' : 'Vorsicht!'}
                                                </div>
                                                {!quoteVerification.isCorrect && (
                                                    <>
                                                        <p className="mb-1">Eigentlich von: <strong>{quoteVerification.author}</strong></p>
                                                        <p className="text-xs opacity-80">{quoteVerification.origin}</p>
                                                    </>
                                                )}
                                                {quoteVerification.isCorrect && (
                                                    <p className="text-xs opacity-80">{quoteVerification.origin}</p>
                                                )}
                                            </div>
                                        )}
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
