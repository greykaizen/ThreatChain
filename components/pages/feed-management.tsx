"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, ArrowRight, Check, Network, FileText, Database, Settings, Send, Loader2, Globe, Server, CheckCircle2, Download } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface FeedAttribute {
  name: string
  type: string
  sampleValue: string
  selected: boolean
}

interface FeedManagementProps {
  onProceedToGraph: (selectedAttributes: FeedAttribute[], csvData: any[]) => void
}

const cardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "0.75rem",
}

export default function FeedManagement({ onProceedToGraph }: FeedManagementProps) {
  const [activeTab, setActiveTab] = useState("extraction")
  const [sourcesTab, setSourcesTab] = useState("external")
  const [settingsTab, setSettingsTab] = useState("general")
  const [step, setStep] = useState<"upload" | "attributes">("upload")
  const [attributes, setAttributes] = useState<FeedAttribute[]>([])
  const [csvData, setCsvData] = useState<any[]>([])
  const [fileName, setFileName] = useState<string>("")
  const [feedUrl, setFeedUrl] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentProgress, setCurrentProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [feedMessages, setFeedMessages] = useState<Array<{ type: "user" | "system" | "progress"; content: string; progress?: number; step?: string }>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const serverFeeds = [
    { id: 1, name: "Global Threat Intelligence Feed", description: "Curated global threat data", subscribers: 1234 },
    { id: 2, name: "Malware Indicators Feed", description: "Latest malware IOCs and signatures", subscribers: 892 },
    { id: 3, name: "Phishing Campaign Feed", description: "Active phishing campaigns and domains", subscribers: 756 },
    { id: 4, name: "Vulnerability Intelligence", description: "CVE and vulnerability data", subscribers: 2103 },
  ]

  const handleAddFeed = async () => {
    if (!feedUrl.trim()) return
    
    setIsProcessing(true)
    setFeedMessages([...feedMessages, { type: "user", content: feedUrl }])
    const url = feedUrl
    setFeedUrl("")

    const progressSteps = [
      { step: "Connecting to source...", progress: 15, delay: 800 },
      { step: "Fetching feed data...", progress: 35, delay: 1200 },
      { step: "Parsing data structure...", progress: 55, delay: 1000 },
      { step: "Extracting threat indicators...", progress: 75, delay: 1200 },
      { step: "Validating data integrity...", progress: 90, delay: 800 },
      { step: "Finalizing import...", progress: 100, delay: 600 },
    ]

    // Add progress message
    setFeedMessages(prev => [...prev, { 
      type: "progress", 
      content: "Starting feed cloning process...",
      progress: 0,
      step: "Initializing..."
    }])

    // Simulate progress steps
    for (let i = 0; i < progressSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, progressSteps[i].delay))
      setCurrentProgress(progressSteps[i].progress)
      setCurrentStep(progressSteps[i].step)
      
      setFeedMessages(prev => {
        const newMessages = [...prev]
        newMessages[newMessages.length - 1] = {
          type: "progress",
          content: progressSteps[i].step,
          progress: progressSteps[i].progress,
          step: progressSteps[i].step
        }
        return newMessages
      })
    }

    // Final success message
    setTimeout(() => {
      setFeedMessages(prev => {
        const filtered = prev.filter(msg => msg.type !== "progress")
        return [...filtered, { 
          type: "system", 
          content: `✓ Successfully cloned feed from ${url}\n\nExtracted 1,247 threat indicators including:\n• 342 malware hashes\n• 189 malicious IPs\n• 156 suspicious domains\n• 560 other IOCs\n\nFeed is now active and syncing.` 
        }]
      })
      setIsProcessing(false)
      setCurrentProgress(0)
      setCurrentStep("")
    }, 500)
  }

  const detectType = (value: string): string => {
    if (!value || value.trim() === "") return "string"
    if (!isNaN(Number(value))) return "number"
    if (value.match(/^\d{4}-\d{2}-\d{2}/)) return "datetime"
    if (value.startsWith("[") || value.startsWith("{")) return "array"
    return "string"
  }

  const parseXML = (text: string): any[] => {
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(text, "text/xml")
      
      // Check for parsing errors
      const parserError = xmlDoc.querySelector("parsererror")
      if (parserError) {
        console.error("XML parsing error:", parserError.textContent)
        return []
      }

      // Find the root element and its children
      const rootElement = xmlDoc.documentElement
      const childElements = Array.from(rootElement.children)
      
      if (childElements.length === 0) return []

      // Extract data from XML elements
      const data: any[] = []
      
      childElements.forEach((element) => {
        const row: any = {}
        
        // Get all child elements and attributes
        Array.from(element.children).forEach((child) => {
          row[child.tagName] = child.textContent || ""
        })
        
        // Also include attributes
        Array.from(element.attributes).forEach((attr) => {
          row[attr.name] = attr.value
        })
        
        // If no children, use the element's text content
        if (Object.keys(row).length === 0 && element.textContent) {
          row[element.tagName] = element.textContent
        }
        
        if (Object.keys(row).length > 0) {
          data.push(row)
        }
      })

      return data
    } catch (error) {
      console.error("Error parsing XML:", error)
      return []
    }
  }

  const parseCSV = (text: string): any[] => {
    const lines = text.split("\n").filter((line) => line.trim())
    if (lines.length === 0) return []

    // Better CSV parsing that handles quoted fields and commas inside quotes
    const parseLine = (line: string): string[] => {
      const result: string[] = []
      let current = ""
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const nextChar = line[i + 1]

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"'
            i++
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === "," && !inQuotes) {
          result.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }

    const headers = parseLine(lines[0])
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i])
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })
      data.push(row)
    }

    return data
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()

    reader.onload = (e) => {
      const text = e.target?.result as string
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      
      let parsedData: any[] = []
      
      // Parse based on file type
      if (fileExtension === 'xml') {
        parsedData = parseXML(text)
      } else if (fileExtension === 'csv') {
        parsedData = parseCSV(text)
      } else {
        // Try CSV as default
        parsedData = parseCSV(text)
      }

      if (parsedData.length > 0) {
        setCsvData(parsedData)
        const headers = Object.keys(parsedData[0])
        const detectedAttributes: FeedAttribute[] = headers.map((header) => ({
          name: header,
          type: detectType(parsedData[0][header]),
          sampleValue: parsedData[0][header],
          selected: true,
        }))
        setAttributes(detectedAttributes)
        setStep("attributes")
      } else {
        alert(`Failed to parse ${fileExtension?.toUpperCase() || 'file'}. Please check the file format.`)
      }
    }

    reader.readAsText(file)
  }

  const toggleAttribute = (index: number) => {
    setAttributes((prev) =>
      prev.map((attr, i) => (i === index ? { ...attr, selected: !attr.selected } : attr))
    )
  }

  const handleProceedToGraph = () => {
    const selectedAttrs = attributes.filter((a) => a.selected)
    onProceedToGraph(selectedAttrs, csvData)
  }

  const selectedCount = attributes.filter((a) => a.selected).length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Feed Management</h2>
        <p className="text-sm text-gray-600 mt-1">Manage threat intelligence feeds and data sources</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="extraction" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Feed Extraction
          </TabsTrigger>
          <TabsTrigger value="sources" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Data Sources
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="extraction" className="space-y-6 mt-6">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm ${step === "upload" ? "text-blue-600 font-medium" : "text-gray-400"}`}
            >
              1. Upload CSV File
            </span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span
              className={`text-sm ${step === "attributes" ? "text-blue-600 font-medium" : "text-gray-400"}`}
            >
              2. Choose Attributes
            </span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">3. Build Knowledge Graph</span>
          </div>

          {step === "upload" && (
        <div style={cardStyle} className="p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-lg bg-blue-50 flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Your Data File</h3>
            <p className="text-sm text-gray-600 mb-6 text-center max-w-md">
              Upload a CSV or XML file containing threat intelligence data. The system will automatically detect
              attributes and their types.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xml"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              style={{ transition: "all 150ms ease" }}
            >
              <Upload className="w-5 h-5" />
              Select Data File
            </button>
            <p className="text-xs text-gray-500 mt-4">Supported formats: CSV (.csv), XML (.xml)</p>
          </div>
        </div>
      )}

      {step === "attributes" && (
        <>
          <div style={cardStyle} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Detected Attributes ({selectedCount} selected)
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  From file: <span className="font-mono">{fileName}</span> ({csvData.length} rows)
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep("upload")}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  style={{ transition: "all 150ms ease" }}
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Upload New File
                </button>
                <button
                  onClick={handleProceedToGraph}
                  disabled={selectedCount < 2}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    selectedCount >= 2
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                  style={{ transition: "all 150ms ease" }}
                >
                  <Network className="w-4 h-4" />
                  View Full Knowledge Graph
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Select the attributes you want to include in the knowledge graph. You'll define relationships in the next step.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {attributes.map((attr, index) => (
                <div
                  key={index}
                  onClick={() => toggleAttribute(index)}
                  className={`p-4 rounded-lg border cursor-pointer ${
                    attr.selected
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-blue-200"
                  }`}
                  style={{ transition: "all 150ms ease" }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{attr.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                          {attr.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 font-mono truncate">{attr.sampleValue}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ml-2 ${
                        attr.selected ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      {attr.selected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={cardStyle} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Selected Attributes Summary</p>
                <p className="text-xs text-gray-600 mt-1">
                  {attributes
                    .filter((a) => a.selected)
                    .map((a) => a.name)
                    .join(", ")}
                </p>
              </div>
              <span className="text-2xl font-bold text-blue-600">{selectedCount}</span>
            </div>
          </div>

          {/* Knowledge Graph Preview */}
          <div style={cardStyle} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Knowledge Graph Preview</h3>
                <p className="text-sm text-gray-600 mt-1">Auto-generated relationships from your data</p>
              </div>
            </div>
            <KnowledgeGraphPreview attributes={attributes.filter(a => a.selected)} csvData={csvData} />
          </div>

          <div style={cardStyle} className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Preview (First 5 Rows)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {attributes
                      .filter((a) => a.selected)
                      .map((attr) => (
                        <th key={attr.name} className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                          {attr.name}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-gray-100">
                      {attributes
                        .filter((a) => a.selected)
                        .map((attr) => (
                          <td key={attr.name} className="px-4 py-2 text-gray-900">
                            {row[attr.name]}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Showing 5 of {csvData.length} total rows
            </p>
          </div>
        </>
      )}
        </TabsContent>

        <TabsContent value="sources" className="space-y-6 mt-6">
          <Tabs value={sourcesTab} onValueChange={setSourcesTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="external" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Clone External Feed
              </TabsTrigger>
              <TabsTrigger value="server" className="flex items-center gap-2">
                <Server className="w-4 h-4" />
                Server Feeds
              </TabsTrigger>
            </TabsList>

            <TabsContent value="external" className="space-y-6 mt-6">
              {/* Example URLs Card */}
              <div style={cardStyle} className="p-4 bg-blue-50 border-blue-200">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">📋 Try These Example URLs:</h4>
                <div className="space-y-1">
                  <button 
                    onClick={() => setFeedUrl("https://feeds.threatintel.com/malware-iocs.json")}
                    className="block w-full text-left text-xs font-mono text-blue-700 hover:text-blue-900 hover:underline"
                  >
                    https://feeds.threatintel.com/malware-iocs.json
                  </button>
                  <button 
                    onClick={() => setFeedUrl("https://api.cyberthreat.io/v1/indicators/latest")}
                    className="block w-full text-left text-xs font-mono text-blue-700 hover:text-blue-900 hover:underline"
                  >
                    https://api.cyberthreat.io/v1/indicators/latest
                  </button>
                  <button 
                    onClick={() => setFeedUrl("https://threat-feeds.security.org/phishing-domains.xml")}
                    className="block w-full text-left text-xs font-mono text-blue-700 hover:text-blue-900 hover:underline"
                  >
                    https://threat-feeds.security.org/phishing-domains.xml
                  </button>
                </div>
              </div>

              <div style={cardStyle} className="p-6 flex flex-col h-[600px]">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Clone External Feed</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Paste a URL to clone threat intelligence feeds from external sources
                </p>
                
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-3 p-4 bg-gray-50 rounded-lg">
                  {feedMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Globe className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-400 text-sm">Enter a feed URL to get started</p>
                      <p className="text-gray-400 text-xs mt-1">Supports JSON, XML, CSV, and RSS feeds</p>
                    </div>
                  ) : (
                    feedMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.type === "progress" ? (
                          <div className="w-full bg-white border border-gray-200 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              <span className="text-sm font-medium text-gray-900">{msg.step}</span>
                            </div>
                            <Progress value={msg.progress} className="h-2 mb-2" />
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Cloning feed...</span>
                              <span className="text-xs font-medium text-blue-600">{msg.progress}%</span>
                            </div>
                          </div>
                        ) : (
                          <div className={`max-w-[85%] p-3 rounded-lg ${
                            msg.type === "user" 
                              ? "bg-blue-600 text-white" 
                              : "bg-white border border-gray-200 text-gray-900"
                          }`}>
                            {msg.type === "system" && msg.content.startsWith("✓") && (
                              <div className="flex items-start gap-2 mb-2">
                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-sm font-medium text-green-600">Feed Cloned Successfully</span>
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-line">{msg.content}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Input Area */}
                <div className="flex gap-2">
                  <Input
                    value={feedUrl}
                    onChange={(e) => setFeedUrl(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddFeed()}
                    placeholder="https://example.com/threat-feed.json"
                    disabled={isProcessing}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleAddFeed} 
                    disabled={!feedUrl.trim() || isProcessing}
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="server" className="space-y-6 mt-6">
              <div style={cardStyle} className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Server className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">ThreadChain Server Feeds</h3>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Subscribe to curated threat intelligence feeds from our network
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {serverFeeds.map((feed) => (
                    <div key={feed.id} style={cardStyle} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{feed.name}</h4>
                          <p className="text-xs text-gray-600 mb-2">{feed.description}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{feed.subscribers.toLocaleString()} subscribers</span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" className="w-full mt-2">
                        Subscribe
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 mt-6">
          <Tabs value={settingsTab} onValueChange={setSettingsTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="privacy">Privacy & Sources</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6 mt-6">
              <div style={cardStyle} className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Feed Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-900 block mb-2">
                      Auto-sync Interval
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                      <option>Every hour</option>
                      <option>Every 6 hours</option>
                      <option>Every 12 hours</option>
                      <option>Daily</option>
                      <option>Manual only</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 block mb-2">
                      Data Retention Period
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                      <option>30 days</option>
                      <option>60 days</option>
                      <option>90 days</option>
                      <option>1 year</option>
                      <option>Indefinite</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Enable automatic deduplication</p>
                      <p className="text-xs text-gray-500">Remove duplicate entries automatically</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Validate data integrity</p>
                      <p className="text-xs text-gray-500">Check for data consistency on import</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  Save Settings
                </button>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6 mt-6">
              <div style={cardStyle} className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Data Sources</h3>
                <p className="text-sm text-gray-600 mb-6">
                  These are the sources from which you're currently receiving threat intelligence feeds
                </p>
                <div className="space-y-3">
                  <div className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Database className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">MITRE ATT&CK</p>
                        <p className="text-xs text-gray-500">Last synced: 2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">Active</span>
                      <button className="text-xs text-red-600 hover:underline">Remove</button>
                    </div>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                        <Database className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">AlienVault OTX</p>
                        <p className="text-xs text-gray-500">Last synced: 1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">Active</span>
                      <button className="text-xs text-red-600 hover:underline">Remove</button>
                    </div>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                        <Database className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Custom CSV Feeds</p>
                        <p className="text-xs text-gray-500">3 feeds configured</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">Active</span>
                      <button className="text-xs text-red-600 hover:underline">Remove</button>
                    </div>
                  </div>
                </div>
              </div>

              <div style={cardStyle} className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Share anonymized data</p>
                      <p className="text-xs text-gray-500">Help improve threat intelligence by sharing anonymized data</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Allow third-party sources</p>
                      <p className="text-xs text-gray-500">Enable feeds from verified third-party providers</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Knowledge Graph Preview Component
function KnowledgeGraphPreview({ attributes, csvData }: { attributes: FeedAttribute[], csvData: any[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [relationships, setRelationships] = useState<Array<{source: string, target: string, type: string}>>([])
  const [showConvertDialog, setShowConvertDialog] = useState(false)
  const [isConverting, setIsConverting] = useState(false)

  useEffect(() => {
    if (attributes.length < 2 || csvData.length === 0) {
      setRelationships([])
      return
    }

    // Auto-generate relationships based on column names
    const autoRels: Array<{source: string, target: string, type: string}> = []
    const attrNames = attributes.map(a => a.name.toLowerCase())
    const originalNames = attributes.map(a => a.name)

    // Smart pattern matching for common CTI fields
    const patterns = [
      // Standard STIX patterns
      { source: ['indicator_type', 'type', 'type_field', 'ioc_type'], target: ['indicator_value', 'value', 'ioc_data', 'ioc'], type: 'indicates' },
      { source: ['threat_type', 'threat', 'malware_type'], target: ['indicator_value', 'value', 'ioc_data'], type: 'related_to' },
      { source: ['threat_type', 'threat', 'type', 'type_field'], target: ['severity', 'risk_level', 'priority', 'confidence'], type: 'has_severity' },
      { source: ['source', 'source_name', 'reporter', 'feed'], target: ['indicator_value', 'value', 'ioc_data'], type: 'observed_in' },
      { source: ['category', 'classification'], target: ['value', 'ioc_data', 'indicator_value'], type: 'indicates' },
      { source: ['description', 'notes', 'analyst_notes'], target: ['value', 'ioc_data', 'indicator_value'], type: 'describes' },
    ]

    // Try to match patterns
    patterns.forEach(pattern => {
      const sourceIdx = attrNames.findIndex(name => pattern.source.some(p => name.includes(p)))
      const targetIdx = attrNames.findIndex(name => pattern.target.some(p => name.includes(p)))
      
      if (sourceIdx !== -1 && targetIdx !== -1 && sourceIdx !== targetIdx) {
        const rel = { 
          source: originalNames[sourceIdx], 
          target: originalNames[targetIdx], 
          type: pattern.type 
        }
        // Avoid duplicates
        if (!autoRels.some(r => r.source === rel.source && r.target === rel.target)) {
          autoRels.push(rel)
        }
      }
    })

    // If no smart matches, create relationships based on data types and position
    if (autoRels.length === 0 && originalNames.length >= 2) {
      // Find likely indicator column (contains varied data)
      let indicatorCol = originalNames.find(name => 
        name.toLowerCase().includes('value') || 
        name.toLowerCase().includes('ioc') || 
        name.toLowerCase().includes('indicator')
      ) || originalNames[1] // Default to second column

      // Create relationships to the indicator column
      originalNames.forEach((name, idx) => {
        if (name !== indicatorCol && idx < 4) { // Limit to first 4 columns
          autoRels.push({ 
            source: name, 
            target: indicatorCol, 
            type: 'related_to' 
          })
        }
      })
    }

    setRelationships(autoRels)
    
    // Delay drawing to ensure canvas is ready
    setTimeout(() => drawGraph(autoRels), 100)
  }, [attributes.map(a => a.name).join(','), csvData.length])

  const drawGraph = (rels: Array<{source: string, target: string, type: string}>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = 400

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Get unique nodes
    const nodeSet = new Set<string>()
    rels.forEach(rel => {
      nodeSet.add(rel.source)
      nodeSet.add(rel.target)
    })
    const nodes = Array.from(nodeSet)

    if (nodes.length === 0) {
      // Draw empty state
      ctx.fillStyle = '#9ca3af'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('No relationships detected', canvas.width / 2, canvas.height / 2)
      return
    }

    // Calculate positions - use different layouts based on node count
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(canvas.width, canvas.height) / 3

    const nodePositions = new Map<string, { x: number; y: number }>()
    
    if (nodes.length <= 3) {
      // Linear layout for few nodes
      nodes.forEach((node, i) => {
        const x = (canvas.width / (nodes.length + 1)) * (i + 1)
        const y = canvas.height / 2
        nodePositions.set(node, { x, y })
      })
    } else {
      // Circular layout for many nodes
      nodes.forEach((node, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)
        nodePositions.set(node, { x, y })
      })
    }

    // Draw edges with arrows
    ctx.strokeStyle = '#6366f1'
    ctx.lineWidth = 2
    rels.forEach(rel => {
      const source = nodePositions.get(rel.source)
      const target = nodePositions.get(rel.target)
      if (source && target) {
        // Draw line
        ctx.beginPath()
        ctx.moveTo(source.x, source.y)
        ctx.lineTo(target.x, target.y)
        ctx.stroke()

        // Draw arrow
        const angle = Math.atan2(target.y - source.y, target.x - source.x)
        const arrowSize = 10
        ctx.beginPath()
        ctx.moveTo(target.x, target.y)
        ctx.lineTo(
          target.x - arrowSize * Math.cos(angle - Math.PI / 6),
          target.y - arrowSize * Math.sin(angle - Math.PI / 6)
        )
        ctx.moveTo(target.x, target.y)
        ctx.lineTo(
          target.x - arrowSize * Math.cos(angle + Math.PI / 6),
          target.y - arrowSize * Math.sin(angle + Math.PI / 6)
        )
        ctx.stroke()

        // Draw label with background
        ctx.fillStyle = '#ffffff'
        ctx.font = '11px sans-serif'
        const midX = (source.x + target.x) / 2
        const midY = (source.y + target.y) / 2
        const textWidth = ctx.measureText(rel.type).width
        ctx.fillRect(midX - textWidth / 2 - 3, midY - 8, textWidth + 6, 16)
        ctx.fillStyle = '#6366f1'
        ctx.textAlign = 'center'
        ctx.fillText(rel.type, midX, midY + 4)
      }
    })

    // Draw nodes with different colors based on role
    nodes.forEach(node => {
      const pos = nodePositions.get(node)
      if (pos) {
        // Determine node color based on whether it's a source or target
        const isSource = rels.some(r => r.source === node)
        const isTarget = rels.some(r => r.target === node)
        
        if (isSource && isTarget) {
          ctx.fillStyle = '#f59e0b' // Orange for both
        } else if (isSource) {
          ctx.fillStyle = '#8b5cf6' // Purple for source
        } else {
          ctx.fillStyle = '#10b981' // Green for target
        }
        
        // Draw node circle
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, 28, 0, 2 * Math.PI)
        ctx.fill()
        
        // Draw white border
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 3
        ctx.stroke()

        // Draw node label below
        ctx.fillStyle = '#1f2937'
        ctx.font = 'bold 12px sans-serif'
        ctx.textAlign = 'center'
        const label = node.length > 12 ? node.substring(0, 12) + '...' : node
        ctx.fillText(label, pos.x, pos.y + 45)
      }
    })
  }

  // Redraw when relationships change
  useEffect(() => {
    if (relationships.length > 0) {
      drawGraph(relationships)
    }
  }, [relationships])

  const handleConvertToSTIX = async () => {
    setIsConverting(true)
    
    await new Promise(resolve => setTimeout(resolve, 1500))

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

      attributes.forEach(attr => {
        if (row[attr.name]) {
          indicator[attr.name] = row[attr.name]
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

    const relationshipObjects = relationships.map((rel, index) => ({
      type: "relationship",
      id: `relationship--${Date.now()}-${index}`,
      spec_version: "2.1",
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      relationship_type: rel.type,
      source_ref: `x-custom-attribute--${rel.source}`,
      target_ref: `x-custom-attribute--${rel.target}`,
    }))

    const stixBundle = {
      type: "bundle",
      id: `bundle--${Date.now()}`,
      spec_version: "2.1",
      objects: [...stixObjects, ...relationshipObjects],
    }

    // Download
    const blob = new Blob([JSON.stringify(stixBundle, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `threat-intel-stix-2.1-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)

    // Send to backend
    try {
      await fetch('http://localhost:3001/api/stix/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stixBundle,
          knowledgeGraph: { relationships },
          sourceData: { fileName: 'csv-export', rowCount: csvData.length }
        })
      })
    } catch (error) {
      console.error('Backend error:', error)
    }

    setIsConverting(false)
    setTimeout(() => setShowConvertDialog(false), 2000)
  }

  if (attributes.length < 2) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Network className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">Select at least 2 attributes to generate knowledge graph</p>
      </div>
    )
  }

  return (
    <div>
      <canvas ref={canvasRef} className="w-full h-[400px] bg-gray-50 rounded-lg mb-4" />
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600">Nodes</p>
          <p className="text-2xl font-bold text-blue-600">{new Set([...relationships.map(r => r.source), ...relationships.map(r => r.target)]).size}</p>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg">
          <p className="text-xs text-gray-600">Relationships</p>
          <p className="text-2xl font-bold text-purple-600">{relationships.length}</p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-gray-600">Data Rows</p>
          <p className="text-2xl font-bold text-green-600">{csvData.length}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {relationships.map((rel, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{rel.source}</span>
            <span className="text-gray-600">→ {rel.type} →</span>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">{rel.target}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowConvertDialog(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        <Download className="w-4 h-4" />
        Convert to STIX 2.1 ({csvData.length} indicators)
      </button>

      {showConvertDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div style={cardStyle} className="max-w-lg w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {isConverting ? "Converting..." : "Convert to STIX 2.1?"}
            </h3>
            
            {!isConverting ? (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  This will create {csvData.length} indicators and {relationships.length} relationships
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConvertDialog(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConvertToSTIX}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Convert
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-600">Generating STIX bundle...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
