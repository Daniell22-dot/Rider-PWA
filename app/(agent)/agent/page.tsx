"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Delivery } from "@/types/interface";
import { agentFetchJson, agentFetchResponse } from "@/lib/agent-client";
import MessageAdminButton from "@/components/MessageAdminButton";
import AgentPingsPanel from "@/components/agent/AgentPingsPanel";
import AgentKYCStatusBanner from "@/components/agent/AgentKYCStatusBanner";

type AgentStatus = "active" | "busy" | "inactive";

const STATUS_LABELS: Record<AgentStatus, string> = {
  active: "Available",
  busy: "Busy",
  inactive: "Offline",
};

export default function AgentHomePage() {
  const queryClient = useQueryClient();
  const [selfStatus, setSelfStatus] = useState<AgentStatus>("active");
  const [loading, setLoading] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const geolocationUnsupported =
    typeof navigator !== "undefined" && !navigator.geolocation;

  const { data: deliveries = [] } = useQuery({
    queryKey: ["agent-deliveries"],
    queryFn: () => agentFetchJson<Delivery[]>("/api/agent/deliveries"),
    refetchInterval: 20000,
  });

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        // Fire-and-forget: a stale location ping must never interrupt the
        // rider, but an expired session still has to bounce them to login.
        agentFetchResponse("/api/agent/location", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        }).catch(() => {});
      },
      () => setLocationDenied(true),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const active = deliveries.filter((d) => d.status !== "delivered" && d.status !== "cancelled");
  const completed = deliveries.filter((d) => d.status === "delivered");
  const next = active[0];

  // Derived, not synchronised: an open delivery makes the agent busy
  // regardless of what they last tapped. Mirroring this into state via an
  // effect caused a second render pass on every 20s poll.
  const status: AgentStatus = active.length > 0 ? "busy" : selfStatus;

  async function toggleStatus() {
    setLoading(true);
    try {
      const newStatus: AgentStatus = selfStatus === "active" ? "inactive" : "active";
      await agentFetchJson("/api/agent/auth/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setSelfStatus(newStatus);
      queryClient.invalidateQueries({ queryKey: ["agent-deliveries"] });
      toast.success(newStatus === "active" ? "You're now available" : "You're now offline");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mambo</h1>
          <p className="text-sm text-muted">
            {next ? "You have active deliveries" : "No active deliveries"}
          </p>
          {geolocationUnsupported && (
            <p className="text-xs text-danger mt-1">Geolocation not supported on this device</p>
          )}
          {locationDenied && (
            <p className="text-xs text-danger mt-1">Location permission denied</p>
          )}
        </div>
        <button
          onClick={toggleStatus}
          disabled={loading}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border transition-colors disabled:opacity-50 ${
            status === "active"
              ? "border-success text-success bg-success/10"
              : "border-border text-muted bg-surface"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${status === "active" ? "bg-success" : "bg-muted"}`} />
          {STATUS_LABELS[status]}
        </button>
        <MessageAdminButton />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold">{active.length}</p>
          <p className="text-xs text-muted mt-1">Active</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold">{completed.length}</p>
          <p className="text-xs text-muted mt-1">Completed</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold">{deliveries.length}</p>
          <p className="text-xs text-muted mt-1">Total</p>
        </div>
      </div>

      {/* Live ping panel for new-order dispatch */}
      <AgentPingsPanel />

      {/* KYC status – only renders when not fully verified */}
      <AgentKYCStatusBanner />

      {/* Next stop */}
      {next && (
        <Link
          href={`/agent/deliveries/${next.id}`}
          className="block card p-5 mb-6 hover:border-amber transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-amber uppercase tracking-wide">Next stop</span>
            {next.distance_km != null && next.duration_min != null ? (
              <span className="text-xs text-muted">
                {next.distance_km} km · {Math.round(next.duration_min)} min
              </span>
            ) : (
              <span className="text-xs text-muted">Open for directions</span>
            )}
          </div>
          <h2 className="text-lg font-bold mb-1">
            {next.order?.buyer_name ?? "Customer"}
          </h2>
          <p className="text-sm text-muted mb-4">
            {next.order?.delivery_address?.exact_location ||
              next.order?.delivery_address?.town ||
              next.order?.delivery_address?.county}
          </p>
          <div className="flex gap-2">
            <span className="text-xs bg-surface border border-border rounded-full px-3 py-1">
              {next.tracking_number}
            </span>
            <span className="text-xs bg-surface border border-border rounded-full px-3 py-1 capitalize">
              {next.status.replace("_", " ")}
            </span>
          </div>
        </Link>
      )}

      {/* Pending deliveries */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-muted">Pending deliveries</h2>
        <span className="text-xs text-muted">{active.length} pending</span>
      </div>

      {active.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-12 text-center">
          <p className="font-bold mb-1">No active deliveries</p>
          <p className="text-sm text-muted">New assignments will show up here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((delivery, idx) => (
            <Link
              key={delivery.id}
              href={`/agent/deliveries/${delivery.id}`}
              className="block card p-4 hover:border-amber transition-colors"
            >
              <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-surface-2 text-muted text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <div>
                  <p className="font-semibold text-sm">{delivery.tracking_number}</p>
                  <p className="text-xs text-muted">{delivery.order?.buyer_name}</p>
                </div>
              </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  delivery.status === "assigned" ? "bg-info/10 text-info" :
                  delivery.status === "picked" ? "bg-amber/10 text-amber" :
                  delivery.status === "in_transit" ? "bg-amber/10 text-amber" :
                  "bg-surface text-muted"
                }`}>
                  {STATUS_LABELS[delivery.status as keyof typeof STATUS_LABELS] ?? delivery.status}
                </span>
                {delivery.distance_km != null && delivery.duration_min != null && (
                  <span className="text-xs text-muted ml-2">
                    {delivery.distance_km} km · {Math.round(delivery.duration_min)} min
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Delivered today */}
      {completed.length > 0 && (
        <>
          <button
            onClick={() => {}}
            className="flex items-center justify-between w-full py-3 text-sm font-medium text-muted border-t border-border mt-6"
          >
            <span>Delivered today ({completed.length})</span>
            <span>▾</span>
          </button>
          <div className="space-y-3 mt-3">
            {completed.slice(0, 5).map((delivery) => (
              <div key={delivery.id} className="card p-4 opacity-75">
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-success/20 text-success text-xs font-bold flex items-center justify-center">
                    ✓
                  </span>
                  <div>
                    <p className="font-semibold text-sm">{delivery.tracking_number}</p>
                    <p className="text-xs text-muted">{delivery.order?.buyer_name}</p>
                  </div>
                </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-success/10 text-success">
                    Delivered
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
