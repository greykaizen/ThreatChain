# Sample Threat Intelligence CSV Files

These CSV files are designed to test the Knowledge Graph feature. They contain threat intelligence data with **no clear relationships** between columns, making them perfect for demonstrating how the knowledge graph helps you visualize and establish proper relationships before converting to STIX.

---

## 📁 File 1: `sample-threat-data.csv`

### Description
Basic threat intelligence data with mixed column names that don't follow standard CTI conventions.

### Columns
- `id` - Sequential identifier
- `timestamp` - When the indicator was observed
- `value` - The actual indicator value (IP, domain, hash, filename)
- `category` - Type category (network, web, file)
- `confidence` - Confidence score (0-100)
- `tags` - Semicolon-separated tags
- `notes` - Human-readable description
- `reporter` - Who/what reported this indicator

### Problems This Data Has
1. **No standard naming**: Columns like `value` and `category` are vague
2. **Mixed indicator types**: IPs, domains, hashes, filenames all in one column
3. **Unclear relationships**: How does `category` relate to `value`?
4. **No severity field**: Only has `confidence` which is different
5. **Tags are unstructured**: Semicolon-separated strings

### What You'll Learn
- How to identify which columns should be connected
- How `category` should "indicates" the `value`
- How `reporter` "observed_in" the `value`
- How to establish proper CTI relationships

### Expected Relationships to Create
```
category → indicates → value
reporter → observed_in → value
confidence → has_confidence → value
tags → related_to → category
```

---

## 📁 File 2: `sample-messy-threat-data.csv`

### Description
Intentionally messy threat intelligence data with inconsistent naming and no obvious relationships. This is closer to real-world data exports.

### Columns
- `entry_id` - Unique entry identifier
- `observed_time` - Observation timestamp
- `ioc_data` - The indicator of compromise
- `type_field` - Indicator type (but inconsistently named)
- `risk_level` - Severity (high, medium, low, critical)
- `source_name` - Intelligence source
- `description` - What this indicator represents
- `analyst_notes` - Additional context

### Problems This Data Has
1. **Inconsistent naming**: `ioc_data`, `type_field`, `risk_level` - no standard
2. **Multiple type formats**: "suspicious_ip", "domain", "hash_md5", "ip_address" - inconsistent
3. **No clear hierarchy**: Which fields depend on which?
4. **Mixed severity levels**: "high", "critical", "medium", "low" - needs normalization
5. **Disconnected metadata**: Source, description, notes all separate

### What You'll Learn
- How to work with real-world messy data
- How to establish relationships when column names are unclear
- How to connect metadata (source, description) to indicators
- How severity relates to indicator types

### Expected Relationships to Create
```
type_field → indicates → ioc_data
risk_level → has_severity → ioc_data
source_name → observed_in → ioc_data
description → describes → ioc_data
type_field → has_severity → risk_level
```

---

## 🎯 How to Use These Files

### Step 1: Upload to ThreatChain
1. Go to Dashboard → Feed Management → Feed Extraction
2. Click "Select CSV File"
3. Choose either `sample-threat-data.csv` or `sample-messy-threat-data.csv`
4. System will detect all columns

### Step 2: Select Attributes
- Select all columns (or the ones you want to analyze)
- Notice how the column names don't clearly indicate relationships
- Click through to see the data preview

### Step 3: View Knowledge Graph Preview
**This is where the magic happens!**

The system will try to auto-generate relationships, but with these messy files:
- It might create basic relationships
- Some relationships will be missing
- Some might not make sense

