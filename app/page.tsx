"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Shield,
  Database,
  Lock,
  Network,
  Zap,
  Search,
  ChevronRight,
  Cpu,
  Globe,
  FileDigit,
  Activity,
  Server,
  ArrowRight,
  Terminal,
  MousePointer2,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { LandingNavBar } from "@/components/LandingNavBar";
import { LandingFooter } from "@/components/LandingFooter";
import { Button } from "@/components/ui/button";

// ─── DESIGN TOKENS (Modern Light SOC Specification) ─────────────────────────

const COLORS = {
  surface: "#f8fafc",    // Snow
  elevated: "#ffffff",   // White
  border: "#e2e8f0",     // Slate-200
  accent: "#4f46e5",     // Indigo-600
  textPrimary: "#0f172a", // Slate-900
  textSecondary: "#64748b" // Slate-500
};

const FADE_UP = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: "easeOut" }
};

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

function StatusBadge({ label, status = "ACTIVE" }: { label: string, status?: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
      <span className="text-[10px] font-bold font-mono text-slate-500 tracking-[0.2em] uppercase">
        {label}: <span className="text-indigo-600">{status}</span>
      </span>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-40 overflow-hidden bg-white">
      {/* Decorative Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.03)_0%,transparent_70%)]" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <StatusBadge label="THREAT_PROTOCOL" status="OPERATIONAL" />
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tight mb-8 leading-[0.95] uppercase">
                Verifiable <br />
                <span className="text-indigo-600">Threat</span> Intelligence
              </h1>

              
              <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                The global backbone for immutable threat provenance. 
                Securing digital assets through blockchain-anchored attestations and 
                Frontier-class AI reasoning.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Button asChild size="lg" className="h-14 px-10 text-xs font-bold uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 rounded-md transition-all shadow-xl shadow-indigo-100">
                  <Link href="/signup">
                    Initialize Onboarding
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 px-10 text-xs font-bold uppercase tracking-widest border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md transition-all">
                  <Link href="/login">
                    Access Portal
                  </Link>
                </Button>
              </div>

              {/* Real-time Status HUD */}
              <div className="mt-16 flex items-center justify-center lg:justify-start gap-8 opacity-60">
                 <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-slate-400">
                    <Server className="w-4 h-4 text-green-500" />
                    <span className="uppercase">ALCH_NODE: READY</span>
                 </div>
                 <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-slate-400">
                    <Database className="w-4 h-4 text-green-500" />
                    <span className="uppercase">SUPA_DB: SYNCED</span>
                 </div>
              </div>
            </motion.div>
          </div>

          <div className="flex-1 w-full relative">
            <CyberGlobe />
          </div>
        </div>
      </div>
    </section>
  );
}

