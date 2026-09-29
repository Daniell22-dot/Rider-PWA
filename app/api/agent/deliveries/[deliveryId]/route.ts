import { NextRequest } from "next/server";
import { agentFetch } from "@/lib/agent-server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ deliveryId: string }> }
) {
  const { deliveryId } = await params;
  return agentFetch(`/delivery/${deliveryId}`);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ deliveryId: string }> }
) {
  const { deliveryId } = await params;
  return agentFetch(`/delivery/${deliveryId}/issue`, {
    method: "POST",
    body: await req.text(),
  });
}
