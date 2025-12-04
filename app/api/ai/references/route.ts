import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { getAllModules } from '@/lib/markdown';

export async function POST(req: Request) {
    try {
        const { content, currentId } = await req.json();

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        // Get all other modules to compare against
        // Note: In a real production app with many modules, we might want to use embeddings/vector DB
        // For this MVP, we'll send a summary list of other modules to the LLM
        const allModules = getAllModules();
        const otherModules = allModules
            .filter(m => m.id !== currentId)
            .map(m => ({ id: m.id, title: m.title }));

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a knowledge management assistant. Analyze the provided text and identify potential logical connections to other modules in the book. 
          
          Here is the list of other available modules:
          ${JSON.stringify(otherModules)}
          
          Return a JSON object with a 'references' array. Each item should have:
          - 'targetId': the ID of the referenced module
          - 'targetTitle': the title of the referenced module
          - 'reason': a brief explanation of why this connection is relevant (e.g., "Expands on the concept of...")
          
          Only suggest strong, relevant connections. IMPORTANT: Output must be in German language.`
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
        const result = JSON.parse(responseContent || '{"references": []}');

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in references API:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate references' }, { status: 500 });
    }
}
