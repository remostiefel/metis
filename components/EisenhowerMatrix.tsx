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
                return 'bg-success/10 border-success/20 text-success-foreground';
            case 'überarbeitung':
                return 'bg-secondary/10 border-secondary/20 text-secondary-foreground';
            default:
                return 'bg-white border-gray-100 text-gray-600';
        }
    };

    const ModuleCard = ({ module }: { module: Module }) => (
        <Link
            href={`/editor/${module.slug}`}
            className={`block p-4 rounded-xl border ${getStatusColor(module.status)} hover:shadow-md transition-all hover:-translate-y-0.5`}
        >
            <div className="text-sm font-bold mb-1">{module.title}</div>
            <div className="text-xs opacity-75 font-medium">
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
        <div className={`p-6 rounded-2xl border ${color} h-full`}>
            <div className="mb-4">
                <h3 className="font-bold text-gray-900">{title}</h3>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{subtitle}</p>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {modules.length === 0 ? (
                    <div className="flex items-center justify-center h-24 border-2 border-dashed border-gray-200 rounded-xl">
                        <p className="text-xs text-gray-400 font-medium">Leer</p>
                    </div>
                ) : (
                    modules.map((module) => (
                        <ModuleCard key={module.id} module={module} />
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Quadrant
                title="Wichtig & Dringend"
                subtitle="Sofort erledigen"
                modules={doFirst}
                color="border-red-100 bg-red-50/50"
            />
            <Quadrant
                title="Wichtig (Nicht Dringend)"
                subtitle="Terminieren"
                modules={schedule}
                color="border-primary/20 bg-primary/5"
            />
            <Quadrant
                title="Dringend (Nicht Wichtig)"
                subtitle="Delegieren"
                modules={delegate}
                color="border-secondary/20 bg-secondary/5"
            />
            <Quadrant
                title="Weder Wichtig noch Dringend"
                subtitle="Eliminieren"
                modules={eliminate}
                color="border-gray-200 bg-gray-50/50"
            />
        </div>
    );
}
