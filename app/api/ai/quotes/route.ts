import { NextResponse } from 'next/server';
import { perplexity } from '@/lib/perplexity';

export async function POST(req: Request) {
    try {
        const { action, query, quote } = await req.json();

        if (!action) {
            return NextResponse.json({ error: 'Action is required' }, { status: 400 });
        }

        let systemPrompt = "";
        let userContent = "";

        if (action === 'search') {
            systemPrompt = `Du bist ein literarischer Assistent.
      Finde 3-5 berühmte, treffende Zitate zum Thema des Nutzers.
      Nutze Perplexity, um ECHTE Zitate mit korrekten Quellen zu finden.
      
      Gib für jedes Zitat zurück:
      - 'text': Das Zitat auf DEUTSCH. Wenn das Original anderssprachig ist, eine gute Übersetzung.
      - 'author': Name des Autors.
      - 'context': Kurzer Kontext (z.B. "Aus 'Faust I', 1808").
      - 'source_url': Link zur Quelle (falls verfügbar, sonst leer).
      
      Antworte als JSON-Objekt mit einem 'quotes' Array.`;
            userContent = `Thema: ${query}`;
        } else if (action === 'verify') {
            systemPrompt = `Du bist ein Faktenchecker für Zitate.
      Analysiere das gegebene Zitat. Prüfe, ob es korrekt zugeordnet ist.
      Nutze Perplexity, um die Echtheit zu verifizieren.
      
      Gib zurück als JSON:
      - 'isCorrect': boolean
      - 'correction': string (wenn falsch, korrigiere es hier, sonst null)
      - 'author': string (korrekter Autor)
      - 'origin': string (Buch/Rede/Jahr)
      - 'context': string (kurzer Kontext)
      - 'source_url': Link zur Quelle.
      
      WICHTIG: Alle Textfelder müssen auf Deutsch sein.`;
            userContent = `Zitat zum Prüfen: "${quote}"`;
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const completion = await perplexity.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userContent }
            ],
            model: "sonar-pro", // Best for research/facts
            response_format: { type: "json_object" },
        });

        const responseContent = completion.choices[0].message.content;
        const result = JSON.parse(responseContent || '{}');

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in quotes API:', error);
        return NextResponse.json({ error: error.message || 'Failed to process quotes' }, { status: 500 });
    }
}
