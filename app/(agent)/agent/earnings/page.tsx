"use client";

import { useQuery } from "@tanstack/react-query";
import { formatKES } from "@/lib/utils";
import { agentFetchJson } from "@/lib/agent-client";
import { LedgerList } from "@/types/interface";

const TYPE_LABELS: Record<string, string> = {
  earning: "Delivery earning",
  b2c_payout: "Payout sent",
  reversal: "Adjustment",
  adjustment: "Adjustment",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  succeeded: "Success",
  failed: "Failed",
};

export default function AgentEarningsPage() {
  const { data: summary } = useQuery({
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

  const { data: ledger } = useQuery<LedgerList>({
    queryKey: ["agent-ledger"],
    queryFn: () => agentFetchJson<LedgerList>("/api/agent/ledger"),
    refetchInterval: 30000,
  });

  if (!summary) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber" />
      </div>
    );
  }

  const entries = ledger?.entries ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Earnings</h1>
      <p className="text-sm text-muted mb-6">Completed deliveries and your payout wallet</p>

      <div className="space-y-3">
        <div className="card p-5">
          <p className="text-xs text-muted mb-1">Wallet balance</p>
          <p className="text-3xl font-bold">{formatKES(ledger?.wallet_balance ?? 0)}</p>
          <p className="text-xs text-muted mt-1">Paid out to M-Pesa on request</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="card p-5">
            <p className="text-xs text-muted mb-1">Total deliveries</p>
            <p className="text-3xl font-bold">{summary.total_deliveries ?? 0}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-muted mb-1">This week</p>
            <p className="text-3xl font-bold">{formatKES(summary.weekly_earnings ?? 0)}</p>
            <p className="text-xs text-muted mt-1">
              {summary.weekly_deliveries ?? 0} completed
            </p>
          </div>
        </div>

        <div className="card p-5">
          <p className="text-xs text-muted mb-1">This month</p>
          <p className="text-3xl font-bold">{formatKES(summary.monthly_earnings ?? 0)}</p>
          <p className="text-xs text-muted mt-1">
            {summary.monthly_deliveries ?? 0} completed deliveries
          </p>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-bold text-muted mb-3">Wallet activity</h2>
          <div className="card divide-y divide-border">
            {entries.map((entry) => {
              const positive = entry.entry_type === "earning" || entry.entry_type === "reversal";
              return (
                <div key={entry.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {TYPE_LABELS[entry.entry_type] ?? entry.entry_type}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(entry.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${positive ? "text-success" : "text-danger"}`}>
                      {positive ? "+" : "−"}
                      {formatKES(entry.amount)}
                    </p>
                    <p className={`text-xs ${entry.status === "failed" ? "text-danger" : "text-muted"}`}>
                      {STATUS_LABELS[entry.status] ?? entry.status}
                      {entry.status === "failed" && entry.failure_reason
                        ? ` · ${entry.failure_reason}`
                        : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}