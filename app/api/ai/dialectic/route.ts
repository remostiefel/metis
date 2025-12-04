import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { perplexity } from '@/lib/perplexity';

export async function POST(req: Request) {
    try {
        const { thesis } = await req.json();

        if (!thesis) {
            return NextResponse.json({ error: 'Thesis is required' }, { status: 400 });
        }

        // Step 1: Get Antithesis from Perplexity (Fact-based counter-arguments)
        const antithesisPrompt = `Du bist ein intellektueller Sparringspartner.
    Der Nutzer gibt eine These vor. Deine Aufgabe ist es, die stärkstmögliche, wissenschaftlich fundierte ANTITHESE zu formulieren.
    
    These: "${thesis}"
    
    Aufgabe:
    1. Suche nach validen Gegenargumenten, Studien oder Perspektiven, die dieser These widersprechen.
    2. Formuliere die Antithese scharf, präzise und faktenbasiert.
    3. Nenne konkrete Quellen/Studien (Name/Jahr), wenn möglich.
    
    Antworte NUR mit dem Text der Antithese (max. 150 Wörter).`;

        const perplexityResponse = await perplexity.chat.completions.create({
            model: 'sonar-pro',
            messages: [
                { role: 'system', content: antithesisPrompt },
                { role: 'user', content: thesis }
            ]
        });

        const antithesis = perplexityResponse.choices[0].message.content;

        // Step 2: Get Synthesis and Reflection from OpenAI (Reasoning/Bridging)
        const synthesisPrompt = `Du bist ein weiser Philosoph und Pädagoge.
    
    Hier ist eine These: "${thesis}"
    Hier ist die faktische Antithese: "${antithesis}"
    
    Deine Aufgabe:
    1. Formuliere eine SYNTHESE: Wie lassen sich beide Perspektiven vereinen? Was ist der differenzierte "Mittelweg" oder die höhere Wahrheit? (max. 100 Wörter)
    2. Formuliere 3 REFLEXIONS-FRAGEN: Fragen, die den Autor dazu bringen, seine Position tiefer zu durchdenken.
    
    Antworte als JSON-Objekt mit den Keys:
    - 'synthesis': string
    - 'reflection_questions': string[]`;

        const openaiResponse = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: synthesisPrompt },
                { role: 'user', content: 'Synthetisiere dies.' }
            ],
            response_format: { type: "json_object" }
        });

        const synthesisData = JSON.parse(openaiResponse.choices[0].message.content || '{}');

        return NextResponse.json({
            thesis,
            antithesis,
            synthesis: synthesisData.synthesis,
            reflection_questions: synthesisData.reflection_questions
        });

    } catch (error: any) {
        console.error('Dialectic API error:', error);
        return NextResponse.json({ error: error.message || 'Failed to process dialectic' }, { status: 500 });
    }
}
