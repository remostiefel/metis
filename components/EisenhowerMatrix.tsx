import { Module } from '@/types';
import Link from 'next/link';

interface EisenhowerMatrixProps {
    modules: Module[];
}

export function EisenhowerMatrix({ modules }: EisenhowerMatrixProps) {
    const doFirst = modules.filter(m => m.importance === 'high' && m.urgency === 'high');
    const schedule = modules.filter(m => m.importance === 'high' && m.urgency !== 'high');
    const delegate = modules.filter(m => m.importance !== 'high' && m.urgency === 'high');
    const eliminate = modules.filter(m => m.importance !== 'high' && m.urgency !== 'high');

    const getStatusColor = (status: Module['status']) => {
        switch (status) {
            case 'final':
                return 'bg-success/10 border-success text-success';
            case 'überarbeitung':
                return 'bg-secondary/10 border-secondary text-secondary';
            default:
                return 'bg-gray-100 border-gray-300 text-gray-700';
        }
    };

    const ModuleCard = ({ module }: { module: Module }) => (
        <Link
            href={`/editor/${module.slug}`}
            className={`block p-3 rounded border ${getStatusColor(module.status)} hover:shadow-md transition-shadow`}
        >
            <div className="text-sm font-medium mb-1">{module.title}</div>
            <div className="text-xs opacity-75">
                Kap. {module.kapitel}.{module.unterkapitel}
            </div>
        </Link>
    );

    const Quadrant = ({
        title,
        subtitle,
        modules,
        color
    }: {
        title: string;
        subtitle: string;
        modules: Module[];
        color: string;
    }) => (
        <div className={`p-4 rounded-lg border-2 ${color}`}>
            <div className="mb-3">
                <h3 className="font-bold text-sm">{title}</h3>
                <p className="text-xs opacity-75">{subtitle}</p>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {modules.length === 0 ? (
                    <p className="text-xs opacity-50 italic">Keine Module</p>
                ) : (
                    modules.map((module) => (
                        <ModuleCard key={module.id} module={module} />
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-2 gap-4">
            <Quadrant
                title="Wichtig & Dringend"
                subtitle="Sofort erledigen"
                modules={doFirst}
                color="border-red-300 bg-red-50"
            />
            <Quadrant
                title="Wichtig (Nicht Dringend)"
                subtitle="Planen & Einplanen"
                modules={schedule}
                color="border-primary bg-primary/5"
            />
            <Quadrant
                title="Dringend (Nicht Wichtig)"
                subtitle="Delegieren oder später"
                modules={delegate}
                color="border-secondary bg-secondary/5"
            />
            <Quadrant
                title="Weder Wichtig noch Dringend"
                subtitle="Eliminieren oder verschieben"
                modules={eliminate}
                color="border-gray-300 bg-gray-50"
            />
        </div>
    );
}
