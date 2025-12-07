import { NextRequest, NextResponse } from 'next/server';
import { getModuleData } from '@/lib/markdown';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string[] }> }
) {
    try {
        const { slug } = await params;

        // Reconstruct the file path from the slug array
        const filePath = `${slug.join('/')}.md`;
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

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string[] }> }
) {
    try {
        const { slug } = await params;
        // Decode slug components to handle special characters correctly
        const decodedSlug = slug.map(s => decodeURIComponent(s));
        const filePath = `${decodedSlug.join('/')}.md`;
        const fullPath = path.join(process.cwd(), 'content', filePath);

        console.log(`[DELETE] Attempting to delete: ${fullPath}`);

        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`[DELETE] Successfully removed file: ${fullPath}`);

            // Cleanup empty parent directory
            try {
                const dir = path.dirname(fullPath);
                const contentDir = path.join(process.cwd(), 'content');

                // Ensure we are strictly inside content dir and not trying to delete content dir itself
                if (dir.startsWith(contentDir) && dir !== contentDir) {
                    const files = fs.readdirSync(dir);
                    if (files.length === 0) {
                        fs.rmdirSync(dir);
                        console.log(`[DELETE] Removed empty directory: ${dir}`);
                    }
                }
            } catch (cleanupError) {
                console.warn('[DELETE] Directory cleanup warning:', cleanupError);
                // Do not fail the request if cleanup fails
            }

            return NextResponse.json({ success: true });
        } else {
            console.warn(`[DELETE] File not found: ${fullPath}`);
            return NextResponse.json(
                { error: 'Module not found' },
                { status: 404 }
            );
        }
    } catch (error) {
        console.error('[DELETE] Error deleting module:', error);
        return NextResponse.json(
            { error: 'Failed to delete module' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string[] }> }
) {
    try {
        const { slug } = await params;
        const body = await request.json();
        const { content, frontmatter } = body;

        // Reconstruct the file path
        const filePath = `${slug.join('/')}.md`;
        const fullPath = path.join(process.cwd(), 'content', filePath);

        // Update frontmatter with current timestamp
        const updatedFrontmatter = {
            ...frontmatter,
            updated: new Date().toISOString().split('T')[0],
        };

        // Combine frontmatter and content
        const fileContent = matter.stringify(content, updatedFrontmatter);

        // Ensure directory exists
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

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
