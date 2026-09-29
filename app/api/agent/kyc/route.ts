import { NextRequest } from "next/server";
import { agentFetch } from "@/lib/agent-server";

export function GET() {
  return agentFetch("/delivery/kyc/me");
}

export async function PUT(req: NextRequest) {
  return agentFetch("/delivery/kyc/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: await req.text(),
  });
}