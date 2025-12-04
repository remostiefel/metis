import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export type ResearchMode = 'keywords' | 'question' | 'dialectic' | 'author' | 'work' | 'factcheck';

const MODE_PROMPTS: Record<ResearchMode, string> = {
    keywords: `Du bist ein Experte fuer akademische Recherche. Der Nutzer gibt dir Schluesselwoerter.
Transformiere diese in eine praezise, akademische Forschungsfrage.
Die Frage sollte:
- Spezifisch und recherchierbar sein
- Nach empirischen Studien oder Meta-Analysen fragen
- Einen klaren Fokus haben
Antworte NUR mit der optimierten Frage, keine Erklaerung.`,

    question: `Du bist ein Experte fuer akademische Recherche. Der Nutzer stellt eine einfache Frage.
Transformiere diese in eine differenzierte, akademische Forschungsanfrage.
Die optimierte Frage sollte:
- Mehrere relevante Aspekte beruecksichtigen
- Nach wissenschaftlicher Evidenz fragen
- Kontextfaktoren einbeziehen (Alter, Setting, Methodik)
Antworte NUR mit der optimierten Frage, keine Erklaerung.`,

    dialectic: `Du bist ein Experte fuer dialektisches Denken. Der Nutzer gibt dir eine Behauptung/These.
Transformiere diese in eine Forschungsanfrage, die nach These, Antithese und Synthese fragt.
Die optimierte Anfrage sollte:
- Die urspruengliche These benennen
- Explizit nach Gegenargumenten und widerspruchlichen Studien fragen
- Nach einer differenzierten Synthese fragen
Antworte NUR mit der optimierten Frage, keine Erklaerung.`,

    author: `Du bist ein Experte fuer akademische Netzwerke. Der Nutzer nennt einen Autor/Forscher.
Transformiere dies in eine Anfrage, die nach verwandten Forschern und deren Werken fragt.
Die optimierte Anfrage sollte:
- Nach 5-7 thematisch verwandten Wissenschaftlern fragen
- Deren Hauptwerke und Verbindung zum genannten Autor erfragen
- Nach aktuellen Kollaborationen oder Debatten fragen
Antworte NUR mit der optimierten Frage, keine Erklaerung.`,

    work: `Du bist ein Experte fuer wissenschaftliche Literatur. Der Nutzer nennt ein Buch oder Paper.
Transformiere dies in eine Anfrage nach verwandten akademischen Werken.
Die optimierte Anfrage sollte:
- Nach thematisch aehnlichen Publikationen fragen
- Nach Werken fragen, die dieses zitieren oder kritisieren
- Nach aktuelleren Studien im gleichen Forschungsfeld fragen
Antworte NUR mit der optimierten Frage, keine Erklaerung.`,

    factcheck: `Du bist ein Experte fuer Faktencheck. Der Nutzer gibt dir eine Behauptung.
Transformiere diese in eine kritische Rechercheanfrage.
Die optimierte Anfrage sollte:
- Nach dem Ursprung der Behauptung fragen
- Nach wissenschaftlichen Studien fragen, die diese stuetzen oder widerlegen
- Nach der Qualitaet der Evidenz fragen
Antworte NUR mit der optimierten Frage, keine Erklaerung.`
};

export async function POST(req: Request) {
    try {
        const { input, mode } = await req.json();

        if (!input || !mode) {
            return NextResponse.json({ error: 'Input and mode are required' }, { status: 400 });
        }

        const systemPrompt = MODE_PROMPTS[mode as ResearchMode];
        if (!systemPrompt) {
            return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: input }
            ],
            temperature: 0.7,
            max_tokens: 500,
        });

        const optimizedPrompt = completion.choices[0].message.content?.trim() || input;

        return NextResponse.json({
            original: input,
            optimized: optimizedPrompt,
            mode: mode
        });

    } catch (error: any) {
        console.error('Optimize API error:', error);
        return NextResponse.json({ error: error.message || 'Failed to optimize prompt' }, { status: 500 });
    }
}
