import { NextRequest, NextResponse } from 'next/server';
import { getModuleData } from '@/lib/markdown';
import fs from 'fs';
import path from 'path';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Reconstruct the file path from the id (slug)
        const filePath = `${id}.md`;
        const fullPath = path.join(process.cwd(), 'content', filePath);

        // Check if file exists
        if (!fs.existsSync(fullPath)) {
            return NextResponse.json(
                { error: 'Module not found' },
                { status: 404 }
            );
        }

        const moduleData = await getModuleData(filePath);

        return NextResponse.json(moduleData);
    } catch (error) {
        console.error('Error loading module:', error);
        return NextResponse.json(
            { error: 'Failed to load module' },
            { status: 500 }
        );
    }
}
