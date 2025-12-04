'use client';

import { useState } from 'react';
import { Globe, Loader2, Sparkles } from 'lucide-react';
import { Source } from '@/types/source';

interface SourceExtractorProps {
    onSourceAdded: (source: Source) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

export function SourceExtractor({ onSourceAdded, showToast }: SourceExtractorProps) {
    const [url, setUrl] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);

    const handleExtract = async () => {
        if (!url.trim()) return;

        setIsExtracting(true);
        try {
            // Step 1: Extract content
            const extractRes = await fetch('/api/research/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'url', url }),
            });

            if (!extractRes.ok) {
                throw new Error('Extraction failed');
            }

            const extracted = await extractRes.json();

            setIsExtracting(false);
            setIsSummarizing(true);

            // Step 2: Summarize with AI
            const summarizeRes = await fetch('/api/research/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: extracted.content,
                    title: extracted.title
                }),
            });

            if (!summarizeRes.ok) {
                throw new Error('Summarization failed');
            }

            const summary = await summarizeRes.json();

            // Step 3: Create source object
            const newSource: Source = {
                id: `src-${Date.now()}`,
                type: 'url',
                title: extracted.title || 'Unbenannte Quelle',
                url: url,
                content: extracted.content || '',
                summary: summary.summary || '',
                keyQuotes: summary.keyQuotes || [],
                tags: summary.tags || [],
                linkedModules: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // Step 4: Save to storage
            await fetch('/api/research/sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSource),
            });

            onSourceAdded(newSource);
            setUrl('');
            showToast('Quelle erfolgreich hinzugefügt!', 'success');

        } catch (error) {
            console.error('Error:', error);
            showToast('Fehler beim Extrahieren der Quelle', 'error');
        } finally {
            setIsExtracting(false);
            setIsSummarizing(false);
        }
    };

    const isLoading = isExtracting || isSummarizing;

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://beispiel.de/artikel"
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none"
                    disabled={isLoading}
                    onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
                />
                <button
                    onClick={handleExtract}
                    disabled={isLoading || !url.trim()}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Globe size={16} />
                    )}
                    {isExtracting ? 'Lade...' : isSummarizing ? 'Analysiere...' : 'Hinzufügen'}
                </button>
            </div>

            {isLoading && (
                <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">
                    <Sparkles size={14} className="animate-pulse" />
                    {isExtracting && 'Inhalte werden extrahiert...'}
                    {isSummarizing && 'AI analysiert die Quelle...'}
                </div>
            )}
        </div>
    );
}
