import fs from 'fs';
import path from 'path';
import { Source } from '@/types/source';

const SOURCES_DIR = path.join(process.cwd(), 'content', 'sources');
const SOURCES_INDEX_PATH = path.join(SOURCES_DIR, 'index.json');

// Ensure directory exists
function ensureDir() {
    if (!fs.existsSync(SOURCES_DIR)) {
        fs.mkdirSync(SOURCES_DIR, { recursive: true });
    }
    if (!fs.existsSync(SOURCES_INDEX_PATH)) {
        fs.writeFileSync(SOURCES_INDEX_PATH, '[]', 'utf-8');
    }
}

export function getAllSources(): Source[] {
    ensureDir();
    try {
        const content = fs.readFileSync(SOURCES_INDEX_PATH, 'utf-8');
        return JSON.parse(content);
    } catch {
        return [];
    }
}

export function getSourceById(id: string): Source | null {
    const sources = getAllSources();
    return sources.find(s => s.id === id) || null;
}

export function saveSource(source: Source): Source {
    ensureDir();
    const sources = getAllSources();
    const existingIndex = sources.findIndex(s => s.id === source.id);

    if (existingIndex >= 0) {
        sources[existingIndex] = { ...source, updatedAt: new Date().toISOString() };
    } else {
        sources.push({
            ...source,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }

    fs.writeFileSync(SOURCES_INDEX_PATH, JSON.stringify(sources, null, 2), 'utf-8');
    return source;
}

export function deleteSource(id: string): boolean {
    ensureDir();
    const sources = getAllSources();
    const filtered = sources.filter(s => s.id !== id);

    if (filtered.length === sources.length) {
        return false; // Not found
    }

    fs.writeFileSync(SOURCES_INDEX_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
}
