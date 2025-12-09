'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { Save, ArrowLeft, Download, Copy, Sparkles, Tag, MessageSquare, Type, Link as LinkIcon, Brain, Quote, HelpCircle, Search, CheckCircle, FileDown, Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Quote as QuoteIcon, Link2, AlignCenter, Palette, BookOpen, Edit3, Highlighter, CheckSquare, X, Settings, Minus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { FormatSettingsDialog } from '@/components/FormatSettingsDialog';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markdown';
import 'prismjs/themes/prism.css'; // Import base theme, we'll override it

interface EditorPageProps {
    params: Promise<{ slug: string[] }>;
}

import { useToast } from '@/components/ui/Toast';
import { exportToPDF } from '@/lib/pdfExport';
import { SourceLibrary } from '@/components/SourceLibrary';
import { SourceExtractor } from '@/components/SourceExtractor';
import { Source } from '@/types/source';
import { PerplexitySearch } from '@/components/PerplexitySearch';
import { PersonaTester } from '@/components/PersonaTester';
import { DialecticEngine } from '@/components/DialecticEngine';

export default function EditorPage({ params }: EditorPageProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const [id, setId] = useState<string>('');
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [kapitel, setKapitel] = useState<string>('');
    const [unterkapitel, setUnterkapitel] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [showPomodoro, setShowPomodoro] = useState(false);
    const [focusMode, setFocusMode] = useState(false);

    // Reading Mode State
    const [viewMode, setViewMode] = useState<'edit' | 'read'>('edit');
    const [reviewNotes, setReviewNotes] = useState('');
    const [selectionTooltip, setSelectionTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

    // Custom Formats State
    const [showFormatSettings, setShowFormatSettings] = useState(false);
    // We store the styles as a CSS string to inject
    const [customStyles, setCustomStyles] = useState('');

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

    // Research/Sources state
    const [sources, setSources] = useState<Source[]>([]);

    // Textarea ref for markdown toolbar
    // We need to keep this to interface with our toolbar functions
    // react-simple-code-editor exposes the textarea via a ref, but it might be nested
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Initial load fix for Prism
    useEffect(() => {
        // Force highlight update on mount if needed
    }, []);

    // Markdown formatting helper
    const applyMarkdownFormat = (prefix: string, suffix: string = prefix, placeholder: string = 'Text') => {
        // For Editor component, we need to access the underlying textarea
        // The simple-code-editor forwards ref to the textarea if passed correctly or we access it via the component
        // Current version of react-simple-code-editor might attach ref to container or textarea depending on version
        // We will pass currentRef to the Editor component
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const scrollTop = textarea.scrollTop; // Capture scroll position
        const selectedText = content.substring(start, end);

        let newText: string;
        let newCursorStart: number;
        let newCursorEnd: number;

        if (selectedText) {
            // Wrap selected text
            newText = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
            // Selection should wrap the original text (now formatted)
            newCursorStart = start + prefix.length;
            newCursorEnd = start + prefix.length + selectedText.length;
        } else {
            // Insert placeholder
            newText = content.substring(0, start) + prefix + placeholder + suffix + content.substring(end);
            // Select the placeholder text
            newCursorStart = start + prefix.length;
            newCursorEnd = newCursorStart + placeholder.length;
        }

        setContent(newText);

        // Restore focus and selection after React re-renders
        // requestAnimationFrame is often more reliable than setTimeout(0) for UI updates
        requestAnimationFrame(() => {
            if (textarea) {
                textarea.focus();
                textarea.setSelectionRange(newCursorStart, newCursorEnd);
                textarea.scrollTop = scrollTop; // Restore scroll position
            }
        });
    };

    const insertAtCursor = (text: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const scrollTop = textarea.scrollTop;

        const newText = content.substring(0, start) + text + content.substring(end);
        setContent(newText);

        requestAnimationFrame(() => {
            if (textarea) {
                textarea.focus();
                const newPos = start + text.length;
                textarea.setSelectionRange(newPos, newPos);
                textarea.scrollTop = scrollTop;
            }
        });
    };

    const applyLineFormat = (prefix: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const scrollTop = textarea.scrollTop; // Capture scroll position
        const lineStart = content.lastIndexOf('\n', start - 1) + 1;

        const newText = content.substring(0, lineStart) + prefix + content.substring(lineStart);
        setContent(newText);

        requestAnimationFrame(() => {
            if (textarea) {
                textarea.focus();
                // Move cursor to where it was, shifted by prefix length
                const newPos = start + prefix.length;
                textarea.setSelectionRange(newPos, newPos);
                textarea.scrollTop = scrollTop; // Restore scroll position
            }
        });
    };

    const insertLink = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const scrollTop = textarea.scrollTop; // Capture scroll position
        const selectedText = content.substring(start, end);

        const linkText = selectedText || 'Link-Text';
        const newText = content.substring(0, start) + `[${linkText}](url)` + content.substring(end);
        setContent(newText);

        requestAnimationFrame(() => {
            if (textarea) {
                textarea.focus();
                // Select the 'url' part so user can type it immediately
                const urlStart = start + linkText.length + 3; // +3 for `[` + `](`
                textarea.setSelectionRange(urlStart, urlStart + 3);
                textarea.scrollTop = scrollTop; // Restore scroll position
            }
        });
    };

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

    // Style Helper Functions
    const objToCss = (obj: any) => {
        return Object.entries(obj)
            .map(([k, v]) => `${k.replace(/[A-Z]/g, m => "-" + m.toLowerCase())}: ${v};`)
            .join(' ');
    };

    const updateStyleTag = (settings: any) => {
        let css = '';
        if (settings.subtitle) css += `.custom-subtitle { ${objToCss(settings.subtitle)} } \n`;
        if (settings.haiku) css += `.custom-haiku { ${objToCss(settings.haiku)} } \n`;
        if (settings.keypoints) css += `.custom-keypoints { ${objToCss(settings.keypoints)} } \n`;
        if (settings.reflection) css += `.custom-reflection { ${objToCss(settings.reflection)} } \n`;
        if (settings.links) css += `.custom-links { ${objToCss(settings.links)} } \n`;
        setCustomStyles(css);
    };

    const loadFormatSettings = async () => {
        try {
            const res = await fetch('/api/settings/formats');
            const data = await res.json();
            updateStyleTag(data);
        } catch (e) {
            console.error('Failed to load format settings', e);
        }
    };

    useEffect(() => {
        params.then((resolvedParams) => {
            // Join the slug array back into a path string
            const resolvedId = Array.isArray(resolvedParams.slug)
                ? resolvedParams.slug.join('/')
                : resolvedParams.slug;

            setId(resolvedId);

            // Load module content
            fetch(`/api/modules/${resolvedId}`, { cache: 'no-store' })
                .then(res => res.json())
                .then(data => {
                    setContent(data.content || '');
                    setTitle(data.title || 'Neues Modul');
                    setKapitel(data.kapitel !== undefined ? String(data.kapitel) : '');
                    setUnterkapitel(data.unterkapitel ? String(data.unterkapitel) : '');
                    setStatus(data.status || 'entwurf');
                    setImportance(data.importance || 'medium');
                    setUrgency(data.urgency || 'low');
                    setReviewNotes(data.reviewNotes || '');
                    setLoading(false);
                })
                .catch(() => {
                    setLoading(false);
                });
        });

        // Load sources
        fetch('/api/research/sources')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setSources(data);
            })
            .catch(console.error);

        // Load settings on mount
        loadFormatSettings();
    }, [params]);

    const handleSave = async (isAutoSave = false) => {
        if (!isAutoSave) setSaving(true);
        try {
            let targetId = id;
            let shouldRedirect = false;

            // If this is a new module (template), generate a new ID from the title
            if (id === 'template') {
                let slug = title
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)+/g, '') || `untitled-${Date.now()}`;

                // Check if module already exists to prevent overwriting
                try {
                    const checkResponse = await fetch(`/api/modules/${slug}`);
                    if (checkResponse.ok) {
                        // File exists! Append timestamp to make it unique
                        slug = `${slug}-${Date.now()}`;
                    }
                } catch (err) {
                    console.warn('Could not check for existing module, using default slug', err);
                }

                targetId = slug;
                shouldRedirect = true;
            }

            const response = await fetch(`/api/modules/${targetId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content,
                    frontmatter: {
                        id: targetId,
                        title,
                        kapitel: kapitel !== '' ? kapitel : undefined,
                        unterkapitel: unterkapitel !== '' ? unterkapitel : undefined,
                        status,
                        importance,
                        urgency,
                        tags, // Save tags
                        summary: smartMetadata?.summary,
                        quotes: smartMetadata?.quotes,
                        questions: smartMetadata?.questions,
                        reviewNotes, // Save review notes
                    },
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save');
            }

            setLastSaved(new Date());

            if (shouldRedirect) {
                setId(targetId);
                window.history.replaceState(null, '', `/editor/${targetId}`);
            }

            if (!isAutoSave) showToast('Modul erfolgreich gespeichert!', 'success');
        } catch (error) {
            console.error('Error saving module:', error);
            if (!isAutoSave) showToast('Fehler beim Speichern.', 'error');
        } finally {
            if (!isAutoSave) setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Möchtest du dieses Kapitel wirklich unwiderruflich löschen?')) {
            return;
        }

        setDeleting(true);
        try {
            const response = await fetch(`/api/modules/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete');
            }

            showToast('Modul gelöscht', 'success');
            router.push('/'); // Redirect to home/dashboard
        } catch (error) {
            console.error('Error deleting module:', error);
            showToast('Fehler beim Löschen', 'error');
            setDeleting(false);
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



    const insertCustomFormat = (type: string) => {
        let snippet = '';
        switch (type) {
            case 'subtitle':
                snippet = '\n<p class="custom-subtitle">Mein Untertitel</p>\n';
                break;
            case 'haiku':
                snippet = '\n<div class="custom-haiku">\nErste Zeile hier,\nZweite Zeile folgt sogleich,\nEnde des Gedichts.\n</div>\n';
                break;
            case 'keypoints':
                snippet = '\n<div class="custom-keypoints">\n<strong>Kernaussagen:</strong>\n<ul>\n<li>Punkt 1</li>\n<li>Punkt 2</li>\n</ul>\n</div>\n';
                break;
            case 'reflection':
                snippet = '\n<div class="custom-reflection">\n<strong>Reflexionsfrage:</strong><br>\nWas bedeutet das für mich?\n</div>\n';
                break;
            case 'links':
                snippet = '\n<div class="custom-links">\n<strong>Siehe auch:</strong> <a href="#">Anderes Kapitel</a>\n</div>\n';
                break;
        }
        insertAtCursor(snippet);
    };

    const handleDeleteSource = async (sourceId: string) => {
        try {
            await fetch('/api/research/sources', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: sourceId }),
            });
            setSources(prev => prev.filter(s => s.id !== sourceId));
            showToast('Quelle gelöscht', 'success');
        } catch (error) {
            console.error('Error deleting source:', error);
            showToast('Fehler beim Löschen', 'error');
        }
    };

    // Helper to ensure lists render correctly even without blank lines (Word-like behavior)
    const preprocessMarkdown = (text: string) => {
        if (!text) return '';
        // Replace single newlines before list items with double newlines
        // Matches: non-newline char, newline, optional whitespace, bullet/number, space
        return text.replace(/([^\n])\n(\s*[-*+] |\s*\d+\. )/g, '$1\n\n$2');
    };

    const handleInsertQuoteFromSource = (quote: string, sourceTitle: string) => {
        setContent(prev => prev + `\n\n> "${quote}"\n> — *${sourceTitle}*`);
        showToast('Zitat eingefügt', 'success');
    };

    const handleTextSelection = () => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
            setSelectionTooltip(null);
            return;
        }

        const text = selection.toString().trim();
        if (!text) return;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setSelectionTooltip({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
            text: text
        });
    };

    const highlightSelection = () => {
        if (!selectionTooltip) return;

        // Simple string replacement - can be improved for multiple occurrences
        // Currently highlights the first occurrence or needs more robust logic for unique identification
        // For a prototype, we'll try to find the selected text in the content

        // Escape regex special characters in the selected text
        const safeText = selectionTooltip.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Create regex to match the text NOT already inside a mark tag
        // This is tricky with simple regex on markdown.
        // Simplified approach: replace the first occurrence of the text that isn't already marked

        const newContent = content.replace(selectionTooltip.text, `<mark>${selectionTooltip.text}</mark>`);

        if (newContent !== content) {
            setContent(newContent);
            showToast('Text markiert', 'success');
        } else {
            showToast('Konnte Textstelle nicht eindeutig finden', 'info');
        }

        setSelectionTooltip(null);
        window.getSelection()?.removeAllRanges();
    };

    // Close tooltip when clicking elsewhere
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            // If click is not on the tooltip button
            const target = e.target as HTMLElement;
            if (!target.closest('#selection-tooltip')) {
                setSelectionTooltip(null);
            }
        };
        window.addEventListener('mousedown', handleClick);
        return () => window.removeEventListener('mousedown', handleClick);
    }, []);

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
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Kapitel-Titel eingeben..."
                                    className="text-lg font-bold text-gray-800 tracking-tight bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                                />
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
                            <div className="bg-gray-100 p-1 rounded-full flex items-center mr-2">
                                <button
                                    onClick={() => setViewMode('edit')}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${viewMode === 'edit' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Edit3 size={14} /> Edit
                                </button>
                                <button
                                    onClick={() => setViewMode('read')}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${viewMode === 'read' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <BookOpen size={14} /> Lesen
                                </button>
                            </div>

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
                            <button
                                onClick={handleDelete}
                                disabled={deleting || id === 'template'}
                                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-all shadow-sm font-medium text-sm border border-red-100 placeholder:opacity-50"
                                title="Kapitel löschen"
                            >
                                {deleting ? '...' : '🗑️'}
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
                            bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[calc(100vh-12rem)] transition-all duration-500
                            ${focusMode ? 'shadow-none border-none' : ''}
                        `}>
                            {viewMode === 'edit' ? (
                                <>
                                    {/* Markdown Toolbar */}
                                    <div className={`
                                        flex items-center gap-1 p-3 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex-wrap
                                        ${focusMode ? 'opacity-0 hover:opacity-100 transition-opacity duration-300' : ''}
                                    `}>
                                        {/* Headings */}
                                        <div className="flex items-center gap-0.5 mr-2 border-r border-gray-200 pr-2">
                                            <button
                                                onClick={() => applyLineFormat('# ')}
                                                className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors"
                                                title="Überschrift 1 (H1)"
                                            >
                                                <Heading1 size={18} />
                                            </button>
                                            <button
                                                onClick={() => applyLineFormat('## ')}
                                                className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors"
                                                title="Überschrift 2 (H2)"
                                            >
                                                <Heading2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => applyLineFormat('### ')}
                                                className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors"
                                                title="Überschrift 3 (H3)"
                                            >
                                                <Heading3 size={18} />
                                            </button>
                                        </div>

                                        {/* Text Formatting */}
                                        <div className="flex items-center gap-0.5 mr-2 border-r border-gray-200 pr-2">
                                            <button
                                                onClick={() => applyMarkdownFormat('**', '**', 'fett')}
                                                className="p-2 hover:bg-gray-100 text-gray-600 hover:text-gray-900 rounded-lg transition-colors"
                                                title="Fett (Cmd+B)"
                                            >
                                                <Bold size={18} />
                                            </button>
                                            <button
                                                onClick={() => applyMarkdownFormat('*', '*', 'kursiv')}
                                                className="p-2 hover:bg-gray-100 text-gray-600 hover:text-gray-900 rounded-lg transition-colors"
                                                title="Kursiv (Cmd+I)"
                                            >
                                                <Italic size={18} />
                                            </button>
                                            <button
                                                onClick={() => applyMarkdownFormat('<center>', '</center>', 'Zentrierter Text')}
                                                className="p-2 hover:bg-gray-100 text-gray-600 hover:text-gray-900 rounded-lg transition-colors"
                                                title="Zentrieren"
                                            >
                                                <AlignCenter size={18} />
                                            </button>

                                            {/* Color Picker Dropdown */}
                                            <div className="relative group">
                                                <button
                                                    className="p-2 hover:bg-gray-100 text-gray-600 hover:text-gray-900 rounded-lg transition-colors"
                                                    title="Schriftfarbe"
                                                >
                                                    <Palette size={18} />
                                                </button>
                                                <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-xl border border-gray-100 p-2 hidden group-hover:block z-50 min-w-[120px]">
                                                    <div className="flex flex-col gap-1">
                                                        <button onClick={() => applyMarkdownFormat('<span style="color:black">', '</span>', 'Text')} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded text-sm w-full text-left">
                                                            <div className="w-3 h-3 rounded-full bg-black border border-gray-200"></div> Schwarz
                                                        </button>
                                                        <button onClick={() => applyMarkdownFormat('<span style="color:blue">', '</span>', 'Text')} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded text-sm w-full text-left">
                                                            <div className="w-3 h-3 rounded-full bg-blue-500"></div> Blau
                                                        </button>
                                                        <button onClick={() => applyMarkdownFormat('<span style="color:red">', '</span>', 'Text')} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded text-sm w-full text-left">
                                                            <div className="w-3 h-3 rounded-full bg-red-500"></div> Rot
                                                        </button>
                                                        <button onClick={() => applyMarkdownFormat('<span style="color:green">', '</span>', 'Text')} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded text-sm w-full text-left">
                                                            <div className="w-3 h-3 rounded-full bg-green-500"></div> Grün
                                                        </button>
                                                        <button onClick={() => applyMarkdownFormat('<span style="color:purple">', '</span>', 'Text')} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded text-sm w-full text-left">
                                                            <div className="w-3 h-3 rounded-full bg-purple-500"></div> Violett
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Block Formatting */}
                                        <div className="flex items-center gap-0.5 mr-2 border-r border-gray-200 pr-2">
                                            <button
                                                onClick={() => applyLineFormat('> ')}
                                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
                                                title="Zitat"
                                            >
                                                <QuoteIcon size={18} />
                                            </button>
                                            <button
                                                onClick={() => applyLineFormat('- ')}
                                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
                                                title="Aufzählung"
                                            >
                                                <List size={18} />
                                            </button>
                                            <button
                                                onClick={() => applyLineFormat('1. ')}
                                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
                                                title="Nummerierte Liste"
                                            >
                                                <ListOrdered size={18} />
                                            </button>
                                            <button
                                                onClick={() => insertAtCursor('\n---\n')}
                                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
                                                title="Trennlinie"
                                            >
                                                <Minus size={18} />
                                            </button>
                                        </div>

                                        {/* Link */}
                                        <button
                                            onClick={insertLink}
                                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
                                            title="Link einfügen"
                                        >
                                            <Link2 size={18} />
                                        </button>

                                        <div className="w-px h-6 bg-gray-200 mx-1"></div>

                                        {/* Custom Formats */}
                                        <div className="flex items-center gap-1.5">
                                            <button onClick={() => insertCustomFormat('subtitle')} className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition-colors">Untertitel</button>
                                            <button onClick={() => insertCustomFormat('haiku')} className="px-3 py-1.5 text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-md font-medium transition-colors">Haiku</button>
                                            <button onClick={() => insertCustomFormat('keypoints')} className="px-3 py-1.5 text-xs bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-md font-medium transition-colors">Kern</button>
                                            <button onClick={() => insertCustomFormat('reflection')} className="px-3 py-1.5 text-xs bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 rounded-md font-medium transition-colors">Reflexion</button>
                                            <button onClick={() => insertCustomFormat('links')} className="px-3 py-1.5 text-xs bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-md font-medium transition-colors">Links</button>

                                            <button
                                                onClick={() => setShowFormatSettings(true)}
                                                className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-primary ml-2 transition-colors"
                                                title="Formate bearbeiten"
                                            >
                                                <Settings size={14} />
                                            </button>
                                        </div>

                                        {/* Hint */}
                                        <span className="ml-auto text-xs text-gray-400 hidden sm:block">
                                            Markdown-Formatierung
                                        </span>
                                    </div>

                                    {/* Editor Area with Syntax Highlighting */}
                                    <div className="relative w-full h-full min-h-[500px] font-mono text-base bg-white rounded-b-2xl p-4 overflow-auto">
                                        <Editor
                                            value={content}
                                            onValueChange={setContent}
                                            highlight={(code) => Prism.highlight(code, Prism.languages.markdown, 'markdown')}
                                            padding={10}
                                            textareaId="editor-textarea"
                                            className="font-mono min-h-full"
                                            style={{
                                                fontFamily: '"Fira Code", "Fira Mono", monospace',
                                                fontSize: 16,
                                                backgroundColor: '#ffffff',
                                                minHeight: '100%',
                                            }}
                                            textareaClassName="focus:outline-none"
                                            // @ts-ignore
                                            ref={textareaRef}
                                        />
                                    </div>
                                    {/* Inject Custom Styles */}
                                    <style>{customStyles}</style>
                                </>
                            ) : (
                                <div
                                    className="p-8 md:p-12 min-h-[600px] prose prose-lg max-w-none text-gray-800 font-serif leading-loose"
                                    onMouseUp={handleTextSelection}
                                    onKeyUp={handleTextSelection}
                                >
                                    <style jsx global>{`
                                        mark {
                                            background-color: #fef08a; /* Yellow-200 */
                                            padding: 2px 0;
                                            border-radius: 2px;
                                            color: inherit;
                                        }
                                    `}</style>
                                    <style>{customStyles}</style>
                                    <ReactMarkdown
                                        rehypePlugins={[rehypeRaw]}
                                        remarkPlugins={[remarkGfm, remarkBreaks]}
                                    >
                                        {preprocessMarkdown(content)}
                                    </ReactMarkdown>

                                    {/* Floating Tooltip */}
                                    {selectionTooltip && (
                                        <div
                                            id="selection-tooltip"
                                            className="fixed z-50 bg-gray-900 text-white rounded-lg shadow-lg py-1 px-2 flex items-center gap-2 transform -translate-x-1/2 -translate-y-full mb-2 animate-in fade-in zoom-in duration-200"
                                            style={{ left: selectionTooltip.x, top: selectionTooltip.y }}
                                        >
                                            <button
                                                onClick={highlightSelection}
                                                className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-700 rounded text-xs font-semibold"
                                            >
                                                <Highlighter size={12} /> Markieren
                                            </button>
                                            <div className="w-px h-3 bg-gray-700"></div>
                                            <button onClick={() => setSelectionTooltip(null)} className="p-1 hover:text-gray-300">
                                                <X size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className={`mt-4 flex justify-end text-xs text-gray-400 font-medium px-4 transition-opacity duration-300 ${focusMode ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                            {content.trim().split(/\s+/).filter(w => w.length > 0).length} Wörter
                        </div>
                    </div>

                    {/* Sidebar - Hidden in Focus Mode */}
                    <div className={`
                        lg:col-span-4 space-y-6 transition-all duration-500 sticky top-24 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto pr-2
                        ${focusMode ? 'opacity-0 translate-x-20 hidden' : 'opacity-100 translate-x-0 block'}
                    `}>
                        {showPomodoro && (
                            <div className="animate-in slide-in-from-right-4 duration-300">
                                <PomodoroTimer />
                            </div>
                        )}

                        {viewMode === 'read' && (
                            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-6 bg-yellow-50/50 border-yellow-100">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <CheckSquare size={16} className="text-yellow-600" /> Lektorat & Status
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                                            Notizen zur Überarbeitung
                                        </label>
                                        <textarea
                                            value={reviewNotes}
                                            onChange={(e) => setReviewNotes(e.target.value)}
                                            placeholder="Was muss noch getan werden?"
                                            className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none transition-all placeholder:text-gray-300"
                                            rows={4}
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            setStatus('final');
                                            handleSave(false);
                                        }}
                                        className="w-full py-2 bg-success/10 text-success hover:bg-success/20 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={16} /> Mark as Done
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                                Einstellungen
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Kapitel Nr.</label>
                                        <input
                                            type="text"
                                            value={kapitel}
                                            onChange={(e) => setKapitel(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-primary/20"
                                            placeholder="1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Unterkapitel</label>
                                        <input
                                            type="text"
                                            value={unterkapitel}
                                            onChange={(e) => setUnterkapitel(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-primary/20"
                                            placeholder="1.1.1"
                                        />
                                    </div>
                                </div>

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

                                {/* Research / Sources */}
                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-sm p-6 border border-emerald-100">
                                    <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        📚 Quellen-Bibliothek
                                    </h3>
                                    <SourceExtractor
                                        onSourceAdded={(source) => setSources(prev => [...prev, source])}
                                        showToast={showToast}
                                    />
                                    <div className="mt-4">
                                        <SourceLibrary
                                            sources={sources}
                                            onDelete={handleDeleteSource}
                                            onInsertQuote={handleInsertQuoteFromSource}
                                        />
                                    </div>
                                </div>

                                {/* Perplexity Academic Research */}
                                <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-2xl shadow-sm p-6 border border-purple-100">
                                    <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        🔬 Wissenschaftliche Recherche
                                    </h3>
                                    <PerplexitySearch
                                        onInsertContent={(content) => setContent(prev => prev + content)}
                                        showToast={showToast}
                                    />
                                </div>

                                {/* Persona Testing */}
                                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-sm p-6 border border-indigo-100">
                                    <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        🎭 Testleser (Personas)
                                    </h3>
                                    <PersonaTester
                                        content={content}
                                        showToast={showToast}
                                    />
                                </div>

                                {/* Dialectic Engine */}
                                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl shadow-sm p-6 border border-teal-100">
                                    <h3 className="text-sm font-bold text-teal-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        ⚖️ Dialektik-Motor
                                    </h3>
                                    <DialecticEngine
                                        initialThesis=""
                                        showToast={showToast}
                                    />
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
            <FormatSettingsDialog
                isOpen={showFormatSettings}
                onClose={() => setShowFormatSettings(false)}
                onSave={(newSettings) => updateStyleTag(newSettings)}
            />
        </div>
    );
}
