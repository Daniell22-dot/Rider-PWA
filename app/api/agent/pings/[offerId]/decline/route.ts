import { NextRequest } from "next/server";
import { agentFetch } from "@/lib/agent-server";

export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  const { offerId } = await params;
  return agentFetch(`/delivery/offers/${offerId}/decline`, { method: "POST" });
}