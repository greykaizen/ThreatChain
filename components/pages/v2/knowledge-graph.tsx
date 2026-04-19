"use client";

import { useState, useEffect, useRef } from "react";
import { Network, Search, Loader2, Info, RefreshCw, Layers, MousePointer2 } from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface KnowledgeGraphProps {
  initialAttributes?: string[];
  initialData?: any[];
}

interface Node {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number | null;
  fy?: number | null;
  color: string;
  size: number;
}

interface Edge {
  source: string;
  target: string;
  label: string;
}

const TYPE_COLORS: Record<string, string> = {
  'malware': '#ef4444',
  'indicator': '#3b82f6',
  'identity': '#10b981',
  'threat-actor': '#7c3aed',
  'report': '#6366f1',
  'default': '#94a3b8'
};

export default function KnowledgeGraphV2({ initialAttributes, initialData }: KnowledgeGraphProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const draggedNodeId = useRef<string | null>(null);

  // ─── INITIAL DATA ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];
      const seenNodes = new Set<string>();

      initialData.slice(0, 35).forEach((row, rowIdx) => {
        const rowNodeId = `row-${rowIdx}`;
        newNodes.push({
          id: rowNodeId,
          label: `Entry #${rowIdx + 1}`,
          type: 'report',
          x: 500 + (Math.random() - 0.5) * 300,
          y: 300 + (Math.random() - 0.5) * 300,
          vx: 0, vy: 0,
          color: TYPE_COLORS['report'],
          size: 24
        });

        Object.entries(row).forEach(([key, value]) => {
          if (!value || typeof value === 'object') return;
          const valStr = String(value);
          const valNodeId = `val-${valStr}`;

          if (!seenNodes.has(valNodeId)) {
            newNodes.push({
              id: valNodeId,
              label: valStr,
              type: key.toLowerCase().includes('ip') ? 'indicator' : 
                    key.toLowerCase().includes('malware') ? 'malware' : 'default',
              x: 500 + (Math.random() - 0.5) * 500,
              y: 300 + (Math.random() - 0.5) * 500,
              vx: 0, vy: 0,
              color: key.toLowerCase().includes('ip') ? TYPE_COLORS['indicator'] : 
                     key.toLowerCase().includes('malware') ? TYPE_COLORS['malware'] : TYPE_COLORS['default'],
              size: 16
            });
            seenNodes.add(valNodeId);
          }
          newEdges.push({ source: rowNodeId, target: valNodeId, label: key });
        });
      });

      nodesRef.current = newNodes;
      setNodes(newNodes);
      setEdges(newEdges);
    }
  }, [initialData]);

  // ─── SEARCH HANDLER ────────────────────────────────────────────────────────

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/stix/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      data.results.forEach((res: any, idx: number) => {
        const nodeId = res.id;
        newNodes.push({
          id: nodeId, label: res.title, type: 'report',
          x: 500 + (Math.random() - 0.5) * 400,
          y: 300 + (Math.random() - 0.5) * 400,
          vx: 0, vy: 0, color: TYPE_COLORS['report'], size: 25
        });
        if (idx > 0) newEdges.push({ source: data.results[idx-1].id, target: nodeId, label: 'related' });
      });

      nodesRef.current = newNodes;
      setNodes(newNodes);
      setEdges(newEdges);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  // ─── PHYSICS ENGINE (Optimized & Sticky) ───────────────────────────────────

  useEffect(() => {
    let animationId: number;
    
    const runPhysics = () => {
      const currentNodes = nodesRef.current;
      if (currentNodes.length === 0) {
        animationId = requestAnimationFrame(runPhysics);
        return;
      }

      currentNodes.forEach((node, i) => {
        // If being dragged, stay exactly under the mouse
        if (node.id === draggedNodeId.current && node.fx !== null && node.fx !== undefined) {
           node.x = node.fx;
           node.y = node.fy!;
           node.vx = 0;
           node.vy = 0;
           return;
        }

        let ax = 0, ay = 0;

        // 1. Better Repulsion
        currentNodes.forEach((other, j) => {
          if (i === j) return;
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const distSq = dx * dx + dy * dy + 1;
          const dist = Math.sqrt(distSq);
          
          const force = 18000 / distSq;
          ax += (dx / dist) * force;
          ay += (dy / dist) * force;

          // Hard Collision
          const minDist = node.size + other.size + 15;
          if (dist < minDist) {
            const overlap = minDist - dist;
            node.x += (dx / dist) * overlap * 0.5;
            node.y += (dy / dist) * overlap * 0.5;
          }
        });

        // 2. Attraction
        edges.forEach(edge => {
          if (edge.source === node.id || edge.target === node.id) {
            const other = currentNodes.find(n => n.id === (edge.source === node.id ? edge.target : edge.source));
            if (other) {
              const dx = other.x - node.x;
              const dy = other.y - node.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const force = (dist - 140) * 0.04;
              ax += (dx / dist) * force;
              ay += (dy / dist) * force;
            }
          }
        });

        // 3. Global Friction & Gravity
        ax += (500 - node.x) * 0.004;
        ay += (300 - node.y) * 0.004;

        node.vx = (node.vx + ax) * 0.88;
        node.vy = (node.vy + ay) * 0.88;
        node.x += node.vx;
        node.y += node.vy;
      });

      setNodes([...currentNodes]);
      animationId = requestAnimationFrame(runPhysics);
    };

    animationId = requestAnimationFrame(runPhysics);
    return () => cancelAnimationFrame(animationId);
  }, [edges.length]);

  // ─── RENDERING (Graphify Style: Clean Light Theme) ──────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Edges
    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Draw Nodes
    nodes.forEach(node => {
      const isSelected = selectedNode?.id === node.id;
      
      // Node Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      
      ctx.strokeStyle = isSelected ? "#000000" : node.color;
      ctx.lineWidth = isSelected ? 4 : 3;
      ctx.stroke();

      // Inner color dot
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();

      // Label
      ctx.fillStyle = "#334155";
      ctx.font = isSelected ? "bold 13px Inter, sans-serif" : "500 12px Inter, sans-serif";
      ctx.textAlign = "center";
      const label = node.label.length > 18 ? node.label.substring(0, 16) + '...' : node.label;
      ctx.fillText(label, node.x, node.y + node.size + 16);
    });
  }, [nodes, selectedNode]);

  // ─── INTERACTION ───────────────────────────────────────────────────────────

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const node = nodes.find(n => Math.sqrt((n.x - x)**2 + (n.y - y)**2) < n.size * 2);
    if (node) {
      draggedNodeId.current = node.id;
      node.fx = x;
      node.fy = y;
      setSelectedNode(node);
    } else {
      setSelectedNode(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNodeId.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const node = nodesRef.current.find(n => n.id === draggedNodeId.current);
      if (node) {
        node.fx = x;
        node.fy = y;
        node.x = x;
        node.y = y;
      }
    }
  };

  const handleMouseUp = () => {
    if (draggedNodeId.current) {
      const node = nodesRef.current.find(n => n.id === draggedNodeId.current);
      if (node) {
        node.fx = null;
        node.fy = null;
      }
    }
    draggedNodeId.current = null;
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col bg-slate-50">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600" />
            Intelligence Knowledge Graph
          </h2>
          <p className="text-sm text-slate-500">Interactive threat relationship mapping</p>
        </div>
        
        {!initialData && (
          <div className="flex gap-3">
            <div className="relative">
              <input 
                type="text" placeholder="Global search..." 
                className="pl-10 pr-4 py-2 border rounded-xl w-64 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
            </div>
            <button 
              onClick={handleSearch} disabled={isSearching}
              className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Discover"}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden">
          <canvas 
            ref={canvasRef} width={1000} height={600} 
            className="w-full h-full cursor-pointer"
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
          />
          
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-300 flex-col gap-4">
              <MousePointer2 className="w-12 h-12 opacity-20" />
              <p className="font-medium">Parse a feed or use global search to build graph</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm min-h-[250px]">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Info className="w-4 h-4" /> Selected Entity
            </h3>
            {selectedNode ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                  <p className="text-[10px] font-bold" style={{ color: selectedNode.color }}>{selectedNode.type.toUpperCase()}</p>
                  <p className="font-bold text-slate-900 text-lg mt-1 break-all">{selectedNode.label}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <div className="p-3 bg-slate-50 rounded-lg text-center border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">X Pos</p>
                      <p className="font-mono text-xs">{Math.round(selectedNode.x)}</p>
                   </div>
                   <div className="p-3 bg-slate-50 rounded-lg text-center border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Y Pos</p>
                      <p className="font-mono text-xs">{Math.round(selectedNode.y)}</p>
                   </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-40">
                <Network className="w-10 h-10 mb-2" />
                <p className="text-sm">Click a node to inspect</p>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Legend</h3>
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(TYPE_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: color }}></div>
                  <span className="capitalize">{type.replace('-', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
