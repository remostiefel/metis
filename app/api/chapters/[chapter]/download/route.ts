
import { NextRequest, NextResponse } from 'next/server';
import { getAllModules } from '@/lib/markdown';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ chapter: string }> }
) {
    const { chapter } = await params;
    const modules = getAllModules();

    // Filter modules by chapter
    const chapterModules = modules.filter(m => String(m.kapitel) === chapter);

    if (chapterModules.length === 0) {
        return new NextResponse('Chapter not found', { status: 404 });
    }

    // Sort by subchapter (should already be sorted by getAllModules, but ensuring safety)
    chapterModules.sort((a, b) => {
        const subA = String(a.unterkapitel || '');
        const subB = String(b.unterkapitel || '');
        return subA.localeCompare(subB, undefined, { numeric: true });
    });

    // Aggregate content
    let fullContent = `# Kapitel ${chapter}\n\n`;

    chapterModules.forEach(module => {
        fullContent += `## ${module.unterkapitel ? `${module.kapitel}.${module.unterkapitel} ` : ''}${module.title}\n\n`;
        fullContent += `${module.content}\n\n---\n\n`;
    });

    // Create response with file download headers
    const filename = `Kapitel-${chapter}_Complete.md`;

    return new NextResponse(fullContent, {
        headers: {
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Type': 'text/markdown',
        },
    });
}
