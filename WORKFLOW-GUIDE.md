# ThreatChain Workflow Guide

## Complete Data Processing Flow

This guide walks you through the entire process of converting threat intelligence data to STIX 2.1 format with knowledge graph visualization.

---

## 🔄 Workflow Overview

```
┌─────────────────┐
│  1. Upload CSV  │
│   Feed Data     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. Select      │
│   Attributes    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. Build       │
│ Knowledge Graph │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. Preview     │  ◄── NEW FEATURE!
│   Conversion    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. Convert to  │
│   STIX 2.1      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  6. Blockchain  │
│   Attestation   │
└─────────────────┘
```

---

## Step 1: Upload CSV Feed Data

### Location
Dashboard → Feed Management → Feed Extraction

### Actions
1. Click "Select CSV File" button
2. Choose your threat intelligence CSV file
3. System automatically parses and detects:
   - Column headers (attributes)
   - Data types (string, number, datetime, array)
   - Sample values

### Example CSV Format
```csv
indicator_type,indicator_value,threat_type,severity,source,timestamp
ip-address,192.168.1.100,malware,high,VirusTotal,2025-11-28T10:00:00Z
domain,evil.com,phishing,medium,AlienVault,2025-11-28T10:05:00Z
hash,abc123def456,ransomware,critical,Internal,2025-11-28T10:10:00Z
```

### What You'll See
- File name and size
- Number of rows detected
- List of detected attributes with types
- Sample values for each attribute

---

## Step 2: Select Attributes

### Location
Feed Management → Attributes Selection (appears after upload)

### Actions
1. Review all detected attributes
2. Click on attributes to select/deselect
3. Selected attributes will be included in the knowledge graph
4. Minimum 2 attributes required

### Tips
- Select attributes that have meaningful relationships
- Include key fields like indicator types, values, and metadata
- Deselect irrelevant or empty columns

### What You'll See
- Attribute name
- Data type badge
- Sample value
- Selection checkbox
- Data preview table (first 5 rows)

---

## Step 3: Build Knowledge Graph

### Location
Dashboard → Knowledge Graph (auto-navigates after attribute selection)

### Auto-Generated Graph
The system automatically creates relationships based on common CTI patterns:

**Pattern Detection:**
- If `indicator_type` + `indicator_value` exist → creates "indicates" relationship
- If `threat_type` + `indicator_value` exist → creates "related_to" relationship
- If `threat_type` + `severity` exist → creates "has_severity" relationship
- If `source` + `indicator_value` exist → creates "observed_in" relationship

### Custom Relationships
You can add your own relationships:

1. **Select Source Attribute** (dropdown)
2. **Choose Relationship Type** (dropdown)
   - indicates
   - related_to
   - has_severity
   - observed_in
   - attributed_to
   - targets
3. **Select Target Attribute** (dropdown)
4. **Click "Add"** button

