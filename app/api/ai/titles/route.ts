import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { perplexity } from '@/lib/perplexity';

export async function POST(req: Request) {
    try {
        const { content, action, title } = await req.json();

        if (action === 'check_availability') {
            if (!title) {
                return NextResponse.json({ error: 'Title is required for availability check' }, { status: 400 });
            }

            const systemPrompt = `Du bist ein Verlags-Marktforscher.
            Prüfe, ob es bereits Bücher mit dem Titel "${title}" gibt.
            Nutze Perplexity für eine Echtzeit-Suche auf Amazon und im Buchhandel.
            
            Gib zurück als JSON:
            - 'isAvailable': boolean (true = Titel scheint frei, false = Titel existiert schon)
            - 'similarTitles': string[] (Liste von existierenden, ähnlichen Buchtiteln)
            - 'verdict': string (Kurzes Fazit auf Deutsch, z.B. "Der Titel ist sehr originell" oder "Achtung, Bestseller existiert schon")
            - 'source_url': Link zu einem gefundenen Buch (optional)`;

            const completion = await perplexity.chat.completions.create({
                model: 'sonar-pro',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Prüfe Verfügbarkeit für: "${title}"` }
                ],
                response_format: { type: "json_object" },
            });

            const responseContent = completion.choices[0].message.content;
            const result = JSON.parse(responseContent || '{}');
            return NextResponse.json(result);
        }

        // Default: Generate Titles (OpenAI)
        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a creative copywriter. Generate 5 catchy, relevant, and engaging titles for the provided text. The titles should be suitable for a non-fiction book chapter for teachers. Return the result as a JSON object with a 'titles' array of strings. IMPORTANT: Output must be in German language."
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
