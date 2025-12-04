'use client';

import { useState } from 'react';
import { Source } from '@/types/source';
import { Globe, FileText, Trash2, Copy, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

interface SourceLibraryProps {
    sources: Source[];
    onDelete: (id: string) => void;
    onInsertQuote: (quote: string, author: string) => void;
}

export function SourceLibrary({ sources, onDelete, onInsertQuote }: SourceLibraryProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    if (sources.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400 text-sm">
                <Globe className="mx-auto mb-2 opacity-50" size={32} />
                <p>Noch keine Quellen gespeichert</p>
                <p className="text-xs mt-1">Füge eine URL hinzu, um zu starten</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {sources.map((source) => (
                <div key={source.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <button
                        onClick={() => setExpandedId(expandedId === source.id ? null : source.id)}
                        className="w-full flex items-center gap-2 p-3 text-left hover:bg-gray-50 transition-colors"
                    >
                        {expandedId === source.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {source.type === 'url' ? <Globe size={14} className="text-blue-500" /> : <FileText size={14} className="text-red-500" />}
                        <span className="flex-1 text-sm font-medium text-gray-800 truncate">{source.title}</span>
                    </button>

                    {/* Expanded Content */}
                    {expandedId === source.id && (
                        <div className="px-3 pb-3 border-t border-gray-50">
                            {/* Summary */}
                            <div className="mt-2 mb-3">
                                <p className="text-xs text-gray-500 font-medium mb-1">Zusammenfassung</p>
                                <p className="text-xs text-gray-700">{source.summary}</p>
                            </div>

                            {/* Tags */}
                            {source.tags.length > 0 && (
                                <div className="mb-3">
                                    <div className="flex flex-wrap gap-1">
                                        {source.tags.map((tag, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Key Quotes */}
                            {source.keyQuotes.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-xs text-gray-500 font-medium mb-1">Schlüsselzitate</p>
                                    <div className="space-y-1">
                                        {source.keyQuotes.map((quote, i) => (
                                            <div key={i} className="flex items-start gap-1 group">
                                                <p className="flex-1 text-xs text-gray-600 italic">"{quote}"</p>
                                                <button
                                                    onClick={() => onInsertQuote(quote, source.title)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-indigo-500 hover:text-indigo-700"
                                                    title="Zitat einfügen"
                                                >
                                                    <Copy size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                {source.url && (
                                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                        <ExternalLink size={10} /> Original
                                    </a>
                                )}
                                <button
                                    onClick={() => onDelete(source.id)}
                                    className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
                                >
                                    <Trash2 size={12} /> Löschen
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
