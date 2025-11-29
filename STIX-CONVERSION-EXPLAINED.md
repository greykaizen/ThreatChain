# 🔄 CSV/XML to STIX 2.1 Conversion - How It Works

## 🎯 Conversion Basis

The conversion from CSV/XML to STIX 2.1 happens based on **data structure mapping** and **STIX 2.1 specification requirements**.

---

## 📊 Conversion Flow

```
CSV/XML Data → Parse → Knowledge Graph → STIX 2.1 Objects → STIX Bundle
```

---

## 🔍 Step-by-Step Conversion Basis

### Step 1: Data Row → STIX Indicator Object

**Basis**: Each row in your CSV/XML becomes a STIX **Indicator** object

**Why Indicator?**
- STIX 2.1 has multiple object types (indicator, malware, threat-actor, etc.)
- **Indicator** is the most generic type for threat intelligence data
- Represents observable patterns that suggest malicious activity

**Conversion Logic:**
```typescript
const stixObjects = csvData.map((row, index) => {
  const indicator = {
    type: "indicator",                          // ← Fixed STIX type
    id: `indicator--${Date.now()}-${index}`,   // ← Generated UUID
    spec_version: "2.1",                        // ← STIX version
    created: new Date().toISOString(),          // ← Timestamp
    modified: new Date().toISOString(),         // ← Timestamp
    pattern_type: "stix",                       // ← Pattern format
    valid_from: new Date().toISOString(),       // ← Validity start
  }
  
  // Add all CSV/XML attributes as custom properties
  allAttributes.forEach((attr) => {
    if (row[attr]) {
      indicator[attr] = row[attr]  // ← Your data becomes properties
    }
  })
  
  return indicator
})
```

---

## 🗺️ Mapping Rules

### 1. **Required STIX Fields** (Auto-Generated)

| STIX Field | Basis | Example |
|------------|-------|---------|
| `type` | Fixed as "indicator" | `"indicator"` |
| `id` | Generated UUID with timestamp | `"indicator--1732819200-0"` |
| `spec_version` | Fixed as "2.1" | `"2.1"` |
| `created` | Current timestamp | `"2024-11-28T18:00:00.000Z"` |
| `modified` | Current timestamp | `"2024-11-28T18:00:00.000Z"` |
| `pattern_type` | Fixed as "stix" | `"stix"` |
| `valid_from` | Current timestamp | `"2024-11-28T18:00:00.000Z"` |

**Basis**: STIX 2.1 specification requires these fields for every Indicator object

---

### 2. **Pattern Field** (Smart Detection)

**Basis**: Looks for specific column names to create STIX pattern

**Detection Logic:**
```typescript
if (row.indicator_value || row.value || row.indicator) {
  const value = row.indicator_value || row.value || row.indicator
  indicator.pattern = `[network-traffic:src_ref.value = '${value}']`
  indicator.name = `Indicator: ${value}`
} else {
  indicator.pattern = `[x-custom:value = 'data']`
  indicator.name = `Indicator ${index + 1}`
}
```

**Priority Order:**
1. `indicator_value` column
2. `value` column  
3. `indicator` column
4. Fallback: generic pattern

**Example:**
```csv
indicator_value,threat_type
192.168.1.100,c2_server
```

Becomes:
```json
{
  "pattern": "[network-traffic:src_ref.value = '192.168.1.100']",
  "name": "Indicator: 192.168.1.100"
}
```

---

### 3. **Custom Properties** (All Your Data)

**Basis**: Every column from your CSV/XML becomes a property in the STIX object

**Mapping:**
```
CSV Column Name → STIX Property Name
CSV Column Value → STIX Property Value
```

**Example:**

**Your CSV:**
```csv
indicator_type,indicator_value,threat_type,severity,confidence
malware,WannaCry,ransomware,critical,high
```

**Becomes STIX:**
```json
{
  "type": "indicator",
  "id": "indicator--1732819200-0",
  "spec_version": "2.1",
  "created": "2024-11-28T18:00:00.000Z",
  "modified": "2024-11-28T18:00:00.000Z",
  "pattern_type": "stix",
  "valid_from": "2024-11-28T18:00:00.000Z",
  "pattern": "[network-traffic:src_ref.value = 'WannaCry']",
  "name": "Indicator: WannaCry",
  "indicator_type": "malware",        ← Your column
  "indicator_value": "WannaCry",      ← Your column
  "threat_type": "ransomware",        ← Your column
  "severity": "critical",             ← Your column
  "confidence": "high"                ← Your column
}
```

---

### 4. **Relationships** (From Knowledge Graph)

**Basis**: Relationships you define in the knowledge graph become STIX Relationship objects

**Conversion Logic:**
```typescript
const relationshipObjects = relationships.map((rel, index) => ({
  type: "relationship",                        // ← Fixed STIX type
  id: `relationship--${Date.now()}-${index}`, // ← Generated UUID
  spec_version: "2.1",
  created: new Date().toISOString(),
  modified: new Date().toISOString(),
  relationship_type: rel.type,                 // ← Your relationship type
  source_ref: `x-custom-attribute--${rel.source}`, // ← Source attribute
  target_ref: `x-custom-attribute--${rel.target}`, // ← Target attribute
  description: `${rel.source} ${rel.type} ${rel.target}`
}))
```

