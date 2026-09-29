import { NextRequest } from "next/server";
import { agentFetch } from "@/lib/agent-server";

export async function PATCH(req: NextRequest) {
  return agentFetch("/delivery/agents/me/status", {
    method: "PATCH",
    body: await req.text(),
  });
}
