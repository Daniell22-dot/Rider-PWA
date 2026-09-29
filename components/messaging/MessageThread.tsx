"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Message } from "@/types/interface";
import { agentFetchJson } from "@/lib/agent-client";

type Role = "buyer" | "seller" | "agent" | "admin";

function toRole(sender_type: string): Role {
  if (sender_type === "customer") return "buyer";
  if (sender_type === "agent") return "agent";
  if (sender_type === "admin") return "admin";
  return sender_type as Role;
}

export default function MessageThread({
  orderId,
  conversationId: explicitConversationId,
}: {
  orderId?: string;
  conversationId?: string;
}) {
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversationsQuery = useQuery({
    queryKey: ["conversations"],
    queryFn: () =>
      agentFetchJson<{ id: string; order_id: string | null }[]>("/api/conversations"),
    enabled: !explicitConversationId && Boolean(orderId),
  });

  const conversationId =
    explicitConversationId ??
    conversationsQuery.data?.find((c) => c.order_id === orderId)?.id ??
    null;

  const messagesQuery = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () =>
      agentFetchJson<Message[]>(`/api/conversations/${conversationId}/messages`),
    enabled: Boolean(conversationId),
    refetchInterval: 5000,
  });

  const send = useMutation({
    mutationFn: (body: string) =>
      agentFetchJson(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      }),
    onSuccess: () => {
      setText("");
      messagesQuery.refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messagesQuery.data]);

  useEffect(() => {
    if (!conversationId) return;
    fetch(`/api/conversations/${conversationId}/read`, { method: "PATCH" }).catch(() => {});
  }, [conversationId]);

  if (conversationsQuery.isLoading) {
    return <p className="text-xs text-muted">Loading chat…</p>;
  }

  if (!conversationId) {
    return <p className="text-xs text-muted">No conversation for this order yet.</p>;
  }
  const messages = messagesQuery.data ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div ref={scrollRef} className="max-h-60 overflow-y-auto space-y-2 pr-1">
        {messages.length === 0 && (
          <p className="text-xs text-muted text-center py-4">No messages yet.</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_type === "agent" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`rounded-lg px-3 py-2 text-sm max-w-[80%] ${
                msg.sender_type === "agent"
                  ? "bg-amber text-white"
                  : "bg-surface border border-border"
              }`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-1 opacity-70">
                {toRole(msg.sender_type)}
              </p>
              <p>{msg.body}</p>
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          send.mutate(text.trim());
        }}
        className="flex gap-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input-field flex-1"
          placeholder="Type a message…"
        />
        <button type="submit" disabled={send.isPending || !text.trim()} className="btn-accent disabled:opacity-50">
          Send
        </button>
      </form>
    </div>
  );
}
