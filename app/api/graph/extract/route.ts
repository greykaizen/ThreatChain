import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

const patterns = {
  ip: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
  domain: /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]\b/gi,
  hash: /\b[a-fA-F0-9]{32,64}\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
};

export async function POST(request: Request) {
  try {
    const { data } = await request.json();
    const nodes: any[] = [];
    const links: any[] = [];
    const seen = new Map<string, any>();

    // 1. Structural Extraction
    data.slice(0, 40).forEach((row: any, index: number) => {
      const rowId = `event-${index}`;

      nodes.push({
        id: rowId,
        label: `Event #${index + 1}`,
        type: 'report',
        community: 0,
        data: row
      });

      Object.entries(row).forEach(([key, value]) => {
        if (!value || typeof value !== 'string') return;

        Object.entries(patterns).forEach(([type, regex]) => {
          const matches = value.match(regex);
          if (matches) {
            matches.forEach(match => {
              const entityId = `entity-${match}`;

              if (!seen.has(entityId)) {
                const entityNode = {
                  id: entityId,
                  label: match,
                  type: type,
                  community: 0
                };
                nodes.push(entityNode);
                seen.set(entityId, entityNode);
              }

              links.push({
                source: rowId,
                target: entityId,
                label: `has_${type}`,
                value: 1
              });
            });
          }
        });
      });
    });

    // 2. Knowledge Creation (Real Graphify Clustering via uv)
    try {
      const jsonInput = JSON.stringify({ nodes, links });
      const pythonScript = path.join(process.cwd(), 'scripts', 'graphify_clustering.py');
      
      // Execute the clustering script using uv run
      const clusteredJson = execSync(`echo '${jsonInput.replace(/'/g, "'\\''")}' | uv run ${pythonScript}`, { 
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer for large graphs
      });
      return NextResponse.json(JSON.parse(clusteredJson));
    } catch (error) {
      console.error('Clustering Bridge Error:', error);
      // Fallback to simple modulo clustering if python fails
      nodes.forEach((n, i) => n.community = i % 5);
      return NextResponse.json({ nodes, links });
    }

  } catch (error: any) {
    console.error('Graph Extract API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
