"use client"

import { Search, Bell, User } from "lucide-react"
// import { ThemeToggle } from "./theme-toggle"

export default function Navbar() {
  return (
    <nav className="px-6 py-3 flex items-center justify-between bg-card border-b border-border">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gray-900 dark:bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs">TC</span>
          </div>
          <h1 className="text-base font-semibold text-foreground">ThreatChain</h1>
        </div>
        
        {/* <div className="relative ml-4">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search"
            className="pl-9 pr-4 py-1.5 text-sm border border-border rounded-md bg-muted text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent w-64"
          />
        </div> */}
      </div>

      <div className="flex items-center gap-3">
        {/* <ThemeToggle /> */}
        {/* <button className="p-2 rounded-md hover:bg-muted transition-all">
          <Bell className="w-4 h-4 text-muted-foreground" />
        </button>
        <button className="p-2 rounded-md hover:bg-muted transition-all">
          <User className="w-4 h-4 text-muted-foreground" />
        </button> */}
      </div>
    </nav>
  )
}
