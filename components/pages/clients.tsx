"use client"

import { useState, useEffect } from "react"
import { Building2, Shield, TrendingUp, Clock, FileText, Users, Globe, Database, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Organization {
  id: string | number
  name: string
  type: "Government" | "Private" | "Academic" | "NGO"
  country: string
  status: "Active" | "Inactive" | "Pending"
  joinDate: string
  lastActivity: string
  trustScore: number
  reportsShared: number
  reportsReceived: number
  specialization: string[]
  contactPerson: string
  email: string
  phone?: string
}

interface ThreatReport {
  id: string
  title: string
  organization: string
  type: "Malware" | "Phishing" | "APT" | "Vulnerability" | "IOC"
  severity: "Low" | "Medium" | "High" | "Critical"
  timestamp: string
  indicators: number
  stixVersion: string
  verified: boolean
}

interface SharingActivity {
  id: string
  organization: string
  action: "Shared Report" | "Received Report" | "Updated Report" | "Verified Report"
  reportTitle: string
  timestamp: string
  indicators: number
  trustImpact: number
}



const cardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "0.75rem",
}

export default function Organizations() {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [recentReports, setRecentReports] = useState<ThreatReport[]>([])
  const [sharingActivity, setSharingActivity] = useState<SharingActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const token = localStorage.getItem('token')
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      // Fetch organizations
      const orgsRes = await fetch('/api/organizations', {
        headers: headers
      })
      const orgsData = await orgsRes.json()

      if (orgsData.success) {
        setOrganizations(orgsData.data.organizations)
      }

      // Fetch recent reports
      const reportsRes = await fetch('/api/stix/reports?limit=10', {
        headers: headers
      })
      const reportsData = await reportsRes.json()

      if (reportsData.success && reportsData.data.reports) {
        const transformedReports: ThreatReport[] = reportsData.data.reports.map((report: any) => ({
          id: report.id,
          title: report.title || 'Untitled Report',
          organization: 'ThreadChain',
          type: (report.report_type || 'IOC') as any,
          severity: (report.severity || 'Medium') as any,
          timestamp: new Date(report.created_at).toLocaleString(),
          indicators: report.indicators_count || 0,
          stixVersion: report.stix_version || '2.1',
          verified: true
        }))
        setRecentReports(transformedReports)
      }

      // Fetch activity
      const activityRes = await fetch('/api/organizations/activity?limit=10', {
        headers: headers
      })
      const activityData = await activityRes.json()

      if (activityData.success) {
        setSharingActivity(activityData.data.activities)
      }

    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load organization data')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700"
      case "Inactive":
        return "bg-gray-100 text-gray-700"
      case "Pending":
        return "bg-yellow-100 text-yellow-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Government":
        return <Shield className="w-4 h-4 text-blue-600" />
      case "Private":
        return <Building2 className="w-4 h-4 text-purple-600" />
      case "Academic":
        return <Users className="w-4 h-4 text-green-600" />
      case "NGO":
        return <Globe className="w-4 h-4 text-orange-600" />
      default:
        return <Building2 className="w-4 h-4 text-gray-600" />
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

  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Partner Organizations</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage threat intelligence sharing partnerships and monitor collaboration activities
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {isLoading && organizations.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Loading organizations...</p>
          </div>
        </div>
      ) : null}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Shared Reports
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Activity Feed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div style={cardStyle} className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-gray-600">Total Organizations</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{organizations.length}</p>
              <p className="text-xs text-green-600 mt-1">+2 this month</p>
            </div>
            <div style={cardStyle} className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-green-600" />
                <p className="text-sm text-gray-600">Reports Shared</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {organizations.reduce((sum, org) => sum + org.reportsShared, 0).toLocaleString()}
              </p>
              <p className="text-xs text-green-600 mt-1">+156 this week</p>
            </div>
            <div style={cardStyle} className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <p className="text-sm text-gray-600">Avg Trust Score</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(organizations.reduce((sum, org) => sum + org.trustScore, 0) / organizations.length)}
              </p>
              <p className="text-xs text-green-600 mt-1">+3.2% this month</p>
            </div>
            <div style={cardStyle} className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-orange-600" />
                <p className="text-sm text-gray-600">Active Partners</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {organizations.filter(org => org.status === "Active").length}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {organizations.filter(org => org.status === "Pending").length} pending
              </p>
            </div>
          </div>

          {/* Top Contributors */}
          <div style={cardStyle} className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Contributors This Month</h3>
            <div className="space-y-4">
              {organizations
                .sort((a, b) => b.reportsShared - a.reportsShared)
                .slice(0, 3)
                .map((org, index) => (
                  <div key={org.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{org.name}</p>
                        <p className="text-sm text-gray-600">{org.type} • {org.country}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{org.reportsShared.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">reports shared</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="organizations" className="space-y-6 mt-6">
          <div style={cardStyle} className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Partner Organizations</h3>
            {organizations.length === 0 && !isLoading ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No organizations found</p>
                <p className="text-sm text-gray-500 mt-1">Organizations will appear here once they register</p>
              </div>
            ) : (
              <div className="space-y-4">
                {organizations.map((org) => (
                <div key={org.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(org.type)}
                      <div>
                        <h4 className="font-medium text-gray-900">{org.name}</h4>
                        <p className="text-sm text-gray-600">{org.type} • {org.country}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(org.status)}`}>
                        {org.status}
                      </span>
                      <span className={`text-sm font-bold ${getTrustScoreColor(org.trustScore)}`}>
                        {org.trustScore}% Trust
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Reports Shared</p>
                      <p className="font-medium text-gray-900">{org.reportsShared.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Reports Received</p>
                      <p className="font-medium text-gray-900">{org.reportsReceived.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Last Activity</p>
                      <p className="font-medium text-gray-900">{org.lastActivity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Member Since</p>
                      <p className="font-medium text-gray-900">{new Date(org.joinDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Specialization</p>
                    <div className="flex flex-wrap gap-1">
                      {org.specialization.map((spec, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{org.contactPerson}</p>
                      <p className="text-xs text-gray-600">{org.email}</p>
                    </div>
                    <button
                      onClick={() => setSelectedOrg(org)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6 mt-6">
          <div style={cardStyle} className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Threat Reports</h3>
            <div className="space-y-4">
              {recentReports.map((report) => (
                <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{report.title}</h4>
                      <p className="text-sm text-gray-600">
                        {report.organization} • {report.timestamp}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {report.verified ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}`}>
                        {report.severity}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Report Type</p>
                      <p className="font-medium text-gray-900">{report.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Indicators</p>
                      <p className="font-medium text-gray-900">{report.indicators}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">STIX Version</p>
                      <p className="font-medium text-gray-900">{report.stixVersion}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p className={`font-medium ${report.verified ? 'text-green-600' : 'text-yellow-600'}`}>
                        {report.verified ? 'Verified' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6 mt-6">
          <div style={cardStyle} className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sharing Activity</h3>
            <div className="space-y-4">
              {sharingActivity.map((activity, index) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                    {index < sharingActivity.length - 1 && <div className="w-0.5 h-12 bg-gray-200 mt-2" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900">
                        {activity.organization} - {activity.action}
                      </p>
                      {activity.trustImpact > 0 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          +{activity.trustImpact} Trust
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{activity.reportTitle}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{activity.timestamp}</span>
                      <span>{activity.indicators} indicators</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
