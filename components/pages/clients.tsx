"use client"

import { useState } from "react"
import { Building2, Shield, TrendingUp, Clock, FileText, Users, Globe, Database, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Organization {
  id: number
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

const organizations: Organization[] = [
  {
    id: 1,
    name: "US-CERT",
    type: "Government",
    country: "United States",
    status: "Active",
    joinDate: "2023-01-15",
    lastActivity: "2 hours ago",
    trustScore: 95,
    reportsShared: 1247,
    reportsReceived: 892,
    specialization: ["APT", "Critical Infrastructure", "Government Threats"],
    contactPerson: "Dr. Sarah Johnson",
    email: "s.johnson@us-cert.gov"
  },
  {
    id: 2,
    name: "CrowdStrike Intelligence",
    type: "Private",
    country: "United States",
    status: "Active",
    joinDate: "2023-02-20",
    lastActivity: "15 minutes ago",
    trustScore: 92,
    reportsShared: 2156,
    reportsReceived: 1543,
    specialization: ["Malware Analysis", "Endpoint Security", "Threat Hunting"],
    contactPerson: "Michael Chen",
    email: "m.chen@crowdstrike.com"
  },
  {
    id: 3,
    name: "ENISA",
    type: "Government",
    country: "European Union",
    status: "Active",
    joinDate: "2023-03-10",
    lastActivity: "1 day ago",
    trustScore: 88,
    reportsShared: 756,
    reportsReceived: 1234,
    specialization: ["Policy Analysis", "EU Cybersecurity", "Standards"],
    contactPerson: "Dr. Elena Rodriguez",
    email: "e.rodriguez@enisa.europa.eu"
  },
  {
    id: 4,
    name: "MIT CSAIL",
    type: "Academic",
    country: "United States",
    status: "Active",
    joinDate: "2023-04-05",
    lastActivity: "3 hours ago",
    trustScore: 85,
    reportsShared: 423,
    reportsReceived: 678,
    specialization: ["AI Security", "Research", "Emerging Threats"],
    contactPerson: "Prof. David Kim",
    email: "d.kim@mit.edu"
  },
  {
    id: 5,
    name: "Kaspersky Lab",
    type: "Private",
    country: "Russia",
    status: "Pending",
    joinDate: "2024-01-10",
    lastActivity: "5 days ago",
    trustScore: 72,
    reportsShared: 89,
    reportsReceived: 45,
    specialization: ["Antivirus Research", "Mobile Security", "Industrial Security"],
    contactPerson: "Alexei Volkov",
    email: "a.volkov@kaspersky.com"
  }
]

const recentReports: ThreatReport[] = [
  {
    id: "RPT-2024-001",
    title: "APT29 Cozy Bear Campaign Analysis",
    organization: "US-CERT",
    type: "APT",
    severity: "Critical",
    timestamp: "2024-01-15 14:30",
    indicators: 156,
    stixVersion: "2.1",
    verified: true
  },
  {
    id: "RPT-2024-002", 
    title: "Banking Trojan Emotet Variant",
    organization: "CrowdStrike Intelligence",
    type: "Malware",
    severity: "High",
    timestamp: "2024-01-15 12:45",
    indicators: 89,
    stixVersion: "2.1",
    verified: true
  },
  {
    id: "RPT-2024-003",
    title: "Phishing Campaign Targeting EU Banks",
    organization: "ENISA",
    type: "Phishing",
    severity: "Medium",
    timestamp: "2024-01-14 16:20",
    indicators: 234,
    stixVersion: "2.0",
    verified: false
  },
  {
    id: "RPT-2024-004",
    title: "Zero-Day Vulnerability in IoT Devices",
    organization: "MIT CSAIL",
    type: "Vulnerability",
    severity: "High",
    timestamp: "2024-01-14 09:15",
    indicators: 67,
    stixVersion: "2.1",
    verified: true
  }
]

const sharingActivity: SharingActivity[] = [
  {
    id: "ACT-001",
    organization: "US-CERT",
    action: "Shared Report",
    reportTitle: "APT29 Cozy Bear Campaign Analysis",
    timestamp: "2024-01-15 14:30",
    indicators: 156,
    trustImpact: +2
  },
  {
    id: "ACT-002",
    organization: "CrowdStrike Intelligence", 
    action: "Verified Report",
    reportTitle: "Banking Trojan Emotet Variant",
    timestamp: "2024-01-15 13:20",
    indicators: 89,
    trustImpact: +1
  },
  {
    id: "ACT-003",
    organization: "ENISA",
    action: "Received Report",
    reportTitle: "Phishing Campaign Targeting EU Banks",
    timestamp: "2024-01-15 11:45",
    indicators: 234,
    trustImpact: 0
  },
  {
    id: "ACT-004",
    organization: "MIT CSAIL",
    action: "Updated Report",
    reportTitle: "Zero-Day Vulnerability in IoT Devices",
    timestamp: "2024-01-15 10:30",
    indicators: 67,
    trustImpact: +1
  }
]

const cardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "0.75rem",
}

export default function Organizations() {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)

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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Partner Organizations</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage threat intelligence sharing partnerships and monitor collaboration activities
        </p>
      </div>

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
