import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { content, frontmatter } = body;

        // Reconstruct the file path
        const filePath = `${id}.md`;
        const fullPath = path.join(process.cwd(), 'content', filePath);

        // Update frontmatter with current timestamp
        const updatedFrontmatter = {
            ...frontmatter,
            updated: new Date().toISOString().split('T')[0],
        };

        // Combine frontmatter and content
        const fileContent = matter.stringify(content, updatedFrontmatter);

        // Write to file
        fs.writeFileSync(fullPath, fileContent, 'utf8');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving module:', error);
        return NextResponse.json(
            { error: 'Failed to save module' },
            { status: 500 }
        );
    }
}
