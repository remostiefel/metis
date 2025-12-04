export interface Source {
    id: string;
    type: 'url' | 'pdf' | 'note';
    title: string;
    url?: string;
    content: string;        // Full extracted text
    summary: string;        // AI-generated summary
    keyQuotes: string[];    // AI-extracted key quotes
    tags: string[];         // Auto-generated tags
    linkedModules: string[];// Connected chapters
    createdAt: string;      // ISO string for JSON compatibility
    updatedAt: string;      // ISO string
}