**You'll see:**
- Visual graph showing how columns connect (or don't)
- List of auto-generated relationships
- Statistics about nodes and edges

### Step 4: Understand the Problem
Look at the graph and ask:
- Does `category` → `value` make sense? (YES - category indicates the value type)
- Does `timestamp` → `value` make sense? (NO - timestamp is just metadata)
- What's missing? (Severity relationships, source relationships)

### Step 5: Go to Full Knowledge Graph Page
Click "View Full Knowledge Graph" to:
- Add missing relationships manually
- Remove incorrect relationships
- Define proper CTI relationship types
- See the graph update in real-time

### Step 6: Convert to STIX
Once you're happy with the relationships:
- Click "Convert to STIX 2.1"
- See the preview showing all indicators and relationships
- Confirm and download
- Your messy CSV is now properly structured STIX!

---

## 🔍 What Makes Good Relationships?

### Good Relationships
✅ `indicator_type` → indicates → `indicator_value`
✅ `threat_type` → related_to → `indicator_value`
✅ `severity` → has_severity → `threat_type`
✅ `source` → observed_in → `indicator_value`

### Bad Relationships
❌ `timestamp` → indicates → `id` (metadata doesn't indicate metadata)
❌ `notes` → has_severity → `value` (notes don't define severity)
❌ `id` → related_to → `timestamp` (no meaningful connection)

---

## 📊 Expected Results

### For `sample-threat-data.csv`
- **15 indicators** (one per row)
- **3-4 relationships** (depending on what you define)
- **5-6 nodes** (unique columns involved in relationships)

### For `sample-messy-threat-data.csv`
- **20 indicators** (one per row)
- **4-5 relationships** (more complex due to messiness)
- **6-7 nodes** (more columns to connect)

---

## 🎓 Learning Objectives

### 1. Understand Data Quality Issues
- See how inconsistent naming affects analysis
- Learn why standardization matters
- Understand the value of STIX format

### 2. Visualize Relationships
- See connections between data fields
- Identify missing relationships
- Understand graph structure

### 3. Improve Data Before Conversion
- Fix relationships before STIX conversion
- Ensure proper CTI structure
- Create meaningful connections

### 4. STIX Best Practices
- Learn proper indicator structure
- Understand relationship types
- See how metadata should be connected

---

## 🚀 Quick Test Scenarios

### Scenario 1: "I have no idea what relationships to create"
1. Upload `sample-threat-data.csv`
2. Select all attributes
3. Look at the auto-generated graph
4. See what the system suggests
5. Add obvious ones like: `category` → indicates → `value`

### Scenario 2: "My data is a mess"
1. Upload `sample-messy-threat-data.csv`
2. Select all attributes
3. Notice the confusing column names
4. Use the graph to understand what connects to what
5. Manually define: `type_field` → indicates → `ioc_data`

### Scenario 3: "I want to see before/after"
1. Upload either file
2. Look at the initial auto-generated graph (before)
3. Go to full Knowledge Graph page
4. Add/remove relationships
5. See the graph update (after)
6. Convert to STIX and compare the structure

---

## 💡 Pro Tips

### Tip 1: Start Simple
Don't try to create all relationships at once. Start with:
1. What indicates what? (type → value)
2. What observed what? (source → value)
3. What has severity? (type → severity)

### Tip 2: Use the Visual
The graph visualization helps you see:
- Isolated nodes (columns with no relationships)
- Over-connected nodes (might be wrong)
- Missing connections (gaps in your model)

### Tip 3: Think Like STIX
STIX has specific relationship types:
- `indicates` - shows indication of threat
- `related-to` - general relationship
- `attributed-to` - attribution
- `targets` - what's being targeted
- `uses` - what tools/techniques are used

### Tip 4: Iterate
1. Create initial relationships
2. Generate graph
3. See what looks wrong
4. Adjust relationships
5. Regenerate
6. Repeat until it makes sense

---

## 🔧 Troubleshooting

### "I don't see any auto-generated relationships"
- Your column names might be too different from standard CTI fields
- Manually add relationships using the UI
- Start with obvious ones (type → value)

### "The graph looks like spaghetti"
- You probably have too many relationships
- Remove unnecessary connections
- Focus on core CTI relationships

### "I'm not sure what relationship type to use"
- Use `indicates` for type → value
- Use `observed_in` for source → value
- Use `has_severity` for anything → severity
- Use `related_to` when unsure

### "The STIX output doesn't look right"
- Check your relationships in the graph
- Make sure indicator values are in the right column
- Verify relationship types make sense

---

## 📝 Next Steps

After testing with these samples:

1. **Try your own data**: Upload real threat intelligence CSVs
2. **Experiment with relationships**: See what works and what doesn't
3. **Compare STIX outputs**: Look at the difference between good and bad relationships
4. **Share feedback**: Help improve the auto-detection algorithms

---

## 🎯 Success Criteria

You've successfully used these samples when you can:

✅ Upload a messy CSV and understand what's wrong
✅ Identify which columns should be connected
✅ Create meaningful relationships using the graph
✅ Generate a valid STIX 2.1 bundle
✅ Explain why certain relationships make sense
✅ Use the knowledge graph to improve data quality

---

Happy graphing! 🎉
