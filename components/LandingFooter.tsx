import Link from "next/link";

export function LandingFooter() {
    return (
        <footer className="bg-muted/50 py-12 border-t border-border">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-xs">TC</span>
                        </div>
                        <span className="font-bold text-foreground">ThreatChain</span>
                    </Link>
                    <div className="flex gap-6 text-sm text-muted-foreground">
                        <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
                        <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
                        <Link href="/about" className="hover:text-primary transition-colors">About Us</Link>
                        <Link href="#" className="hover:text-primary transition-colors">Contact</Link>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        © 2024 ThreatChain. All rights reserved.
                    </div>
                </div>
            </div>
        </footer>
    );
}
