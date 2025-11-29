"use client";

import { useState, useEffect, useRef } from "react";
import {
  Download,
  Plus,
  Trash2,
  Network,
  ArrowLeft,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  FileDown,
  Table,
} from "lucide-react";

interface Relationship {
  id: string;
  source: string;
  target: string;
  type: string;
}

interface GraphNode {
  id: string;
  label: string;
  type: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  label: string;
}

interface KnowledgeGraphProps {
  selectedAttributes?: string[];
  csvData?: any[];
}

const cardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "0.75rem",
};

export default function KnowledgeGraph({
  selectedAttributes = [],
  csvData = [],
}: KnowledgeGraphProps) {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [newRelationship, setNewRelationship] = useState({
    source: "",
    target: "",
    type: "",
  });
  const [graphGenerated, setGraphGenerated] = useState(false);
  const [initialGraphGenerated, setInitialGraphGenerated] = useState(false);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [allAttributes, setAllAttributes] = useState<string[]>([]);
  const [showConversionDialog, setShowConversionDialog] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionComplete, setConversionComplete] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Interactive features state
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [useForceLayout, setUseForceLayout] = useState(true);
  const animationFrameRef = useRef<number | null>(null);
  const [physicsEnabled, setPhysicsEnabled] = useState(true);
  const [visualizationMode, setVisualizationMode] = useState<"schema" | "data">(
    "schema"
  );
  const [maxDataNodes, setMaxDataNodes] = useState(50);

  // STIX Graph state
  const [stixNodes, setStixNodes] = useState<GraphNode[]>([]);
  const [stixEdges, setStixEdges] = useState<GraphEdge[]>([]);
  const [stixGraphGenerated, setStixGraphGenerated] = useState(false);
  const [selectedStixNode, setSelectedStixNode] = useState<string | null>(null);
  const [hoveredStixNode, setHoveredStixNode] = useState<string | null>(null);
  const [isDraggingStix, setIsDraggingStix] = useState(false);
  const [draggedStixNode, setDraggedStixNode] = useState<string | null>(null);
  const [zoomStix, setZoomStix] = useState(1);
  const [panStix, setPanStix] = useState({ x: 0, y: 0 });
  const [isPanningStix, setIsPanningStix] = useState(false);
  const [panStartStix, setPanStartStix] = useState({ x: 0, y: 0 });
  const [physicsEnabledStix, setPhysicsEnabledStix] = useState(true);
  const canvasStixRef = useRef<HTMLCanvasElement>(null);
  const animationFrameStixRef = useRef<number | null>(null);

  const relationshipTypes = [
    "indicates",
    "related_to",
    "has_severity",
    "observed_in",
    "attributed_to",
    "targets",
  ];

  // Generate initial graph automatically when data is available
  const generateInitialGraph = () => {
    if (csvData.length === 0) return;

    // Get all attributes from CSV data
    const attributes = Object.keys(csvData[0] || {});
    setAllAttributes(attributes);

    // Create automatic relationships based on common CTI patterns
    const autoRelationships: Relationship[] = [];
    const attrLower = attributes.map((a) => a.toLowerCase());

    // Smart pattern matching for common CTI fields
    const patterns = [
      {
        source: [
          "indicator_type",
          "type",
          "type_field",
          "ioc_type",
          "category",
        ],
        target: ["indicator_value", "value", "ioc_data", "ioc"],
        type: "indicates",
      },
      {
        source: ["threat_type", "threat", "malware_type"],
        target: ["indicator_value", "value", "ioc_data"],
        type: "related_to",
      },
      {
        source: ["threat_type", "threat", "type", "type_field"],
        target: ["severity", "risk_level", "priority", "confidence"],
        type: "has_severity",
      },
      {
        source: ["source", "source_name", "reporter", "feed"],
        target: ["indicator_value", "value", "ioc_data"],
        type: "observed_in",
      },
    ];

    let idCounter = 1;
    patterns.forEach((pattern) => {
      const sourceIdx = attrLower.findIndex((name) =>
        pattern.source.some((p) => name.includes(p))
      );
      const targetIdx = attrLower.findIndex((name) =>
        pattern.target.some((p) => name.includes(p))
      );

      if (sourceIdx !== -1 && targetIdx !== -1 && sourceIdx !== targetIdx) {
        const rel = {
          id: `auto-${idCounter++}`,
          source: attributes[sourceIdx],
          target: attributes[targetIdx],
          type: pattern.type,
        };
        // Avoid duplicates
        if (
          !autoRelationships.some(
            (r) => r.source === rel.source && r.target === rel.target
          )
        ) {
          autoRelationships.push(rel);
        }
      }
    });

    if (
      attributes.includes("source") &&
      attributes.includes("indicator_value")
    ) {
      autoRelationships.push({
        id: "auto-4",
        source: "source",
        target: "indicator_value",
        type: "observed_in",
      });
    }

    // If no automatic relationships found, create basic connections between first few attributes
    if (autoRelationships.length === 0 && attributes.length >= 2) {
      for (let i = 0; i < Math.min(attributes.length - 1, 3); i++) {
        autoRelationships.push({
          id: `auto-basic-${i}`,
          source: attributes[i],
          target: attributes[i + 1],
          type: "related_to",
        });
      }
    }

    setRelationships(autoRelationships);

    // Generate nodes and edges for initial graph
    const nodeSet = new Set<string>();
    autoRelationships.forEach((rel) => {
      nodeSet.add(rel.source);
      nodeSet.add(rel.target);
    });

    const initialNodes: GraphNode[] = Array.from(nodeSet).map((attr) => ({
      id: attr,
      label: attr,
      type: "attribute",
    }));

    const initialEdges: GraphEdge[] = autoRelationships.map((rel) => ({
      source: rel.source,
      target: rel.target,
      label: rel.type,
    }));

    setNodes(initialNodes);
    setEdges(initialEdges);
    setInitialGraphGenerated(true);

    // Draw the initial graph
    setTimeout(() => drawGraph(initialNodes, initialEdges), 100);
  };

  const addRelationship = () => {
    if (
      newRelationship.source &&
      newRelationship.target &&
      newRelationship.type
    ) {
      setRelationships([
        ...relationships,
        { ...newRelationship, id: Date.now().toString() },
      ]);
      setNewRelationship({ source: "", target: "", type: "" });
    }
  };

  const removeRelationship = (id: string) => {
    setRelationships(relationships.filter((r) => r.id !== id));
  };

  const generateGraph = () => {
    if (visualizationMode === "data") {
      generateDataGraph();
    } else {
      generateSchemaGraph();
    }
  };

  const generateSchemaGraph = () => {
    // Filter relationships to only include those with both source and target in allAttributes
    const validRelationships = relationships.filter(
      (rel) =>
        allAttributes.includes(rel.source) && allAttributes.includes(rel.target)
    );

    const nodeSet = new Set<string>();
    validRelationships.forEach((rel) => {
      nodeSet.add(rel.source);
      nodeSet.add(rel.target);
    });

    const generatedNodes: GraphNode[] = Array.from(nodeSet).map((attr) => ({
      id: attr,
      label: attr,
      type: "attribute",
    }));

    const generatedEdges: GraphEdge[] = validRelationships.map((rel) => ({
      source: rel.source,
      target: rel.target,
      label: rel.type,
    }));

    setNodes(generatedNodes);
    setEdges(generatedEdges);
    setGraphGenerated(true);
    setInitialGraphGenerated(false);

    drawGraph(generatedNodes, generatedEdges);
  };

  const generateDataGraph = () => {
    // Create nodes from CSV data rows (limited to maxDataNodes)
    const dataToVisualize = csvData.slice(0, maxDataNodes);
    const generatedNodes: GraphNode[] = [];
    const generatedEdges: GraphEdge[] = [];

    // Create nodes for each data row
    dataToVisualize.forEach((row, index) => {
      const nodeId = `row-${index}`;
      const label =
        row.indicator_value ||
        row.value ||
        row.threat_type ||
        row.type ||
        `Row ${index + 1}`;

      generatedNodes.push({
        id: nodeId,
        label: label.length > 20 ? label.substring(0, 20) + "..." : label,
        type: row.threat_type || row.type || "data",
      });
    });

    // Create edges based on relationships
    relationships.forEach((rel) => {
      dataToVisualize.forEach((row, index) => {
        const sourceValue = row[rel.source];
        const targetValue = row[rel.target];

        if (sourceValue && targetValue) {
          // Find or create attribute nodes
          const sourceAttrId = `attr-${rel.source}`;
          const targetAttrId = `attr-${rel.target}`;

          if (!generatedNodes.find((n) => n.id === sourceAttrId)) {
            generatedNodes.push({
              id: sourceAttrId,
              label: rel.source,
              type: "attribute",
            });
          }

          if (!generatedNodes.find((n) => n.id === targetAttrId)) {
            generatedNodes.push({
              id: targetAttrId,
              label: rel.target,
              type: "attribute",
            });
          }

          // Connect data row to attributes
          generatedEdges.push({
            source: `row-${index}`,
            target: sourceAttrId,
            label: "has",
          });

          generatedEdges.push({
            source: sourceAttrId,
            target: targetAttrId,
            label: rel.type,
          });
        }
      });
    });

    // If no relationships defined, create simple connections between similar data
    if (relationships.length === 0 && allAttributes.length > 0) {
      const keyAttr =
        allAttributes.find(
          (a) =>
            a.toLowerCase().includes("type") ||
            a.toLowerCase().includes("category") ||
            a.toLowerCase().includes("severity")
        ) || allAttributes[0];

      // Group by attribute value
      const groups = new Map<string, number[]>();
      dataToVisualize.forEach((row, index) => {
        const value = row[keyAttr];
        if (value) {
          if (!groups.has(value)) {
            groups.set(value, []);
          }
          groups.get(value)!.push(index);
        }
      });

      // Create group nodes and connect data to them
      groups.forEach((indices, groupValue) => {
        const groupId = `group-${groupValue}`;
        generatedNodes.push({
          id: groupId,
          label: groupValue,
          type: "group",
        });

        indices.forEach((index) => {
          generatedEdges.push({
            source: `row-${index}`,
            target: groupId,
            label: keyAttr,
          });
        });
      });
    }

    setNodes(generatedNodes);
    setEdges(generatedEdges);
    setGraphGenerated(true);
    setInitialGraphGenerated(false);

    drawGraph(generatedNodes, generatedEdges);
  };

  // Initialize node positions
  const initializeNodePositions = (nodes: GraphNode[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return nodes;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 3;

    return nodes.map((node, i) => {
      if (node.x !== undefined && node.y !== undefined) return node;

      if (nodes.length <= 3) {
        return {
          ...node,
          x: (canvas.width / (nodes.length + 1)) * (i + 1),
          y: canvas.height / 2,
          vx: 0,
          vy: 0,
        };
      } else {
        const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
        return {
          ...node,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          vx: 0,
          vy: 0,
        };
      }
    });
  };

  // Enhanced PyVis-style force-directed layout simulation
  const applyForces = (nodes: GraphNode[], edges: GraphEdge[]) => {
    if (!physicsEnabled) return;

    const springLength = 150; // Ideal edge length
    const springStrength = 0.05; // Spring force multiplier
    const repulsionStrength = 8000; // Node repulsion
    const damping = 0.85; // Velocity damping
    const centerGravity = 0.01; // Pull towards center
    const maxVelocity = 10; // Limit max speed

    const canvas = canvasRef.current;
    if (!canvas) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    nodes.forEach((node) => {
      if (!node.x || !node.y) return;

      let fx = 0,
        fy = 0;

      // Repulsion between all nodes (Coulomb's law)
      nodes.forEach((other) => {
        if (node.id === other.id || !other.x || !other.y) return;
        const dx = node.x! - other.x;
        const dy = node.y! - other.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq) || 1;

        // Prevent division by zero and extreme forces
        if (dist < 1) return;

        const force = repulsionStrength / distSq;
        fx += (dx / dist) * force;
        fy += (dy / dist) * force;
      });

      // Spring attraction along edges (Hooke's law)
      edges.forEach((edge) => {
        const other = nodes.find(
          (n) =>
            (edge.source === node.id && n.id === edge.target) ||
            (edge.target === node.id && n.id === edge.source)
        );
        if (!other || !other.x || !other.y) return;

        const dx = other.x - node.x!;
        const dy = other.y - node.y!;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        // Spring force proportional to distance from ideal length
        const displacement = dist - springLength;
        const force = displacement * springStrength;

        fx += (dx / dist) * force;
        fy += (dy / dist) * force;
      });

      // Gravity towards center (keeps graph centered)
      const dcx = centerX / zoom - node.x!;
      const dcy = centerY / zoom - node.y!;
      fx += dcx * centerGravity;
      fy += dcy * centerGravity;

      // Update velocity with damping
      node.vx = ((node.vx || 0) + fx * 0.01) * damping;
      node.vy = ((node.vy || 0) + fy * 0.01) * damping;

      // Limit maximum velocity
      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (speed > maxVelocity) {
        node.vx = (node.vx / speed) * maxVelocity;
        node.vy = (node.vy / speed) * maxVelocity;
      }

      // Update position (unless being dragged)
      if (draggedNode !== node.id) {
        node.x! += node.vx;
        node.y! += node.vy;
      }
    });
  };

  const drawGraph = (nodes: GraphNode[], edges: GraphEdge[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (nodes.length === 0) {
      ctx.fillStyle = "#9ca3af";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("No nodes to display", canvas.width / 2, canvas.height / 2);
      return;
    }

    // Apply transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw edges with arrows
    edges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      if (sourceNode?.x && sourceNode?.y && targetNode?.x && targetNode?.y) {
        const isHighlighted =
          selectedNode === edge.source || selectedNode === edge.target;

        ctx.strokeStyle = isHighlighted ? "#4f46e5" : "#6366f1";
        ctx.lineWidth = isHighlighted ? 3 : 2;
        ctx.globalAlpha = isHighlighted ? 1 : 0.6;

        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.stroke();

        // Draw arrow
        const angle = Math.atan2(
          targetNode.y - sourceNode.y,
          targetNode.x - sourceNode.x
        );
        const arrowSize = 10;
        ctx.beginPath();
        ctx.moveTo(targetNode.x, targetNode.y);
        ctx.lineTo(
          targetNode.x - arrowSize * Math.cos(angle - Math.PI / 6),
          targetNode.y - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(targetNode.x, targetNode.y);
        ctx.lineTo(
          targetNode.x - arrowSize * Math.cos(angle + Math.PI / 6),
          targetNode.y - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();

        // Draw label with background
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#ffffff";
        ctx.font = "11px sans-serif";
        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2;
        const textWidth = ctx.measureText(edge.label).width;
        ctx.fillRect(midX - textWidth / 2 - 3, midY - 8, textWidth + 6, 16);
        ctx.fillStyle = isHighlighted ? "#4f46e5" : "#6366f1";
        ctx.textAlign = "center";
        ctx.fillText(edge.label, midX, midY + 4);
      }
    });

    // Draw nodes with colors based on type
    nodes.forEach((node) => {
      if (!node.x || !node.y) return;

      const isSource = edges.some((e) => e.source === node.id);
      const isTarget = edges.some((e) => e.target === node.id);
      const isSelected = selectedNode === node.id;
      const isHovered = hoveredNode === node.id;

      // Color based on node type
      let fillColor = "#10b981"; // Green - default

      if (visualizationMode === "data") {
        if (node.type === "attribute")
          fillColor = "#8b5cf6"; // Purple - attributes
        else if (node.type === "group")
          fillColor = "#f59e0b"; // Orange - groups
        else if (node.id.startsWith("row-"))
          fillColor = "#3b82f6"; // Blue - data rows
        else fillColor = "#10b981"; // Green - other
      } else {
        if (isSource && isTarget) fillColor = "#f59e0b"; // Orange
        else if (isSource) fillColor = "#8b5cf6"; // Purple
        else fillColor = "#10b981"; // Green
      }

      const nodeRadius = isSelected || isHovered ? 32 : 28;

      ctx.globalAlpha = 1;
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = isSelected ? "#1e40af" : "#ffffff";
      ctx.lineWidth = isSelected ? 4 : 3;
      ctx.stroke();

      // Hover/selection glow
      if (isHovered || isSelected) {
        ctx.strokeStyle = fillColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius + 6, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "#1f2937";
      ctx.font = isSelected ? "bold 13px sans-serif" : "bold 12px sans-serif";
      ctx.textAlign = "center";
      const label =
        node.label.length > 12
          ? node.label.substring(0, 12) + "..."
          : node.label;
      ctx.fillText(label, node.x, node.y + (nodeRadius + 17));
    });

    ctx.restore();
  };

  // Mouse event handlers
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
    };
  };

  const findNodeAtPosition = (x: number, y: number) => {
    return nodes.find((node) => {
      if (!node.x || !node.y) return false;
      const dx = node.x - x;
      const dy = node.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < 32;
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const node = findNodeAtPosition(pos.x, pos.y);

    if (node) {
      setIsDragging(true);
      setDraggedNode(node.id);
      setSelectedNode(node.id);
    } else if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedNode(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);

    if (isDragging && draggedNode) {
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === draggedNode
            ? { ...node, x: pos.x, y: pos.y, vx: 0, vy: 0 }
            : node
        )
      );
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else {
      const node = findNodeAtPosition(pos.x, pos.y);
      setHoveredNode(node?.id || null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.1, Math.min(3, prev * delta)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  // STIX Graph handlers (duplicate of main graph handlers but for STIX canvas)
  const getMousePosStix = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasStixRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - panStix.x) / zoomStix,
      y: (e.clientY - rect.top - panStix.y) / zoomStix,
    };
  };

  const findStixNodeAtPosition = (x: number, y: number) => {
    return stixNodes.find((node) => {
      if (!node.x || !node.y) return false;
      const dx = node.x - x;
      const dy = node.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < 32;
    });
  };

  const handleMouseDownStix = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePosStix(e);
    const node = findStixNodeAtPosition(pos.x, pos.y);

    if (node) {
      setIsDraggingStix(true);
      setDraggedStixNode(node.id);
      setSelectedStixNode(node.id);
    } else if (e.button === 0) {
      setIsPanningStix(true);
      setPanStartStix({ x: e.clientX - panStix.x, y: e.clientY - panStix.y });
      setSelectedStixNode(null);
    }
  };

  const handleMouseMoveStix = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePosStix(e);

    if (isDraggingStix && draggedStixNode) {
      setStixNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === draggedStixNode
            ? { ...node, x: pos.x, y: pos.y, vx: 0, vy: 0 }
            : node
        )
      );
    } else if (isPanningStix) {
      setPanStix({
        x: e.clientX - panStartStix.x,
        y: e.clientY - panStartStix.y,
      });
    } else {
      const node = findStixNodeAtPosition(pos.x, pos.y);
      setHoveredStixNode(node?.id || null);
    }
  };

  const handleMouseUpStix = () => {
    setIsDraggingStix(false);
    setDraggedStixNode(null);
    setIsPanningStix(false);
  };

  const handleWheelStix = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoomStix((prev) => Math.max(0.1, Math.min(3, prev * delta)));
  };

  const resetViewStix = () => {
    setZoomStix(1);
    setPanStix({ x: 0, y: 0 });
    setSelectedStixNode(null);
  };

  const drawStixGraph = (nodes: GraphNode[], edges: GraphEdge[]) => {
    const canvas = canvasStixRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (nodes.length === 0) {
      ctx.fillStyle = "#9ca3af";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        "No STIX objects to display",
        canvas.width / 2,
        canvas.height / 2
      );
      return;
    }

    ctx.save();
    ctx.translate(panStix.x, panStix.y);
    ctx.scale(zoomStix, zoomStix);

    // Draw edges
    edges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      if (sourceNode?.x && sourceNode?.y && targetNode?.x && targetNode?.y) {
        const isHighlighted =
          selectedStixNode === edge.source || selectedStixNode === edge.target;

        ctx.strokeStyle = isHighlighted ? "#dc2626" : "#ef4444";
        ctx.lineWidth = isHighlighted ? 3 : 2;
        ctx.globalAlpha = isHighlighted ? 1 : 0.6;

        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.stroke();

        const angle = Math.atan2(
          targetNode.y - sourceNode.y,
          targetNode.x - sourceNode.x
        );
        const arrowSize = 10;
        ctx.beginPath();
        ctx.moveTo(targetNode.x, targetNode.y);
        ctx.lineTo(
          targetNode.x - arrowSize * Math.cos(angle - Math.PI / 6),
          targetNode.y - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(targetNode.x, targetNode.y);
        ctx.lineTo(
          targetNode.x - arrowSize * Math.cos(angle + Math.PI / 6),
          targetNode.y - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();

        ctx.globalAlpha = 1;
        ctx.fillStyle = "#ffffff";
        ctx.font = "11px sans-serif";
        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2;
        const textWidth = ctx.measureText(edge.label).width;
        ctx.fillRect(midX - textWidth / 2 - 3, midY - 8, textWidth + 6, 16);
        ctx.fillStyle = isHighlighted ? "#dc2626" : "#ef4444";
        ctx.textAlign = "center";
        ctx.fillText(edge.label, midX, midY + 4);
      }
    });

    // Draw nodes with STIX-specific colors
    nodes.forEach((node) => {
      if (!node.x || !node.y) return;

      const isSelected = selectedStixNode === node.id;
      const isHovered = hoveredStixNode === node.id;

      // Color by STIX type
      let fillColor = "#3b82f6"; // Blue for indicators
      if (node.type === "relationship") fillColor = "#ef4444"; // Red
      else if (node.type === "threat-actor") fillColor = "#dc2626"; // Dark red
      else if (node.type === "malware") fillColor = "#f59e0b"; // Orange
      else if (node.type === "attack-pattern") fillColor = "#8b5cf6"; // Purple

      const nodeRadius = isSelected || isHovered ? 32 : 28;

      ctx.globalAlpha = 1;
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = isSelected ? "#1e40af" : "#ffffff";
      ctx.lineWidth = isSelected ? 4 : 3;
      ctx.stroke();

      if (isHovered || isSelected) {
        ctx.strokeStyle = fillColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius + 6, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "#1f2937";
      ctx.font = isSelected ? "bold 13px sans-serif" : "bold 12px sans-serif";
      ctx.textAlign = "center";
      const label =
        node.label.length > 15
          ? node.label.substring(0, 15) + "..."
          : node.label;
      ctx.fillText(label, node.x, node.y + (nodeRadius + 17));
    });

    ctx.restore();
  };

  const applyForcesStix = (nodes: GraphNode[], edges: GraphEdge[]) => {
    if (!physicsEnabledStix) return;

    const springLength = 150;
    const springStrength = 0.05;
    const repulsionStrength = 8000;
    const damping = 0.85;
    const centerGravity = 0.01;
    const maxVelocity = 10;

    const canvas = canvasStixRef.current;
    if (!canvas) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    nodes.forEach((node) => {
      if (!node.x || !node.y) return;

      let fx = 0,
        fy = 0;

      nodes.forEach((other) => {
        if (node.id === other.id || !other.x || !other.y) return;
        const dx = node.x! - other.x;
        const dy = node.y! - other.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq) || 1;
        if (dist < 1) return;
        const force = repulsionStrength / distSq;
        fx += (dx / dist) * force;
        fy += (dy / dist) * force;
      });

      edges.forEach((edge) => {
        const other = nodes.find(
          (n) =>
            (edge.source === node.id && n.id === edge.target) ||
            (edge.target === node.id && n.id === edge.source)
        );
        if (!other || !other.x || !other.y) return;

        const dx = other.x - node.x!;
        const dy = other.y - node.y!;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const displacement = dist - springLength;
        const force = displacement * springStrength;
        fx += (dx / dist) * force;
        fy += (dy / dist) * force;
      });

      const dcx = centerX / zoomStix - node.x!;
      const dcy = centerY / zoomStix - node.y!;
      fx += dcx * centerGravity;
      fy += dcy * centerGravity;

      node.vx = ((node.vx || 0) + fx * 0.01) * damping;
      node.vy = ((node.vy || 0) + fy * 0.01) * damping;

      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (speed > maxVelocity) {
        node.vx = (node.vx / speed) * maxVelocity;
        node.vy = (node.vy / speed) * maxVelocity;
      }

      if (draggedStixNode !== node.id) {
        node.x! += node.vx;
        node.y! += node.vy;
      }
    });
  };

  const handleConvertToSTIX = () => {
    setShowConversionDialog(true);
  };

  // STIX Graph functions
  const generateStixGraph = (stixBundle: any) => {
    const stixGraphNodes: GraphNode[] = [];
    const stixGraphEdges: GraphEdge[] = [];

    // Create nodes for each STIX object
    stixBundle.objects.forEach((obj: any) => {
      stixGraphNodes.push({
        id: obj.id,
        label: obj.name || obj.type || obj.id.split("--")[0],
        type: obj.type,
      });
    });

    // Create edges from relationship objects
    stixBundle.objects
      .filter((obj: any) => obj.type === "relationship")
      .forEach((rel: any) => {
        stixGraphEdges.push({
          source: rel.source_ref,
          target: rel.target_ref,
          label: rel.relationship_type,
        });
      });

    setStixNodes(stixGraphNodes);
    setStixEdges(stixGraphEdges);
    setStixGraphGenerated(true);
  };

  const confirmConversion = async () => {
    setIsConverting(true);

    // Simulate conversion process with progress
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const stixObjects = csvData.map((row, index) => {
      const indicator: any = {
        type: "indicator",
        id: `indicator--${Date.now()}-${index}`,
        spec_version: "2.1",
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        pattern_type: "stix",
        valid_from: new Date().toISOString(),
      };

      allAttributes.forEach((attr) => {
        if (row[attr]) {
          indicator[attr] = row[attr];
        }
      });

      if (row.indicator_value || row.value || row.indicator) {
        const value = row.indicator_value || row.value || row.indicator;
        indicator.pattern = `[network-traffic:src_ref.value = '${value}']`;
        indicator.name = `Indicator: ${value}`;
      } else {
        indicator.pattern = `[x-custom:value = 'data']`;
        indicator.name = `Indicator ${index + 1}`;
      }

      return indicator;
    });

    // Add relationship objects based on the knowledge graph
    const relationshipObjects = relationships.map((rel, index) => ({
      type: "relationship",
      id: `relationship--${Date.now()}-${index}`,
      spec_version: "2.1",
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      relationship_type: rel.type,
      source_ref: `x-custom-attribute--${rel.source}`,
      target_ref: `x-custom-attribute--${rel.target}`,
      description: `${rel.source} ${rel.type} ${rel.target}`,
    }));

    const stixBundle = {
      type: "bundle",
      id: `bundle--${Date.now()}`,
      spec_version: "2.1",
      objects: [...stixObjects, ...relationshipObjects],
      metadata: {
        knowledge_graph: {
          nodes: nodes.length,
          edges: edges.length,
          relationships: relationships.length,
        },
        generated_at: new Date().toISOString(),
        source_rows: csvData.length,
      },
    };

    // Download the STIX bundle
    const blob = new Blob([JSON.stringify(stixBundle, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `threat-intel-stix-2.1-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    // Send to backend API
    try {
      const response = await fetch("http://localhost:3001/api/stix/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stixBundle,
          knowledgeGraph: {
            nodes,
            edges,
            relationships,
          },
          sourceData: {
            fileName: "knowledge-graph-export",
            rowCount: csvData.length,
            attributes: allAttributes,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("STIX bundle saved to backend:", result);
      }
    } catch (error) {
      console.error("Error sending to backend:", error);
    }

    setIsConverting(false);
    setConversionComplete(true);

    // Generate STIX knowledge graph
    generateStixGraph(stixBundle);

    setTimeout(() => {
      setShowConversionDialog(false);
      setConversionComplete(false);
    }, 2000);
  };

  useEffect(() => {
    if (graphGenerated && nodes.length > 0) {
      // Initialize positions if needed
      const initializedNodes = initializeNodePositions(nodes);
      if (initializedNodes !== nodes) {
        setNodes(initializedNodes);
        return;
      }

      // Continuous animation loop (PyVis style)
      const animate = () => {
        if (physicsEnabled) {
          applyForces(nodes, edges);
        }
        drawGraph(nodes, edges);
        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animate();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [
    graphGenerated,
    nodes.length,
    edges.length,
    zoom,
    pan,
    selectedNode,
    hoveredNode,
    physicsEnabled,
  ]);

  // Redraw when nodes move
  useEffect(() => {
    if (graphGenerated && !physicsEnabled) {
      drawGraph(nodes, edges);
    }
  }, [nodes, edges, graphGenerated, physicsEnabled]);

  // STIX Graph animation loop
  useEffect(() => {
    if (stixGraphGenerated && stixNodes.length > 0) {
      const initializedNodes = initializeNodePositions(stixNodes);
      if (initializedNodes !== stixNodes) {
        setStixNodes(initializedNodes);
        return;
      }

      const animate = () => {
        if (physicsEnabledStix) {
          applyForcesStix(stixNodes, stixEdges);
        }
        drawStixGraph(stixNodes, stixEdges);
        animationFrameStixRef.current = requestAnimationFrame(animate);
      };

      animate();

      return () => {
        if (animationFrameStixRef.current) {
          cancelAnimationFrame(animationFrameStixRef.current);
        }
      };
    }
  }, [
    stixGraphGenerated,
    stixNodes.length,
    stixEdges.length,
    zoomStix,
    panStix,
    selectedStixNode,
    hoveredStixNode,
    physicsEnabledStix,
  ]);

  useEffect(() => {
    if (stixGraphGenerated && !physicsEnabledStix) {
      drawStixGraph(stixNodes, stixEdges);
    }
  }, [stixNodes, stixEdges, stixGraphGenerated, physicsEnabledStix]);

  // Don't auto-generate - let user build their own graph
  useEffect(() => {
    if (csvData.length > 0) {
      // Just set the available attributes, don't generate relationships
      const attributes = Object.keys(csvData[0] || {});
      setAllAttributes(attributes);
    }
  }, [csvData]);

  if (csvData.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Knowledge Graph</h2>
        <div style={cardStyle} className="p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-lg bg-blue-50 flex items-center justify-center mb-6">
              <Network className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Data Available
            </h3>
            <p className="text-sm text-gray-600 mb-6 text-center max-w-md">
              Please upload a CSV file from the Feed Management page first.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Knowledge Graph</h2>
          <p className="text-sm text-gray-600 mt-1">
            Working with {csvData.length} rows and {allAttributes.length} total
            attributes
          </p>
          {graphGenerated && relationships.length > 0 && (
            <p className="text-xs text-green-600 mt-1">
              ✓ Graph generated with {relationships.length} relationships
            </p>
          )}
        </div>
        {graphGenerated && relationships.length > 0 && (
          <button
            onClick={handleConvertToSTIX}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
            style={{ transition: "all 150ms ease" }}
          >
            <Download className="w-4 h-4" />
            Convert to STIX 2.1 ({csvData.length} indicators)
          </button>
        )}
      </div>

      <div style={cardStyle} className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Define Relationships
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Visualization Mode:</span>
            <button
              onClick={() => setVisualizationMode("schema")}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                visualizationMode === "schema"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Schema View
            </button>
            <button
              onClick={() => setVisualizationMode("data")}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                visualizationMode === "data"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Data View
            </button>
          </div>
        </div>

        {visualizationMode === "data" && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Data Visualization Mode
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Showing {Math.min(maxDataNodes, csvData.length)} of{" "}
                  {csvData.length} data rows as interactive nodes
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-blue-900">Max nodes:</label>
                <select
                  value={maxDataNodes}
                  onChange={(e) => setMaxDataNodes(Number(e.target.value))}
                  className="px-2 py-1 text-xs border border-blue-300 rounded bg-white"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <select
            value={newRelationship.source}
            onChange={(e) =>
              setNewRelationship({ ...newRelationship, source: e.target.value })
            }
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Source Attribute</option>
            {allAttributes.map((attr) => (
              <option key={attr} value={attr}>
                {attr}
              </option>
            ))}
          </select>

          <select
            value={newRelationship.type}
            onChange={(e) =>
              setNewRelationship({ ...newRelationship, type: e.target.value })
            }
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Relationship Type</option>
            {relationshipTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            value={newRelationship.target}
            onChange={(e) =>
              setNewRelationship({ ...newRelationship, target: e.target.value })
            }
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Target Attribute</option>
            {allAttributes.map((attr) => (
              <option key={attr} value={attr}>
                {attr}
              </option>
            ))}
          </select>

          <button
            onClick={addRelationship}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
            style={{ transition: "all 150ms ease" }}
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        <div className="space-y-2">
          {relationships.map((rel) => (
            <div
              key={rel.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3 text-sm">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {rel.source}
                </span>
                <span className="text-gray-600">→ {rel.type} →</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                  {rel.target}
                </span>
              </div>
              <button
                onClick={() => removeRelationship(rel.id)}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={generateGraph}
            disabled={
              visualizationMode === "schema" && relationships.length === 0
            }
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg ${
              visualizationMode === "data" || relationships.length > 0
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            style={{ transition: "all 150ms ease" }}
          >
            <Network className="w-5 h-5" />
            {visualizationMode === "data"
              ? "Generate Data Graph"
              : "Generate Schema Graph"}
          </button>
          {relationships.length > 0 && (
            <button
              onClick={() => {
                setRelationships([]);
                setNodes([]);
                setEdges([]);
                setGraphGenerated(false);
              }}
              className="px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              style={{ transition: "all 150ms ease" }}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {graphGenerated &&
        (visualizationMode === "data" || relationships.length > 0) && (
          <>
            <div style={cardStyle} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Interactive Knowledge Graph{" "}
                  {visualizationMode === "data" && "- Data View"}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPhysicsEnabled(!physicsEnabled)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                      physicsEnabled
                        ? "bg-green-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Move className="w-3 h-3 inline mr-1" />
                    {physicsEnabled ? "Physics ON" : "Physics OFF"}
                  </button>
                  <button
                    onClick={() => setZoom((prev) => Math.min(3, prev * 1.2))}
                    className="p-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoom((prev) => Math.max(0.1, prev * 0.8))}
                    className="p-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={resetView}
                    className="p-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    title="Reset View"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative">
                <canvas
                  ref={canvasRef}
                  className="w-full h-96 bg-gray-50 rounded-lg cursor-move"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                />

                {selectedNode && (
                  <div className="absolute top-4 right-4 bg-white border border-gray-200 rounded-lg p-3 shadow-lg max-w-xs max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm text-gray-900">
                        Node Details
                      </h4>
                      <button
                        onClick={() => setSelectedNode(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </div>
                    <div className="space-y-1 text-xs">
                      <p>
                        <span className="text-gray-600">ID:</span>{" "}
                        <span className="font-mono text-xs">
                          {selectedNode}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-600">Type:</span>{" "}
                        {nodes.find((n) => n.id === selectedNode)?.type}
                      </p>
                      <p>
                        <span className="text-gray-600">Connections:</span>{" "}
                        {
                          edges.filter(
                            (e) =>
                              e.source === selectedNode ||
                              e.target === selectedNode
                          ).length
                        }
                      </p>

                      {/* Show CSV data if it's a data row node */}
                      {visualizationMode === "data" &&
                        selectedNode.startsWith("row-") && (
                          <div className="pt-2 border-t border-gray-200 mt-2">
                            <p className="text-gray-600 mb-2 font-semibold">
                              CSV Data:
                            </p>
                            <div className="space-y-1 bg-gray-50 p-2 rounded max-h-48 overflow-y-auto">
                              {(() => {
                                const rowIndex = parseInt(
                                  selectedNode.replace("row-", "")
                                );
                                const rowData = csvData[rowIndex];
                                if (!rowData)
                                  return (
                                    <p className="text-gray-500">No data</p>
                                  );

                                return Object.entries(rowData).map(
                                  ([key, value]) => (
                                    <div key={key} className="flex gap-2">
                                      <span className="text-gray-600 font-medium min-w-20">
                                        {key}:
                                      </span>
                                      <span className="text-gray-900 break-all">
                                        {String(value)}
                                      </span>
                                    </div>
                                  )
                                );
                              })()}
                            </div>
                          </div>
                        )}

                      <div className="pt-2 border-t border-gray-200 mt-2">
                        <p className="text-gray-600 mb-1">Related:</p>
                        {edges
                          .filter(
                            (e) =>
                              e.source === selectedNode ||
                              e.target === selectedNode
                          )
                          .map((e, i) => (
                            <div
                              key={i}
                              className="text-xs bg-blue-50 px-2 py-1 rounded mb-1"
                            >
                              {e.source === selectedNode
                                ? `→ ${e.target}`
                                : `← ${e.source}`}
                              <span className="text-blue-600 ml-1">
                                ({e.label})
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded px-3 py-2 text-xs text-gray-600 shadow-md">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      Zoom: {(zoom * 100).toFixed(0)}%
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        physicsEnabled
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {physicsEnabled ? "● Physics Active" : "○ Physics Paused"}
                    </span>
                  </div>
                  <div className="mt-1 text-gray-500">
                    Drag nodes • Scroll to zoom • Click & drag to pan
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-4 text-xs flex-wrap">
                {visualizationMode === "schema" ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-purple-600"></div>
                      <span className="text-gray-600">Source Node</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-600"></div>
                      <span className="text-gray-600">Target Node</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-orange-600"></div>
                      <span className="text-gray-600">Both</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                      <span className="text-gray-600">Data Row</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-purple-600"></div>
                      <span className="text-gray-600">Attribute</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-orange-600"></div>
                      <span className="text-gray-600">Group</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-600"></div>
                      <span className="text-gray-600">Other</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div style={cardStyle} className="p-4">
                <p className="text-xs text-gray-600 mb-1">Total Nodes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {nodes.length}
                </p>
              </div>
              <div style={cardStyle} className="p-4">
                <p className="text-xs text-gray-600 mb-1">Total Edges</p>
                <p className="text-2xl font-bold text-gray-900">
                  {edges.length}
                </p>
              </div>
              <div style={cardStyle} className="p-4">
                <p className="text-xs text-gray-600 mb-1">Relationships</p>
                <p className="text-2xl font-bold text-gray-900">
                  {relationships.length}
                </p>
              </div>
              <div style={cardStyle} className="p-4">
                <p className="text-xs text-gray-600 mb-1">Data Rows</p>
                <p className="text-2xl font-bold text-gray-900">
                  {csvData.length}
                </p>
              </div>
            </div>

            <div style={cardStyle} className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Source Data Preview (First 10 Rows)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {allAttributes.map((attr) => (
                        <th
                          key={attr}
                          className="px-4 py-2 text-left text-xs font-semibold text-gray-600"
                        >
                          {attr}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 10).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-gray-100">
                        {allAttributes.map((attr) => (
                          <td key={attr} className="px-4 py-2 text-gray-900">
                            {row[attr]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                All {csvData.length} rows will be included in the STIX 2.1
                export
              </p>
            </div>
          </>
        )}

      {/* Conversion Dialog */}
      {showConversionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div style={cardStyle} className="max-w-2xl w-full mx-4 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {conversionComplete
                ? "✓ Conversion Complete!"
                : "Convert to STIX 2.1"}
            </h3>

            {!conversionComplete ? (
              <>
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-4">
                    You're about to convert your knowledge graph to STIX 2.1
                    format. This will include:
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                        {csvData.length}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Threat Indicators
                        </p>
                        <p className="text-xs text-gray-600">
                          From your CSV data
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                        {relationships.length}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Relationship Objects
                        </p>
                        <p className="text-xs text-gray-600">
                          Based on your knowledge graph
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                        {nodes.length}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Graph Nodes
                        </p>
                        <p className="text-xs text-gray-600">
                          Attributes and entities
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Preview: Knowledge Graph Structure
                    </h4>
                    <canvas
                      ref={canvasRef}
                      className="w-full h-48 bg-white rounded"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConversionDialog(false)}
                    disabled={isConverting}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmConversion}
                    disabled={isConverting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {isConverting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Confirm & Convert
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Your STIX 2.1 bundle has been generated and downloaded!
                </p>
                <p className="text-xs text-gray-500">
                  The file includes {csvData.length} indicators and{" "}
                  {relationships.length} relationships
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STIX 2.1 Knowledge Graph Visualization */}
      {stixGraphGenerated && stixNodes.length > 0 && (
        <>
          <div style={cardStyle} className="p-6 border-4 border-green-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  STIX 2.1 Knowledge Graph (After Conversion)
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Interactive visualization of {stixNodes.length} STIX objects
                  and {stixEdges.length} relationships
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPhysicsEnabledStix(!physicsEnabledStix)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                    physicsEnabledStix
                      ? "bg-green-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Move className="w-3 h-3 inline mr-1" />
                  {physicsEnabledStix ? "Physics ON" : "Physics OFF"}
                </button>
                <button
                  onClick={() => setZoomStix((prev) => Math.min(3, prev * 1.2))}
                  className="p-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setZoomStix((prev) => Math.max(0.1, prev * 0.8))
                  }
                  className="p-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={resetViewStix}
                  className="p-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  title="Reset View"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative">
              <canvas
                ref={canvasStixRef}
                className="w-full h-96 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg cursor-move border-2 border-green-200"
                onMouseDown={handleMouseDownStix}
                onMouseMove={handleMouseMoveStix}
                onMouseUp={handleMouseUpStix}
                onMouseLeave={handleMouseUpStix}
                onWheel={handleWheelStix}
              />

              {selectedStixNode && (
                <div className="absolute top-4 right-4 bg-white border-2 border-green-500 rounded-lg p-3 shadow-xl max-w-xs">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm text-gray-900 flex items-center gap-1">
                      <Network className="w-4 h-4 text-green-600" />
                      STIX Object Details
                    </h4>
                    <button
                      onClick={() => setSelectedStixNode(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p>
                      <span className="text-gray-600">ID:</span>{" "}
                      <span className="font-mono text-xs">
                        {selectedStixNode.substring(0, 30)}...
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-600">Type:</span>{" "}
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {stixNodes.find((n) => n.id === selectedStixNode)?.type}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-600">Label:</span>{" "}
                      {stixNodes.find((n) => n.id === selectedStixNode)?.label}
                    </p>
                    <p>
                      <span className="text-gray-600">Connections:</span>{" "}
                      {
                        stixEdges.filter(
                          (e) =>
                            e.source === selectedStixNode ||
                            e.target === selectedStixNode
                        ).length
                      }
                    </p>
                    <div className="pt-2 border-t border-gray-200 mt-2">
                      <p className="text-gray-600 mb-1 font-semibold">
                        Related Objects:
                      </p>
                      {stixEdges
                        .filter(
                          (e) =>
                            e.source === selectedStixNode ||
                            e.target === selectedStixNode
                        )
                        .slice(0, 5)
                        .map((e, i) => (
                          <div
                            key={i}
                            className="text-xs bg-green-50 px-2 py-1 rounded mb-1 border border-green-200"
                          >
                            {e.source === selectedStixNode
                              ? `→ ${
                                  stixNodes.find((n) => n.id === e.target)
                                    ?.label || "Unknown"
                                }`
                              : `← ${
                                  stixNodes.find((n) => n.id === e.source)
                                    ?.label || "Unknown"
                                }`}
                            <span className="text-green-700 ml-1 font-semibold">
                              ({e.label})
                            </span>
                          </div>
                        ))}
                      {stixEdges.filter(
                        (e) =>
                          e.source === selectedStixNode ||
                          e.target === selectedStixNode
                      ).length > 5 && (
                        <p className="text-xs text-gray-500 mt-1">
                          +
                          {stixEdges.filter(
                            (e) =>
                              e.source === selectedStixNode ||
                              e.target === selectedStixNode
                          ).length - 5}{" "}
                          more...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div
                className="absolute botto
m-4 left-4 bg-white bg-opacity-90 rounded px-3 py-2 text-xs text-gray-600 shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold">
                    Zoom: {(zoom * 100).toFixed(0)}%
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded ${
                      physicsEnabled
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {physicsEnabled ? "● Physics Active" : "○ Physics Paused"}
                  </span>
                </div>
                <div className="mt-1 text-gray-500">
                  Drag nodes • Scroll to zoom • Click & drag to pan
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-4 text-xs flex-wrap">
              {visualizationMode === "schema" ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-purple-600"></div>
                    <span className="text-gray-600">Source Node</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-600"></div>
                    <span className="text-gray-600">Target Node</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-orange-600"></div>
                    <span className="text-gray-600">Both</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                    <span className="text-gray-600">Data Row</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-purple-600"></div>
                    <span className="text-gray-600">Attribute</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-orange-600"></div>
                    <span className="text-gray-600">Group</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-600"></div>
                    <span className="text-gray-600">Other</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div style={cardStyle} className="p-4">
              <p className="text-xs text-gray-600 mb-1">Total Nodes</p>
              <p className="text-2xl font-bold text-gray-900">{nodes.length}</p>
            </div>
            <div style={cardStyle} className="p-4">
              <p className="text-xs text-gray-600 mb-1">Total Edges</p>
              <p className="text-2xl font-bold text-gray-900">{edges.length}</p>
            </div>
            <div style={cardStyle} className="p-4">
              <p className="text-xs text-gray-600 mb-1">Relationships</p>
              <p className="text-2xl font-bold text-gray-900">
                {relationships.length}
              </p>
            </div>
            <div style={cardStyle} className="p-4">
              <p className="text-xs text-gray-600 mb-1">Data Rows</p>
              <p className="text-2xl font-bold text-gray-900">
                {csvData.length}
              </p>
            </div>
          </div>

          <div style={cardStyle} className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Source Data Preview (First 10 Rows)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {allAttributes.map((attr) => (
                      <th
                        key={attr}
                        className="px-4 py-2 text-left text-xs font-semibold text-gray-600"
                      >
                        {attr}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 10).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-gray-100">
                      {allAttributes.map((attr) => (
                        <td key={attr} className="px-4 py-2 text-gray-900">
                          {row[attr]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-600 mt-3">
              All {csvData.length} rows will be included in the STIX 2.1 export
            </p>
          </div>
        </>
      )}

      {/* Conversion Dialog */}
      {showConversionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div style={cardStyle} className="max-w-2xl w-full mx-4 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {conversionComplete
                ? "✓ Conversion Complete!"
                : "Convert to STIX 2.1"}
            </h3>

            {!conversionComplete ? (
              <>
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-4">
                    You're about to convert your knowledge graph to STIX 2.1
                    format. This will include:
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                        {csvData.length}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Threat Indicators
                        </p>
                        <p className="text-xs text-gray-600">
                          From your CSV data
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                        {relationships.length}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Relationship Objects
                        </p>
                        <p className="text-xs text-gray-600">
                          Based on your knowledge graph
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                        {nodes.length}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Graph Nodes
                        </p>
                        <p className="text-xs text-gray-600">
                          Attributes and entities
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Preview: Knowledge Graph Structure
                    </h4>
                    <canvas
                      ref={canvasRef}
                      className="w-full h-48 bg-white rounded"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConversionDialog(false)}
                    disabled={isConverting}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmConversion}
                    disabled={isConverting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {isConverting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Confirm & Convert
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Your STIX 2.1 bundle has been generated and downloaded!
                </p>
                <p className="text-xs text-gray-500">
                  The file includes {csvData.length} indicators and{" "}
                  {relationships.length} relationships
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
