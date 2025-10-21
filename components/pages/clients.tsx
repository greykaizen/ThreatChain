"use client"

import { Users, Clock } from "lucide-react"

const clients = [
  { id: 1, name: "Client 1", status: "Connected", lastAccess: "2 minutes ago" },
  { id: 2, name: "Client 2", status: "Connected", lastAccess: "15 minutes ago" },
  { id: 3, name: "Client 3", status: "Idle", lastAccess: "1 hour ago" },
]

const accessTimeline = [
  { id: 1, client: "Client 1", action: "Data Pull", timestamp: "2024-01-15 14:30", records: 245 },
  { id: 2, client: "Client 2", action: "Feed Upload", timestamp: "2024-01-15 13:45", records: 128 },
  { id: 3, client: "Client 1", action: "Data Pull", timestamp: "2024-01-15 12:20", records: 89 },
  { id: 4, client: "Client 3", action: "Query", timestamp: "2024-01-15 11:15", records: 34 },
]

const cardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "0.75rem",
}

export default function Clients() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Connected Clients</h2>

      <div style={cardStyle} className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Active Clients
        </h3>
        <div className="space-y-3">
          {clients.map((client) => (
            <div
              key={client.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div>
                <p className="font-medium text-gray-900">{client.name}</p>
                <p className="text-sm text-gray-600">Last access: {client.lastAccess}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  client.status === "Connected" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {client.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={cardStyle} className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Access Timeline
        </h3>
        <div className="space-y-4">
          {accessTimeline.map((entry, index) => (
            <div key={entry.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-blue-600" />
                {index < accessTimeline.length - 1 && <div className="w-0.5 h-12 bg-gray-200 mt-2" />}
              </div>
              <div className="flex-1 pb-4">
                <p className="font-medium text-gray-900">
                  {entry.client} - {entry.action}
                </p>
                <p className="text-sm text-gray-600">{entry.timestamp}</p>
                <p className="text-xs text-gray-500 mt-1">{entry.records} records processed</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
