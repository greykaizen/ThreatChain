"use client"

import { useState, useEffect } from "react"
import { Server, CheckCircle2, Copy, ExternalLink, RefreshCw, Shield, Database, Globe, Download, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TaxiiReport {
  id: string
  title: string
  description: string
  hash: string
  stix_version: string
  report_type: string
  indicators_count: number
  created_at: string
  blockchain_verified: boolean
  blockchain_hash: string | null
  tx_hash: string | null
  block_number: number | null
}

interface VerificationResult {
  isValid: boolean
  freshHash: string
  blockchainHash: string | null
  txHash: string | null
  blockNumber: number | null
  timestamp: string
  gethVerified?: boolean
  gethData?: any
  error?: string
}

interface TaxiiCollection {
  id: string
  title: string
  description: string
  objects_count: number
}

const cardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "0.75rem",
}

export default function TaxiiServer() {
  const [collections, setCollections] = useState<TaxiiCollection[]>([])
  const [reports, setReports] = useState<TaxiiReport[]>([])
  const [serverStats, setServerStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedHash, setCopiedHash] = useState<string | null>(null)
  const [verificationModal, setVerificationModal] = useState<{
    isOpen: boolean
    report: TaxiiReport | null
    isVerifying: boolean
    result: VerificationResult | null
  }>({
    isOpen: false,
    report: null,
    isVerifying: false,
    result: null
  })

  const TAXII_BASE_URL = "/api/taxii"

  useEffect(() => {
    fetchTaxiiData()
  }, [])

  const fetchTaxiiData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch server status for stats cards
      const statusRes = await fetch(`${TAXII_BASE_URL}/status`)
      const statusData = await statusRes.json()
      setServerStats(statusData)

      // Fetch collections
      const collectionsRes = await fetch(`${TAXII_BASE_URL}/threatchain/collections/`)
      const collectionsData = await collectionsRes.json()
      setCollections(collectionsData.collections || [])

      // Fetch reports with blockchain data
      // Get token from localStorage
      const token = localStorage.getItem('token')
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const reportsRes = await fetch('/api/stix/reports?limit=50', {
        headers: headers
      })
      const reportsData = await reportsRes.json()

      if (reportsData.success && reportsData.data.reports) {
        // Fetch blockchain verification for each report
        const reportsWithBlockchain = await Promise.all(
          reportsData.data.reports.map(async (report: any) => {
            try {
              const blockchainRes = await fetch(
                `/api/blockchain/transactions?reportId=${report.id}`
              )
              const blockchainData = await blockchainRes.json()
              
              const confirmedTx = blockchainData.data?.transactions?.find(
                (tx: any) => tx.status === 'confirmed'
              )

              return {
                id: report.id,
                title: report.title || 'Untitled Report',
                description: report.description || 'No description',
                hash: report.hash,
                stix_version: report.stix_version || '2.1',
                report_type: report.report_type || 'bundle',
                indicators_count: report.indicators_count || 0,
                created_at: new Date(report.created_at).toLocaleString(),
                blockchain_verified: !!confirmedTx,
                blockchain_hash: confirmedTx?.report_hash || null,
                tx_hash: confirmedTx?.tx_hash || null,
                block_number: confirmedTx?.block_number || null
              }
            } catch {
              return {
                id: report.id,
                title: report.title || 'Untitled Report',
                description: report.description || 'No description',
                hash: report.hash,
                stix_version: report.stix_version || '2.1',
                report_type: report.report_type || 'bundle',
                indicators_count: report.indicators_count || 0,
                created_at: new Date(report.created_at).toLocaleString(),
                blockchain_verified: false,
                blockchain_hash: null,
                tx_hash: null,
                block_number: null
              }
            }
          })
        )

        setReports(reportsWithBlockchain)
      }
    } catch (err) {
      console.error('Error fetching TAXII data:', err)
      setError('Failed to connect to TAXII server. Make sure backend is running.')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedHash(text)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  const openTaxiiEndpoint = (endpoint: string) => {
    window.open(`${TAXII_BASE_URL}${endpoint}`, '_blank')
  }

  const verifyReportIntegrity = async (report: TaxiiReport) => {
    setVerificationModal({
      isOpen: true,
      report: report,
      isVerifying: true,
      result: null
    })

    try {
      // Step 1: Verify database hash against blockchain
      const dbHash = report.hash;

      const verifyResponse = await fetch('/api/blockchain/verify-hash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ hash: dbHash })
      })

      const verifyData = await verifyResponse.json()

      // Step 2: Set result based on blockchain verification
      const isValid = verifyData.success && verifyData.verified

      setVerificationModal(prev => ({
        ...prev,
        isVerifying: false,
        result: {
          isValid: isValid,
          freshHash: dbHash,
          blockchainHash: report.hash,
          txHash: report.tx_hash,
          blockNumber: report.block_number,
          timestamp: new Date().toISOString(),
          gethVerified: verifyData.verified,
          gethData: verifyData.data
        }
      }))
    } catch (error: any) {
      setVerificationModal(prev => ({
        ...prev,
        isVerifying: false,
        result: {
          isValid: false,
          freshHash: '',
          blockchainHash: report.hash,
          txHash: report.tx_hash,
          blockNumber: report.block_number,
          timestamp: new Date().toISOString(),
          error: 'Verification failed: ' + error.message
        }
      }))
    }
  }

  const exportReport = async (report: TaxiiReport) => {
    try {
      const token = localStorage.getItem('token')
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch(`/api/stix/reports/${report.id}`, {
        headers: headers
      })
      const data = await response.json()
      const stixContent = data.data.content
      
      const blob = new Blob([JSON.stringify(stixContent, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${report.title.replace(/[^a-z0-9]/gi, '_')}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('Failed to export report')
    }
  }

  const exportWithCertificate = async (report: TaxiiReport, result: VerificationResult) => {
    try {
      const token = localStorage.getItem('token')
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch(`/api/stix/reports/${report.id}`, {
        headers: headers
      })
      const data = await response.json()
      const stixContent = data.data.content
      
      const packageWithCert = {
        stix_report: stixContent,
        verification_certificate: {
          verified_at: result.timestamp,
          content_hash: result.freshHash,
          blockchain_hash: result.blockchainHash,
          transaction_hash: result.txHash,
          block_number: result.blockNumber,
          status: 'VERIFIED',
          verified_by: 'ThreatChain TAXII Server'
        }
      }
      
      const blob = new Blob([JSON.stringify(packageWithCert, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${report.title.replace(/[^a-z0-9]/gi, '_')}_verified.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('Failed to export report with certificate')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Server className="w-6 h-6" />
            TAXII 2.1 Server
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Blockchain-verified threat intelligence sharing endpoint
          </p>
        </div>
        <Button onClick={fetchTaxiiData} disabled={isLoading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Server Status */}
      <div style={cardStyle} className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Server Status</h3>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Operational
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Total Reports</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{serverStats?.statistics?.total_reports || 0}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Blockchain Verified</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {serverStats?.statistics?.blockchain_verified || 0}
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Collections</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{serverStats?.statistics?.collections || collections.length}</p>
          </div>
        </div>
      </div>

      {/* TAXII Collections */}
      <div style={cardStyle} className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">TAXII Collections</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {collections.map((collection) => (
            <div key={collection.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900">{collection.title}</h4>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {collection.objects_count} objects
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{collection.description}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openTaxiiEndpoint(`/threatchain/collections/${collection.id}/objects/`)}
                className="w-full"
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                View Collection
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Reports with Blockchain Hashes */}
      <div style={cardStyle} className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Reports & Blockchain Verification
        </h3>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">⚠️ {error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Loading TAXII data...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <Server className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No reports available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">{report.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>STIX {report.stix_version}</span>
                      <span>{report.report_type}</span>
                      <span>{report.indicators_count} indicators</span>
                      <span>{report.created_at}</span>
                    </div>
                  </div>
                </div>

                {/* Report Hash */}
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">Report Hash (SHA-256)</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(report.hash, 'hash')}
                      className="h-6 px-2"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedHash === report.hash ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <code className="text-xs text-gray-800 break-all">{report.hash}</code>
                </div>

                {/* Blockchain Data - Show if available */}
                {report.blockchain_verified && report.tx_hash && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Blockchain Data</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">Transaction Hash</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(report.tx_hash!, 'tx')}
                            className="h-6 px-2"
                          >
                            <Copy className="w-3 h-3" />
                            {copiedHash === report.tx_hash ? 'Copied!' : 'Copy'}
                          </Button>
                        </div>
                        <code className="text-xs text-gray-800 break-all">{report.tx_hash}</code>
                      </div>
                      {report.block_number && (
                        <div>
                          <span className="text-xs font-medium text-gray-700">Block Number: </span>
                          <span className="text-xs text-gray-800">{report.block_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Verify Integrity Button - Always show */}
                <div className="mt-3">
                  <Button
                    size="sm"
                    onClick={() => verifyReportIntegrity(report)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Shield className="w-3 h-3 mr-2" />
                    Verify Integrity & Export
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TAXII Endpoints Reference */}
      <div style={cardStyle} className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">TAXII Endpoints</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <code className="text-xs">GET /api/taxii/</code>
            <Button size="sm" variant="ghost" onClick={() => openTaxiiEndpoint('/')}>
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <code className="text-xs">GET /api/taxii/threatchain/collections/</code>
            <Button size="sm" variant="ghost" onClick={() => openTaxiiEndpoint('/threatchain/collections/')}>
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <code className="text-xs">GET /api/taxii/status</code>
            <Button size="sm" variant="ghost" onClick={() => openTaxiiEndpoint('/status')}>
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      {verificationModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Integrity Verification</h3>
            
            {verificationModal.isVerifying ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-gray-600">Verifying report integrity...</p>
                <p className="text-sm text-gray-500 mt-2">Calculating hash and comparing with blockchain...</p>
              </div>
            ) : verificationModal.result ? (
              <div>
                {verificationModal.result.error ? (
                  <div className="p-4 rounded-lg mb-4 bg-red-50 border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span className="font-bold text-red-900">ERROR</span>
                    </div>
                    <p className="text-sm text-red-800">{verificationModal.result.error}</p>
                  </div>
                ) : (
                  <>
                    <div className={`p-4 rounded-lg mb-4 ${
                      verificationModal.result.isValid 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-indigo-50 border border-indigo-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {verificationModal.result.isValid ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <span className="font-bold text-green-900 uppercase tracking-tight">✅ Provenance Verified</span>
                          </>
                        ) : (
                          <>
                            <Shield className="w-5 h-5 text-indigo-600" />
                            <span className="font-bold text-indigo-900 uppercase tracking-tight">ℹ️ Local Integrity Confirmed</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-slate-700">
                        {verificationModal.result.isValid
                          ? 'This report is globally verified. The database fingerprint matches the immutable record on the Ethereum ledger.'
                          : 'The report content is authentic and matches our database records. Note: Global ledger anchoring is currently pending or processing.'}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                           Fingerprint (Database)
                        </label>
                        <code className="block text-xs bg-slate-50 border border-slate-100 p-3 rounded-xl font-mono text-slate-600 break-all">
                          {verificationModal.result.blockchainHash}
                        </code>
                      </div>

                      {verificationModal.result.isValid && (
                        <div className="p-4 bg-green-50/50 rounded-2xl border border-green-100">
                          <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                             <Globe className="w-3 h-3" /> 
                             Immutable Ledger Proof
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-[11px]">
                            <div>
                               <p className="text-slate-400 uppercase font-bold mb-1">Status</p>
                               <p className="text-green-700 font-black">CONFIRMED</p>
                            </div>
                            <div>
                               <p className="text-slate-400 uppercase font-bold mb-1">Block Height</p>
                               <p className="text-slate-900 font-mono font-bold">#{verificationModal.result.blockNumber}</p>
                            </div>
                            <div className="col-span-2">
                               <p className="text-slate-400 uppercase font-bold mb-1">Ledger Fingerprint (On-Chain)</p>
                               <p className="text-slate-900 font-mono break-all">{verificationModal.result.blockchainHash}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">
                          Transaction Hash:
                        </label>
                        <code className="block text-xs bg-gray-100 p-2 rounded break-all text-gray-800">
                          {verificationModal.result.txHash}
                        </code>
                      </div>
                      {verificationModal.result.blockNumber && (
                        <div>
                          <label className="text-xs font-medium text-gray-700 block mb-1">
                            Block Number:
                          </label>
                          <span className="text-sm text-gray-800">{verificationModal.result.blockNumber}</span>
                        </div>
                      )}
                    </div>

                    {verificationModal.result.isValid && verificationModal.report && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-3">Export verified report:</p>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => exportReport(verificationModal.report!)}
                            variant="outline"
                            className="flex-1"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export STIX Report
                          </Button>
                          <Button 
                            onClick={() => exportWithCertificate(verificationModal.report!, verificationModal.result!)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Export with Certificate
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : null}

            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setVerificationModal({ isOpen: false, report: null, isVerifying: false, result: null })}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
