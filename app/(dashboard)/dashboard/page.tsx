"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  Sparkles,
  Plus,
  Loader2,
  MessageSquare,
  Wand2,
  Brain,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreditDisplay } from "@/components/credit-display";
import { supabaseClient } from "@/lib/supabaseClient";
import { supabaseFetch } from "@/lib/supabaseFetch";

export default function DashboardPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
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

  const createNewChat = async (title: string, routeSuffix: string) => {
    setIsCreating(true);
    try {
      const response = await supabaseFetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/chat/${data.conversation.id}${routeSuffix}`);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setIsCreating(false);
    }
  };

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
              <span className="gradient-text">{userName || "User"}</span>!
            </h1>
            <p className="text-lg text-gray-400 mb-6">
              Your AI app builder dashboard
            </p>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid lg:grid-cols-3 gap-6 mb-12">
            {/* Left Column - Products */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product - Turion Chat */}
              <div className="p-8 bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-500/30 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <MessageSquare className="h-8 w-8 text-purple-400" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">Turion Chat</h2>
                    <p className="text-xs text-purple-300">
                      Anthropic + OpenAI - low cost, high quality
                    </p>
                  </div>
                </div>
                <p className="text-gray-300 mb-6">
                  A fast, affordable chat LLM with memory enhancement to keep
                  context sharp and useful.
                </p>
                <Button
                  onClick={() => createNewChat("Turion Chat", "")}
                  disabled={isCreating}
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white"
                >
                  {isCreating ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-5 w-5 mr-2" />
                  )}
                  Open Turion Chat
                </Button>
              </div>

              {/* Product - Concept Architect */}
              <div className="p-8 bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="h-8 w-8 text-blue-400" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Concept Architect
                    </h2>
                    <p className="text-xs text-blue-300">
                      Idea clarification - scope - tech plan
                    </p>
                  </div>
                </div>
                <p className="text-gray-300 mb-6">
                  Helps you understand the idea, define scope, and structure a
                  clear plan to hand off to the Deep Agent.
                </p>
                <Button
                  onClick={() =>
                    createNewChat("Concept Architect", "?mode=concept")
                  }
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
                >
                  <Wand2 className="h-5 w-5 mr-2" />
                  Start Concept Architect
                </Button>
              </div>

              {/* Product - Deep Agent */}
              <div className="p-8 bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border border-emerald-500/30 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Layers className="h-8 w-8 text-emerald-400" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">Deep Agent</h2>
                    <p className="text-xs text-emerald-300">
                      Full build - scaffolding - preview
                    </p>
                  </div>
                </div>
                <p className="text-gray-300 mb-6">
                  Executes the full build using your structured plan. Generates
                  code, scaffolds, and runs previews.
                </p>
                <Button
                  onClick={() => router.push("/builder")}
                  size="lg"
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Open Deep Agent
                </Button>
              </div>
            </div>

            {/* Right Column - Credits Display */}
            <div className="lg:col-span-1">
              <CreditDisplay />
            </div>
          </div>

          {/* Products Status Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="p-8 rounded-lg bg-gradient-to-br from-purple-600/20 to-purple-500/10 border border-purple-500/30 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600/30 mb-4">
                <MessageSquare className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Turion Chat
              </h3>
              <p className="text-green-400 text-sm font-semibold">Live now</p>
            </div>

            <div className="p-8 rounded-lg bg-gradient-to-br from-blue-600/20 to-blue-500/10 border border-blue-500/30 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/30 mb-4">
                <Brain className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Concept Architect
              </h3>
              <p className="text-green-400 text-sm font-semibold">Live now</p>
            </div>

            <div className="p-8 rounded-lg bg-gradient-to-br from-emerald-600/20 to-emerald-500/10 border border-emerald-500/30 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-600/30 mb-4">
                <Layers className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Deep Agent
              </h3>
              <p className="text-green-400 text-sm font-semibold">Live now</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