### Graph Visualization
- **Nodes**: Circular elements representing attributes
- **Edges**: Lines connecting nodes with relationship labels
- **Layout**: Circular arrangement for clarity
- **Colors**: 
  - Nodes: Purple (#8b5cf6)
  - Edges: Blue (#6366f1)
  - Labels: Gray (#9ca3af)

### Actions Available
- Add new relationships
- Remove existing relationships
- Regenerate graph with updated relationships
- View graph statistics (nodes, edges, relationships)

---

## Step 4: Preview Conversion (NEW!)

### Location
Knowledge Graph → Click "Convert to STIX 2.1" button

### Preview Dialog Shows

#### Summary Cards
1. **Threat Indicators** (Blue)
   - Count: Number of CSV rows
   - Description: "From your CSV data"

2. **Relationship Objects** (Purple)
   - Count: Number of relationships defined
   - Description: "Based on your knowledge graph"

3. **Graph Nodes** (Green)
   - Count: Unique attributes in graph
   - Description: "Attributes and entities"

#### Visual Preview
- Mini canvas showing the knowledge graph structure
- Same layout as main graph
- Helps verify relationships before conversion

#### What Gets Converted
The dialog clearly shows:
- Total indicators to be created
- Total relationships to be created
- Graph structure metadata
- Source data information

### Actions
- **Cancel**: Close dialog without converting
- **Confirm & Convert**: Proceed with STIX conversion

---

## Step 5: Convert to STIX 2.1

### Conversion Process

#### What Happens
1. **Generate Indicator Objects**
   - One STIX indicator per CSV row
   - Includes all selected attributes
   - Auto-generates STIX pattern
   - Adds timestamps and IDs

2. **Generate Relationship Objects**
   - One STIX relationship per graph edge
   - Maps relationship types to STIX spec
   - Links source and target references
   - Includes descriptions

3. **Create Bundle**
   - Wraps all objects in STIX bundle
   - Adds metadata about knowledge graph
   - Includes generation timestamp
   - Calculates SHA-256 hash

4. **Download File**
   - Automatically downloads JSON file
   - Filename: `threat-intel-stix-2.1-[timestamp].json`
   - Format: Pretty-printed JSON

5. **Send to Backend**
   - POSTs bundle to `/api/stix/convert`
   - Saves to database
   - Records provenance
   - Initiates blockchain attestation

### STIX Bundle Structure
```json
{
  "type": "bundle",
  "id": "bundle--[timestamp]",
  "spec_version": "2.1",
  "objects": [
    {
      "type": "indicator",
      "id": "indicator--[uuid]",
      "spec_version": "2.1",
      "created": "2025-11-28T...",
      "modified": "2025-11-28T...",
      "pattern_type": "stix",
      "pattern": "[network-traffic:src_ref.value = '192.168.1.100']",
      "valid_from": "2025-11-28T...",
      "name": "Indicator: 192.168.1.100",
      "indicator_type": "ip-address",
      "indicator_value": "192.168.1.100",
      "threat_type": "malware",
      "severity": "high"
    },
    {
      "type": "relationship",
      "id": "relationship--[uuid]",
      "spec_version": "2.1",
      "created": "2025-11-28T...",
      "modified": "2025-11-28T...",
      "relationship_type": "indicates",
      "source_ref": "x-custom-attribute--indicator_type",
      "target_ref": "x-custom-attribute--indicator_value",
      "description": "indicator_type indicates indicator_value"
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

### Success Confirmation
- Green checkmark icon
- "Conversion Complete!" message
- File download confirmation
- Statistics summary

---

## Step 6: Blockchain Attestation

### Automatic Process

#### Local Blockchain
1. Calculates SHA-256 hash of STIX bundle
2. Creates transaction with metadata:
   - Report ID
   - File name
   - Knowledge graph statistics
   - Source row count
3. Adds to blockchain
4. Returns transaction ID

#### Ethereum (if enabled)
1. Registers report hash on Ethereum
2. Creates immutable public record
3. Returns transaction hash
4. Provides block number

### Database Storage
Saves to `stix_reports` table:
- Unique report ID (UUID)
- Title and description
- Full STIX content (JSON)
- File metadata
- SHA-256 hash
- STIX version
- Indicator count
- Timestamps

### Provenance Record
Creates entry in `provenance_records`:
- Links to report ID
- Blockchain transaction ID
- Action type: "created"
- Actor: "system"
- Metadata: Knowledge graph info, Ethereum TX

---

## 📊 Data Flow Diagram

```
CSV File
   │
   ├─► Parse & Detect Attributes
   │      │
   │      ├─► Attribute Selection
   │      │      │
   │      │      ├─► Build Knowledge Graph
   │      │      │      │
   │      │      │      ├─► Auto-generate Relationships
   │      │      │      │
   │      │      │      ├─► Custom Relationships
   │      │      │      │
   │      │      │      └─► Visualize Graph
   │      │      │             │
   │      │      │             ├─► Preview Conversion Dialog
   │      │      │             │      │
   │      │      │             │      ├─► Show Statistics
   │      │      │             │      │
   │      │      │             │      └─► Confirm
   │      │      │             │             │
   │      │      │             │             ├─► Generate STIX Bundle
   │      │      │             │             │      │
   │      │      │             │             │      ├─► Indicator Objects
   │      │      │             │             │      │
   │      │      │             │             │      └─► Relationship Objects
   │      │      │             │             │
   │      │      │             │             ├─► Download JSON
   │      │      │             │             │
   │      │      │             │             └─► Send to Backend
   │      │      │             │                    │
   │      │      │             │                    ├─► Save to Database
   │      │      │             │                    │
   │      │      │             │                    ├─► Local Blockchain
   │      │      │             │                    │
   │      │      │             │                    └─► Ethereum (optional)
```

---

## 🎯 Key Features

### 1. Automatic Relationship Detection
- Intelligent pattern matching
- Common CTI relationship types
- Reduces manual configuration

### 2. Visual Knowledge Graph
- Interactive canvas visualization
- Clear node and edge representation
- Real-time updates

### 3. Preview Before Convert
- See exactly what will be created
- Verify counts and structure
- No surprises after conversion

### 4. STIX 2.1 Compliance
- Proper object structure
- Valid relationship types
- Metadata inclusion

### 5. Blockchain Provenance
- Immutable audit trail
- Cryptographic verification
- Timestamp proof

### 6. Full Transparency
- Every step is visible
- Clear statistics
- Detailed metadata

---

## 💡 Best Practices

### CSV Preparation
- Use clear, descriptive column names
- Include timestamp fields
- Normalize data formats
- Remove duplicates beforehand

### Attribute Selection
- Select meaningful attributes
- Include context fields (source, severity)
- Keep indicator types and values
- Avoid empty or null-heavy columns

### Relationship Building
- Start with auto-generated relationships
- Add domain-specific relationships
- Use appropriate relationship types
- Verify connections make sense

### Before Converting
- Review the preview dialog carefully
- Check indicator and relationship counts
- Verify graph structure
- Ensure data quality

### After Conversion
- Verify downloaded STIX file
- Check backend confirmation
- Review blockchain transaction
- Test STIX bundle validity

---

## 🔍 Verification

### How to Verify Your STIX Bundle

1. **Open the downloaded JSON file**
2. **Check structure**:
   - Has `type: "bundle"`
   - Has `spec_version: "2.1"`
   - Has `objects` array
3. **Verify objects**:
   - Indicator count matches CSV rows
   - Relationship count matches graph edges
   - All have proper IDs and timestamps
4. **Validate with STIX validator** (optional):
   ```bash
   stix2-validator your-file.json
   ```

### Backend Verification

1. Navigate to Dashboard → Sharing & Reports
2. Find your converted report
3. Check:
   - Report hash
   - Blockchain transaction ID
   - Indicator count
   - Provenance records

---

## 🚀 Quick Start Example

### 5-Minute Walkthrough

1. **Prepare CSV** (example-threats.csv):
```csv
type,value,severity
ip,192.168.1.1,high
domain,evil.com,medium
hash,abc123,critical
```

2. **Upload**: Feed Management → Upload CSV

3. **Select All Attributes**: Click all three (type, value, severity)

4. **Auto-Graph**: System creates relationships automatically

5. **Preview**: Click "Convert to STIX 2.1"
   - See: 3 indicators, 2 relationships, 3 nodes

6. **Convert**: Click "Confirm & Convert"
   - Downloads: threat-intel-stix-2.1-[timestamp].json
   - Saves to backend with blockchain attestation

7. **Done!** Your threat intelligence is now in STIX 2.1 format with full provenance.

---

## 📚 Additional Resources

- [STIX 2.1 Specification](https://docs.oasis-open.org/cti/stix/v2.1/)
- [Knowledge Graph Concepts](https://en.wikipedia.org/wiki/Knowledge_graph)
- [Blockchain Provenance](./docs/blockchain-provenance.md)
- [API Documentation](./docs/api-reference.md)

---

## ❓ Need Help?

- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Review [KNOWLEDGE-GRAPH-PREVIEW-FEATURE.md](./KNOWLEDGE-GRAPH-PREVIEW-FEATURE.md)
- Open an issue on GitHub
- Contact support team
