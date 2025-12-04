import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export async function POST(req: Request) {
    try {
        const { content } = await req.json();

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant for a German author. Analyze the provided text and suggest 3-5 relevant German tags (Schlüsselwörter). CRITICAL: Use precise GERMAN terms in 'Nominativ Singular' (e.g., 'Motivation' instead of 'motivieren', 'Schüler' instead of 'Schülern') to ensure consistency. Return only the tags as a JSON array of strings."
                },
                {
                    role: "user",
                    content: content.substring(0, 2000) // Limit context to save tokens
                }
            ],
            model: "gpt-3.5-turbo",
            response_format: { type: "json_object" },
        });

        const responseContent = completion.choices[0].message.content;
        const result = JSON.parse(responseContent || '{"tags": []}');

        // Handle case where API returns object with "tags" key or just array
        const tags = Array.isArray(result) ? result : (result.tags || []);

        return NextResponse.json({ tags });
    } catch (error: any) {
        console.error('Error in tagging API:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate tags' }, { status: 500 });
    }
}
