import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 p-1.5">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">NexlyAI</span>
          </Link>

          {/* Links */}
          <nav className="flex items-center space-x-6">
            <Link
              href="/pricing"
              className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/#about"
              className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
            >
              About
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-gray-500">
            © {currentYear} NexlyAI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
