const fs = require('fs');
const path = require('path');

/**
 * Data Preparation & Feature Engineering Script
 * Converts STIX JSON data into ML-ready format
 */

class DatasetPreparation {
  constructor() {
    this.datasetPath = './all_dataset/stix_feed_pretty.json';
    this.outputDir = './data/ml';
  }

  /**
   * Parse STIX JSON data and extract features
   */
  async parseDataset() {
    console.log('🔍 Parsing STIX dataset...');
    
    try {
      const rawData = fs.readFileSync(this.datasetPath, 'utf8');
      const jsonData = JSON.parse(rawData);
      
      // Ensure jsonData is an array
      const indicators = Array.isArray(jsonData) ? jsonData : jsonData.objects || [jsonData];
      
      console.log(`📊 Found ${indicators.length} indicators in dataset`);
      
      const extractedData = [];
      
      for (let i = 0; i < indicators.length; i++) {
        const indicator = indicators[i];
        
        if (indicator.type === 'indicator' || indicator.x_dugganusa_threat_intel) {
          const features = this.extractFeatures(indicator);
          
          if (features) {
            extractedData.push(features);
          }
        }
      }
      
      console.log(`✅ Successfully extracted features from ${extractedData.length} indicators`);
      return extractedData;
    } catch (error) {
      console.error('❌ Error parsing dataset:', error);
      throw error;
    }
  }

  /**
   * Extract features from a single STIX indicator
   */
  extractFeatures(indicator) {
    try {
      // Safely extract nested properties with defaults
      const threatIntel = indicator.x_dugganusa_threat_intel || {};
      const discovery = indicator.x_dugganusa_discovery || {};
      const botClassification = indicator.x_dugganusa_bot_classification || {};
      
      // Numerical features
      const totalReports = threatIntel.total_reports || 0;
      const vtDetections = threatIntel.vt_detections || 0;
      const abuseScore = threatIntel.abuse_score || 0;
      const confidence = indicator.confidence || 50; // Default confidence
      const threatfoxIocs = threatIntel.threatfox_iocs || 0;
      const mitreConfidence = threatIntel.mitre_confidence || 0;
      const assholeScore = threatIntel.asshole_score || 0;
      const classificationConfidence = botClassification.classification_confidence || 0;
      
      // Categorical features (with defaults)
      const usageType = threatIntel.usage_type || 'unknown';
      const countryCode = (discovery.geolocation && discovery.geolocation.country_code) || 'unknown';
      const threatCategory = botClassification.threat_category || 'unknown';
      const infrastructureType = botClassification.infrastructure_type || 'unknown';
      
      // Boolean features
      const suspiciousIsp = threatIntel.suspicious_isp || false;
      const youngDomain = threatIntel.young_domain || false;
      const residentialProxy = botClassification.residential_proxy || false;
      const verifiedIdentity = botClassification.verified_identity || false;
      const publishedIpRanges = botClassification.published_ip_ranges || false;
      
      // Detection signals
      const detectionSignals = botClassification.detection_signals || {};
      const signalAbuseReports = detectionSignals.abuse_reports || false;
      const signalVtDetections = detectionSignals.virus_total_detections || false;
      const signalThreatfox = detectionSignals.threatfox_iocs || false;
      const signalSuspiciousInfra = detectionSignals.suspicious_infrastructure || false;
      const signalBehavioral = detectionSignals.behavioral_analysis || false;
      
      // Derived features
      const reportsToVtRatio = totalReports / (vtDetections + 1); // +1 to avoid division by zero
      const hasSslData = !!(threatIntel.ssl_tls_enrichment);
      const sslPortOpen = (threatIntel.ssl_tls_enrichment && threatIntel.ssl_tls_enrichment.https_port_open) || false;
      
      // Target variables
      const targetAbuseScore = threatIntel.abuse_score || 0;
      const targetConfidence = indicator.confidence || 50;
      const targetAutoBlocked = threatIntel.auto_blocked || false;
      
      return {
        // Target variables
        target_abuse_score: targetAbuseScore,
        target_confidence: targetConfidence,
        target_auto_blocked: targetAutoBlocked ? 1 : 0,
        
        // Numerical features
        total_reports: totalReports,
        vt_detections: vtDetections,
        abuse_score: abuseScore,
        confidence: confidence,
        threatfox_iocs: threatfoxIocs,
        mitre_confidence: mitreConfidence,
        asshole_score: assholeScore,
        classification_confidence: classificationConfidence,
        
        // Categorical features (will be encoded later)
        usage_type: usageType,
        country_code: countryCode,
        threat_category: threatCategory,
        infrastructure_type: infrastructureType,
        
        // Boolean features
        suspicious_isp: suspiciousIsp ? 1 : 0,
        young_domain: youngDomain ? 1 : 0,
        residential_proxy: residentialProxy ? 1 : 0,
        verified_identity: verifiedIdentity ? 1 : 0,
        published_ip_ranges: publishedIpRanges ? 1 : 0,
        
        // Detection signals
        signal_abuse_reports: signalAbuseReports ? 1 : 0,
        signal_vt_detections: signalVtDetections ? 1 : 0,
        signal_threatfox: signalThreatfox ? 1 : 0,
        signal_suspicious_infra: signalSuspiciousInfra ? 1 : 0,
        signal_behavioral: signalBehavioral ? 1 : 0,
        
        // Derived features
        reports_to_vt_ratio: reportsToVtRatio,
        has_ssl_data: hasSslData ? 1 : 0,
        ssl_port_open: sslPortOpen ? 1 : 0,
        
        // Additional metadata
        id: indicator.id || `indicator_${Math.random().toString(36).substr(2, 9)}`
      };
    } catch (error) {
      console.warn('⚠️ Error extracting features from indicator:', error.message);
      return null;
    }
  }

