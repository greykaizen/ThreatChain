# Knowledge Graph Preview Before STIX Conversion

## Overview

This feature allows you to visualize and review your threat intelligence data as a knowledge graph **before** converting it to STIX 2.1 format. This gives you better control and understanding of your data relationships before finalizing the conversion.

## How It Works

### Step-by-Step Flow

1. **Upload CSV Data** (Feed Management)

   - Navigate to Feed Management → Feed Extraction
   - Upload your CSV file containing threat intelligence data
   - System automatically detects attributes and data types

2. **Select Attributes** (Feed Management)

   - Review detected attributes from your CSV
   - Select which attributes to include in the knowledge graph
   - Preview your data before proceeding

3. **Build Knowledge Graph** (Knowledge Graph Page)

   - System auto-generates relationships based on common CTI patterns
   - Visualize nodes and edges in an interactive graph
   - Customize relationships by adding/removing connections
   - Define relationship types (indicates, related_to, has_severity, etc.)

4. **Preview Before Conversion** (NEW FEATURE)

   - Click "Convert to STIX 2.1" button
   - Review conversion dialog showing:
     - Number of threat indicators to be created
     - Number of relationship objects
     - Number of graph nodes
     - Visual preview of the knowledge graph structure
   - See exactly what will be included in the STIX bundle

5. **Confirm & Convert**
   - Click "Confirm & Convert" to proceed
   - System generates STIX 2.1 bundle with:
     - Indicator objects from CSV data
     - Relationship objects from knowledge graph
     - Metadata about the graph structure
   - Bundle is automatically downloaded
   - Data is saved to backend with blockchain attestation

## Features

### Auto-Generated Knowledge Graph

The system automatically creates relationships based on common threat intelligence patterns:

- `indicator_type` → `indicator_value` (indicates)
- `threat_type` → `indicator_value` (related_to)
- `threat_type` → `severity` (has_severity)
- `source` → `indicator_value` (observed_in)

### Custom Relationships

You can define your own relationships:

1. Select source attribute
2. Choose relationship type
3. Select target attribute
4. Add to graph

Available relationship types:

- `indicates` - Shows indication of threat
- `related_to` - General relationship
- `has_severity` - Severity level connection
- `observed_in` - Source observation
- `attributed_to` - Attribution connection
- `targets` - Target relationship

### Conversion Preview Dialog

Before converting to STIX, you see:

- **Threat Indicators Count**: Total indicators from CSV rows
- **Relationship Objects Count**: Relationships from your graph
- **Graph Nodes Count**: Unique nodes in the graph
- **Visual Preview**: Mini canvas showing graph structure

### STIX 2.1 Output

The generated STIX bundle includes:

```json
{
  "type": "bundle",
  "id": "bundle--[timestamp]",
  "spec_version": "2.1",
  "objects": [
    // Indicator objects from CSV data
    {
      "type": "indicator",
      "id": "indicator--[uuid]",
      "pattern": "[network-traffic:src_ref.value = 'value']"
      // ... CSV attributes
    },
    // Relationship objects from knowledge graph
    {
      "type": "relationship",
      "id": "relationship--[uuid]",
      "relationship_type": "indicates",
      "source_ref": "x-custom-attribute--source",
      "target_ref": "x-custom-attribute--target"
    }
  ],
  "metadata": {
    "knowledge_graph": {
      "nodes": 5,
      "edges": 4,
      "relationships": 4
    },
    "generated_at": "2025-11-28T...",
    "source_rows": 100
  }
}
```

## Backend Integration

### New API Endpoint

**POST** `/api/stix/convert`

Converts knowledge graph to STIX 2.1 and stores it with blockchain attestation.

**Request Body:**

