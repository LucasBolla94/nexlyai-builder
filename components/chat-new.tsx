"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabaseFetch } from "@/lib/supabaseFetch";

interface ChatNewProps {
  mode: string;
  searchSuffix: string;
}

const PENDING_MESSAGE_KEY = "turion.pendingMessage";

export function ChatNew({ mode, searchSuffix }: ChatNewProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const sendFirstMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);

    try {
      const response = await supabaseFetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });

      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }

      const data = await response.json();
      const conversationId = data?.conversation?.id;
      if (!conversationId) {
        throw new Error("Missing conversation id");
      }

      sessionStorage.setItem(
        PENDING_MESSAGE_KEY,
        JSON.stringify({ content: trimmed, createdAt: Date.now() })
      );

      router.push(`/chat/${conversationId}${searchSuffix}`);
    } catch (error) {
      console.error("Error starting chat:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl w-full text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600/30 to-purple-500/10 border border-purple-500/30">
            <Bot className="h-8 w-8 text-purple-300" />
          </div>
          <h2 className="text-3xl font-semibold text-white mb-3">
            Ready to build with Turion?
          </h2>
          <p className="text-gray-400 mb-6">
            Share your goal and I will guide you step by step. I can plan,
            explain, and turn ideas into clean, scalable projects.
          </p>

          <div className="grid gap-3 text-left text-sm text-gray-300 mb-8">
            <div className="rounded-lg border border-purple-500/20 bg-black/40 p-4">
              <div className="flex items-center gap-2 text-purple-300 mb-2">
                <Sparkles className="h-4 w-4" />
                Try a quick prompt
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  "Build a SaaS landing page with pricing",
                  "Help me design a chatbot flow",
                  "Explain how to scale a Next.js app",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200 hover:border-purple-500/40 hover:bg-purple-500/10"
                    onClick={() => setInput(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-purple-500/20 p-4 bg-black/40">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "concept"
                ? "Describe your idea. I will help you structure it..."
                : mode === "deep"
                ? "Paste your plan or requirements to start building..."
                : "Ask anything about tech, projects, or AI..."
            }
            className="flex-1 min-h-[60px] max-h-[200px] bg-gray-900 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500 resize-none"
            disabled={isSending}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendFirstMessage();
              }
            }}
          />
          <Button
            onClick={sendFirstMessage}
            disabled={!input.trim() || isSending}
            className="self-end bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-6"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
