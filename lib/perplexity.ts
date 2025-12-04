import OpenAI from 'openai';

// Perplexity uses OpenAI-compatible API
export const perplexity = new OpenAI({
    apiKey: process.env.PERPLEXITY_API_KEY || '',
    baseURL: 'https://api.perplexity.ai',
});
