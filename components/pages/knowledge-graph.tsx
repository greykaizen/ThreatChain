"use client"

import { useState, useEffect, useRef } from "react"
import { Download, Plus, Trash2, Network, ArrowLeft } from "lucide-react"

interface Relationship {
  id: string
  source: string
  target: string
  type: string
}

interface GraphNode {
  id: string
  label: string
  type: string
}

interface GraphEdge {
  source: string
  target: string
  label: string
}

interface KnowledgeGraphProps {
  selectedAttributes?: string[]
  csvData?: any[]
}

const cardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "0.75rem",
}

export default function KnowledgeGraph({ selectedAttributes = [], csvData = [] }: KnowledgeGraphProps) {
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [newRelationship, setNewRelationship] = useState({
    source: "",
    target: "",
    type: "",
  })
  const [graphGenerated, setGraphGenerated] = useState(false)
  const [initialGraphGenerated, setInitialGraphGenerated] = useState(false)
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [allAttributes, setAllAttributes] = useState<string[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const relationshipTypes = [
    "indicates",
    "related_to",
    "has_severity",
    "observed_in",
    "attributed_to",
    "targets",
  ]

  // Generate initial graph automatically when data is available
  const generateInitialGraph = () => {
    if (csvData.length === 0) return

    // Get all attributes from CSV data
    const attributes = Object.keys(csvData[0] || {})
    setAllAttributes(attributes)

    // Create automatic relationships based on common CTI patterns
    const autoRelationships: Relationship[] = []
    
    // Common threat intelligence relationships
    if (attributes.includes('indicator_type') && attributes.includes('indicator_value')) {
      autoRelationships.push({
        id: 'auto-1',
        source: 'indicator_type',
        target: 'indicator_value',
        type: 'indicates'
      })
    }
    
    if (attributes.includes('threat_type') && attributes.includes('indicator_value')) {
      autoRelationships.push({
        id: 'auto-2',
        source: 'threat_type',
        target: 'indicator_value',
        type: 'related_to'
      })
    }
    
    if (attributes.includes('severity') && attributes.includes('threat_type')) {
      autoRelationships.push({
        id: 'auto-3',
        source: 'threat_type',
        target: 'severity',
        type: 'has_severity'
      })
    }
    
    if (attributes.includes('source') && attributes.includes('indicator_value')) {
      autoRelationships.push({
        id: 'auto-4',
        source: 'source',
        target: 'indicator_value',
        type: 'observed_in'
      })
    }

    // If no automatic relationships found, create basic connections between first few attributes
    if (autoRelationships.length === 0 && attributes.length >= 2) {
      for (let i = 0; i < Math.min(attributes.length - 1, 3); i++) {
        autoRelationships.push({
          id: `auto-basic-${i}`,
          source: attributes[i],
          target: attributes[i + 1],
          type: 'related_to'
        })
      }
    }

    setRelationships(autoRelationships)

    // Generate nodes and edges for initial graph
    const nodeSet = new Set<string>()
    autoRelationships.forEach((rel) => {
      nodeSet.add(rel.source)
      nodeSet.add(rel.target)
    })

    const initialNodes: GraphNode[] = Array.from(nodeSet).map((attr) => ({
      id: attr,
      label: attr,
      type: "attribute",
    }))

    const initialEdges: GraphEdge[] = autoRelationships.map((rel) => ({
      source: rel.source,
      target: rel.target,
      label: rel.type,
    }))

    setNodes(initialNodes)
    setEdges(initialEdges)
    setInitialGraphGenerated(true)
    
    // Draw the initial graph
    setTimeout(() => drawGraph(initialNodes, initialEdges), 100)
  }

  const addRelationship = () => {
    if (newRelationship.source && newRelationship.target && newRelationship.type) {
      setRelationships([
        ...relationships,
        { ...newRelationship, id: Date.now().toString() },
      ])
      setNewRelationship({ source: "", target: "", type: "" })
    }
  }

  const removeRelationship = (id: string) => {
    setRelationships(relationships.filter((r) => r.id !== id))
  }

  const generateGraph = () => {
    const nodeSet = new Set<string>()
    relationships.forEach((rel) => {
      nodeSet.add(rel.source)
      nodeSet.add(rel.target)
    })

    const generatedNodes: GraphNode[] = Array.from(nodeSet).map((attr) => ({
      id: attr,
      label: attr,
      type: "attribute",
    }))

    const generatedEdges: GraphEdge[] = relationships.map((rel) => ({
      source: rel.source,
      target: rel.target,
      label: rel.type,
    }))

    setNodes(generatedNodes)
    setEdges(generatedEdges)
    setGraphGenerated(true)
    drawGraph(generatedNodes, generatedEdges)
  }

  const drawGraph = (nodes: GraphNode[], edges: GraphEdge[]) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(canvas.width, canvas.height) / 3

    const nodePositions = new Map<string, { x: number; y: number }>()
    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      nodePositions.set(node.id, { x, y })
    })

    ctx.strokeStyle = "#6366f1"
    ctx.lineWidth = 2
    edges.forEach((edge) => {
      const source = nodePositions.get(edge.source)
      const target = nodePositions.get(edge.target)
      if (source && target) {
        ctx.beginPath()
        ctx.moveTo(source.x, source.y)
        ctx.lineTo(target.x, target.y)
        ctx.stroke()

        ctx.fillStyle = "#9ca3af"
        ctx.font = "10px sans-serif"
        const midX = (source.x + target.x) / 2
        const midY = (source.y + target.y) / 2
        ctx.fillText(edge.label, midX, midY)
      }
    })

    nodes.forEach((node) => {
      const pos = nodePositions.get(node.id)
      if (pos) {
        ctx.fillStyle = "#8b5cf6"
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, 20, 0, 2 * Math.PI)
        ctx.fill()

        ctx.fillStyle = "#ffffff"
        ctx.font = "12px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(node.label.substring(0, 8), pos.x, pos.y + 35)
      }
    })
  }

  const exportToSTIX = () => {
    const stixObjects = csvData.map((row, index) => {
      const indicator: any = {
        type: "indicator",
        id: `indicator--${Date.now()}-${index}`,
        spec_version: "2.1",
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        pattern_type: "stix",
        valid_from: new Date().toISOString(),
      }

      allAttributes.forEach((attr) => {
        if (row[attr]) {
          indicator[attr] = row[attr]
        }
      })

      if (row.indicator_value || row.value || row.indicator) {
        const value = row.indicator_value || row.value || row.indicator
        indicator.pattern = `[network-traffic:src_ref.value = '${value}']`
        indicator.name = `Indicator: ${value}`
      } else {
        indicator.pattern = `[x-custom:value = 'data']`
        indicator.name = `Indicator ${index + 1}`
      }

      return indicator
    })

    const stixBundle = {
      type: "bundle",
      id: `bundle--${Date.now()}`,
      spec_version: "2.1",
      objects: stixObjects,
    }

    const blob = new Blob([JSON.stringify(stixBundle, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `threat-intel-stix-2.1-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (graphGenerated && nodes.length > 0) {
      drawGraph(nodes, edges)
    }
  }, [graphGenerated, nodes, edges])

  // Auto-generate initial graph when component loads with data
  useEffect(() => {
    if (csvData.length > 0 && !initialGraphGenerated) {
      generateInitialGraph()
    }
  }, [csvData, initialGraphGenerated])

  if (csvData.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Knowledge Graph</h2>
        <div style={cardStyle} className="p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-lg bg-blue-50 flex items-center justify-center mb-6">
              <Network className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
            <p className="text-sm text-gray-600 mb-6 text-center max-w-md">
              Please upload a CSV file from the Feed Management page first.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Knowledge Graph</h2>
          <p className="text-sm text-gray-600 mt-1">
            Working with {csvData.length} rows and {allAttributes.length} total attributes
          </p>
          {initialGraphGenerated && (
            <p className="text-xs text-green-600 mt-1">
              ✓ Auto-generated graph from {relationships.length} relationships
            </p>
          )}
        </div>
        {(initialGraphGenerated || graphGenerated) && (
          <button
            onClick={exportToSTIX}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            style={{ transition: "all 150ms ease" }}
          >
            <Download className="w-4 h-4" />
            Export STIX 2.1 ({csvData.length} indicators)
          </button>
        )}
      </div>

      <div style={cardStyle} className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Define Relationships</h3>
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

        <button
          onClick={generateGraph}
          disabled={relationships.length === 0}
          className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg ${
            relationships.length > 0
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          style={{ transition: "all 150ms ease" }}
        >
          <Network className="w-5 h-5" />
          Generate Knowledge Graph
        </button>
      </div>

      {(initialGraphGenerated || graphGenerated) && (
        <>
          <div style={cardStyle} className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {initialGraphGenerated && !graphGenerated ? "Auto-Generated Knowledge Graph" : "Custom Knowledge Graph"}
            </h3>
            <canvas
              ref={canvasRef}
              className="w-full h-96 bg-gray-50 rounded-lg"
            />
            {initialGraphGenerated && !graphGenerated && (
              <p className="text-sm text-gray-600 mt-3">
                This graph was automatically generated based on common threat intelligence patterns. 
                You can customize it by adding/removing relationships above and clicking "Generate Knowledge Graph".
              </p>
            )}
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
              <p className="text-2xl font-bold text-gray-900">{csvData.length}</p>
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
                      <th key={attr} className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
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
    </div>
  )
}
