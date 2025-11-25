"use client"

import { useState, useRef } from "react"
import { Upload, FileCheck, AlertTriangle, CheckCircle2, XCircle, FileText, Settings, Shield, Database } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface ValidationResult {
  fileName: string
  fileType: string
  size: string
  status: "compatible" | "convertible" | "rejected"
  stixVersion?: string
  issues: string[]
  recommendations: string[]
  canConvert: boolean
  conversionPath?: string
}

interface PolicyRule {
  id: string
  name: string
  description: string
  enabled: boolean
  severity: "low" | "medium" | "high" | "critical"
}

const cardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "0.75rem",
}

const supportedFormats = [
  { format: "STIX 2.1", extension: ".json", status: "native", description: "Native format - no conversion needed" },
  { format: "STIX 2.0", extension: ".json", status: "convertible", description: "Can be upgraded to STIX 2.1" },
  { format: "STIX 1.x", extension: ".xml", status: "convertible", description: "Can be migrated to STIX 2.1" },
  { format: "OpenIOC", extension: ".xml", status: "convertible", description: "Can be converted to STIX 2.1" },
  { format: "YARA Rules", extension: ".yar", status: "convertible", description: "Can be wrapped in STIX 2.1" },
  { format: "CSV Threat Intel", extension: ".csv", status: "convertible", description: "Can be structured as STIX 2.1" },
  { format: "MISP JSON", extension: ".json", status: "convertible", description: "Can be converted to STIX 2.1" },
]

const defaultPolicyRules: PolicyRule[] = [
  {
    id: "stix-compliance",
    name: "STIX 2.1 Format Compliance",
    description: "All reports must conform to STIX 2.1 specification",
    enabled: true,
    severity: "critical"
  },
  {
    id: "file-size-limit",
    name: "File Size Validation",
    description: "Maximum file size: 50MB for individual reports",
    enabled: true,
    severity: "high"
  },
  {
    id: "malware-scan",
    name: "Malware Detection",
    description: "Scan all uploaded files for malicious content",
    enabled: true,
    severity: "critical"
  },
  {
    id: "source-verification",
    name: "Source Attribution Check",
    description: "Verify source identity and credibility",
    enabled: true,
    severity: "medium"
  },
  {
    id: "timestamp-validation",
    name: "Timestamp Verification",
    description: "Validate all timestamps are within acceptable range",
    enabled: true,
    severity: "medium"
  },
  {
    id: "duplicate-detection",
    name: "Duplicate Content Detection",
    description: "Check for duplicate indicators and reports",
    enabled: true,
    severity: "low"
  },
  {
    id: "pattern-validation",
    name: "Indicator Pattern Validation",
    description: "Validate STIX patterns and cyber observables",
    enabled: true,
    severity: "high"
  },
  {
    id: "encryption-check",
    name: "Encryption Requirements",
    description: "Ensure sensitive data is properly encrypted",
    enabled: true,
    severity: "high"
  }
]

