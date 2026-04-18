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
  Menu,
  X,
  Cpu,
  Globe,
  FileDigit
} from "lucide-react";
import { LandingNavBar } from "@/components/LandingNavBar";
import { LandingFooter } from "@/components/LandingFooter";
import { Button } from "@/components/ui/button";

// --- Components ---



function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 opacity-50" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] -z-10 opacity-30" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6 border border-primary/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Live Threat Intelligence
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                Trust Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                  Threat Data
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Provenance-aware threat intelligence with verifiable trust scoring.
                We record tamper-evident attestations on a blockchain ledger, giving
                you the context to act with confidence.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href="/signup">
                  {/* <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/25 transition-transform hover:scale-105">
                    Start Free Trial
                    <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-background/50 backdrop-blur-sm hover:bg-muted/50">
                    Read Documentation
                  </Button> */}
                </Link>
              </div>
            </motion.div>
          </div>

          <div className="flex-1 w-full max-w-[600px] lg:max-w-none">
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
      {/* Abstract 3D Representation */}
      <motion.div
        className="relative w-64 h-64 md:w-96 md:h-96"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-0 rounded-full border border-primary/20" />
        <div className="absolute inset-4 rounded-full border border-dashed border-primary/30" />
        <div className="absolute inset-12 rounded-full border border-blue-500/20" />

        {/* Orbiting Elements */}
        <motion.div
          className="absolute -top-4 left-1/2 -ml-3 w-6 h-6 bg-background border border-primary rounded-md flex items-center justify-center shadow-lg shadow-primary/50"
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <Lock className="w-3 h-3 text-primary" />
        </motion.div>

        <motion.div
          className="absolute top-1/2 -right-4 -mt-3 w-6 h-6 bg-background border border-blue-500 rounded-md flex items-center justify-center shadow-lg shadow-blue-500/50"
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <Database className="w-3 h-3 text-blue-500" />
        </motion.div>

        <motion.div
          className="absolute -bottom-4 left-1/2 -ml-3 w-6 h-6 bg-background border border-purple-500 rounded-md flex items-center justify-center shadow-lg shadow-purple-500/50"
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <Network className="w-3 h-3 text-purple-500" />
        </motion.div>
      </motion.div>

      {/* Center Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-24 h-24 md:w-32 md:h-32 bg-background/80 backdrop-blur-xl rounded-2xl border border-border shadow-2xl flex items-center justify-center transform rotate-0 z-10">
          <Shield className="w-10 h-10 md:w-14 md:h-14 text-primary" />
        </div>
      </div>

      {/* Floating Cards (Static positioning relative to container) */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="absolute top-10 -left-10 md:left-0 bg-card/90 backdrop-blur border border-border p-3 rounded-lg shadow-xl max-w-[200px]"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs font-semibold">Threat Detected</span>
        </div>
        <p className="text-[10px] text-muted-foreground">IP 192.168.1.1 flagged as malicious via STIX feed.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="absolute bottom-10 -right-10 md:right-0 bg-card/90 backdrop-blur border border-border p-3 rounded-lg shadow-xl max-w-[200px]"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-xs font-semibold">Blockchain Verified</span>
        </div>
        <p className="text-[10px] text-muted-foreground">Attestation recorded on block #892104.</p>
      </motion.div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -5 }}
      className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all group"
    >
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

