import { getAllModules } from '@/lib/markdown';
import { ModuleList } from '@/components/ModuleList';
import Link from 'next/link';

export default function ModulesPage() {
    const modules = getAllModules();

    return (
        <div className="min-h-screen bg-paper">
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Link href="/" className="text-3xl font-bold text-gray-900 hover:text-primary">
                                METIS
                            </Link>
                            <p className="text-sm text-neutral mt-1">Alle Module</p>
                        </div>
                        <Link
                            href="/"
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                        >
                            ← Zurück zum Dashboard
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <ModuleList modules={modules} />
            </main>
        </div>
    );
}
