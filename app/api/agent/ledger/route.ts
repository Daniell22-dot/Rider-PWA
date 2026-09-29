import { agentFetch } from "@/lib/agent-server";

export function GET() {
  return agentFetch("/delivery/agents/me/ledger");
}