import { agentFetch } from "@/lib/agent-server";

export function GET(_: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  return params.then(({ conversationId }) =>
    agentFetch(`/conversations/${conversationId}`)
  );
}
