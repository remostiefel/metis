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
                    content: "You are a creative copywriter. Generate 5 catchy, relevant, and engaging titles for the provided text. The titles should be suitable for a non-fiction book chapter. Return the result as a JSON object with a 'titles' array of strings."
                },
                {
                    role: "user",
                    content: content.substring(0, 2000)
                }
            ],
            model: "gpt-3.5-turbo",
            response_format: { type: "json_object" },
        });

        const responseContent = completion.choices[0].message.content;
        const result = JSON.parse(responseContent || '{"titles": []}');

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in titles API:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate titles' }, { status: 500 });
    }
}
