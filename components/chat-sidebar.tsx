"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, MessageSquare, Trash2, Loader2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { supabaseFetch } from "@/lib/supabaseFetch";

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatSidebarProps {
  currentConversationId?: string;
}

export function ChatSidebar({ currentConversationId }: ChatSidebarProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (editingId) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [editingId]);

  const fetchConversations = async () => {
    try {
      const response = await supabaseFetch("/api/conversations");
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewConversation = async () => {
    setIsCreating(true);
    try {
      const response = await supabaseFetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/chat/${data.conversation.id}`);
        fetchConversations();
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const response = await supabaseFetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setConversations(conversations.filter((c) => c.id !== id));
        if (currentConversationId === id) {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const startEditing = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title || "New Chat");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const saveTitle = async (id: string) => {
    const title = editingTitle.trim();
    if (!title) {
      cancelEditing();
      return;
    }

    try {
      const response = await supabaseFetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title } : c))
        );
      }
    } catch (error) {
      console.error("Error updating conversation:", error);
    } finally {
      cancelEditing();
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/40 border-r border-purple-500/20">
      {/* Header */}
      <div className="p-4 border-b border-purple-500/20">
        <Button
          onClick={createNewConversation}
          disabled={isCreating}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white"
        >
          {isCreating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          New Chat
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center text-gray-400 text-sm mt-8 px-4">
            No conversations yet.
            <br />
            Start a new chat!
          </div>
        ) : (
          conversations.map((conversation) => (
            <motion.div
              key={conversation.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-2"
            >
              <div
                className={`group relative flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                  currentConversationId === conversation.id
                    ? "bg-purple-600/20 border border-purple-500/30"
                    : "hover:bg-purple-600/10 border border-transparent"
                }`}
                onClick={() => {
                  if (!editingId) {
                    router.push(`/chat/${conversation.id}`);
                  }
                }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <MessageSquare className="h-4 w-4 text-purple-400 flex-shrink-0" />
                  {editingId === conversation.id ? (
                    <input
                      ref={inputRef}
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveTitle(conversation.id);
                        }
                        if (e.key === "Escape") {
                          e.preventDefault();
                          cancelEditing();
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-transparent text-sm text-white border-b border-purple-500/40 focus:outline-none"
                    />
                  ) : (
                    <span className="text-sm text-white truncate">
                      {conversation.title}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {editingId === conversation.id ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          saveTitle(conversation.id);
                        }}
                        className="p-1 hover:bg-green-500/20 rounded"
                        aria-label="Save title"
                      >
                        <Check className="h-3 w-3 text-green-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEditing();
                        }}
                        className="p-1 hover:bg-gray-500/20 rounded"
                        aria-label="Cancel edit"
                      >
                        <X className="h-3 w-3 text-gray-300" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(conversation);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-opacity"
                        aria-label="Edit title"
                      >
                        <Pencil className="h-3 w-3 text-purple-300" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conversation.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-opacity"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="h-3 w-3 text-red-400" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
