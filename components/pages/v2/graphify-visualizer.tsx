"use client";

import { useState, useEffect, useRef } from "react";
import { Network, DataSet } from "vis-network/standalone";
import { Info, Shield, Search, MousePointer2, Activity, Zap, Layers, ArrowLeft } from "lucide-react";

interface GraphifyVisualizerProps {
  data: {
    nodes: any[];
    links: any[];
  } | null;
  onBack?: () => void;
}

export default function GraphifyVisualizer({ data, onBack }: GraphifyVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [searchTerm, setSearchQuery] = useState("");

  const COLORS = ["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F", "#EDC948", "#B07AA1", "#FF9DA7", "#9C755F", "#BAB0AC"];

  useEffect(() => {
    if (!data || !containerRef.current) return;

    // ... (rest of the useEffect is correct)

    // 1. Format data exactly like Graphify
    const visNodes = new DataSet(data.nodes.map(n => ({
      id: n.id,
      label: n.label,
      color: {
        background: COLORS[n.community % COLORS.length],
        border: COLORS[n.community % COLORS.length],
        highlight: { background: "#ffffff", border: COLORS[n.community % COLORS.length] }
      },
      size: n.type === 'report' ? 25 : 15,
      font: { color: "#ffffff", size: n.type === 'report' ? 14 : 10, face: "Inter, system-ui" },
      shape: 'dot',
      title: n.label,
      _type: n.type,
      _community: n.community
    })));

    const visEdges = new DataSet(data.links.map((l, i) => ({
      id: i,
      from: l.source,
      to: l.target,
      label: l.label || '',
      color: { opacity: 0.4, color: "#94a3b8" },
      arrows: { to: { enabled: true, scaleFactor: 0.5 } },
      smooth: { type: 'continuous', roundness: 0.2 }
    })));

    // 2. Exact Graphify Physics & Styling
    const options = {
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -80,
          centralGravity: 0.005,
          springLength: 150,
          springConstant: 0.08,
          damping: 0.4,
          avoidOverlap: 1.0,
        },
        stabilization: { iterations: 150, fit: true },
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        hideEdgesOnDrag: false,
        navigationButtons: false,
        dragNodes: true,
      },
      nodes: {
        borderWidth: 2,
        shadow: { enabled: true, color: 'rgba(0,0,0,0.5)', size: 10, x: 5, y: 5 }
      },
      edges: {
        width: 1,
        selectionWidth: 3
      }
    };

    const network = new Network(containerRef.current, { nodes: visNodes, edges: visEdges }, options);
    networkRef.current = network;

    // 3. Event Listeners
    network.on("click", (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = visNodes.get(nodeId);
        setSelectedNode(node);
      } else {
        setSelectedNode(null);
      }
    });

    network.on("hoverNode", () => {
      containerRef.current!.style.cursor = 'grab';
    });
    
    network.on("blurNode", () => {
      containerRef.current!.style.cursor = 'default';
    });

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className="flex h-full bg-[#f8fafc] text-slate-900 overflow-hidden font-sans select-none">
      {/* HUD Header */}
      <div className="absolute top-6 left-6 z-20 flex items-start gap-4">
        {onBack && (
          <button 
            onClick={onBack}
            className="p-2.5 bg-white/90 backdrop-blur border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition-colors shadow-lg pointer-events-auto"
            title="Return to feed"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex flex-col gap-1 pointer-events-none">
          <div className="flex items-center gap-2">
             <Layers className="w-5 h-5 text-indigo-600" />
             <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase">Knowledge Graph</h3>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
             <span className="text-[9px] font-bold text-slate-400 tracking-[0.3em] uppercase">Neural Trace v2.4</span>
          </div>
        </div>
      </div>

      {/* Main Graph Area */}
      <div className="flex-1 relative">
        <div ref={containerRef} className="w-full h-full bg-[#f8fafc]" />
        
        {!data && (
           <div className="absolute inset-0 flex items-center justify-center text-slate-400 flex-col gap-4">
              <Activity className="w-12 h-12 opacity-10 animate-spin-slow" />
              <p className="text-[10px] font-bold tracking-widest uppercase">Initializing Physics Core...</p>
           </div>
        )}

        <div className="absolute bottom-8 left-8 flex gap-3">
           <div className="px-3 py-1.5 bg-white/90 backdrop-blur border border-slate-200 rounded-lg flex items-center gap-2 shadow-sm">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Node Count: {data?.nodes?.length || 0}</span>
           </div>
        </div>
      </div>

      {/* Graphify Sidebar */}
      <div className="w-80 border-l border-slate-200 bg-white/90 backdrop-blur-md p-6 flex flex-col gap-6 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] z-30">
        <div className="space-y-6 flex-1 overflow-y-auto">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search intelligence..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-xs text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          </div>

          <div>
             <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Intelligence Inspector</h4>
             {selectedNode ? (
               <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-inner">
                     <p className="text-[9px] font-black text-indigo-600 uppercase mb-2">Fragment: {selectedNode._type}</p>
                     <p className="text-slate-900 font-bold leading-snug break-all">{selectedNode.label}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                     <div className="p-3 bg-white rounded-lg border border-slate-100 flex items-center justify-between shadow-sm">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Community</span>
                        <span className="text-[10px] font-bold text-indigo-600 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded">#{selectedNode._community}</span>
                     </div>
                  </div>
               </div>
             ) : (
               <div className="py-20 text-center flex flex-col items-center gap-4 opacity-40">
                  <MousePointer2 className="w-10 h-10 text-slate-300" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Select Node to Decrypt</p>
               </div>
             )}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Neural Clusters</p>
           <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                   <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Group {i}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
