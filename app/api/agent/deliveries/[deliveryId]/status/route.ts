import { NextRequest } from "next/server";
import { agentFetch } from "@/lib/agent-server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ deliveryId: string }> }
) {
  const { deliveryId } = await params;
  return agentFetch(`/delivery/${deliveryId}/status`, {
    method: "PATCH",
    body: await req.text(),
  });
}
