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
                    content: "You are a professional editor. Analyze the text for style issues, specifically focusing on: 1. Passive voice usage. 2. overly complex sentences (Schachtelsätze). 3. Repetitive words. Provide a brief critique and 1-2 concrete suggestions for improvement. Keep the tone encouraging but professional. Return the result as JSON with 'critique' and 'suggestions' fields."
                },
                {
                    role: "user",
                    content: content.substring(0, 3000)
                }
            ],
            model: "gpt-3.5-turbo",
            response_format: { type: "json_object" },
        });

        const responseContent = completion.choices[0].message.content;
        const result = JSON.parse(responseContent || '{}');

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in style API:', error);
        return NextResponse.json({ error: error.message || 'Failed to analyze style' }, { status: 500 });
    }
}
