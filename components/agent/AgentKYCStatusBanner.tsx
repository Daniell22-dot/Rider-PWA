"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, Clock, ShieldCheck, ArrowRight } from "lucide-react";
import { KYCDetail } from "@/types/interface";
import { agentFetchJson } from "@/lib/agent-client";

/**
 * Surfaces the rider's KYC status so an unverified rider is not left confused
 * about why toggling to Active keeps failing. Only renders when the rider is
 * not fully verified.
 */
export default function AgentKYCStatusBanner() {
  const { data: kyc, isLoading } = useQuery<KYCDetail | null>({
    queryKey: ["agent-kyc"],
    queryFn: async () => {
      try {
        return await agentFetchJson<KYCDetail>("/api/agent/kyc");
      } catch {
        return null;
      }
    },
  });

  if (isLoading) return null;
  const status = kyc?.kyc_status;

  if (status === "approved") return null;

  const pending = status === "pending_review";

  return (
    <Link
      href="/agent/kyc"
      className={`block card p-4 mb-6 border ${
        pending ? "border-amber/40" : "border-amber/60"
      } hover:border-amber transition-colors`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            pending ? "bg-amber/10 text-amber" : "bg-amber/15 text-amber"
          }`}
        >
          {pending ? (
            <Clock size={20} />
          ) : status === "rejected" ? (
            <ShieldAlert size={20} />
          ) : (
            <ShieldCheck size={20} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">
            {pending
              ? "Verification under review"
              : status === "rejected"
              ? "Verification rejected"
              : "Complete your verification"}
          </p>
          <p className="text-xs text-muted">
            {pending
              ? "You'll start receiving pings once approved."
              : status === "rejected"
              ? "Resubmit your details to start receiving pings."
              : "Riders must be verified before accepting delivery pings."}
          </p>
        </div>
        <ArrowRight size={16} className="text-muted shrink-0" />
      </div>
    </Link>
  );
}