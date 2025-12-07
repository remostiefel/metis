'use client';

import { Fragment } from 'react';
import { Module } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, Download } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface ModuleListProps {
    modules: Module[];
}

export function ModuleList({ modules }: ModuleListProps) {
    const router = useRouter();
    const { showToast } = useToast();

    const handleDelete = async (e: React.MouseEvent, slug: string, title: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!window.confirm(`Möchtest du das Modul "${title}" wirklich löschen?`)) return;

        try {
            const response = await fetch(`/api/modules/${slug}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                showToast('Modul gelöscht', 'success');
                router.refresh();
            } else {
                throw new Error('Failed to delete');
            }
        } catch (error) {
            console.error('Error deleting module:', error);
            showToast('Fehler beim Löschen', 'error');
        }
    };

    const handleDownloadChapter = (chapter: string) => {
        window.location.href = `/api/chapters/${chapter}/download`;
    };

    const getStatusBadge = (status: Module['status']) => {
        const styles = {
            entwurf: 'bg-gray-100 text-gray-700',
            überarbeitung: 'bg-secondary/20 text-secondary',
            final: 'bg-success/20 text-success',
        };
        const labels = {
            entwurf: '📝 Entwurf',
            überarbeitung: '✏️ Überarbeitung',
            final: '✅ Final',
        };
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    // Group modules by chapter
    const groupedModules: { [key: string]: Module[] } = {};
    modules.forEach(module => {
        const chapter = String(module.kapitel || 'Andere');
        if (!groupedModules[chapter]) {
            groupedModules[chapter] = [];
        }
        groupedModules[chapter].push(module);
    });

    const sortedChapters = Object.keys(groupedModules).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
    );

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                Kapitel
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                Titel
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                Priorität
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                Aktualisiert
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                                Aktionen
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sortedChapters.map(chapter => (
                            <Fragment key={chapter}>
                                {/* Chapter Header */}
                                <tr className="bg-gray-50/50">
                                    <td colSpan={6} className="px-4 py-3 border-y border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-gray-800">
                                                Kapitel {chapter}
                                            </span>
                                            {chapter !== 'Andere' && (
                                                <button
                                                    onClick={() => handleDownloadChapter(chapter)}
                                                    className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded-full transition-colors"
                                                    title="Gesamtes Kapitel herunterladen"
                                                >
                                                    <Download size={14} />
                                                    Download Kapitel
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                {/* Modules in Chapter */}
                                {groupedModules[chapter].map((module) => (
                                    <tr
                                        key={module.id || module.slug}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-4 py-3 text-sm text-gray-600 pl-8">
                                            {module.kapitel && module.unterkapitel
                                                ? (String(module.unterkapitel).startsWith(String(module.kapitel))
                                                    ? module.unterkapitel
                                                    : `${module.kapitel}.${module.unterkapitel}`)
                                                : (module.kapitel || module.unterkapitel || '')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/editor/${module.slug}`}
                                                className="text-sm font-medium text-primary hover:underline"
                                            >
                                                {module.title}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(module.status)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                <span className={`w-2 h-2 rounded-full ${module.importance === 'high' ? 'bg-red-500' :
                                                    module.importance === 'medium' ? 'bg-yellow-500' :
                                                        'bg-green-500'
                                                    }`} title={`Wichtigkeit: ${module.importance}`} />
                                                <span className={`w-2 h-2 rounded-full ${module.urgency === 'high' ? 'bg-red-500' :
                                                    module.urgency === 'medium' ? 'bg-yellow-500' :
                                                        'bg-green-500'
                                                    }`} title={`Dringlichkeit: ${module.urgency}`} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {new Date(module.updated).toLocaleDateString('de-DE')}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={(e) => handleDelete(e, module.slug, module.title)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Löschen"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
