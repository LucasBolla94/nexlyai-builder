"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

export function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadSession = async () => {
      const { data, error } = await supabaseClient.auth.getSession();

      if (!isActive) return;

      setIsAuthed(!!data.session && !error);
      setIsLoading(false);
    };

    loadSession();

    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthed(!!session);
      }
    );

    return () => {
      isActive = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-lg">
      <div className="container mx-auto max-w-7xl">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 p-1.5 transition-transform group-hover:scale-105">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Turion</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/#features"
              className="text-sm text-gray-300 hover:text-purple-400 transition-colors"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-gray-300 hover:text-purple-400 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/#about"
              className="text-sm text-gray-300 hover:text-purple-400 transition-colors"
            >
              About
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isLoading ? (
              <div className="h-9 w-20 animate-pulse rounded-lg bg-gray-800" />
            ) : isAuthed ? (
              <>
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    className="text-gray-300 hover:text-white hover:bg-white/10"
                  >
                    Dashboard
                  </Button>
                </Link>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="text-gray-300 hover:text-white hover:bg-white/10"
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4 px-4 space-y-3">
            <Link
              href="/#features"
              className="block text-sm text-gray-300 hover:text-purple-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="block text-sm text-gray-300 hover:text-purple-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/#about"
              className="block text-sm text-gray-300 hover:text-purple-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <div className="pt-3 space-y-2">
              {isAuthed ? (
                <>
                  <Link href="/dashboard" className="block">
                    <Button className="w-full" variant="ghost">
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block">
                    <Button className="w-full" variant="ghost">
                      Login
                    </Button>
                  </Link>
                  <Link href="/signup" className="block">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-700">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