```json
{
  "stixBundle": { /* STIX 2.1 bundle */ },
  "knowledgeGraph": {
    "nodes": [ /* graph nodes */ ],
    "edges": [ /* graph edges */ ],
    "relationships": [ /* relationships */ ]
  },
  "sourceData": {
    "fileName": "threat-data.csv",
    "rowCount": 100,
    "attributes": ["indicator_type", "indicator_value", ...]
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "reportId": "uuid",
    "reportHash": "sha256-hash",
    "stixVersion": "2.1",
    "objectsCount": 150,
    "knowledgeGraph": {
      "nodes": 5,
      "edges": 4,
      "relationships": 4
    },
    "blockchain": {
      /* blockchain transaction */
    },
    "ethereum": {
      /* ethereum transaction */
    }
  },
  "message": "Knowledge graph converted to STIX and recorded on blockchain"
}
```

### Database Storage

The STIX bundle is stored in the `stix_reports` table with:

- Unique report ID
- SHA-256 hash for integrity
- Full STIX content
- Metadata about knowledge graph
- Blockchain transaction reference

### Blockchain Attestation

Each conversion is recorded on:

1. **Local Blockchain**: Immediate attestation with metadata
2. **Ethereum** (if enabled): Immutable public ledger record

## Benefits

### 1. Better Data Understanding

- Visualize relationships before conversion
- Identify missing or incorrect connections
- Understand data structure at a glance

### 2. Quality Control

- Review what will be converted
- Verify indicator counts
- Check relationship accuracy

### 3. Transparency

- See exactly what's in the STIX bundle
- No surprises after conversion
- Clear metadata and statistics

### 4. Flexibility

- Modify relationships before converting
- Add or remove connections
- Regenerate graph as needed

### 5. Provenance

- Full audit trail of conversion
- Blockchain attestation
- Immutable record of data lineage

## Usage Example

### Scenario: Converting Malware IOCs

1. **Upload CSV** with columns:

   - `indicator_type` (e.g., "ip-address", "domain", "hash")
   - `indicator_value` (e.g., "192.168.1.1", "evil.com")
   - `threat_type` (e.g., "malware", "phishing")
   - `severity` (e.g., "high", "medium", "low")
   - `source` (e.g., "VirusTotal", "AlienVault")

2. **Auto-Generated Graph** creates:

   - `indicator_type` → indicates → `indicator_value`
   - `threat_type` → related_to → `indicator_value`
   - `threat_type` → has_severity → `severity`
   - `source` → observed_in → `indicator_value`

3. **Preview Shows**:

   - 100 threat indicators
   - 4 relationship types
   - 5 unique nodes
   - Visual graph structure

4. **Convert** generates:
   - 100 STIX indicator objects
   - 4 STIX relationship objects
   - Complete metadata
   - Blockchain attestation

## Technical Details

### Frontend Components

- **KnowledgeGraph Component**: Main visualization and conversion UI
- **Conversion Dialog**: Preview modal before STIX generation
- **Canvas Rendering**: Interactive graph visualization

### Backend Services

- **STIX Conversion Service**: Transforms graph to STIX 2.1
- **Blockchain Service**: Records attestations
- **Database Service**: Stores reports and provenance

### Data Flow

```
CSV Upload → Attribute Detection → Graph Building → Preview Dialog → STIX Conversion → Blockchain Attestation → Download & Storage
```

## Future Enhancements

- [ ] Interactive graph editing (drag nodes, edit relationships)
- [ ] Multiple graph layouts (force-directed, hierarchical, circular)
- [ ] Export graph as image (PNG, SVG)
- [ ] Import existing STIX bundles and visualize
- [ ] Advanced relationship types from STIX 2.1 spec
- [ ] Graph comparison between versions
- [ ] Collaborative graph editing
- [ ] AI-suggested relationships based on data patterns

## Troubleshooting

### Graph Not Displaying

- Ensure CSV has at least 2 attributes selected
- Check browser console for errors
- Verify canvas element is rendering

### Conversion Fails

- Check backend server is running (port 3001)
- Verify database connection
- Check network requests in browser DevTools

### Missing Relationships

- Manually add relationships using the UI
- Ensure source and target attributes exist
- Verify relationship type is selected

## Support

For issues or questions:

1. Check the console logs (browser and server)
2. Review the TROUBLESHOOTING.md file
3. Open an issue on GitHub with:
   - Steps to reproduce
   - Error messages
   - Sample data (anonymized)
