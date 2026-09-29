"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BellRing, MapPin, Loader2, Check, X } from "lucide-react";
import { OfferList, DeliveryOffer } from "@/types/interface";
import { agentFetchJson } from "@/lib/agent-client";

/**
 * Live ping panel for the new-order dispatch engine. Polls the rider's
 * pending offers and renders an accept/decline card with a live 30-second
 * countdown. Pending offers are the ones this rider can act on right now;
 * queued offers are sequential fallbacks that only become pending after the
 * riders ahead of them decline or time out.
 */
export default function AgentPingsPanel() {
  const queryClient = useQueryClient();
  const [actingOn, setActingOn] = useState<string | null>(null);

  const { data: pings, isLoading } = useQuery<OfferList>({
    queryKey: ["agent-pings"],
    queryFn: () => agentFetchJson<OfferList>("/api/agent/pings"),
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

  const pending = useMemo(
    () => (pings?.offers ?? []).filter((o) => o.status === "pending"),
    [pings]
  );
  const queued = useMemo(
    () => (pings?.offers ?? []).filter((o) => o.status === "queued"),
    [pings]
  );

  async function respond(offerId: string, action: "accept" | "decline") {
    setActingOn(offerId);
    try {
      await agentFetchJson(`/api/agent/pings/${offerId}/${action}`, {
        method: "POST",
      });
      toast.success(action === "accept" ? "Ping accepted" : "Ping declined");
      queryClient.invalidateQueries({ queryKey: ["agent-pings"] });
      queryClient.invalidateQueries({ queryKey: ["agent-deliveries"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActingOn(null);
    }
  }

  if (isLoading) {
    return (
      <div className="card p-5 flex items-center gap-3">
        <Loader2 size={18} className="animate-spin text-muted" />
        <p className="text-sm text-muted">Checking for new delivery pings…</p>
      </div>
    );
  }

  if (pending.length === 0 && queued.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center gap-2">
        <BellRing size={16} className="text-amber" />
        <h2 className="text-sm font-bold text-muted">
          New delivery {pending.length > 1 ? "pings" : "ping"}
          {pending.length > 0 && (
            <span className="ml-2 bg-amber text-surface text-xs font-bold px-2 py-0.5 rounded-full">
              {pending.length}
            </span>
          )}
        </h2>
      </div>

      {pending.map((offer) => (
        <PingCard key={offer.id} offer={offer} acting={actingOn === offer.id} onRespond={respond} />
      ))}

      {queued.length > 0 && (
        <p className="text-xs text-muted px-1">
          {queued.length} ping{queued.length > 1 ? "s" : ""} standing by for riders ahead of you.
        </p>
      )}
    </div>
  );
}

function PingCard({
  offer,
  acting,
  onRespond,
}: {
  offer: DeliveryOffer;
  acting: boolean;
  onRespond: (offerId: string, action: "accept" | "decline") => void;
}) {
  const expiresIn = useCountdown(offer.expires_at);

  const order = offer.delivery?.order;
  const address = order?.delivery_address;

  return (
    <div className="card p-4 border-amber/40">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="font-bold">
          {order?.shop?.name ?? "New delivery"}
        </p>
        <CountdownBadge seconds={expiresIn} />
      </div>

      <div className="text-sm text-muted space-y-1 mb-4">
        {order?.buyer_name && <p className="font-medium text-foreground">{order.buyer_name}</p>}
        {address && (
          <p className="flex items-center gap-1.5">
            <MapPin size={13} />
            {[address.exact_location || address.town, address.county].filter(Boolean).join(", ")}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onRespond(offer.id, "accept")}
          disabled={acting}
          className="btn-accent flex-1 flex items-center justify-center gap-1.5"
        >
          {acting ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} />}
          Accept
        </button>
        <button
          onClick={() => onRespond(offer.id, "decline")}
          disabled={acting}
          className="text-sm font-medium px-4 py-2 rounded-md text-danger hover:bg-danger/10 disabled:opacity-50 flex items-center gap-1.5"
        >
          <X size={15} />
          Decline
        </button>
      </div>
    </div>
  );
}

function CountdownBadge({ seconds }: { seconds: number }) {
  const deadline = seconds <= 0;
  return (
    <span
      className={`text-xs font-bold px-2 py-1 rounded-full ${
        deadline ? "bg-danger/10 text-danger" : "bg-amber/10 text-amber"
      }`}
    >
      {deadline ? "Expiring…" : `${seconds}s`}
    </span>
  );
}

/** Count-down timer in seconds, re-ticking every second locally so the badge
 * animates without bumping the 5s network poll cadence. The deadline itself
 * is re-read from the server on each refetch, so expiry is authoritative. */
function useCountdown(expiresAt?: string | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!expiresAt) return 0;
  const ms = new Date(expiresAt).getTime() - now;
  return Math.max(0, Math.round(ms / 1000));
}