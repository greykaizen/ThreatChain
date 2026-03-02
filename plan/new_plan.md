# FYP Enhancement Plan: STIX Feature Extraction & Model Prediction Improvement

## Overview
This plan addresses two key improvements to the threat intelligence system:
1. **Update STIX sample files** with ML model-compatible features while maintaining STIX 2.1 format
2. **Enhance prediction pipeline** to extract features from the `content` field (JSON STIX data) in the database before running ML predictions

**Critical Constraint**: NO existing functionality will be affected. All changes are additive and backward-compatible.

---

## Current System Analysis

### Current STIX Structure
- **Location**: Root directory sample files
  - `sample-stix-2.1.json` - Basic STIX indicators
  - `sample-ransomware-attack.json` - Ransomware campaign
  - `sample-apt-campaign.json` - APT29 espionage campaign
  - `sample-stix-2.1 - part2.json` - Additional indicators

- **Current Features**: Standard STIX 2.1 objects (indicators, malware, threat-actors, relationships)
- **Missing**: ML model features needed for trust scoring

### Current Prediction Flow
```
Database (stix_reports table) 
  → Extract basic fields (severity, indicators_count, report_type)
  → extractFeaturesFromReport() creates estimated features
  → ML Service prediction
```

**Problem**: Features are estimated/hardcoded rather than extracted from actual STIX content

### ML Model Required Features
Based on `routes/trust.js` and `ml-service/app.py`:

**Numerical Features**:
- total_reports, vt_detections, abuse_score, confidence
- threatfox_iocs, mitre_confidence, asshole_score
- classification_confidence, reports_to_vt_ratio

**Categorical Features**:
- usage_type, country_code, threat_category, infrastructure_type

**Boolean Features** (0/1):
- suspicious_isp, young_domain, residential_proxy
- verified_identity, published_ip_ranges
- signal_abuse_reports, signal_vt_detections, signal_threatfox
- signal_suspicious_infra, signal_behavioral
- has_ssl_data, ssl_port_open

---

## Phase 1: Create Enhanced STIX Sample Files

### Task 1.1: Create New Testing Directory
**Action**: Create folder structure
```
testing_stix_files/
  ├── enhanced-ransomware-campaign.json
  ├── enhanced-apt-espionage.json
  ├── enhanced-botnet-activity.json
  ├── enhanced-phishing-campaign.json
  ├── enhanced-malware-distribution.json
  └── enhanced-ddos-attack.json
```

**Files to Create**: 6 new comprehensive STIX files

### Task 1.2: Design Enhanced STIX Schema
**Approach**: Extend STIX 2.1 with custom properties (x_* namespace)

**STIX Structure**:
```json
{
  "type": "bundle",
  "id": "bundle--[uuid]",
  "spec_version": "2.1",
  "name": "Campaign Name",
  "description": "Campaign description",
  "x_ml_features": {
    "numerical": {
      "total_reports": 42,
      "vt_detections": 15,
      "abuse_score": 75,
      "confidence": 85,
      "threatfox_iocs": 8,
      "mitre_confidence": 70,
      "asshole_score": 60,
      "classification_confidence": 80,
      "reports_to_vt_ratio": 2.8
    },
    "categorical": {
      "usage_type": "Data Center/Web Hosting/Transit",
      "country_code": "RU",
      "threat_category": "ransomware",
      "infrastructure_type": "datacenter"
    },
    "boolean": {
      "suspicious_isp": 1,
      "young_domain": 0,
      "residential_proxy": 0,
      "verified_identity": 1,
      "published_ip_ranges": 1,
      "signal_abuse_reports": 1,
      "signal_vt_detections": 1,
      "signal_threatfox": 1,
      "signal_suspicious_infra": 1,
      "signal_behavioral": 1,
      "has_ssl_data": 1,
      "ssl_port_open": 1
    }
  },
  "objects": [
    // Standard STIX 2.1 objects (indicators, malware, etc.)
  ]
}
```

**Why This Works**:
- ✅ Maintains STIX 2.1 compliance (custom properties use x_ prefix)
- ✅ Preserves all existing STIX objects and relationships
- ✅ Adds ML features in a structured, extractable format
- ✅ Backward compatible with existing parsers

### Task 1.3: Create 6 Enhanced STIX Files

