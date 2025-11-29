"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, Send, MessageSquare, Users, FileText, Shield, Clock, CheckCircle2, AlertTriangle, Eye, Download, Filter, Search, Trash2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

interface SharedReport {
  id: string
  title: string
  description: string
  sharedBy: string
  sharedWith: string[]
  timestamp: string
  reportType: "Malware" | "Phishing" | "APT" | "Vulnerability" | "IOC" | "Campaign"
  severity: "Low" | "Medium" | "High" | "Critical"
  stixVersion: string
  fileSize: string
  indicators: number
  status: "Pending" | "Accepted" | "Reviewed" | "Archived"
  accessLevel: "Public" | "Restricted" | "Confidential"
  tags: string[]
  comments: number
  downloads: number
  verificationStatus: "Verified" | "Unverified" | "Under Review"
}

interface ChatMessage {
  id: string
  sender: string
  senderOrg: string
  message: string
  timestamp: string
  reportId?: string
  messageType: "text" | "file" | "system"
  attachments?: string[]
}

interface Organization {
  id: string
  name: string
  type: "Government" | "Private" | "Academic" | "NGO"
  trustLevel: "High" | "Medium" | "Low"
  online: boolean
}

const organizations: Organization[] = [
  { id: "1", name: "US-CERT", type: "Government", trustLevel: "High", online: true },
  { id: "2", name: "CrowdStrike Intelligence", type: "Private", trustLevel: "High", online: true },
  { id: "3", name: "ENISA", type: "Government", trustLevel: "High", online: false },
  { id: "4", name: "MIT CSAIL", type: "Academic", trustLevel: "Medium", online: true },
  { id: "5", name: "Kaspersky Lab", type: "Private", trustLevel: "Medium", online: false },
  { id: "6", name: "FireEye Mandiant", type: "Private", trustLevel: "High", online: true },
  { id: "7", name: "CISA", type: "Government", trustLevel: "High", online: true },
  { id: "8", name: "Symantec Research", type: "Private", trustLevel: "Medium", online: false }
]

// Static data removed - will fetch from database

const chatMessages: ChatMessage[] = [
  {
    id: "MSG-001",
    sender: "Dr. Sarah Johnson",
    senderOrg: "US-CERT",
    message: "Just shared the APT40 maritime campaign analysis. This is a critical threat affecting multiple sectors.",
    timestamp: "2024-01-15 14:32",
    reportId: "SR-2024-001",
    messageType: "text"
  },
  {
    id: "MSG-002",
    sender: "Michael Chen",
    senderOrg: "CrowdStrike Intelligence",
    message: "Thanks for sharing! We've seen similar TTPs in our telemetry. Adding our IOCs to the thread.",
    timestamp: "2024-01-15 14:45",
    messageType: "text"
  },
  {
    id: "MSG-003",
    sender: "System",
    senderOrg: "ThreadChain",
    message: "New report 'Emotet Banking Trojan Resurgence' has been shared by CrowdStrike Intelligence",
    timestamp: "2024-01-15 11:45",
    reportId: "SR-2024-002",
    messageType: "system"
  },
  {
    id: "MSG-004",
    sender: "Prof. David Kim",
    senderOrg: "MIT CSAIL",
    message: "Interesting correlation with our research on banking malware evolution. Can we schedule a discussion?",
    timestamp: "2024-01-15 12:15",
    messageType: "text"
  }
]

const cardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "0.75rem",
}

