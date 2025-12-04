import { NextResponse } from 'next/server';
import { perplexity } from '@/lib/perplexity';

export async function POST(req: Request) {
    try {
        const { query, focus } = await req.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // Build system prompt based on focus area
        let systemPrompt = `Du bist ein wissenschaftlicher Forschungsassistent fuer Lehrpersonen, die ein Buch schreiben.
    
Beantworte die Frage praezise und faktenbasiert. Gib IMMER Quellenangaben an.
Strukturiere deine Antwort wie folgt:
1. **Zusammenfassung**: Kernaussage in 2-3 Saetzen
2. **Wichtigste Erkenntnisse**: 3-5 Bullet Points mit den zentralen Fakten
3. **Zitierbare Aussagen**: 1-2 praegnante Saetze, die direkt im Buch verwendet werden koennen
4. **Quellen**: Liste der verwendeten Quellen mit Links

Schreibe auf Deutsch und richte dich an ein akademisches Publikum (Lehrpersonen).`;

        if (focus === 'academic') {
            systemPrompt += '\n\nFokussiere dich auf peer-reviewed Studien, Meta-Analysen und wissenschaftliche Fachliteratur.';
        } else if (focus === 'practical') {
            systemPrompt += '\n\nFokussiere dich auf praktische Anwendungen, Best Practices und Fallstudien aus dem Bildungsbereich.';
        }

        const completion = await perplexity.chat.completions.create({
            model: 'sonar-pro', // Best for academic research
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: query }
            ],
        });

        const response = completion.choices[0].message.content;

        // Extract citations if available (Perplexity returns them in the response)
        const citations = (completion as any).citations || [];

        return NextResponse.json({
            answer: response,
            citations: citations,
            model: 'sonar-pro'
        });

    } catch (error: any) {
        console.error('Perplexity API error:', error);

        // Check for API key issues
        if (error.status === 401) {
            return NextResponse.json({
                error: 'Perplexity API Key fehlt oder ist ungültig. Bitte in .env.local eintragen.'
            }, { status: 401 });
        }

        return NextResponse.json({
            error: error.message || 'Fehler bei der Recherche'
        }, { status: 500 });
    }
}