**File 1: enhanced-ransomware-campaign.json**
- Threat: LockBit 3.0 ransomware
- Features: High abuse_score (85), high confidence (90)
- Indicators: File hashes, C2 domains, IPs
- Attack patterns: T1486 (Data Encrypted for Impact)

**File 2: enhanced-apt-espionage.json**
- Threat: APT29 (Cozy Bear) espionage
- Features: Medium-high abuse_score (70), very high confidence (95)
- Indicators: SUNBURST malware, C2 infrastructure
- Attack patterns: T1195.002 (Supply Chain Compromise)

**File 3: enhanced-botnet-activity.json**
- Threat: Mirai botnet variant
- Features: High abuse_score (80), medium confidence (65)
- Indicators: Botnet IPs, DGA domains
- Attack patterns: T1584 (Compromise Infrastructure)

**File 4: enhanced-phishing-campaign.json**
- Threat: Credential harvesting campaign
- Features: Medium abuse_score (60), high confidence (85)
- Indicators: Phishing domains, email indicators
- Attack patterns: T1566.001 (Spearphishing Attachment)

**File 5: enhanced-malware-distribution.json**
- Threat: Emotet malware distribution
- Features: High abuse_score (75), high confidence (88)
- Indicators: Malware hashes, distribution URLs
- Attack patterns: T1204 (User Execution)

**File 6: enhanced-ddos-attack.json**
- Threat: Distributed Denial of Service
- Features: Medium abuse_score (55), medium confidence (70)
- Indicators: Attack source IPs, amplification servers
- Attack patterns: T1498 (Network Denial of Service)

---

## Phase 2: Enhance Feature Extraction Pipeline

### Task 2.1: Create Feature Extractor Utility
**File**: `lib/trust-engine/StixFeatureExtractor.js`

**Purpose**: Extract ML features from STIX JSON content

**Functions**:
```javascript
class StixFeatureExtractor {
  // Extract features from STIX bundle
  extractFromBundle(stixBundle)
  
  // Extract from x_ml_features if present
  extractMLFeatures(bundle)
  
  // Calculate features from STIX objects (fallback)
  calculateFromObjects(objects)
  
  // Merge extracted + calculated features
  mergeFeatures(extracted, calculated, dbFields)
}
```

**Logic**:
1. Check if `x_ml_features` exists → use directly
2. If not, calculate from STIX objects:
   - Count indicators → total_reports
   - Analyze indicator types → threat_category
   - Check confidence values → confidence
   - Analyze relationships → behavioral signals
3. Merge with database fields (severity, indicators_count)
4. Return complete feature set

### Task 2.2: Update extractFeaturesFromReport()
**File**: `routes/trust.js`

**Current Implementation**:
```javascript
function extractFeaturesFromReport(report) {
  // Uses only DB fields: severity, indicators_count, report_type
  // Estimates/hardcodes most features
}
```

**New Implementation**:
```javascript
function extractFeaturesFromReport(report) {
  // Step 1: Parse content field (JSON STIX data)
  let stixContent = null;
  try {
    stixContent = JSON.parse(report.content);
  } catch (err) {
    console.warn('Failed to parse STIX content, using fallback');
  }
  
  // Step 2: Extract features from STIX content
  const StixFeatureExtractor = require('../lib/trust-engine/StixFeatureExtractor');
  const extractor = new StixFeatureExtractor();
  
  let features = {};
  if (stixContent) {
    features = extractor.extractFromBundle(stixContent);
  }
  
  // Step 3: Merge with DB fields (backward compatibility)
  const dbFeatures = {
    severity: report.severity,
    indicators_count: report.indicators_count,
    report_type: report.report_type
  };
  
  // Step 4: Fill missing features with intelligent defaults
  features = extractor.mergeFeatures(features, {}, dbFeatures);
  
  return features;
}
```

**Benefits**:
- ✅ Extracts real features from STIX content
- ✅ Falls back to DB fields if content parsing fails
- ✅ Maintains backward compatibility
- ✅ No changes to existing API contracts

### Task 2.3: Update TrustCalculator Integration
**File**: `lib/trust-engine/TrustCalculator.js`

**Changes**: Minimal - just ensure it uses the updated extractFeaturesFromReport()

