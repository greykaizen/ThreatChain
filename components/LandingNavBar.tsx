"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingNavBar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                    ? "bg-white/80 backdrop-blur-md border-b border-slate-200 py-3 shadow-sm"
                    : "bg-transparent py-5"
                }`}
        >
            <div className="container mx-auto px-6 flex items-center justify-between text-slate-900">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-black tracking-tight uppercase">ThreatChain</span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    {/* <NavLink href="/#features">Features</NavLink>
                    <NavLink href="/#how-it-works">How it Works</NavLink>
                    <NavLink href="/about">About Us</NavLink> */}
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <Link href="/login">
                        <Button variant="ghost" className="text-foreground/80 hover:text-foreground">
                            Log in
                        </Button>
                    </Link>
                    <Link href="/signup">
                        {/* <Button className="shadow-lg shadow-primary/20">Get Started</Button> */}
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden p-2 text-foreground"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border p-6 shadow-xl flex flex-col gap-4"
                >
                    <Link href="/#features" className="text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                        Features
                    </Link>
                    <Link href="/#how-it-works" className="text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                        How it Works
                    </Link>
                    <Link href="/about" className="text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                        About Us
                    </Link>
                    <div className="h-px bg-border my-2" />
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full justify-center">
                            Log in
                        </Button>
                    </Link>
                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full justify-center">Get Started</Button>
                    </Link>
                </motion.div>
            )}
        </nav>
    );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hover:scale-105 transform inline-block"
        >
            {children}
        </Link>
    );
}
