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
                    content: "You are an experienced book editor. Analyze the provided chapter content. Provide constructive feedback on: 1. Structure and flow. 2. Argument clarity. 3. Missing information or gaps. 4. Engagement level. Return the result as a JSON object with a 'summary' field and a 'points' array containing specific feedback items. IMPORTANT: Output must be in German language. Tone: Professional, constructive, suitable for educators."
                },
                {
                    role: "user",
                    content: content.substring(0, 4000) // Limit context
                }
            ],
            model: "gpt-3.5-turbo",
            response_format: { type: "json_object" },
        });

        const responseContent = completion.choices[0].message.content;
        const result = JSON.parse(responseContent || '{}');

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in feedback API:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate feedback' }, { status: 500 });
    }
}
