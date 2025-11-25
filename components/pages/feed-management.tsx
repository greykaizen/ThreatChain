"use client"

import { useState, useRef } from "react"
import { Upload, ArrowRight, Check, Network, FileText, Database, Settings, Send, Loader2, Globe, Server, CheckCircle2 } from "lucide-react"
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
      const parsedData = parseCSV(text)

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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Your CSV File</h3>
            <p className="text-sm text-gray-600 mb-6 text-center max-w-md">
              Upload a CSV file containing threat intelligence data. The system will automatically detect
              attributes and their types.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              style={{ transition: "all 150ms ease" }}
            >
              <Upload className="w-5 h-5" />
              Select CSV File
            </button>
            <p className="text-xs text-gray-500 mt-4">Supported format: CSV (.csv)</p>
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
                  Build Knowledge Graph
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
