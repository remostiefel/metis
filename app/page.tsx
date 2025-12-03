import Link from 'next/link';
import { getAllModules } from '@/lib/markdown';
import { EisenhowerMatrix } from '@/components/EisenhowerMatrix';
import { ProgressBar } from '@/components/ProgressBar';
import { getStats } from '@/lib/modules';

export default function Home() {
  const modules = getAllModules();
  const stats = getStats(modules);

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                METIS
              </h1>
              <p className="text-sm text-neutral mt-1">
                Selbstmanagement-Schreibwerkstatt
              </p>
            </div>
            <nav className="flex gap-4">
              <Link
                href="/modules"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
              >
                Alle Module
              </Link>
              <Link
                href="/editor/template"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                + Neues Modul
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-sm text-gray-600 font-medium mb-1">Gesamt Module</div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalModules}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-sm text-gray-600 font-medium mb-1">Fertiggestellt</div>
            <div className="text-3xl font-bold text-gray-900">{stats.completedModules}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-sm text-gray-600 font-medium mb-1">Wörter geschrieben</div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.totalWords.toLocaleString('de-DE')}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
          <ProgressBar modules={modules} />
        </div>

        {/* Eisenhower Matrix */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Eisenhower-Matrix
          </h2>
          <p className="text-sm text-neutral mb-6">
            Priorisieren Sie Ihre Module nach Wichtigkeit und Dringlichkeit
          </p>
          <EisenhowerMatrix modules={modules} />
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/modules"
            className="px-6 py-3 bg-white border-2 border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors font-medium"
          >
            📚 Alle Module anzeigen
          </Link>
          <Link
            href="/editor/template"
            className="px-6 py-3 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors font-medium"
          >
            ✍️ Schreib-Session starten
          </Link>
        </div>
      </main>

      <footer className="mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-neutral">
          <p>METIS - Modular Editing & Thinking Integration System</p>
          <p className="mt-1">Selbstmanagement für Lehrpersonen</p>
        </div>
      </footer>
    </div>
  );
}
