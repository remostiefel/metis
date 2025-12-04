import { NextResponse } from 'next/server';
import { getAllSources, saveSource, deleteSource } from '@/lib/sources';
import { Source } from '@/types/source';

export async function GET() {
    try {
        const sources = getAllSources();
        return NextResponse.json(sources);
    } catch (error: any) {
        console.error('Error getting sources:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const source: Source = await req.json();

        if (!source.id || !source.title) {
            return NextResponse.json({ error: 'ID and title are required' }, { status: 400 });
        }

        const saved = saveSource(source);
        return NextResponse.json(saved);
    } catch (error: any) {
        console.error('Error saving source:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const deleted = deleteSource(id);
        if (!deleted) {
            return NextResponse.json({ error: 'Source not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting source:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
