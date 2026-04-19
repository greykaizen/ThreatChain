"use client"

import { useState } from "react"
import { Download, RefreshCw, Database, Globe, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StixReport {
  id: string
  type: string
  name: string
  description: string
  created: string
  modified: string
  indicators_count: number
  source: string
  raw: any
}

const cardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "0.75rem",
}

const TAXII_SOURCES = [
  { id: 'mitre-attack', name: 'MITRE ATT&CK', description: 'Enterprise attack patterns and techniques' },
  { id: 'circl-lu', name: 'CIRCL.LU', description: 'Luxembourg threat intelligence feed' },
  { id: 'anomali-limo', name: 'Anomali Limo', description: 'Free community threat intelligence' }
]

export default function FeedExtractor() {
  const [selectedSource, setSelectedSource] = useState<string>('mitre-attack')
  const [reports, setReports] = useState<StixReport[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/feed-extractor/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ source: selectedSource })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch reports')
      }

      setReports(data.reports || [])
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || 'Failed to fetch reports from TAXII server')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadReport = (report: StixReport) => {
    const blob = new Blob([JSON.stringify(report.raw, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.name.replace(/[^a-z0-9]/gi, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadAll = () => {
    const bundle = {
      type: 'bundle',
      id: `bundle--${Date.now()}`,
      objects: reports.map(r => r.raw)
    }
    
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    a.download = `stix-reports-bundle-${timestamp}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Globe className="w-6 h-6" />
          Feed Extractor
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Fetch STIX 2.1 reports from external TAXII servers
        </p>
      </div>

      {/* Source Selection */}
      <div style={cardStyle} className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select TAXII Source</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {TAXII_SOURCES.map((source) => (
            <button
              key={source.id}
              onClick={() => setSelectedSource(source.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedSource === source.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Database className={`w-5 h-5 ${selectedSource === source.id ? 'text-blue-600' : 'text-gray-600'}`} />
                <h4 className="font-medium text-gray-900">{source.name}</h4>
              </div>
              <p className="text-sm text-gray-600">{source.description}</p>
            </button>
          ))}
        </div>

        <Button 
          onClick={fetchReports} 
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Fetching Reports...' : 'Fetch Reports'}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={cardStyle} className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">Error</h4>
              <p className="text-sm text-red-800 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Reports List */}
      {reports.length > 0 && (
        <div style={cardStyle} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Fetched Reports ({reports.length})
            </h3>
            <Button 
              onClick={downloadAll}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
          </div>

          <div className="space-y-3">
            {reports.map((report, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{report.name}</h4>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {report.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Source: {report.source}</span>
                      <span>{report.indicators_count} indicators</span>
                      <span>Created: {new Date(report.created).toLocaleDateString()}</span>
                      <span>Modified: {new Date(report.modified).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadReport(report)}
                    className="ml-4"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    JSON
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && reports.length === 0 && !error && (
        <div style={cardStyle} className="p-12 text-center">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Fetched</h3>
          <p className="text-sm text-gray-600">
            Select a TAXII source and click "Fetch Reports" to retrieve threat intelligence
          </p>
        </div>
      )}
    </div>
  )
}