export default function SharingReports() {
  const [activeTab, setActiveTab] = useState("reports")
  const [selectedReport, setSelectedReport] = useState<SharedReport | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([])
  const [isSharing, setIsSharing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSeverity, setFilterSeverity] = useState("All")
  const [filterStatus, setFilterStatus] = useState("All")
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // State for fetching reports from database
  const [sharedReports, setSharedReports] = useState<SharedReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch reports from backend on component mount
  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('http://localhost:3001/api/stix/reports?limit=50')
      const data = await response.json()
      
      if (data.success && data.data.reports) {
        // Transform backend data to match frontend interface
        const transformedReports: SharedReport[] = data.data.reports.map((report: any) => ({
          id: report.id,
          title: report.title || 'Untitled Report',
          description: report.description || 'No description available',
          sharedBy: "ThreadChain System",
          sharedWith: ["Partner Organizations"],
          timestamp: new Date(report.created_at).toLocaleString(),
          reportType: (report.report_type || 'IOC') as any,
          severity: (report.severity || 'Medium') as any,
          stixVersion: report.stix_version || '2.1',
          fileSize: report.file_size ? `${(report.file_size / 1024).toFixed(1)} KB` : 'N/A',
          indicators: report.indicators_count || 0,
          status: "Accepted" as any,
          accessLevel: "Public" as any,
          tags: [report.report_type || 'STIX', report.stix_version || '2.1'],
          comments: 0,
          downloads: 0,
          verificationStatus: "Verified" as any
        }))
        setSharedReports(transformedReports)
      } else {
        setError('Failed to load reports from database')
      }
    } catch (err) {
      console.error('Error fetching reports:', err)
      setError('Cannot connect to backend. Make sure server is running on port 3001.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Add message logic here
      setNewMessage("")
    }
  }

  const handleShareReport = async () => {
    setIsSharing(true)
    // Simulate sharing process
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSharing(false)
    setSelectedOrganizations([])
  }

  const handleDeleteReport = async (reportId: string, reportTitle: string) => {
    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete this report?\n\n"${reportTitle}"\n\nThis action cannot be undone and will remove the report from the database along with all associated blockchain and provenance records.`
    )
    
    if (!confirmed) return

    try {
      const response = await fetch(`http://localhost:3001/api/stix/reports/${reportId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Remove from local state
        setSharedReports(prev => prev.filter(report => report.id !== reportId))
        alert('Report deleted successfully!')
      } else {
        throw new Error(data.message || 'Failed to delete report')
      }
    } catch (err) {
      console.error('Error deleting report:', err)
      alert(`Failed to delete report: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const toggleOrganization = (orgId: string) => {
    setSelectedOrganizations(prev => 
      prev.includes(orgId) 
        ? prev.filter(id => id !== orgId)
        : [...prev, orgId]
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Accepted":
        return "bg-green-100 text-green-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Reviewed":
        return "bg-blue-100 text-blue-800"
      case "Under Review":
        return "bg-purple-100 text-purple-800"
      case "Archived":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-100 text-red-800"
      case "High":
        return "bg-orange-100 text-orange-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Low":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case "Public":
        return "bg-green-100 text-green-800"
      case "Restricted":
        return "bg-yellow-100 text-yellow-800"
      case "Confidential":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTrustLevelColor = (level: string) => {
    switch (level) {
      case "High":
        return "text-green-600"
      case "Medium":
        return "text-yellow-600"
      case "Low":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const filteredReports = sharedReports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesSeverity = filterSeverity === "All" || report.severity === filterSeverity
    const matchesStatus = filterStatus === "All" || report.status === filterStatus
    return matchesSearch && matchesSeverity && matchesStatus
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Shared Reports</h2>
        <p className="text-sm text-gray-600 mt-1">
          View and manage shared threat intelligence reports
        </p>
      </div>

      <div className="space-y-6">
          {/* Filters and Search */}
          <div style={cardStyle} className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search reports, tags, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="All">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Reviewed">Reviewed</option>
                <option value="Under Review">Under Review</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Reports List */}
          <div style={cardStyle} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Shared Reports ({filteredReports.length})
              </h3>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={fetchReports}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Refresh"}
              </Button>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">⚠️ {error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12">
                <Clock className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Loading reports from database...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No reports found</p>
                <p className="text-sm text-gray-500 mt-1">Upload a STIX report to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{report.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}`}>
                          {report.severity}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccessLevelColor(report.accessLevel)}`}>
                          {report.accessLevel}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Shared by: {report.sharedBy}</span>
                        <span>{report.timestamp}</span>
                        <span>{report.indicators} indicators</span>
                        <span>{report.fileSize}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {report.verificationStatus === "Verified" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-wrap gap-1">
                      {report.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {report.comments}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {report.downloads}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-600">
                      Shared with: {report.sharedWith.join(", ")}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        Download
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => handleDeleteReport(report.id, report.title)}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
        </div>
    )
  }
}

// Remove all the unused tab content below
/*
        <TabsContent value="share" className="space-y-6 mt-6">
          {/* Upload New Report */}
          <div style={cardStyle} className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share New Threat Report</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Title</label>
                <Input placeholder="Enter report title..." />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Provide a detailed description of the threat intelligence..."
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>Malware</option>
                    <option>Phishing</option>
                    <option>APT</option>
                    <option>Vulnerability</option>
                    <option>IOC</option>
                    <option>Campaign</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Access Level</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>Public</option>
                    <option>Restricted</option>
                    <option>Confidential</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">STIX Version</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>2.1</option>
                    <option>2.0</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <Input placeholder="Enter tags separated by commas..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Report File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload STIX file or drag and drop</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.xml"
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select File
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Select Organizations */}
          <div style={cardStyle} className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Select Organizations to Share With ({selectedOrganizations.length} selected)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  onClick={() => toggleOrganization(org.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedOrganizations.includes(org.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{org.name}</p>
                      <p className="text-sm text-gray-600">{org.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${getTrustLevelColor(org.trustLevel)}`}>
                        {org.trustLevel}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${org.online ? "bg-green-500" : "bg-gray-400"}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleShareReport}
                disabled={selectedOrganizations.length === 0 || isSharing}
                className="flex items-center gap-2"
              >
                {isSharing ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Share Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="chat" className="space-y-6 mt-6">
          <div style={cardStyle} className="p-6 h-[600px] flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Collaboration Chat</h3>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {chatMessages.map((message) => (
                <div key={message.id} className={`flex ${message.messageType === "system" ? "justify-center" : "justify-start"}`}>
                  {message.messageType === "system" ? (
                    <div className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm">
                      {message.message}
                    </div>
                  ) : (
                    <div className="max-w-[70%] bg-white border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{message.sender}</span>
                        <span className="text-xs text-gray-500">{message.senderOrg}</span>
                        <span className="text-xs text-gray-400">{message.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-700">{message.message}</p>
                      {message.reportId && (
                        <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                          <p className="text-xs text-blue-700">📎 Related Report: {message.reportId}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="organizations" className="space-y-6 mt-6">
          <div style={cardStyle} className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Partner Network Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {organizations.map((org) => (
                <div key={org.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{org.name}</h4>
                    <div className={`w-3 h-3 rounded-full ${org.online ? "bg-green-500" : "bg-gray-400"}`} />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{org.type}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${getTrustLevelColor(org.trustLevel)}`}>
                      {org.trustLevel} Trust
                    </span>
                    <span className="text-xs text-gray-500">
                      {org.online ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={cardStyle} className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {organizations.filter(org => org.online).length}
                </p>
                <p className="text-sm text-green-700">Online Now</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {organizations.filter(org => org.trustLevel === "High").length}
                </p>
                <p className="text-sm text-blue-700">High Trust</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {sharedReports.length}
                </p>
                <p className="text-sm text-purple-700">Active Reports</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">
                  {chatMessages.length}
                </p>
                <p className="text-sm text-orange-700">Chat Messages</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}