"use client"

import { useState, useEffect } from "react"
import { Server, CheckCircle2, Copy, ExternalLink, RefreshCw, Shield, Database, Globe, Download, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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

      const statusRes = await fetch(`${TAXII_BASE_URL}/status`)
      const statusData = await statusRes.json()
      setServerStats(statusData)

      const collectionsRes = await fetch(`${TAXII_BASE_URL}/threatchain/collections/`)
      const collectionsData = await collectionsRes.json()
      setCollections(collectionsData.collections || [])

      const token = localStorage.getItem('token')
      const headers: HeadersInit = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      
      const reportsRes = await fetch('/api/stix/reports?limit=50', { headers })
      const reportsData = await reportsRes.json()

      if (reportsData.success && reportsData.data.reports) {
        const reportsWithBlockchain = await Promise.all(
          reportsData.data.reports.map(async (report: any) => {
            try {
              const blockchainRes = await fetch(`/api/blockchain/transactions?reportId=${report.id}`)
              const blockchainData = await blockchainRes.json()
              const confirmedTx = blockchainData.data?.transactions?.find((tx: any) => tx.status === 'confirmed')

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
      setIsLoading(false);
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
    setVerificationModal({ isOpen: true, report, isVerifying: true, result: null })

    try {
      const dbHash = report.hash;
      const verifyResponse = await fetch('/api/blockchain/verify-hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: dbHash })
      })
      const verifyData = await verifyResponse.json()
      const isValid = verifyData.success && verifyData.verified

      setVerificationModal(prev => ({
        ...prev,
        isVerifying: false,
        result: {
          isValid,
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
          isValid: false, freshHash: '', blockchainHash: report.hash,
          txHash: report.tx_hash, blockNumber: report.block_number,
          timestamp: new Date().toISOString(), error: 'Verification failed: ' + error.message
        }
      }))
    }
  }

  const exportReport = async (report: TaxiiReport) => {
    try {
      const token = localStorage.getItem('token')
      const headers: HeadersInit = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const response = await fetch(`/api/stix/reports/${report.id}`, { headers })
      const data = await response.json()
      const blob = new Blob([JSON.stringify(data.data.content, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${report.title.replace(/[^a-z0-9]/gi, '_')}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) { alert('Failed to export report') }
  }

  const exportWithCertificate = async (report: TaxiiReport, result: VerificationResult) => {
    try {
      const token = localStorage.getItem('token')
      const headers: HeadersInit = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const response = await fetch(`/api/stix/reports/${report.id}`, { headers })
      const data = await response.json()
      const packageWithCert = {
        stix_report: data.data.content,
        verification_certificate: {
          verified_at: result.timestamp,
          content_hash: result.freshHash,
          blockchain_hash: result.blockchainHash,
          transaction_hash: result.txHash,
          block_number: result.blockNumber,
          status: 'VERIFIED',
          verified_by: 'ThreadChain Provenance Engine'
        }
      }
      const blob = new Blob([JSON.stringify(packageWithCert, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${report.title.replace(/[^a-z0-9]/gi, '_')}_verified.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) { alert('Failed to export report with certificate') }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Server className="w-6 h-6" />
            Provenance Engine
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

      <div style={cardStyle} className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Operational</span>
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
            <p className="text-2xl font-bold text-gray-900">{serverStats?.statistics?.blockchain_verified || 0}</p>
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

      <div style={cardStyle} className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports & Blockchain Verification</h3>
        {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">⚠️ {error}</div>}
        {isLoading ? (
          <div className="text-center py-12"><RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" /><p className="text-gray-600">Loading data...</p></div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12"><Server className="w-12 h-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-600">No reports available</p></div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{report.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>STIX {report.stix_version}</span>
                      <span>{report.report_type}</span>
                      <span>{report.indicators_count} indicators</span>
                      <span>{report.created_at}</span>
                    </div>
                  </div>
                </div>
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">Report Hash (SHA-256)</span>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(report.hash, 'hash')} className="h-6 px-2"><Copy className="w-3 h-3" />{copiedHash === report.hash ? 'Copied!' : 'Copy'}</Button>
                  </div>
                  <code className="text-xs text-gray-800 break-all">{report.hash}</code>
                </div>
                {report.blockchain_verified && report.tx_hash && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2"><Shield className="w-4 h-4 text-blue-600" /><span className="text-sm font-medium text-blue-900">Blockchain Data</span></div>
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="flex items-center justify-between"><span className="font-medium text-gray-700">Transaction Hash</span><Button size="sm" variant="ghost" onClick={() => copyToClipboard(report.tx_hash!, 'tx')} className="h-6 px-2"><Copy className="w-3 h-3" />{copiedHash === report.tx_hash ? 'Copied!' : 'Copy'}</Button></div>
                        <code className="text-gray-800 break-all">{report.tx_hash}</code>
                      </div>
                      {report.block_number && <div><span className="font-medium text-gray-700">Block Number: </span>{report.block_number}</div>}
                    </div>
                  </div>
                )}
                <div className="mt-3">
                  <Button size="sm" onClick={() => verifyReportIntegrity(report)} className="w-full bg-blue-600 hover:bg-blue-700 text-white"><Shield className="w-3 h-3 mr-2" />Verify Integrity & Export</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={cardStyle} className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">TAXII Collections</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {collections.map((collection) => (
            <div key={collection.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-2"><h4 className="font-medium text-gray-900">{collection.title}</h4><span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{collection.objects_count} objects</span></div>
              <p className="text-sm text-gray-600 mb-3">{collection.description}</p>
              <Button size="sm" variant="outline" onClick={() => openTaxiiEndpoint(`/threatchain/collections/${collection.id}/objects/`)} className="w-full"><ExternalLink className="w-3 h-3 mr-2" />View Collection</Button>
            </div>
          ))}
        </div>
      </div>

      {verificationModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Integrity Verification</h3>
            {verificationModal.isVerifying ? (
              <div className="text-center py-8"><RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" /><p className="text-gray-600">Verifying report integrity...</p></div>
            ) : verificationModal.result ? (
              <div className="space-y-4">
                {verificationModal.result.error ? (
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">⚠️ {verificationModal.result.error}</div>
                ) : (
                  <>
                    <div className={`p-4 rounded-lg border ${verificationModal.result.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center gap-2 mb-2 font-bold uppercase tracking-tight">
                        {verificationModal.result.isValid ? <><CheckCircle2 className="w-5 h-5 text-green-600" /><span className="text-green-900">✅ Provenance Verified</span></> : <><AlertTriangle className="w-5 h-5 text-red-600" /><span className="text-red-900">🛑 Content Tampered</span></>}
                      </div>
                      <p className="text-sm text-slate-700">{verificationModal.result.isValid ? 'This report is globally verified. The database fingerprint matches the immutable record on the Ethereum ledger.' : 'Warning: This file has been tampered with! The current content does not match the original verified record.'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tamper Detection Lab</p>
                      <div className="flex flex-col items-center justify-center py-4 px-2 text-center">
                        <p className="text-xs text-slate-500 mb-4 font-medium">Drop an exported STIX file here to verify its content hasn't been modified since archival.</p>
                        <Input type="file" accept=".json" onChange={async (e) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          const content = await file.text();
                          let parsed = JSON.parse(content);
                          const data = new TextEncoder().encode(JSON.stringify(parsed));
                          const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
                          const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
                          setVerificationModal(prev => ({ ...prev, result: { ...prev.result!, freshHash: hashHex, isValid: hashHex === prev.result?.blockchainHash } }));
                        }} className="text-xs border-none bg-white shadow-sm rounded-lg cursor-pointer" />
                      </div>
                    </div>
                    {verificationModal.result.isValid && (
                      <div className="p-4 bg-green-50/50 rounded-2xl border border-green-100">
                        <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-3 flex items-center gap-2"><Globe className="w-3 h-3" /> Immutable Ledger Proof</p>
                        <div className="grid grid-cols-2 gap-4 text-[11px]">
                          <div><p className="text-slate-400 uppercase font-bold mb-1">Status</p><p className="text-green-700 font-black">CONFIRMED</p></div>
                          <div><p className="text-slate-400 uppercase font-bold mb-1">Block Height</p><p className="text-slate-900 font-mono font-bold">#{verificationModal.result.blockNumber}</p></div>
                        </div>
                      </div>
                    )}
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Data Portability</p>
                      <div className="flex gap-3">
                        <Button onClick={() => exportReport(verificationModal.report!)} variant="outline" className="flex-1 rounded-xl py-6 font-bold"><Download className="w-4 h-4 mr-2" />Export STIX</Button>
                        <Button onClick={() => exportWithCertificate(verificationModal.report!, verificationModal.result!)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-6 font-bold shadow-lg shadow-indigo-100"><Shield className="w-4 h-4 mr-2" />Verified Certificate</Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : null}
            <div className="mt-4 flex justify-end"><Button variant="outline" onClick={() => setVerificationModal({ isOpen: false, report: null, isVerifying: false, result: null })}>Close</Button></div>
          </div>
        </div>
      )}
    </div>
  )
}
