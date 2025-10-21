"use client"

import { useState, useRef } from "react"
import { Upload, ArrowRight, Check, Network, FileText } from "lucide-react"

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
  const [step, setStep] = useState<"upload" | "attributes">("upload")
  const [attributes, setAttributes] = useState<FeedAttribute[]>([])
  const [csvData, setCsvData] = useState<any[]>([])
  const [fileName, setFileName] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Feed Management</h2>
          <div className="flex items-center gap-2 mt-2">
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
        </div>
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
    </div>
  )
}
