"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, RefreshCw, AlertCircle, CheckCircle, Loader2, Database } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Source {
  source: string
  report_id?: string
  indicator_id?: string
  title?: string
  severity?: string
  report_type?: string
  indicators_count?: number
  indicator_type?: string
  confidence?: number
  relevance_score?: number
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: Source[]
  timestamp: Date
  isError?: boolean
}

interface RagStatus {
  online: boolean
  ready: boolean
  indexed_documents: number
  message: string
}

// ─── Suggested questions ─────────────────────────────────────────────────────
const SUGGESTED_QUESTIONS = [
  "What are the most critical severity threat reports?",
  "Show me reports related to malware campaigns",
  "Which indicators have the highest confidence scores?",
  "What threat types appear most frequently?",
  "Summarize recent threat intelligence activity",
]

const API_BASE = "http://localhost:3001/api"

// ─── Component ────────────────────────────────────────────────────────────────
export default function RagAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm the ThreadChain Threat Intelligence Assistant. Ask me anything about your STIX reports, indicators of compromise, threat actors, or malware campaigns. I'll search your indexed threat data to answer.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [ragStatus, setRagStatus] = useState<RagStatus | null>(null)
  const [reindexing, setReindexing] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ─── Fetch RAG status on mount and every 15s ────────────────────────────
  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 15000)
    return () => clearInterval(interval)
  }, [])

  // ─── Auto-scroll to bottom on new messages ──────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/rag/status`)
      const data = await res.json()
      setRagStatus(data)
    } catch {
      setRagStatus({ online: false, ready: false, indexed_documents: 0, message: "RAG service offline" })
    }
  }

  const handleReindex = async () => {
    setReindexing(true)
    try {
      await fetch(`${API_BASE}/rag/index`, { method: "POST" })
      // Poll status until ready
      const poll = setInterval(async () => {
        const res = await fetch(`${API_BASE}/rag/status`)
        const data = await res.json()
        setRagStatus(data)
        if (data.ready) {
          clearInterval(poll)
          setReindexing(false)
        }
      }, 2000)
    } catch {
      setReindexing(false)
    }
  }

  const sendMessage = async (question: string) => {
    if (!question.trim() || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question.trim(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/rag/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), top_k: 5 }),
      })
      const data = await res.json()

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.success
          ? data.answer || "No answer returned."
          : data.error || "An error occurred.",
        sources: data.sources || [],
        timestamp: new Date(),
        isError: !data.success,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Could not reach the RAG service. Make sure it is running on port 5002.",
          timestamp: new Date(),
          isError: true,
        },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  // ─── Severity badge colour ───────────────────────────────────────────────
  const severityColor = (s?: string) => {
    switch ((s || "").toLowerCase()) {
      case "critical": return "bg-red-100 text-red-700"
      case "high":     return "bg-orange-100 text-orange-700"
      case "medium":   return "bg-yellow-100 text-yellow-700"
      case "low":      return "bg-green-100 text-green-700"
      default:         return "bg-gray-100 text-gray-600"
    }
  }

  const cardStyle = {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "0.75rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  }

  return (
    <div className="flex flex-col h-full p-6 gap-4 max-w-6xl mx-auto">

      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Threat Intelligence Assistant
          </h2>
          <p className="text-gray-500 mt-1">
            Ask natural language questions about your STIX reports and IOCs
          </p>
        </div>

        {/* Status badge + re-index button */}
        <div className="flex items-center gap-3">
          {ragStatus && (
            <div
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border ${
                ragStatus.online && ragStatus.ready
                  ? "bg-green-50 text-green-700 border-green-200"
                  : ragStatus.online
                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {ragStatus.online && ragStatus.ready ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : ragStatus.online ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              {ragStatus.online && ragStatus.ready
                ? `RAG Online · ${ragStatus.indexed_documents} docs`
                : ragStatus.online
                ? "Indexing..."
                : "RAG Offline"}
            </div>
          )}

          <button
            onClick={handleReindex}
            disabled={reindexing || !ragStatus?.online}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reindexing ? "animate-spin" : ""}`} />
            {reindexing ? "Indexing..." : "Re-index"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">

        {/* ─── Chat panel ───────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-h-0" style={cardStyle}>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.role === "user" ? "bg-blue-600" : "bg-gray-800"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Bubble */}
                <div className={`max-w-[75%] space-y-2 ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-sm"
                        : msg.isError
                        ? "bg-red-50 text-red-800 border border-red-200 rounded-tl-sm"
                        : "bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="space-y-1 w-full">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                        Sources ({msg.sources.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {msg.sources.map((src, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs"
                          >
                            <Database className="w-3 h-3 text-blue-500 flex-shrink-0" />
                            <span className="font-medium text-gray-700 truncate max-w-[140px]">
                              {src.title || src.indicator_type || src.source}
                            </span>
                            {src.severity && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${severityColor(src.severity)}`}>
                                {src.severity}
                              </span>
                            )}
                            {src.relevance_score !== undefined && (
                              <span className="text-gray-400 text-[10px]">
                                {(src.relevance_score * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-gray-400 px-1">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1 items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-gray-100 p-4">
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about threats, IOCs, malware campaigns... (Enter to send)"
                rows={2}
                className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                disabled={loading}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ─── Sidebar: suggested questions ─────────────────────────────── */}
        <div className="w-64 flex-shrink-0 space-y-4">
          <div style={cardStyle} className="p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Suggested Questions
            </h3>
            <div className="space-y-2">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                  className="w-full text-left text-xs text-gray-700 px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-100 hover:border-blue-200 transition-colors disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Setup info card */}
          {ragStatus && !ragStatus.online && (
            <div style={cardStyle} className="p-4 border-orange-200 bg-orange-50">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-bold text-orange-700 uppercase tracking-widest">
                  RAG Service Offline
                </h3>
              </div>
              <p className="text-xs text-orange-700 leading-relaxed">
                Start the RAG service:
              </p>
              <pre className="mt-2 text-[10px] bg-orange-100 text-orange-800 p-2 rounded font-mono leading-relaxed">
                cd rag-service{"\n"}
                pip install -r requirements.txt{"\n"}
                python app.py
              </pre>
            </div>
          )}

          {/* LLM info card */}
          {ragStatus?.online && (
            <div style={cardStyle} className="p-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                LLM Backend
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                For AI answers, run Ollama locally:
              </p>
              <pre className="mt-2 text-[10px] bg-gray-50 text-gray-700 p-2 rounded font-mono leading-relaxed border border-gray-100">
                ollama run llama3
              </pre>
              <p className="text-[10px] text-gray-400 mt-2">
                Or set OPENAI_API_KEY in rag-service/.env
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
