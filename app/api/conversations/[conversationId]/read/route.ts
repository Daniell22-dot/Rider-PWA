import { agentFetch } from "@/lib/agent-server";

export async function PATCH(
  _: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  return agentFetch(`/conversations/${conversationId}/read`, { method: "PATCH" });
}
