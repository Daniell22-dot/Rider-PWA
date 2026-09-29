import { NextRequest } from "next/server";
import { agentFetch } from "@/lib/agent-server";

export function GET() {
  return agentFetch("/conversations");
}

export async function POST(req: NextRequest) {
  return agentFetch("/conversations", {
    method: "POST",
    body: await req.text(),
  });
}
