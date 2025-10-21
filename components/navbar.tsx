"use client"

import { Search, Bell, User } from "lucide-react"

export default function Navbar() {
  return (
    <nav
      style={{
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
      }}
      className="px-6 py-3 flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gray-900 flex items-center justify-center">
            <span className="text-white font-bold text-xs">TC</span>
          </div>
          <h1 className="text-base font-semibold text-gray-900">ThreadChain</h1>
        </div>
        
        <div className="relative ml-4">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search"
            className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 rounded-md hover:bg-gray-100" style={{ transition: "all 150ms ease" }}>
          <Bell className="w-4 h-4 text-gray-600" />
        </button>
        <button className="p-2 rounded-md hover:bg-gray-100" style={{ transition: "all 150ms ease" }}>
          <User className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </nav>
  )
}
