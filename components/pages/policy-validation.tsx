"use client"

import { useState } from "react"

const validationRules = [
  "STIX 2.1 Format Compliance",
  "Indicator Pattern Validation",
  "Timestamp Verification",
  "Source Attribution Check",
  "Duplicate Detection",
  "Malware Signature Validation",
]

const cardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "0.75rem",
}

export default function PolicyValidation() {
  const [strictMode, setStrictMode] = useState(false)
  const [normalMode, setNormalMode] = useState(true)

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Policy & Validation</h2>

      <div style={cardStyle} className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Policies</h3>
        <textarea
          className="w-full h-32 bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          defaultValue="ThreadChain Platform Policies:

1. All threat intelligence must be validated against multiple sources
2. Data retention policy: 90 days for raw data, 2 years for aggregated insights
3. Access control: Role-based access with audit logging
4. Encryption: AES-256 for data at rest, TLS 1.3 for data in transit
5. Compliance: GDPR, CCPA, and industry-specific regulations"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div style={cardStyle} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Strict Validation</h3>
            <button
              onClick={() => setStrictMode(!strictMode)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full ${
                strictMode ? "bg-blue-600" : "bg-gray-200"
              }`}
              style={{ transition: "all 150ms ease" }}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white ${
                  strictMode ? "translate-x-7" : "translate-x-1"
                }`}
                style={{ transition: "all 150ms ease" }}
              />
            </button>
          </div>
          <p className="text-sm text-gray-600">Enable strict validation mode for maximum security</p>
        </div>

        <div style={cardStyle} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Normal Mode</h3>
            <button
              onClick={() => setNormalMode(!normalMode)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full ${
                normalMode ? "bg-blue-600" : "bg-gray-200"
              }`}
              style={{ transition: "all 150ms ease" }}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white ${
                  normalMode ? "translate-x-7" : "translate-x-1"
                }`}
                style={{ transition: "all 150ms ease" }}
              />
            </button>
          </div>
          <p className="text-sm text-gray-600">Standard validation with balanced performance</p>
        </div>
      </div>

      <div style={cardStyle} className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Validation Rules Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {validationRules.map((rule, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-blue-600" />
              <span className="text-sm text-gray-900">{rule}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
