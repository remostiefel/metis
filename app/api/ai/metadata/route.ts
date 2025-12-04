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
                    content: `You are a smart German book architect. Analyze the provided chapter content deeply in German.
          
          Extract the following metadata:
          1. **Schlüsselwörter (Keywords)**: 5-10 semantic tags. CRITICAL: Use precise GERMAN terms. Use "Nominativ Singular" (e.g., "Haus" instead of "Häuser") to ensure better matching between chapters.
          2. **Summary**: A concise 2-3 sentence "Elevator Pitch" of the chapter in German.
          3. **Key Quotes**: 1-3 most impactful sentences from the text (must be exact matches).
          4. **Reflection Questions**: 1-2 thought-provoking questions for the reader (in German).
          
          Return the result as a JSON object with keys: 'tags' (array), 'summary' (string), 'quotes' (array), 'questions' (array).`
                },
                {
                    role: "user",
                    content: content.substring(0, 4000)
                }
            ],
            model: "gpt-3.5-turbo",
            response_format: { type: "json_object" },
        });

        const responseContent = completion.choices[0].message.content;
        const result = JSON.parse(responseContent || '{}');

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in metadata API:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate metadata' }, { status: 500 });
    }
}
