"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ExternalLink, Camera } from "lucide-react";

const screenshots = [
  {
    title: "Intelligence Command",
    description: "Real-time threat telemetry and neural scoring overview.",
    src: "/images/screenshots/dashboard-v2.png",
  },
  {
    title: "Blockchain Metrics",
    description: "Immutable ledger performance and transaction health.",
    src: "/images/screenshots/blockchain-metrics.png",
  },
  {
    title: "Trust Intelligence",
    description: "Explainable XGBoost scoring with feature importance.",
    src: "/images/screenshots/trust-intelligence.png",
  },
  {
    title: "Provenance Engine",
    description: "Trace every indicator back to its cryptographic origin.",
    src: "/images/screenshots/provenance-engine.png",
  },
  {
    title: "Feed Parser",
    description: "Automated attribute extraction from multi-format feeds.",
    src: "/images/screenshots/feed-parser-attributes.png",
  },
  {
    title: "AI Assistant",
    description: "RAG-powered conversational interface for threat hunting.",
    src: "/images/screenshots/ai-assistant.png",
  },
];

const FADE_UP = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: "easeOut" }
};

export function PlatformShowcase() {
  return (
    <section className="py-32 bg-slate-50/50 border-y border-slate-100 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
            <Camera className="w-3 h-3 text-indigo-600" />
            <span className="text-[10px] font-bold font-mono text-indigo-600 tracking-[0.2em] uppercase">
              Platform_Showcase
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter mb-6">
            Visualizing the <span className="text-indigo-600">Frontier</span>
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium text-lg">
            Experience the full spectrum of ThreatChain's intelligence capabilities through our high-fidelity interface.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {screenshots.map((item, i) => (
            <motion.div
              key={i}
              {...FADE_UP}
              transition={{ delay: i * 0.1 }}
              className="group relative bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500"
            >
              <div className="aspect-video relative overflow-hidden bg-slate-100">
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/5 transition-colors duration-500" />
              </div>
              
              <div className="p-8">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-black text-slate-900 uppercase tracking-tight text-xl">
                    {item.title}
                  </h3>
                  <div className="p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
