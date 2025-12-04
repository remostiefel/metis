import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export async function POST(req: Request) {
    try {
        const { content, title } = await req.json();

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        // Truncate content if too long (token limits)
        const truncatedContent = content.substring(0, 12000);

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Du bist ein intelligenter Forschungsassistent für Lehrpersonen, die ein Buch schreiben.
          
          Analysiere den folgenden Text und extrahiere:
          1. **Zusammenfassung**: Eine prägnante Zusammenfassung in 3-4 Sätzen auf Deutsch.
          2. **Schlüsselzitate**: 2-3 besonders wichtige oder zitierwürdige Sätze (exakte Zitate aus dem Text).
          3. **Schlüsselwörter**: 3-5 relevante Tags auf Deutsch (Nominativ Singular).
          
          Antworte als JSON-Objekt mit den Keys: 'summary', 'keyQuotes', 'tags'.`
                },
                {
                    role: "user",
                    content: `Titel: ${title || 'Unbekannt'}\n\nInhalt:\n${truncatedContent}`
                }
            ],
            model: "gpt-3.5-turbo",
            response_format: { type: "json_object" },
        });

        const responseContent = completion.choices[0].message.content;
        const result = JSON.parse(responseContent || '{}');

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in summarize API:', error);
        return NextResponse.json({ error: error.message || 'Failed to summarize' }, { status: 500 });
    }
}
