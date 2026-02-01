"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  MessageSquare,
  Trash2,
  Loader2,
  Pencil,
  Check,
  X,
  Search,
} from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
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
      setError(null);
      const response = await supabaseFetch("/api/conversations");
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError("Could not load chats. Please try again.");
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
    } catch (err) {
      console.error("Error creating conversation:", err);
      setError("Could not create a new chat. Try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      setDeletingId(id);
      const response = await supabaseFetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
      } else {
        setError("Failed to delete chat. Try again.");
      }
    } catch (err) {
      console.error("Error deleting conversation:", err);
      setError("Failed to delete chat. Try again.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
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
    } catch (err) {
      console.error("Error updating conversation:", err);
    } finally {
      cancelEditing();
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-black/40 border-r border-purple-500/20">
      <div className="p-4 border-b border-purple-500/20 space-y-3">
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search chats..."
            className="w-full rounded-lg bg-black/40 border border-purple-500/30 py-2 pl-9 pr-3 text-sm text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center text-gray-400 text-sm mt-8 px-4">
            {conversations.length === 0
              ? "No conversations yet. Start a new chat!"
              : "No chats match your search."}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
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
                          setConfirmDeleteId(conversation.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-opacity"
                        aria-label="Delete conversation"
                      >
                        {deletingId === conversation.id ? (
                          <Loader2 className="h-3 w-3 animate-spin text-red-400" />
                        ) : (
                          <Trash2 className="h-3 w-3 text-red-400" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
              {confirmDeleteId === conversation.id && (
                <div className="mt-2 rounded-lg border border-white/10 bg-black/80 p-3 shadow-lg">
                  <div className="text-sm text-white mb-2">
                    Delete this chat? This can’t be undone.
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="flex-1 rounded-md bg-red-600/80 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600"
                      onClick={() => deleteConversation(conversation.id)}
                    >
                      Delete
                    </button>
                    <button
                      className="flex-1 rounded-md bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
        {error && (
          <div className="mx-2 mt-3 rounded-lg border border-red-500/40 bg-red-900/20 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
