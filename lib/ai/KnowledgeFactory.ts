/**
 * Knowledge Factory - Browser-safe API Proxy
 * Forwards extraction requests to the server-side API to bypass child_process limitations.
 */

export interface GraphData {
  nodes: any[];
  links: any[];
}

export class KnowledgeFactory {
  /**
   * Extract entities and relationships via the server-side API
   */
  async extract(data: any[]): Promise<GraphData> {
    try {
      const response = await fetch('/api/graph/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract knowledge from server');
      }

      return await response.json();
    } catch (error) {
      console.error('Knowledge Factory Proxy Error:', error);
      // Fallback: Return simple graph to prevent crash
      return { nodes: [], links: [] };
    }
  }
}
