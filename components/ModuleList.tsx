import { Module } from '@/types';
import Link from 'next/link';

interface ModuleListProps {
    modules: Module[];
}

export function ModuleList({ modules }: ModuleListProps) {
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
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {modules.map((module) => (
                            <tr
                                key={module.id}
                                className="hover:bg-gray-50 transition-colors"
                            >
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    {module.kapitel}.{module.unterkapitel}
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
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