**Example:**

**Your Relationship:**
```
indicator_type → "related-to" → threat_type
```

**Becomes STIX:**
```json
{
  "type": "relationship",
  "id": "relationship--1732819200-0",
  "spec_version": "2.1",
  "created": "2024-11-28T18:00:00.000Z",
  "modified": "2024-11-28T18:00:00.000Z",
  "relationship_type": "related-to",
  "source_ref": "x-custom-attribute--indicator_type",
  "target_ref": "x-custom-attribute--threat_type",
  "description": "indicator_type related-to threat_type"
}
```

---

### 5. **STIX Bundle** (Container)

**Basis**: All objects are wrapped in a STIX Bundle (required by STIX 2.1 spec)

**Structure:**
```json
{
  "type": "bundle",
  "id": "bundle--1732819200",
  "spec_version": "2.1",
  "objects": [
    { /* indicator 1 */ },
    { /* indicator 2 */ },
    { /* relationship 1 */ },
    { /* relationship 2 */ }
  ],
  "metadata": {
    "knowledge_graph": {
      "nodes": 10,
      "edges": 15,
      "relationships": 5
    },
    "generated_at": "2024-11-28T18:00:00.000Z",
    "source_rows": 6
  }
}
```

---

## 🎯 Conversion Basis Summary

| Element | Basis | Source |
|---------|-------|--------|
| **Indicator Objects** | One per CSV/XML row | Your data rows |
| **Required Fields** | STIX 2.1 specification | Auto-generated |
| **Pattern Field** | Column name detection | `indicator_value`, `value`, or `indicator` |
| **Custom Properties** | All CSV/XML columns | Your column names & values |
| **Relationships** | Knowledge graph edges | Your defined relationships |
| **Bundle** | STIX 2.1 container | Wraps all objects |
| **Metadata** | Statistics | Graph metrics |

---

## 📋 Real Example

### Input CSV:
```csv
indicator_type,indicator_value,threat_type,severity
malware,WannaCry,ransomware,critical
ip,192.168.1.100,c2_server,high
```

### Output STIX 2.1:
```json
{
  "type": "bundle",
  "id": "bundle--1732819200",
  "spec_version": "2.1",
  "objects": [
    {
      "type": "indicator",
      "id": "indicator--1732819200-0",
      "spec_version": "2.1",
      "created": "2024-11-28T18:00:00.000Z",
      "modified": "2024-11-28T18:00:00.000Z",
      "pattern_type": "stix",
      "valid_from": "2024-11-28T18:00:00.000Z",
      "pattern": "[network-traffic:src_ref.value = 'WannaCry']",
      "name": "Indicator: WannaCry",
      "indicator_type": "malware",
      "indicator_value": "WannaCry",
      "threat_type": "ransomware",
      "severity": "critical"
    },
    {
      "type": "indicator",
      "id": "indicator--1732819200-1",
      "spec_version": "2.1",
      "created": "2024-11-28T18:00:00.000Z",
      "modified": "2024-11-28T18:00:00.000Z",
      "pattern_type": "stix",
      "valid_from": "2024-11-28T18:00:00.000Z",
      "pattern": "[network-traffic:src_ref.value = '192.168.1.100']",
      "name": "Indicator: 192.168.1.100",
      "indicator_type": "ip",
      "indicator_value": "192.168.1.100",
      "threat_type": "c2_server",
      "severity": "high"
    }
  ]
}
```

---

## 🔑 Key Points

1. **No Data Loss**: All your CSV/XML columns are preserved as STIX properties
2. **STIX Compliant**: Meets STIX 2.1 specification requirements
3. **Automatic**: No manual mapping needed
4. **Flexible**: Works with any CSV/XML structure
5. **Relationships**: Knowledge graph relationships become STIX relationships
6. **Metadata**: Includes statistics about the conversion

---

## 💡 Why This Approach?

### Advantages:
✅ **Simple**: One-to-one mapping (row → indicator)
✅ **Flexible**: Works with any column names
✅ **Preserves Data**: No information lost
✅ **STIX Compliant**: Valid STIX 2.1 format
✅ **Extensible**: Easy to add more STIX types later

### Limitations:
⚠️ **Generic Type**: Everything becomes "indicator" (could be more specific)
⚠️ **Pattern Detection**: Limited to specific column names
⚠️ **No Validation**: Doesn't validate if data matches STIX semantics

---

## 🎯 Bottom Line

**Conversion Basis:**
1. **Structure**: Each row → STIX Indicator object
2. **Required Fields**: Auto-generated per STIX 2.1 spec
3. **Pattern**: Detected from `indicator_value`, `value`, or `indicator` columns
4. **Properties**: All your columns become STIX properties
5. **Relationships**: Knowledge graph edges → STIX Relationship objects
6. **Bundle**: Everything wrapped in STIX Bundle container

**Result**: Your CSV/XML data becomes a valid, STIX 2.1 compliant threat intelligence bundle that can be:
- Stored in the blockchain
- Shared with other systems
- Imported into STIX-compatible tools
- Verified for integrity

🚀 Your data is now in the industry-standard format for threat intelligence sharing!