**Verification**:
- Existing rule-based scoring continues to work
- XGBoost predictions use enhanced features
- No breaking changes to trust score API

---

## Phase 3: Testing & Validation

### Task 3.1: Unit Tests
**Create**: `tests/stix-feature-extraction.test.js`

**Test Cases**:
1. Extract features from enhanced STIX files
2. Fallback to DB fields when content is invalid
3. Handle missing x_ml_features gracefully
4. Verify all 30+ features are extracted correctly
5. Test backward compatibility with old STIX files

### Task 3.2: Integration Tests
**Test Scenarios**:
1. Upload enhanced STIX file → verify features extracted
2. Run prediction on report with enhanced features
3. Compare predictions: old method vs new method
4. Verify existing reports still work (no regression)

### Task 3.3: Manual Testing Checklist
- [ ] Upload each of 6 new STIX files
- [ ] Verify they appear in reports table
- [ ] Run trust score calculation on each
- [ ] Check ML predictions use extracted features
- [ ] Verify existing functionality unchanged:
  - [ ] Report listing works
  - [ ] Blockchain storage works
  - [ ] TAXII sharing works
  - [ ] Trust score dashboard works

---

## Phase 4: Documentation

### Task 4.1: Update Documentation Files
**Files to Update**:
- `README.md` - Add section on enhanced STIX features
- `USAGE_GUIDE.md` - Document new STIX format
- Create `STIX-ML-FEATURES.md` - Detailed feature documentation

### Task 4.2: Code Documentation
- Add JSDoc comments to StixFeatureExtractor
- Document x_ml_features schema
- Add inline comments explaining feature extraction logic

---

## Implementation Order

### Week 1: STIX Files Creation
1. Create `testing_stix_files/` directory
2. Design x_ml_features schema
3. Create 6 enhanced STIX files with diverse scenarios
4. Validate STIX 2.1 compliance

### Week 2: Feature Extraction
1. Create `StixFeatureExtractor.js`
2. Implement extraction logic
3. Update `extractFeaturesFromReport()`
4. Test with new STIX files

### Week 3: Integration & Testing
1. Integration testing with ML service
2. Regression testing on existing reports
3. Performance testing
4. Bug fixes



---

## Risk Mitigation

### Risk 1: Breaking Existing Functionality
**Mitigation**:
- All changes are additive (new folder, new utility)
- Fallback logic preserves old behavior
- Extensive regression testing

### Risk 2: STIX Compliance Issues
**Mitigation**:
- Use standard x_* custom properties
- Validate with STIX validator tools
- Keep standard STIX objects intact

### Risk 3: Performance Impact
**Mitigation**:
- JSON parsing is fast (< 1ms for typical reports)
- Cache extracted features if needed
- Monitor prediction latency

### Risk 4: Missing Features in Old Reports
**Mitigation**:
- Intelligent defaults for missing features
- Gradual migration strategy
- Old reports continue to work with estimated features

---

## Success Criteria

### Functional Requirements
✅ 6 new enhanced STIX files created in `testing_stix_files/`
✅ All files maintain STIX 2.1 compliance
✅ ML features embedded in x_ml_features namespace
✅ StixFeatureExtractor successfully extracts all features
✅ Predictions use real features from STIX content
✅ Backward compatibility maintained (100% existing tests pass)

### Quality Requirements
✅ Code coverage > 80% for new code
✅ No performance degradation (< 5% latency increase)
✅ Documentation complete and accurate
✅ All edge cases handled gracefully

### Business Requirements
✅ More accurate ML predictions
✅ Better trust scores for threat intelligence
✅ Improved system reliability
✅ Foundation for future ML enhancements

---

## Next Steps

1. **Review this plan** with team/advisor
2. **Approve schema design** for x_ml_features
3. **Start Phase 1** - Create testing_stix_files directory
4. **Implement incrementally** - one phase at a time
5. **Test continuously** - no surprises at the end

---

## Notes

- This plan is designed to be **non-disruptive**
- All changes are **backward compatible**
- Implementation is **incremental and testable**
- Focus is on **quality over speed**
- **No existing functionality will break**

---

**Plan Created**: March 1, 2026
**Status**: Ready for Implementation
**Estimated Duration**: 4 weeks
**Risk Level**: Low (due to backward compatibility design)
