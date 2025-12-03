import Link from 'next/link';
import { getAllModules } from '@/lib/markdown';
import { EisenhowerMatrix } from '@/components/EisenhowerMatrix';
import { ProgressBar } from '@/components/ProgressBar';
import { getStats } from '@/lib/modules';
import { CloudBackupButton } from '@/components/CloudBackupButton';

export default function Home() {
  const modules = getAllModules();
  const stats = getStats(modules);

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Willkommen zurück, Remo! 👋
              </h1>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                Dein persönliches METIS Schreib-Studio
              </p>
            </div>
            <nav className="flex gap-4">
              <CloudBackupButton />
              <Link
                href="/modules"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
              >
                Alle Module
              </Link>
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
      </header >

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-500 font-medium mb-1 uppercase tracking-wider">Gesamt Module</div>
            <div className="text-4xl font-extrabold text-gray-800">{stats.totalModules}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-500 font-medium mb-1 uppercase tracking-wider">Fertiggestellt</div>
            <div className="text-4xl font-extrabold text-success-foreground">{stats.completedModules}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-500 font-medium mb-1 uppercase tracking-wider">Wörter geschrieben</div>
            <div className="text-4xl font-extrabold text-primary-foreground">
              {stats.totalWords.toLocaleString('de-DE')}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 mb-10">
          <ProgressBar modules={modules} />
        </div>

        {/* Eisenhower Matrix */}
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Eisenhower-Matrix
          </h2>
          <p className="text-gray-500 mb-8">
            Priorisiere deine Module nach Wichtigkeit und Dringlichkeit
          </p>
          <EisenhowerMatrix modules={modules} />
        </div>

        {/* Quick Actions */}
        <div className="mt-12 flex gap-6 justify-center">
          <Link
            href="/modules"
            className="px-8 py-4 bg-white border-2 border-primary text-primary-foreground rounded-full hover:bg-primary/10 transition-all font-bold shadow-sm hover:shadow-md"
          >
            📚 Alle Module anzeigen
          </Link>
          <Link
            href="/editor/template"
            className="px-8 py-4 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/90 transition-all font-bold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
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
    </div >
  );
}
