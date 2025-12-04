'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Module } from '@/types';

// Dynamically import ForceGraph2D with no SSR
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl text-gray-400">Lade Knowledge Graph...</div>
});

interface KnowledgeGraphProps {
    modules: Module[];
}

export function KnowledgeGraph({ modules }: KnowledgeGraphProps) {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.offsetWidth,
                height: 500
            });
        }

        // Process modules into nodes and links
        const nodes = modules.map(m => ({
            id: m.id,
            name: m.title,
            val: m.content.length / 1000 + 1, // Size based on content length
            group: m.status === 'final' ? 1 : (m.status === 'überarbeitung' ? 2 : 3),
            color: m.status === 'final' ? '#10B981' : (m.status === 'überarbeitung' ? '#F59E0B' : '#EF4444')
        }));

        const links: any[] = [];

        // Create links based on shared tags (simple clustering)
        for (let i = 0; i < modules.length; i++) {
            for (let j = i + 1; j < modules.length; j++) {
                const m1 = modules[i];
                const m2 = modules[j];

                // Link if they share tags
                const sharedTags = m1.tags.filter(t => m2.tags.includes(t));
                if (sharedTags.length > 0) {
                    links.push({
                        source: m1.id,
                        target: m2.id,
                        value: sharedTags.length // Thicker link for more shared tags
                    });
                }
            }
        }

        setGraphData({ nodes: nodes as any, links });

    }, [modules]);

    return (
        <div ref={containerRef} className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Knowledge Graph</h3>
                <div className="flex gap-2 text-xs">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Final</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Überarbeitung</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Entwurf</span>
                </div>
            </div>
            <ForceGraph2D
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}
                nodeLabel="name"
                nodeColor="color"
                linkColor={() => '#E5E7EB'}
                onNodeClick={(node: any) => router.push(`/editor/${node.id}`)}
                enableNodeDrag={false}
                cooldownTicks={100}
            />
        </div>
    );
}
