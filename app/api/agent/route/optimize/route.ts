import { NextRequest } from "next/server";
import { agentFetch } from "@/lib/agent-server";

export async function POST(req: NextRequest) {
  return agentFetch("/delivery/optimize-route", {
    method: "POST",
    body: await req.text(),
  });
}
