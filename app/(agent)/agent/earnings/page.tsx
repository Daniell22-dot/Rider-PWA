"use client";

import { useQuery } from "@tanstack/react-query";
import { formatKES } from "@/lib/utils";
import { agentFetchJson } from "@/lib/agent-client";

export default function AgentEarningsPage() {
  const { data: earnings, isLoading, isError } = useQuery({
    queryKey: ["agent-earnings"],
    queryFn: () =>
      agentFetchJson<{
        total_deliveries: number;
        weekly_deliveries: number;
        monthly_deliveries: number;
        weekly_earnings: string;
        monthly_earnings: string;
      }>("/api/agent/earnings"),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber" />
      </div>
    );
  }

  if (isError || !earnings) {
    return (
      <div className="card flex flex-col items-center justify-center py-20 text-center">
        <p className="font-bold mb-1">Could not load earnings</p>
        <p className="text-sm text-muted">Please try signing in again.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Earnings</h1>
      <p className="text-sm text-muted mb-6">Deliveries completed, and what they were paid at</p>

      <div className="space-y-3">
        <div className="card p-5">
          <p className="text-xs text-muted mb-1">Total deliveries</p>
          <p className="text-3xl font-bold">{earnings.total_deliveries ?? 0}</p>
        </div>

        <div className="card p-5">
          <p className="text-xs text-muted mb-1">This week</p>
          <p className="text-3xl font-bold">{formatKES(earnings.weekly_earnings ?? 0)}</p>
          <p className="text-xs text-muted mt-1">
            {earnings.weekly_deliveries ?? 0} completed deliveries
          </p>
        </div>

        <div className="card p-5">
          <p className="text-xs text-muted mb-1">This month</p>
          <p className="text-3xl font-bold">{formatKES(earnings.monthly_earnings ?? 0)}</p>
          <p className="text-xs text-muted mt-1">
            {earnings.monthly_deliveries ?? 0} completed deliveries
          </p>
        </div>
      </div>

      <p className="text-xs text-muted mt-4">
        Figures are calculated by dispatch at a flat rate per completed delivery.
        Zone, distance and time-of-day rates are not applied yet. If a figure
        looks wrong, raise it with dispatch.
      </p>
    </div>
  );
}