function DeepDive() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-red-500 uppercase bg-red-500/10 rounded-full">
              The Problem
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">The "Black Box" of Threat Intel</h2>
            <div className="space-y-6 text-lg text-muted-foreground/90 leading-relaxed">
              <p>
                Modern threat feeds are opaque. You receive an IP address flagged as malicious, but
                you typically don't know the full context: <strong>Who flagged it? When? And why should you trust them?</strong>
              </p>
              <p>
                When incidents happen, reconstructing the decision trail is nearly impossible.
                Compliance audits become a nightmare of missing logs and vague answers, leaving your team vulnerable.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/40 to-blue-600/40 rounded-2xl blur-lg opacity-30" />
            <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-2xl">
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="mt-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                      <Shield className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Full Provenance Tracking</h3>
                    <p className="text-muted-foreground text-sm">Most platforms discard history. We keep everything—original format, parser decisions, and validation errors.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500">
                      <Cpu className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Explainable AI Scores</h3>
                    <p className="text-muted-foreground text-sm">Get a precise 0-1 Trust Score with context. "Rated 0.87 because 3 independent sources reported it within 24h."</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10 text-purple-500">
                      <FileDigit className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Immutable Ledger</h3>
                    <p className="text-muted-foreground text-sm">Critical for legal proceedings. Proves an indicator existed at a specific time with specific metadata.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
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
      if (latest < 0.2) setCurrentStep(0);
      else if (latest < 0.45) setCurrentStep(1);
      else if (latest < 0.7) setCurrentStep(2);
      else setCurrentStep(3);
    });
  }, [scrollYProgress]);

  const steps = [
    {
      id: "01",
      title: "Ingestion & Normalization",
      description: "Raw threat feeds enter the system. We parse MISP, OpenCTI, and OSINT data, normalizing it into a unified STIX 2.1 format without losing context.",
      icon: Database,
      color: "text-blue-500",
      bgColor: "bg-blue-500",
      borderColor: "border-blue-500",
    },
    {
      id: "02",
      title: "AI Trust Scoring",
      description: "The XGBoost engine activates. It analyzes source reputation and cross-feed corroboration, assigning a transparent Trust Score in real-time.",
      icon: Search,
      color: "text-purple-500",
      bgColor: "bg-purple-500",
      borderColor: "border-purple-500",
    },
    {
      id: "03",
      title: "Blockchain Attestation",
      description: "Immutable proof. A cryptographic hash of the indicator and its score is anchored to the ledger, creating a permanent audit trail.",
      icon: Lock,
      color: "text-green-500",
      bgColor: "bg-green-500",
      borderColor: "border-green-500",
    },
    {
      id: "04",
      title: "Secure Consumption",
      description: "Verified intelligence is ready. Security teams consume the enriched data via TAXII 2.1, with full confidence in its origin and integrity.",
      icon: Globe,
      color: "text-amber-500",
      bgColor: "bg-amber-500",
      borderColor: "border-amber-500",
    },
  ];

  return (
    <section ref={targetRef} className="relative h-[300vh] bg-background">
      <div className="sticky top-0 h-screen flex flex-col md:flex-row items-center justify-center overflow-hidden">

        {/* Left Side: The Pipeline Animation */}
        <div className="w-full md:w-1/2 h-[50vh] md:h-full flex items-center justify-center relative p-6 md:p-10">
          {/* Simulation of Data Flow */}
          <div className="relative w-full max-w-md aspect-square bg-card/50 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl overflow-hidden flex flex-col items-center justify-center p-8">

            {/* Background Grid */}
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-5 pointer-events-none">
              {[...Array(36)].map((_, i) => (
                <div key={i} className="border-[0.5px] border-primary/20" />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {currentStep === 0 && (
                <motion.div
                  key="step-0"
                  className="w-full h-full flex flex-col items-center justify-center relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Central Funnel */}
                  <motion.div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/30 mb-8 z-10"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Database className="w-8 h-8 text-blue-500" />
                  </motion.div>

                  {/* Floating "Raw Data" Cards */}
                  {[
                    { text: "MISP Feed", delay: 0, x: -80, y: -60 },
                    { text: "OSINT Log", delay: 0.5, x: 80, y: -40 },
                    { text: "Firewall JSON", delay: 1, x: -60, y: 60 },
                    { text: "CSV Report", delay: 1.5, x: 70, y: 50 },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      className="absolute bg-background border border-border px-3 py-1.5 rounded text-xs font-mono text-muted-foreground shadow-sm"
                      initial={{ opacity: 0, x: item.x * 2, y: item.y * 2, scale: 0.8 }}
                      animate={{
                        opacity: [0, 1, 0],
                        x: 0,
                        y: 0,
                        scale: [0.8, 1, 0]
                      }}
                      transition={{
                        duration: 2.5,
                        delay: item.delay,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    >
                      {item.text}
                    </motion.div>
                  ))}
                  <div className="absolute bottom-4 text-xs font-mono text-blue-500 animate-pulse">Normalizing Data...</div>
                </motion.div>
              )}

              {currentStep === 1 && (
                <motion.div
                  key="step-1"
                  className="w-full h-full flex flex-col items-center justify-center relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Indicator Card */}
                  <motion.div
                    className="w-64 bg-background border border-border rounded-xl p-4 shadow-lg relative overflow-hidden z-10"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                  >
                    <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                      <span className="text-xs font-bold text-muted-foreground">IOC ANALYSIS</span>
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="h-2 bg-muted rounded w-3/4" />
                      <div className="h-2 bg-muted rounded w-1/2" />
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground">Trust Score</div>
                        <div className="text-2xl font-bold text-purple-500">
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            0.95
                          </motion.span>
                        </div>
                      </div>
                      <Search className="w-6 h-6 text-purple-500/50" />
                    </div>

                    {/* Scanning Laser */}
                    <motion.div
                      className="absolute top-0 left-0 right-0 h-1 bg-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.5)] z-20"
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </motion.div>

                  {/* Floating "Checks" */}
                  <div className="absolute top-10 right-10 flex flex-col gap-2">
                    {["Reputation", "History", "Source"].map((text, i) => (
                      <motion.div
                        key={text}
                        className="flex items-center gap-2 text-xs text-green-500 font-mono"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + (i * 0.3) }}
                      >
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        {text}_OK
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step-2"
                  className="w-full h-full flex flex-col items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="relative w-32 h-32 flex items-center justify-center mb-6"
                  >
                    {/* Spinning Rings */}
                    <motion.div
                      className="absolute inset-0 border-4 border-green-500/20 border-t-green-500 rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                      className="absolute inset-2 border-4 border-green-500/20 border-b-green-500 rounded-full"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                    <Lock className="w-10 h-10 text-green-500" />
                  </motion.div>

                  <div className="font-mono text-center">
                    <div className="text-xs text-muted-foreground mb-1">Anchoring to Ledger</div>
                    <motion.div
                      className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded border border-green-500/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      HASH: 0x7f8...3a1
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step-3"
                  className="w-full h-full flex flex-col items-center justify-center relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Central Node */}
                  <div className="w-16 h-16 bg-amber-500/10 rounded-xl border border-amber-500/30 flex items-center justify-center mb-8 z-10">
                    <Globe className="w-8 h-8 text-amber-500" />
                  </div>

                  {/* Connected Nodes */}
                  <div className="absolute w-full h-full">
                    {[
                      { label: "SIEM", x: "20%", y: "20%" },
                      { label: "Firewall", x: "80%", y: "20%" },
                      { label: "Analyst", x: "50%", y: "80%" },
                    ].map((node, i) => (
                      <motion.div
                        key={node.label}
                        className="absolute flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: node.x, top: node.y }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.2 }}
                      >
                        <div className="w-10 h-10 bg-background border border-border rounded-lg flex items-center justify-center shadow-lg relative">
                          <div className="w-4 h-4 rounded-full bg-amber-500/20 animate-ping absolute" />
                          <Network className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <span className="text-[10px] font-bold mt-1 text-muted-foreground">{node.label}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Particles moving to nodes */}
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={`particle-${i}`}
                      className="absolute top-1/2 left-1/2 w-2 h-2 bg-amber-500 rounded-full"
                      animate={{
                        x: i === 0 ? -60 : i === 1 ? 60 : 0,
                        y: i === 0 ? -60 : i === 1 ? -60 : 60,
                        opacity: [1, 0]
                      }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: The Text Steps */}
        <div className="w-full md:w-1/2 p-10 md:p-20 flex flex-col justify-center h-[50vh] md:h-full overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-10 md:hidden" />

          <div className="space-y-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                animate={{
                  opacity: currentStep === index ? 1 : 0.2,
                  x: currentStep === index ? 0 : 20,
                  scale: currentStep === index ? 1 : 0.95
                }}
                transition={{ duration: 0.5 }}
                className="cursor-pointer"
                onClick={() => {
                  // Optional: Smooth scroll to this section could be added
                }}
              >
                <div className={`text-sm font-bold mb-2 uppercase tracking-widest ${steps[index].color}`}>
                  Step {step.id}
                </div>
                <h3 className={`text-3xl font-bold mb-4 ${currentStep === index ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.title}
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


function Statistics() {
  const stats = [
    { value: "99.9%", label: "Uptime Guarantee", icon: Zap },
    { value: "<50ms", label: "Global Latency", icon: Network },
    { value: "24/7", label: "Threat Monitoring", icon: Shield },
  ];

  return (
    <section className="py-32 relative overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 divide-y md:divide-y-0 md:divide-x divide-border">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              className="flex flex-col items-center justify-center text-center px-4 group"
            >
              <div className="mb-6 p-4 rounded-2xl bg-primary/5 text-primary ring-1 ring-primary/20 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <stat.icon className="w-8 h-8" />
              </div>
              <h3 className="text-5xl md:text-6xl font-black text-foreground mb-3 tracking-tighter">
                {stat.value}
              </h3>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em]">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CallToAction() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 -z-10" />
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to secure your intelligence?</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join the provenance-aware revolution. Get verifiable trust scores for your threat data today.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup">
            {/* <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/20">
              Get Started Now
            </Button> */}
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 cursor-default scroll-smooth">
      <LandingNavBar />
      <main>
        <Hero />
        <Statistics />
        <DeepDive />
        <PipelineScroll />
        <CallToAction />
      </main>
      <LandingFooter />
    </div>
  );
}
