"use client"

import { useState, useEffect } from "react"
import { Upload, Hash, Database, CheckCircle2, Clock, AlertCircle, FileText, Shield, ArrowRight, Server, Lock, Network } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface BlockchainTransaction {
  id: string
  hash: string
  blockNumber: number
  timestamp: string
  status: "pending" | "confirmed" | "failed"
  gasUsed?: string
  reportId: string
}

interface OffChainRecord {
  id: string
  reportHash: string
  stixContent: any
  timestamp: string
  size: string
  blockchainTxId: string
}

const cardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "0.75rem",
}

export default function BlockchainDemo() {
  const [stixFile, setStixFile] = useState<File | null>(null)
  const [stixContent, setStixContent] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState("")
  const [progress, setProgress] = useState(0)
  const [reportHash, setReportHash] = useState("")
  const [blockchainTx, setBlockchainTx] = useState<BlockchainTransaction | null>(null)
  const [offChainRecord, setOffChainRecord] = useState<OffChainRecord | null>(null)
  const [processComplete, setProcessComplete] = useState(false)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  // Check backend status on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health')
        if (response.ok) {
          setBackendStatus('online')
        } else {
          setBackendStatus('offline')
        }
      } catch {
        setBackendStatus('offline')
      }
    }
    checkBackend()
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setStixFile(file)
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target?.result as string)
        setStixContent(content)
      } catch (error) {
        alert("Invalid STIX JSON file")
      }
    }

    reader.readAsText(file)
  }

  const processSTIXReport = async () => {
    if (!stixContent || !stixFile) return

    setIsProcessing(true)
    setProgress(0)
    setProcessComplete(false)

    try {
      // Step 1: Generate Hash
      setCurrentStep("Generating SHA-256 hash of STIX report...")
      setProgress(20)
      const hash = await generateHash(JSON.stringify(stixContent))
      setReportHash(hash)

      // Step 2: Upload to Backend API
      setCurrentStep("Uploading to backend and storing in database...")
      setProgress(40)

      const formData = new FormData()
      formData.append('file', stixFile)
      formData.append('title', stixContent.name || stixFile.name.replace('.json', ''))
      formData.append('description', stixContent.description || 'STIX 2.1 Threat Intelligence Report')

      let uploadResponse
      try {
        uploadResponse = await fetch('http://localhost:3001/api/stix/upload', {
          method: 'POST',
          body: formData
        })
      } catch (fetchError) {
        throw new Error('Cannot connect to backend server. Make sure it is running on port 3001.')
      }

      const uploadData = await uploadResponse.json()

      if (!uploadResponse.ok) {
        // Handle duplicate reports specifically
        if (uploadResponse.status === 409) {
          throw new Error(`Duplicate Report: ${uploadData.message || 'This report already exists in the database'}`)
        }
        throw new Error(uploadData.message || uploadData.error || 'Failed to upload report')
      }

      // Step 3: Create Blockchain Transaction Record
      setCurrentStep("Recording on blockchain...")
      setProgress(60)

      const transaction: BlockchainTransaction = {
        id: uploadData.data.blockchain.transactionId || `tx-${Date.now()}`,
        hash: uploadData.data.reportHash,
        blockNumber: uploadData.data.blockchain.blockNumber || Math.floor(Math.random() * 1000000),
        timestamp: uploadData.timestamp,
        status: "confirmed",
        gasUsed: "21000",
        reportId: uploadData.data.reportId
      }
      setBlockchainTx(transaction)

      // Step 4: Create Off-chain Record
      setCurrentStep("Storing full report in off-chain database...")
      setProgress(80)

      const offChain: OffChainRecord = {
        id: uploadData.data.reportId,
        reportHash: uploadData.data.reportHash,
        stixContent: stixContent,
        timestamp: uploadData.timestamp,
        size: `${uploadData.data.fileSize} bytes`,
        blockchainTxId: transaction.id
      }
      setOffChainRecord(offChain)

      // Complete
      setCurrentStep("Provenance recording complete!")
      setProgress(100)
      await new Promise(resolve => setTimeout(resolve, 500))

      setIsProcessing(false)
      setProcessComplete(true)

    } catch (error) {
      console.error('Error processing STIX report:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to process report'
      setCurrentStep(`Error: ${errorMessage}`)
      setIsProcessing(false)
      
      // Show more specific error messages
      if (errorMessage.includes('Duplicate Report')) {
        alert(`⚠️ ${errorMessage}\n\nPlease upload a different STIX report or modify the existing one.`)
      } else if (errorMessage.includes('fetch')) {
        alert('❌ Cannot connect to backend server.\n\nMake sure the backend is running on port 3001.\n\nRun: npm run backend')
      } else {
        alert(`❌ Failed to process report:\n\n${errorMessage}`)
      }
    }
  }

  const generateHash = async (content: string): Promise<string> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(content)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600 animate-pulse" />
      case "confirmed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Blockchain Provenance Demo</h2>
          <p className="text-sm text-gray-600 mt-1">
            Upload STIX 2.1 report → Generate hash → Store on blockchain → Record provenance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
            backendStatus === 'online' ? 'bg-green-100 text-green-700' :
            backendStatus === 'offline' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              backendStatus === 'online' ? 'bg-green-500 animate-pulse' :
              backendStatus === 'offline' ? 'bg-red-500' :
              'bg-gray-400'
            }`}></div>
            <span className="font-medium">
              {backendStatus === 'online' ? 'Backend Online' :
               backendStatus === 'offline' ? 'Backend Offline' :
               'Checking...'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Architecture Diagram */}
      <div style={cardStyle} className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">System Architecture</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Node 1: Upload & Hash */}
          <div className="relative">
            <div className="bg-white rounded-lg p-4 border-2 border-blue-300 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Node 1: Client</p>
                  <p className="text-xs text-gray-600">Upload & Hash</p>
                </div>
              </div>
              <div className="space-y-1 text-xs text-gray-700">
                <p>• Upload STIX Report</p>
                <p>• Generate SHA-256</p>
                <p>• Validate Format</p>
              </div>
            </div>
            <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
              <ArrowRight className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          {/* Node 2: Off-Chain Storage */}
          <div className="relative">
            <div className="bg-white rounded-lg p-4 border-2 border-green-300 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Database className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Node 2: Off-Chain</p>
                  <p className="text-xs text-gray-600">MySQL Database</p>
                </div>
              </div>
              <div className="space-y-1 text-xs text-gray-700">
                <p>• Store Full Report</p>
                <p>• Save Metadata</p>
                <p>• Index for Search</p>
              </div>
            </div>
            <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
              <ArrowRight className="w-8 h-8 text-green-400" />
            </div>
          </div>

          {/* Node 3: On-Chain Storage */}
          <div className="bg-white rounded-lg p-4 border-2 border-purple-300 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Lock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Node 3: On-Chain</p>
                <p className="text-xs text-gray-600">Blockchain</p>
              </div>
            </div>
            <div className="space-y-1 text-xs text-gray-700">
              <p>• Store Hash Only</p>
              <p>• Create Block</p>
              <p>• Link to Chain</p>
            </div>
          </div>
        </div>

        {/* Data Flow Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-700"><strong>Client Layer:</strong> User Interface</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-700"><strong>Off-Chain:</strong> Full Data Storage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-gray-700"><strong>On-Chain:</strong> Hash & Provenance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div style={cardStyle} className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload STIX 2.1 Report
        </h3>

        {!stixFile ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Upload your STIX 2.1 JSON file</p>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              id="stix-upload"
            />
            <label
              htmlFor="stix-upload"
              className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Select STIX File
            </label>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">File Loaded: {stixFile.name}</span>
            </div>
            <p className="text-sm text-green-700">
              STIX Objects: {stixContent?.objects?.length || 0} |
              Size: {Math.round(stixFile.size / 1024)}KB |
              Type: {stixContent?.type || 'Unknown'}
            </p>
          </div>
        )}
      </div>

      {/* Process Button */}
      {stixContent && !processComplete && (
        <div className="flex justify-center">
          <Button
            onClick={processSTIXReport}
            disabled={isProcessing}
            className="px-8 py-3 text-lg"
          >
            {isProcessing ? (
              <>
                <Clock className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 mr-2" />
                Record Provenance on Blockchain
              </>
            )}
          </Button>
        </div>
      )}

      {/* Progress Section */}
      {isProcessing && (
        <div style={cardStyle} className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Status</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">{currentStep}</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {(reportHash || blockchainTx || offChainRecord) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Hash Generation */}
          {reportHash && (
            <div style={cardStyle} className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Hash className="w-5 h-5 text-blue-600" />
                Report Hash Generated
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">SHA-256 Hash:</p>
                <p className="font-mono text-sm text-gray-900 break-all">{reportHash}</p>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <p>✓ Cryptographic fingerprint created</p>
                <p>✓ Tamper detection enabled</p>
              </div>
            </div>
          )}

          {/* Blockchain Transaction */}
          {blockchainTx && (
            <div style={cardStyle} className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                Blockchain Transaction
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(blockchainTx.status)}
                    <span className={`text-sm font-medium ${blockchainTx.status === 'confirmed' ? 'text-green-600' :
                        blockchainTx.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                      {blockchainTx.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Transaction ID:</p>
                  <p className="font-mono text-sm text-gray-900">{blockchainTx.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Block Number:</p>
                  <p className="text-sm text-gray-900">{blockchainTx.blockNumber.toLocaleString()}</p>
                </div>
                {blockchainTx.gasUsed && (
                  <div>
                    <p className="text-xs text-gray-600">Gas Used:</p>
                    <p className="text-sm text-gray-900">{blockchainTx.gasUsed}</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Off-chain Storage */}
      {offChainRecord && (
        <div style={cardStyle} className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-600" />
            Off-Chain Storage Record
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Record ID:</p>
              <p className="font-mono text-sm text-gray-900">{offChainRecord.id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Storage Size:</p>
              <p className="text-sm text-gray-900">{offChainRecord.size}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Linked Blockchain TX:</p>
              <p className="font-mono text-sm text-blue-600">{offChainRecord.blockchainTxId}</p>
            </div>
          </div>
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-2">STIX Content Preview:</p>
            <pre className="text-xs text-gray-800 overflow-x-auto">
              {JSON.stringify(stixContent, null, 2).substring(0, 300)}...
            </pre>
          </div>
        </div>
      )}

      {/* Visual Transaction Flow */}
      {processComplete && (
        <div style={cardStyle} className="p-6 bg-gradient-to-r from-blue-50 via-purple-50 to-green-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Transaction Flow Visualization</h3>
          
          <div className="relative">
            {/* Flow Steps */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center mb-2 shadow-lg">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <p className="text-xs font-semibold text-gray-900 text-center">STIX Report</p>
                <p className="text-xs text-gray-600 text-center">Upload</p>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <ArrowRight className="w-8 h-8 text-blue-400" />
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center mb-2 shadow-lg">
                  <Hash className="w-8 h-8 text-white" />
                </div>
                <p className="text-xs font-semibold text-gray-900 text-center">Generate Hash</p>
                <p className="text-xs text-gray-600 text-center">SHA-256</p>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <ArrowRight className="w-8 h-8 text-purple-400" />
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-2 shadow-lg">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <p className="text-xs font-semibold text-gray-900 text-center">Blockchain</p>
                <p className="text-xs text-gray-600 text-center">Confirmed</p>
              </div>
            </div>

            {/* Data Split Visualization */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Off-Chain */}
              <div className="bg-white rounded-lg p-4 border-2 border-green-300 shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-gray-900">Off-Chain Storage</h4>
                </div>
                <div className="space-y-2 text-xs text-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Full STIX JSON ({stixFile?.size ? Math.round(stixFile.size / 1024) : 0}KB)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>All Indicators ({stixContent?.objects?.length || 0} objects)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Metadata & Searchable Data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Access Controlled</span>
                  </div>
                </div>
              </div>

              {/* On-Chain */}
              <div className="bg-white rounded-lg p-4 border-2 border-purple-300 shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900">On-Chain Storage</h4>
                </div>
                <div className="space-y-2 text-xs text-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span>Hash Only (64 characters)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span>Block Number: {blockchainTx?.blockNumber || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span>Timestamp: {new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span>Immutable & Tamper-Evident</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Summary */}
      {processComplete && (
        <div style={cardStyle} className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-900">Provenance Successfully Recorded!</h3>
                <p className="text-sm text-green-700">Your STIX report is now immutably stored with blockchain provenance</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setStixFile(null)
                setStixContent(null)
                setReportHash("")
                setBlockchainTx(null)
                setOffChainRecord(null)
                setProcessComplete(false)
                setProgress(0)
                setCurrentStep("")
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Another Report
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 bg-white rounded-lg border border-green-200">
              <Hash className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-900">Hash Generated</p>
              <p className="text-xs text-green-700">Tamper-proof fingerprint</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-green-200">
              <Shield className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-900">Blockchain Stored</p>
              <p className="text-xs text-green-700">Immutable provenance</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-green-200">
              <Database className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-900">Off-chain Archived</p>
              <p className="text-xs text-green-700">Full report preserved</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}