  /**
   * Split dataset into train/validation/test sets (70/15/15)
   */
  splitDataset(data) {
    console.log('🔄 Splitting dataset into train/validation/test sets...');
    
    // Shuffle the data
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    
    const trainSplit = Math.floor(shuffled.length * 0.7);
    const validationSplit = Math.floor(shuffled.length * 0.85); // 70% train, 15% validation, 15% test
    
    const train = shuffled.slice(0, trainSplit);
    const validation = shuffled.slice(trainSplit, validationSplit);
    const test = shuffled.slice(validationSplit);
    
    console.log(`📊 Train set: ${train.length} samples`);
    console.log(`📊 Validation set: ${validation.length} samples`);
    console.log(`📊 Test set: ${test.length} samples`);
    
    return { train, validation, test };
  }

  /**
   * Write data to CSV files
   */
  async writeCsvFiles(splits) {
    console.log('💾 Writing CSV files...');
    
    const writeSplit = (data, filename) => {
      if (data.length === 0) {
        console.warn(`⚠️ Warning: ${filename} is empty!`);
        return;
      }
      
      const keys = Object.keys(data[0]);
      const csvHeader = keys.join(',');
      const csvRows = data.map(row => {
        return keys.map(key => {
          const value = row[key];
          if (typeof value === 'string') {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',');
      });
      
      const csvContent = [csvHeader, ...csvRows].join('\n');
      fs.writeFileSync(path.join(this.outputDir, filename), csvContent);
      console.log(`✅ Created ${filename} with ${data.length} rows`);
    };
    
    writeSplit(splits.train, 'train.csv');
    writeSplit(splits.validation, 'validation.csv');
    writeSplit(splits.test, 'test.csv');
    
    // Write full dataset
    const allData = [...splits.train, ...splits.validation, ...splits.test];
    writeSplit(allData, 'training_data.csv');
    
    // Write feature metadata
    const featureMetadata = {
      numerical_features: [
        'total_reports', 'vt_detections', 'abuse_score', 'confidence', 
        'threatfox_iocs', 'mitre_confidence', 'asshole_score', 'classification_confidence',
        'reports_to_vt_ratio'
      ],
      categorical_features: [
        'usage_type', 'country_code', 'threat_category', 'infrastructure_type'
      ],
      boolean_features: [
        'suspicious_isp', 'young_domain', 'residential_proxy', 'verified_identity',
        'published_ip_ranges', 'signal_abuse_reports', 'signal_vt_detections',
        'signal_threatfox', 'signal_suspicious_infra', 'signal_behavioral',
        'has_ssl_data', 'ssl_port_open'
      ],
      target_features: [
        'target_abuse_score', 'target_confidence', 'target_auto_blocked'
      ]
    };
    
    fs.writeFileSync(
      path.join(this.outputDir, 'feature_metadata.json'),
      JSON.stringify(featureMetadata, null, 2)
    );
    
    console.log('✅ Created feature metadata file');
  }

  /**
   * Main execution function
   */
  async run() {
    try {
      console.log('🚀 Starting dataset preparation...');
      
      // Create output directory if it doesn't exist
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }
      
      // Parse and extract features
      const extractedData = await this.parseDataset();
      
      if (extractedData.length === 0) {
        throw new Error('No valid data extracted from dataset');
      }
      
      // Split dataset
      const splits = this.splitDataset(extractedData);
      
      // Write CSV files
      await this.writeCsvFiles(splits);
      
      console.log('✅ Dataset preparation completed successfully!');
      
      return {
        total_samples: extractedData.length,
        train_samples: splits.train.length,
        validation_samples: splits.validation.length,
        test_samples: splits.test.length
      };
    } catch (error) {
      console.error('❌ Dataset preparation failed:', error);
      throw error;
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const prep = new DatasetPreparation();
  prep.run()
    .then(results => {
      console.log('\n📈 Dataset preparation results:');
      console.log(JSON.stringify(results, null, 2));
    })
    .catch(error => {
      console.error('\n💥 Error:', error);
      process.exit(1);
    });
}

module.exports = DatasetPreparation;