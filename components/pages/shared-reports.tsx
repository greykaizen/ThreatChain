"use client"

import { useState, useEffect } from "react"
import { FileText, CheckCircle2, AlertTriangle, Eye, Download, Search, Trash2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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
  verificationStatus: "Verified" | "Unverified" | "Under Review"
}

const cardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "0.75rem",
}

export default function SharedReports() {
  const [sharedReports, setSharedReports] = useState<SharedReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSeverity, setFilterSeverity] = useState("All")
  const [filterStatus, setFilterStatus] = useState("All")

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Get token from localStorage
      const token = localStorage.getItem('token')
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch('/api/stix/reports?limit=50', {
        headers: headers
      })
      const data = await response.json()
      
      if (data.success && data.data.reports) {
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

  const handleDeleteReport = async (reportId: string, reportTitle: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this report?\n\n"${reportTitle}"\n\nThis action cannot be undone.`
    )
    
    if (!confirmed) return

    try {
      // Get token from localStorage
      const token = localStorage.getItem('token')
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch(`/api/stix/reports/${reportId}`, {
        method: 'DELETE',
        headers: headers
      })

      const data = await response.json()

      if (response.ok && data.success) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Accepted": return "bg-green-100 text-green-800"
      case "Pending": return "bg-yellow-100 text-yellow-800"
      case "Reviewed": return "bg-blue-100 text-blue-800"
      case "Under Review": return "bg-purple-100 text-purple-800"
      case "Archived": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "bg-red-100 text-red-800"
      case "High": return "bg-orange-100 text-orange-800"
      case "Medium": return "bg-yellow-100 text-yellow-800"
      case "Low": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case "Public": return "bg-green-100 text-green-800"
      case "Restricted": return "bg-yellow-100 text-yellow-800"
      case "Confidential": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
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
              Reports ({filteredReports.length})
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
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-600">
                      Shared with: {report.sharedWith.join(", ")}
                    </div>
                    <div className="flex gap-2">
                      {/* <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        Download
                      </Button> */}
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
    </div>
  )
}