function CyberGlobe() {
  return (
    <div className="relative w-full aspect-square flex items-center justify-center">
      {/* High-Fidelity Orbitals from original design */}
      <motion.div
        className="relative w-64 h-64 md:w-[500px] md:h-[500px]"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-0 rounded-full border border-slate-100" />
        <div className="absolute inset-8 rounded-full border border-dashed border-indigo-100" />
        <div className="absolute inset-24 rounded-full border border-slate-100" />

        {/* Orbiting Tech Nodes */}
        {[0, 120, 240].map((angle, i) => (
          <motion.div
            key={i}
            className="absolute w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-xl"
            style={{ 
              top: '50%', 
              left: '50%',
              transform: `rotate(${angle}deg) translateX(250px) rotate(-${angle}deg)` 
            }}
            animate={{ rotate: [-360, 0] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          >
            {i === 0 ? <Lock className="w-5 h-5 text-indigo-600" /> : 
             i === 1 ? <Database className="w-5 h-5 text-indigo-600" /> : 
                       <Network className="w-5 h-5 text-indigo-600" />}
          </motion.div>
        ))}
      </motion.div>

      {/* Center Shield with Neural Core */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-24 h-24 md:w-40 md:h-40 bg-white/90 backdrop-blur-2xl rounded-[2.5rem] border border-slate-200 shadow-[0_20px_80px_rgba(79,70,229,0.15)] flex items-center justify-center z-10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.05)_0%,transparent_100%)]" />
          <Shield className="w-12 h-12 md:w-16 md:h-16 text-indigo-600 relative z-20 transition-transform duration-500 group-hover:scale-110" />
        </div>
      </div>

      {/* Floating Insight Cards */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="absolute top-10 -left-6 md:left-0 bg-white/95 backdrop-blur border border-slate-200 p-4 rounded-2xl shadow-2xl max-w-[220px] z-20 ring-1 ring-slate-100"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Threat Logic</span>
        </div>
        <p className="text-[11px] text-slate-500 font-mono leading-tight uppercase">BLOCK_SYNC: 10690384_OK</p>
      </motion.div>
    </div>
  );
}

function Statistics() {
  const stats = [
    { value: "3.2k+", label: "Verified Hashes", icon: FileDigit },
    { value: "100%", label: "Chain Integrity", icon: CheckCircle2 },
    { value: "24/7", label: "Ledger Monitoring", icon: Activity },
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-slate-50/50 border-y border-slate-200">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              {...FADE_UP}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center justify-center text-center px-4 group"
            >
              <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                <stat.icon className="w-8 h-8" />
              </div>
              <h3 className="text-5xl md:text-6xl font-black text-slate-900 mb-3 tracking-tighter uppercase">
                {stat.value}
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.4em]">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PipelineScroll() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    return scrollYProgress.onChange((latest) => {
      if (latest < 0.25) setCurrentStep(0);
      else if (latest < 0.5) setCurrentStep(1);
      else if (latest < 0.75) setCurrentStep(2);
      else setCurrentStep(3);
    });
  }, [scrollYProgress]);

  const steps = [
    { id: "01", title: "Normalization", desc: "Raw threat feeds are unified into STIX 2.1.", icon: Database, color: "text-blue-600" },
    { id: "02", title: "Neural Scoring", desc: "XGBoost engine calculates trust in real-time.", icon: Search, color: "text-indigo-600" },
    { id: "03", title: "Attestation", desc: "Cryptographic anchoring to the public ledger.", icon: Lock, color: "text-green-600" },
    { id: "04", title: "Consumption", desc: "Verified intel served via secure TAXII v2.1.", icon: Globe, color: "text-amber-600" },
  ];

  return (
    <section ref={targetRef} className="relative h-[400vh] bg-white">
      <div className="sticky top-0 h-screen flex flex-col md:flex-row items-center justify-center overflow-hidden">
        
        {/* Full Pipeline Simulation from original design */}
        <div className="w-full md:w-1/2 h-[50vh] md:h-full flex items-center justify-center p-12">
           <div className="relative w-full max-w-lg aspect-square bg-slate-50 rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden flex items-center justify-center">
              {/* Background Grid */}
              <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-30 pointer-events-none">
                {[...Array(36)].map((_, i) => <div key={i} className="border-[0.5px] border-slate-200" />)}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.1, y: -15 }}
                  transition={{ duration: 0.5 }}
                  className="text-center relative z-10"
                >
                   <div className="mb-8 p-10 rounded-[2.5rem] bg-white border border-slate-200 inline-flex shadow-xl shadow-indigo-100/50 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.05)_0%,transparent_100%)]" />
                      {(() => {
                        const Icon = steps[currentStep].icon;
                        return <Icon className={`w-20 h-20 ${steps[currentStep].color} relative z-10`} />
                      })()}
                   </div>
                   <h3 className="text-3xl font-black text-slate-900 uppercase tracking-widest">{steps[currentStep].id} / {steps[currentStep].title}</h3>
                   <div className="mt-4 flex items-center justify-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono italic">Process_Ready</p>
                   </div>
                </motion.div>
              </AnimatePresence>
           </div>
        </div>

        {/* Dynamic Stepper Text */}
        <div className="w-full md:w-1/2 p-12 md:p-32 flex flex-col justify-center gap-16">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              animate={{
                opacity: currentStep === index ? 1 : 0.1,
                x: currentStep === index ? 0 : 40,
                scale: currentStep === index ? 1 : 0.95
              }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <p className={`text-xs font-black uppercase tracking-[0.5em] ${step.color}`}>Protocol_Node_{step.id}</p>
              <h3 className="text-5xl font-black text-slate-900 tracking-tighter">{step.title}</h3>
              <p className="text-slate-500 leading-relaxed max-w-sm text-xl font-medium">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GlobalFooter() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-24">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
          <div className="col-span-1 md:col-span-1">
             <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-100">
                   <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="font-black text-slate-900 uppercase tracking-tighter text-2xl">ThreadChain</span>
             </div>
             <p className="text-slate-500 text-sm leading-relaxed max-w-xs font-medium">
               Securing the global threat landscape through immutable blockchain provenance and Frontier-class AI.
             </p>
          </div>
          
          {[
            { title: "Platform", links: ["Analysis", "Assistant", "Blockchain", "Storage"] },
            { title: "Develop", links: ["Documentation", "GitHub", "API Keys", "Status"] },
            { title: "Company", links: ["About", "Privacy", "Security", "Contact"] }
          ].map((col, i) => (
            <div key={i}>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mb-10">{col.title}</h4>
              <ul className="space-y-5 text-sm font-bold text-slate-600">
                {col.links.map((link, j) => (
                  <li key={j} className="hover:text-indigo-600 transition-colors cursor-pointer uppercase tracking-tighter">{link}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-12 border-t border-slate-200">
           <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">© 2026 // THREADCHAIN_INTELLIGENCE // v4.2.0_STABLE</p>
           <div className="flex gap-10">
              <Zap className="w-5 h-5 text-slate-300 hover:text-indigo-600 transition-all cursor-pointer" />
              <Activity className="w-5 h-5 text-slate-300 hover:text-indigo-600 transition-all cursor-pointer" />
              <Server className="w-5 h-5 text-slate-300 hover:text-indigo-600 transition-all cursor-pointer" />
           </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 scroll-smooth antialiased">
      <LandingNavBar />
      <main>
        <Hero />
        <Statistics />

        {/* Enhanced Deep Dive from original layout */}
        <section className="py-40 bg-white relative overflow-hidden">
           <div className="container mx-auto px-6">
              <div className="grid lg:grid-cols-2 gap-24 items-center">
                 <motion.div {...FADE_UP}>
                    <StatusBadge label="INFRA_VIEW" status="DECENTRALIZED" />
                    <h2 className="text-5xl md:text-7xl font-black text-slate-900 mb-10 uppercase tracking-tighter leading-tight">Beyond Raw <br /> Threat Feeds</h2>
                    <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-xl mb-12">
                       We solve the context gap by providing **mathematical proof** of origin. Every indicator is hashed, verified, and anchored to a public ledger.
                    </p>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 shadow-sm">
                          <Cpu className="w-8 h-8 text-indigo-600 mb-4" />
                          <h4 className="font-black text-xs uppercase tracking-widest">XGBoost ML</h4>
                       </div>
                       <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 shadow-sm">
                          <Globe className="w-8 h-8 text-indigo-600 mb-4" />
                          <h4 className="font-black text-xs uppercase tracking-widest">TAXII 2.1</h4>
                       </div>
                    </div>
                 </motion.div>

                 <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   whileInView={{ opacity: 1, scale: 1 }}
                   className="relative bg-slate-900 rounded-[4rem] p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] overflow-hidden text-left"
                 >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.15),transparent)]" />
                    <div className="relative z-10 space-y-12 font-mono">
                       <div className="flex items-center justify-between border-b border-white/10 pb-8">
                          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest italic">Neural_Link_Init...</p>
                          <div className="flex gap-2">
                             <div className="w-2 h-2 rounded-full bg-slate-700" />
                             <div className="w-2 h-2 rounded-full bg-slate-700" />
                             <div className="w-2 h-2 rounded-full bg-slate-700" />
                          </div>
                       </div>
                       
                       <div className="space-y-8">
                          {[
                            "ANALYZING_MALWARE_VECTORS...",
                            "ETHEREUM_BLOCK_ANCHORING...",
                            "CALCULATING_PROVENANCE...",
                            "RAG_BRAIN_SYNC_COMPLETE"
                          ].map((t, i) => (
                            <motion.div 
                               key={i}
                               initial={{ opacity: 0, x: -10 }}
                               whileInView={{ opacity: 1, x: 0 }}
                               transition={{ delay: i * 0.15 }}
                               className="flex items-center gap-4 text-slate-400 text-[11px] font-bold tracking-tight"
                            >
                               <Terminal className="w-4 h-4 text-indigo-500" />
                               {t}
                            </motion.div>
                          ))}
                       </div>
                    </div>
                 </motion.div>
              </div>
           </div>
        </section>

        <PipelineScroll />

        {/* Clean Light CTA Section */}
        <section className="py-40 relative flex items-center justify-center overflow-hidden bg-slate-50/50 border-t border-slate-100">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.02)_0%,transparent_70%)]" />
           <motion.div 
             initial={{ opacity: 0, scale: 0.98 }}
             whileInView={{ opacity: 1, scale: 1 }}
             className="relative z-10 w-full max-w-5xl bg-white border border-slate-200 p-24 rounded-[4rem] text-center shadow-[0_40px_100px_rgba(0,0,0,0.05)] ring-1 ring-slate-100"
           >
              <StatusBadge label="DEPLOYMENT_BRIDGE" status="STABLE_V4.2" />
              <h2 className="text-5xl md:text-8xl font-black mb-12 tracking-tight text-slate-900 uppercase leading-[0.9]">Establish Link <br /> <span className="text-indigo-600">to Network</span></h2>
              <Button asChild size="lg" className="h-16 px-16 text-xs font-bold uppercase tracking-[0.3em] bg-indigo-600 text-white hover:bg-indigo-700 rounded-md transition-all shadow-2xl shadow-indigo-100 active:scale-95">
                <Link href="/signup">Initiate Link</Link>
              </Button>
           </motion.div>
        </section>
      </main>
      <GlobalFooter />
    </div>
  );
}
