import { NextRequest } from "next/server";
import { agentFetch } from "@/lib/agent-server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  return agentFetch(`/conversations/${conversationId}/messages`);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  return agentFetch(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: await req.text(),
  });
}
