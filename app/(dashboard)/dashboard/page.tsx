"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Sparkles, Code2, Rocket } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadSession = async () => {
      const { data, error } = await supabaseClient.auth.getSession();

      if (!isActive) return;

      if (error || !data.session) {
        router.push("/login");
        return;
      }

      const profileName =
        data.session.user.user_metadata?.name ||
        data.session.user.user_metadata?.full_name ||
        data.session.user.email;

      setUserName(profileName ?? null);
      setIsLoading(false);
    };

    loadSession();

    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.push("/login");
          return;
        }

        const profileName =
          session.user.user_metadata?.name ||
          session.user.user_metadata?.full_name ||
          session.user.email;

        setUserName(profileName ?? null);
      }
    );

    return () => {
      isActive = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent" />
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <Header />

      <section className="gradient-bg py-20">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Welcome Header */}
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-4xl md:text-5xl font-bold">
              Welcome back,{" "}
              <span className="gradient-text">{userName || "User"}</span>
              !
            </h1>
            <p className="text-lg text-gray-400">
              Your AI app builder dashboard
            </p>
          </div>

          {/* Coming Soon Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="p-8 rounded-lg bg-gradient-to-br from-gray-900 to-gray-950 border border-white/10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-950/50 mb-4">
                <Sparkles className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                AI Chat Interface
              </h3>
              <p className="text-gray-400 text-sm">Coming in Phase 2</p>
            </div>

            <div className="p-8 rounded-lg bg-gradient-to-br from-gray-900 to-gray-950 border border-white/10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-950/50 mb-4">
                <Code2 className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                App Generation
              </h3>
              <p className="text-gray-400 text-sm">Coming in Phase 3</p>
            </div>

            <div className="p-8 rounded-lg bg-gradient-to-br from-gray-900 to-gray-950 border border-white/10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-950/50 mb-4">
                <Rocket className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Code Preview & Download
              </h3>
              <p className="text-gray-400 text-sm">Coming in Phase 4</p>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-12 max-w-3xl mx-auto p-6 rounded-lg bg-purple-950/30 border border-purple-500/30">
            <p className="text-center text-gray-300">
              <span className="font-semibold text-purple-400">
                Phase 1 Complete!
              </span>{" "}
              The foundation is ready. Stay tuned for exciting features coming in
              the next phases.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
