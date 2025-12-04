import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export async function POST(req: Request) {
    try {
        const { action, query, quote } = await req.json();

        if (!action) {
            return NextResponse.json({ error: 'Action is required' }, { status: 400 });
        }

        let systemPrompt = "";
        let userContent = "";

        if (action === 'search') {
            systemPrompt = `You are a well-read literary assistant. 
      Find 3-5 famous, impactful quotes related to the user's topic. 
      For each quote, provide:
      - 'text': The quote itself (in German if possible, or original with German translation).
      - 'author': The author's name.
      - 'context': A very brief context (e.g., "From 'The Republic'").
      
      Return as a JSON object with a 'quotes' array. IMPORTANT: Output context/commentary must be in German.`;
            userContent = `Topic: ${query}`;
        } else if (action === 'verify') {
            systemPrompt = `You are a fact-checker for quotes. 
      Analyze the provided quote. Determine if it is correctly attributed.
      If yes, confirm it. If no, provide the correct author and origin.
      
      Return as a JSON object with:
      - 'isCorrect': boolean
      - 'correction': string (if incorrect, otherwise null)
      - 'author': string (correct author)
      - 'origin': string (book/speech/year)
      - 'context': string (brief context)
      
      IMPORTANT: Output fields (correction, origin, context) must be in German language.`;
            userContent = `Quote to verify: "${quote}"`;
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userContent }
            ],
            model: "gpt-3.5-turbo",
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
