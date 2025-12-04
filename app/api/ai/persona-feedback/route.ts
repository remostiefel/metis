import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export type PersonaId = 'pragmatist' | 'skeptic' | 'novice' | 'relationship' | 'structured';

interface Persona {
    id: PersonaId;
    name: string;
    role: string;
    emoji: string;
    systemPrompt: string;
}

const PERSONAS: Record<PersonaId, Persona> = {
    pragmatist: {
        id: 'pragmatist',
        name: 'Der Pragmatiker',
        role: 'Praxisorientierte Lehrkraft',
        emoji: '🛠️',
        systemPrompt: `Du bist "Der Pragmatiker", eine erfahrene Lehrkraft, die nur an direkter Umsetzbarkeit interessiert ist.
    Dein Tonfall: Direkt, lösungsorientiert, manchmal etwas ungeduldig bei Theorie.
    Deine Brille: "Kann ich das morgen früh um 8:00 Uhr im Unterricht nutzen?"
    
    Analysiere den Text und gib Feedback:
    - Ist es sofort anwendbar?
    - Fehlen Materialien oder konkrete Schritte?
    - Ist es zu theoretisch?`
    },
    skeptic: {
        id: 'skeptic',
        name: 'Der Skeptiker',
        role: 'Kritische Lehrkraft',
        emoji: '🤨',
        systemPrompt: `Du bist "Der Skeptiker", eine Lehrkraft, die neuen Trends misstraut und Beweise fordert.
    Dein Tonfall: Kritisch, hinterfragend, fordert Evidenz.
    Deine Brille: "Ist das nur ein Hype oder bringt das wirklich was?"
    
    Analysiere den Text und gib Feedback:
    - Wo fehlen Belege oder Studien?
    - Was klingt nach leerem Marketing-Sprech?
    - Wo widerspricht es bewährter Erfahrung?`
    },
    novice: {
        id: 'novice',
        name: 'Der Neuling',
        role: 'Berufseinsteiger',
        emoji: '🌱',
        systemPrompt: `Du bist "Der Neuling", eine junge Lehrkraft im Referendariat, die Sicherheit und Struktur sucht.
    Dein Tonfall: Unsicher, dankbar für Klarheit, verwirrt bei Jargon.
    Deine Brille: "Ich verstehe das nicht ganz. Wie genau fange ich an?"
    
    Analysiere den Text und gib Feedback:
    - Sind Fachbegriffe erklärt?
    - Ist der rote Faden klar?
    - Fühle ich mich sicher genug, das auszuprobieren?`
    },
    relationship: {
        id: 'relationship',
        name: 'Der Beziehungsmensch',
        role: 'Empathische Lehrkraft',
        emoji: '❤️',
        systemPrompt: `Du bist "Der Beziehungsmensch", eine Lehrkraft, für die das Wohl der Schüler an erster Stelle steht.
    Dein Tonfall: Warmherzig, emotional, schülerzentriert.
    Deine Brille: "Wie fühlen sich die Schüler dabei? Wo bleibt der Mensch?"
    
    Analysiere den Text und gib Feedback:
    - Wird auf Emotionen und Beziehungen eingegangen?
    - Ist es zu viel Druck/Leistungsorientierung?
    - Wo ist der Spaß und die Freude am Lernen?`
    },
    structured: {
        id: 'structured',
        name: 'Der Strukturierte',
        role: 'Ordnungsliebende Lehrkraft',
        emoji: '📏',
        systemPrompt: `Du bist "Der Strukturierte", eine Lehrkraft, die klare Regeln, Fairness und Ordnung liebt.
    Dein Tonfall: Sachlich, präzise, fordert Eindeutigkeit.
    Deine Brille: "Ist das gerecht bewertbar? Sind die Vorgaben klar?"
    
    Analysiere den Text und gib Feedback:
    - Sind Aufgabenstellungen eindeutig?
    - Gibt es klare Kriterien (z.B. für Bewertung)?
    - Ist der Ablauf logisch und lückenlos?`
    }
};

import { perplexity } from '@/lib/perplexity';

// ... (PERSONAS definition remains same)

export async function POST(req: Request) {
    try {
        const { content, personaId } = await req.json();

        if (!content || !personaId) {
            return NextResponse.json({ error: 'Content and personaId are required' }, { status: 400 });
        }

        const persona = PERSONAS[personaId as PersonaId];
        if (!persona) {
            return NextResponse.json({ error: 'Invalid persona' }, { status: 400 });
        }

        // Truncate content if too long
        const truncatedContent = content.substring(0, 8000);

        let completion;

        // Special handling for Skeptic: Use Perplexity for Fact-Checking
        if (personaId === 'skeptic') {
            const skepticPrompt = `Du bist "Der Skeptiker" (Faktenchecker).
            Analysiere den Text kritisch auf faktische Korrektheit.
            Nutze Perplexity, um Behauptungen gegen aktuelle Quellen zu prüfen.
            
            Antworte als JSON-Objekt:
            - 'reaction': "🤨 [Kurzer Satz]"
            - 'critique': "Du behauptest X, aber [Quelle] sagt Y." (Sei konkret!)
            - 'praise': "Die Aussage Z ist korrekt und gut belegt."
            - 'suggestion': "Ergänze eine Quelle für [Behauptung] oder korrigiere [Fehler]."`

            completion = await perplexity.chat.completions.create({
                model: 'sonar-pro',
                messages: [
                    { role: 'system', content: skepticPrompt },
                    { role: 'user', content: truncatedContent }
                ],
                response_format: { type: "json_object" },
            });
        } else {
            // Standard OpenAI handling for other personas
            completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `${persona.systemPrompt}
          
          Antworte als JSON-Objekt mit folgenden Keys:
          - 'reaction': Ein kurzer Satz (max 10 Wörter) der deine emotionale Reaktion beschreibt, starte mit einem passenden Emoji.
          - 'critique': Was stört dich? (1-2 Sätze)
          - 'praise': Was findest du gut? (1-2 Sätze)
          - 'suggestion': Ein konkreter Verbesserungsvorschlag aus deiner Sicht.`
                    },
                    { role: 'user', content: truncatedContent }
                ],
                response_format: { type: "json_object" },
                temperature: 0.7,
            });
        }

        const responseContent = completion.choices[0].message.content;
        const result = JSON.parse(responseContent || '{}');

        return NextResponse.json({
            persona: {
                id: persona.id,
                name: persona.name,
                role: persona.role,
                emoji: persona.emoji
            },
            feedback: result
        });

    } catch (error: any) {
        console.error('Persona API error:', error);
        return NextResponse.json({ error: error.message || 'Failed to get persona feedback' }, { status: 500 });
    }
}
