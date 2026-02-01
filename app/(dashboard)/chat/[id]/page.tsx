"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatInterface } from "@/components/chat-interface";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabaseClient";

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const conversationId = params?.id as string;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const mode = searchParams.get("mode");
  const modeLabel =
    mode === "concept"
      ? "Concept Architect"
      : mode === "deep"
      ? "Deep Agent"
      : "Turion Chat";

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
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-purple-500/20 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            <span className="text-xl font-bold gradient-text">Turion</span>
          </Link>
          <div className="text-sm text-gray-400 flex items-center gap-3">
            <span>
              Welcome, <span className="text-white">{userName || "User"}</span>
            </span>
            <span className="px-2 py-1 rounded-full text-xs bg-purple-600/20 text-purple-300 border border-purple-500/30">
              {modeLabel}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div
          className={`${
            isSidebarOpen ? "w-64" : "w-0"
          } transition-all duration-300 overflow-hidden`}
        >
          <ChatSidebar currentConversationId={conversationId} />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <ChatInterface conversationId={conversationId} />
        </div>
      </div>
    </div>
  );
}
