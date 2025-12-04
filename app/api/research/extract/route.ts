import { NextResponse } from 'next/server';
import { extract } from '@extractus/article-extractor';
// import pdf from 'pdf-parse'; // Will be used for PDF support later

export async function POST(req: Request) {
    try {
        const { type, url } = await req.json();

        if (type === 'url' && url) {
            try {
                const article = await extract(url);
                if (!article) {
                    return NextResponse.json({ error: 'Could not extract content' }, { status: 400 });
                }
                return NextResponse.json({
                    title: article.title || 'Unbenannte Quelle',
                    content: article.content || '', // Note: article-extractor returns HTML content often, might need stripping
                    author: article.author,
                    description: article.description
                });
            } catch (e) {
                console.error("Extraction error:", e);
                return NextResponse.json({ error: 'Failed to extract content from URL' }, { status: 500 });
            }
        }

        // PDF handling will go here (requires file upload handling which is different)

        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    } catch (error: any) {
        console.error('Error in extract API:', error);
        return NextResponse.json({ error: error.message || 'Failed to process request' }, { status: 500 });
    }
}
