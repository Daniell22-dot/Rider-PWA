"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import MessageThread from "@/components/messaging/MessageThread";

type Conversation = {
  id: string;
  subject?: string | null;
  order_id?: string | null;
};

export default function AgentMessageThreadPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);

  const conversationQuery = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${conversationId}`);
      if (!res.ok) throw new Error();
      return res.json() as Promise<Conversation>;
    },
    retry: false,
  });

  useEffect(() => {
    document.title = "Conversation · Agent";
  }, []);

  if (conversationQuery.isLoading) {
    return <p className="text-sm text-muted">Loading conversation…</p>;
  }

  if (conversationQuery.isError) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">
          This conversation is unavailable or does not belong to you.
        </p>
        <Link href="/agent" className="text-sm text-amber underline underline-offset-2">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const subject = conversationQuery.data?.subject;

  return (
    <div className="space-y-4">
      <div>
        <Link href="/agent" className="text-xs text-muted hover:text-amber">
          ← Back
        </Link>
        <h1 className="text-xl font-bold">{subject || "Conversation"}</h1>
      </div>

      <MessageThread conversationId={conversationId} />
    </div>
  );
}
