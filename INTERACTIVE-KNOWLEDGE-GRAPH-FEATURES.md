# Interactive Knowledge Graph Features

## Overview

The Knowledge Graph now supports two visualization modes with full PyVis-style interactive physics simulation.

## Visualization Modes

### 1. Schema View (Default)

- Visualizes the **relationships between attributes** (columns) in your CSV data
- Shows how different data fields relate to each other
- Perfect for understanding data structure and patterns

**Node Colors:**

- 🟣 Purple: Source nodes (start of relationships)
- 🟢 Green: Target nodes (end of relationships)
- 🟠 Orange: Both source and target

### 2. Data View (NEW!)

- Visualizes **actual CSV data rows** as interactive nodes
- Each threat indicator/data entry becomes a node
- Shows connections between data based on defined relationships
- Configurable: Display 25, 50, 100, or 200 data rows

**Node Colors:**

- 🔵 Blue: Individual data rows (threat indicators)
- 🟣 Purple: Attribute nodes (data fields)
- 🟠 Orange: Group nodes (categories)
- 🟢 Green: Other nodes

## Interactive Features

### PyVis-Style Physics Simulation

- ✅ **Automatic force-directed layout** - Nodes move and settle naturally
- ✅ **Repulsion forces** - Nodes push away from each other
- ✅ **Spring forces** - Connected nodes attract to ideal distance
- ✅ **Center gravity** - Keeps graph centered
- ✅ **Velocity damping** - Smooth, natural movement
- ✅ **Physics ON/OFF toggle** - Pause/resume simulation

### Mouse Controls

- **Drag nodes** - Click and drag any node to reposition it
- **Pan view** - Click and drag empty space to move the entire graph
- **Zoom** - Use mouse wheel to zoom in/out
- **Select nodes** - Click nodes to see detailed information
- **Hover effects** - Nodes glow when you hover over them

### Node Details Panel

When you click a node, you'll see:

- Node ID and type
- Number of connections
- Related nodes and relationship types
- **For data nodes**: Full CSV row data with all fields

### Control Buttons

- **Physics ON/OFF** - Toggle physics simulation
- **Zoom In/Out** - Manual zoom controls
- **Reset View** - Return to default zoom and position

## How to Use

### Schema View

1. Define relationships between attributes (e.g., "threat_type" → "indicates" → "indicator_value")
2. Click "Generate Schema Graph"
3. Watch nodes settle into position with physics
4. Drag nodes to explore relationships
5. Click nodes to see connection details

### Data View

1. Switch to "Data View" mode
2. Select how many data rows to visualize (25-200)
3. Define relationships (optional - auto-groups if none defined)
4. Click "Generate Data Graph"
5. Explore your actual threat data as interactive nodes
6. Click data nodes to see full CSV row information

## Tips

- Start with fewer nodes (25-50) for better performance
- Use physics to let the graph organize itself naturally
- Turn off physics once nodes settle to freeze the layout
- Drag nodes to manually organize clusters
- Zoom in to see node labels clearly
- Click nodes to see full data details

## Export Options

- **STIX 2.1 Export** - Convert your knowledge graph to STIX format
- Includes all relationships and metadata
- Downloads JSON file and sends to backend API

## Performance

- Optimized for up to 200 nodes with smooth animation
- Continuous 60 FPS rendering
- Efficient force calculations
- Responsive to user interactions

---

**Status**: ✅ Fully Interactive | 🎨 PyVis-Style Physics | 📊 Dual Visualization Modes