export default function PolicyValidation() {
  const [activeTab, setActiveTab] = useState("validation")
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [policyRules, setPolicyRules] = useState<PolicyRule[]>(defaultPolicyRules)
  const [strictMode, setStrictMode] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsValidating(true)
    const results: ValidationResult[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      await new Promise(resolve => setTimeout(resolve, 800)) // Simulate validation time
      
      const result = await validateFile(file)
      results.push(result)
    }

    setValidationResults(results)
    setIsValidating(false)
  }

  const validateFile = async (file: File): Promise<ValidationResult> => {
    const fileName = file.name
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'))
    const fileSize = `${(file.size / 1024).toFixed(1)} KB`
    
    // Simulate file content analysis
    let fileType = "Unknown"
    let stixVersion = undefined
    let status: "compatible" | "convertible" | "rejected" = "rejected"
    let issues: string[] = []
    let recommendations: string[] = []
    let canConvert = false
    let conversionPath = undefined

    // Determine file type and compatibility
    if (fileExtension === '.json') {
      // Simulate JSON parsing and STIX detection
      if (fileName.includes('stix') || fileName.includes('2.1')) {
        fileType = "STIX 2.1"
        stixVersion = "2.1"
        status = "compatible"
        recommendations.push("File is ready for direct import")
      } else if (fileName.includes('2.0') || Math.random() > 0.7) {
        fileType = "STIX 2.0"
        stixVersion = "2.0"
        status = "convertible"
        canConvert = true
        conversionPath = "STIX 2.0 → STIX 2.1"
        issues.push("Older STIX version detected")
        recommendations.push("Automatic upgrade to STIX 2.1 available")
      } else {
        fileType = "MISP JSON"
        status = "convertible"
        canConvert = true
        conversionPath = "MISP JSON → STIX 2.1"
        recommendations.push("Can be converted to STIX 2.1 format")
      }
    } else if (fileExtension === '.xml') {
      if (Math.random() > 0.5) {
        fileType = "STIX 1.x"
        stixVersion = "1.2"
        status = "convertible"
        canConvert = true
        conversionPath = "STIX 1.x → STIX 2.1"
        issues.push("Legacy STIX format")
        recommendations.push("Migration to STIX 2.1 recommended")
      } else {
        fileType = "OpenIOC"
        status = "convertible"
        canConvert = true
        conversionPath = "OpenIOC → STIX 2.1"
        recommendations.push("Can be wrapped in STIX 2.1 indicators")
      }
    } else if (fileExtension === '.csv') {
      fileType = "CSV Threat Intel"
      status = "convertible"
      canConvert = true
      conversionPath = "CSV → STIX 2.1"
      recommendations.push("Can be structured as STIX 2.1 indicators")
    } else if (fileExtension === '.yar') {
      fileType = "YARA Rules"
      status = "convertible"
      canConvert = true
      conversionPath = "YARA → STIX 2.1"
      recommendations.push("Can be embedded in STIX 2.1 patterns")
    } else {
      fileType = "Unsupported Format"
      status = "rejected"
      issues.push("File format not supported")
      issues.push("Only JSON, XML, CSV, and YARA files are accepted")
    }

    // Add common validation checks
    if (file.size > 50 * 1024 * 1024) { // 50MB
      issues.push("File size exceeds 50MB limit")
      if (status !== "rejected") status = "rejected"
    }

    if (strictMode && status === "convertible") {
      issues.push("Strict mode: Only native STIX 2.1 files allowed")
      status = "rejected"
    }

    return {
      fileName,
      fileType,
      size: fileSize,
      status,
      stixVersion,
      issues,
      recommendations,
      canConvert,
      conversionPath
    }
  }

  const togglePolicyRule = (ruleId: string) => {
    setPolicyRules(prev => 
      prev.map(rule => 
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compatible":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case "convertible":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <FileCheck className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compatible":
        return "bg-green-100 text-green-800 border-green-200"
      case "convertible":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Policy & Validation</h2>
        <p className="text-sm text-gray-600 mt-1">
          Validate threat intelligence reports and manage system policies
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="validation" className="flex items-center gap-2">
            <FileCheck className="w-4 h-4" />
            File Validation
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Policy Rules
          </TabsTrigger>
          <TabsTrigger value="formats" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Supported Formats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="validation" className="space-y-6 mt-6">
          {/* Upload Section */}
          <div style={cardStyle} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload & Validate Reports</h3>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={strictMode}
                    onChange={(e) => setStrictMode(e.target.checked)}
                    className="rounded"
                  />
                  Strict Mode
                </label>
              </div>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Upload threat intelligence reports for validation
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supports: JSON (STIX), XML (STIX 1.x, OpenIOC), CSV, YARA files
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".json,.xml,.csv,.yar"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isValidating}
              >
                {isValidating ? "Validating..." : "Select Files"}
              </Button>
            </div>
          </div>

          {/* Validation Progress */}
          {isValidating && (
            <div style={cardStyle} className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Validation in Progress</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                  <span className="text-sm">Analyzing file format and structure...</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
            </div>
          )}

          {/* Validation Results */}
          {validationResults.length > 0 && (
            <div style={cardStyle} className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Validation Results ({validationResults.length} files)
              </h3>
              <div className="space-y-4">
                {validationResults.map((result, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <p className="font-medium text-gray-900">{result.fileName}</p>
                          <p className="text-sm text-gray-600">
                            {result.fileType} • {result.size}
                            {result.stixVersion && ` • STIX ${result.stixVersion}`}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(result.status)}`}>
                        {result.status.toUpperCase()}
                      </span>
                    </div>

                    {result.conversionPath && (
                      <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <strong>Conversion Path:</strong> {result.conversionPath}
                        </p>
                      </div>
                    )}

                    {result.issues.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-red-700 mb-2">Issues Found:</p>
                        <ul className="text-sm text-red-600 space-y-1">
                          {result.issues.map((issue, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-red-600 rounded-full" />
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.recommendations.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-green-700 mb-2">Recommendations:</p>
                        <ul className="text-sm text-green-600 space-y-1">
                          {result.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.canConvert && result.status === "convertible" && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          Convert to STIX 2.1
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="policies" className="space-y-6 mt-6">
          <div style={cardStyle} className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Policy Rules</h3>
            <p className="text-sm text-gray-600 mb-6">
              Configure validation rules and security policies for threat intelligence processing
            </p>
            
            <div className="space-y-4">
              {policyRules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">{rule.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(rule.severity)}`}>
                        {rule.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{rule.description}</p>
                  </div>
                  <button
                    onClick={() => togglePolicyRule(rule.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      rule.enabled ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        rule.enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={cardStyle} className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Policy Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {policyRules.filter(r => r.enabled).length}
                </p>
                <p className="text-sm text-green-700">Active Rules</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">
                  {policyRules.filter(r => r.severity === "critical" && r.enabled).length}
                </p>
                <p className="text-sm text-red-700">Critical Rules</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">
                  {policyRules.filter(r => r.severity === "high" && r.enabled).length}
                </p>
                <p className="text-sm text-orange-700">High Priority</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {policyRules.filter(r => !r.enabled).length}
                </p>
                <p className="text-sm text-blue-700">Disabled</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="formats" className="space-y-6 mt-6">
          <div style={cardStyle} className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Supported File Formats</h3>
            <p className="text-sm text-gray-600 mb-6">
              ThreadChain supports various threat intelligence formats with automatic conversion to STIX 2.1
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supportedFormats.map((format, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{format.format}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      format.status === "native" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                    }`}>
                      {format.status === "native" ? "NATIVE" : "CONVERTIBLE"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{format.description}</p>
                  <p className="text-xs text-gray-500">Extension: {format.extension}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={cardStyle} className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2 text-left">Source Format</th>
                    <th className="px-4 py-2 text-left">Target Format</th>
                    <th className="px-4 py-2 text-left">Conversion Type</th>
                    <th className="px-4 py-2 text-left">Data Loss</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2">STIX 2.0</td>
                    <td className="px-4 py-2">STIX 2.1</td>
                    <td className="px-4 py-2">Automatic Upgrade</td>
                    <td className="px-4 py-2 text-green-600">None</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2">STIX 1.x</td>
                    <td className="px-4 py-2">STIX 2.1</td>
                    <td className="px-4 py-2">Schema Migration</td>
                    <td className="px-4 py-2 text-yellow-600">Minimal</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2">OpenIOC</td>
                    <td className="px-4 py-2">STIX 2.1</td>
                    <td className="px-4 py-2">Format Translation</td>
                    <td className="px-4 py-2 text-yellow-600">Minimal</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2">CSV</td>
                    <td className="px-4 py-2">STIX 2.1</td>
                    <td className="px-4 py-2">Structure Mapping</td>
                    <td className="px-4 py-2 text-orange-600">Moderate</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}