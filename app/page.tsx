import Link from 'next/link';
import { getAllModules } from '@/lib/markdown';
import { EisenhowerMatrix } from '@/components/EisenhowerMatrix';
import { KnowledgeGraph } from '@/components/KnowledgeGraph';
import { ProgressBar } from '@/components/ProgressBar';
import { getStats } from '@/lib/modules';
import { CloudBackupButton } from '@/components/CloudBackupButton';
import { BookOpen, FileText, Clock, TrendingUp } from 'lucide-react';

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
                Willkommen zurück, Remo!
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
              <Link
                href="/editor/template"
                className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-100 rounded-full hover:bg-rose-100 transition-all text-sm font-bold shadow-sm hover:shadow-md"
              >
                + Neues Modul
              </Link>
            </nav>
          </div>
        </div>
      </header >

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Gesamtfortschritt</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.progress}%</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Wörter gesamt</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalWords.toLocaleString()}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Lesezeit</p>
              <h3 className="text-2xl font-bold text-gray-900">~{Math.ceil(stats.totalWords / 250)} Min.</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Module</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalModules}</h3>
            </div>
          </div>
        </div>

        {/* Knowledge Graph */}
        <div className="mb-12">
          <KnowledgeGraph modules={modules} />
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
            className="px-8 py-4 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-all font-bold shadow-sm hover:shadow-md"
          >
            Alle Module anzeigen
          </Link>
          <Link
            href="/editor/template"
            className="px-8 py-4 bg-rose-50 text-rose-700 rounded-full hover:bg-rose-100 transition-all font-bold shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          >
            Schreib-Session starten
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
