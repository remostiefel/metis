import { Module } from '@/types';
import { calculateProgress } from '@/lib/modules';

interface ProgressBarProps {
    modules: Module[];
}

export function ProgressBar({ modules }: ProgressBarProps) {
    const { total, completed, percentage } = calculateProgress(modules);

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700">Fortschritt</h3>
                <span className="text-sm text-gray-700 font-medium">
                    {completed}/{total} Module ({percentage}%)
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <div className="mt-2 flex gap-4 text-xs text-gray-600 font-medium">
                <span>
                    📝 Entwurf: {modules.filter(m => m.status === 'entwurf').length}
                </span>
                <span>
                    ✏️ Überarbeitung: {modules.filter(m => m.status === 'überarbeitung').length}
                </span>
                <span>
                    ✅ Final: {modules.filter(m => m.status === 'final').length}
                </span>
            </div>
        </div>
    );
}
