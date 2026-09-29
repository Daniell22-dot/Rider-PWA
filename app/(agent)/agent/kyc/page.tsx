"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ShieldCheck,
  Loader2,
  Bike,
  Truck,
  Car,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { KYCDetail, VehicleType } from "@/types/interface";
import { agentFetchJson } from "@/lib/agent-client";

const VEHICLE_OPTIONS: { value: VehicleType; label: string; icon: typeof Bike }[] = [
  { value: "bicycle", label: "Bicycle", icon: Bike },
  { value: "motorcycle", label: "Motorcycle", icon: Car },
  { value: "pickup_van", label: "Pickup van", icon: Truck },
];

export default function AgentKYCPage() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const [vehicleType, setVehicleType] = useState<VehicleType>("motorcycle");
  const [nationalId, setNationalId] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [equipmentPhotoUrl, setEquipmentPhotoUrl] = useState("");
  const [documentUrls, setDocumentUrls] = useState<{ type: string; url: string }[]>([]);

  const { data: kyc, isLoading } = useQuery<KYCDetail | null>({
    queryKey: ["agent-kyc"],
    queryFn: async () => {
      try {
        return await agentFetchJson<KYCDetail>("/api/agent/kyc");
      } catch {
        return null; // 404 when no KYC has ever been submitted
      }
    },
  });

  const status = kyc?.kyc_status;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nationalId.trim()) {
      toast.error("National ID number is required");
      return;
    }
    setSaving(true);
    try {
      await agentFetchJson("/api/agent/kyc", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_type: vehicleType,
          national_id_number: nationalId.trim(),
          license_number: licenseNumber.trim() || null,
          kyc_documents: documentUrls.length > 0 ? documentUrls : null,
          equipment_photo_url: equipmentPhotoUrl.trim() || null,
        }),
      });
      toast.success("KYC submitted for review");
      queryClient.invalidateQueries({ queryKey: ["agent-kyc"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit KYC");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted" />
      </div>
    );
  }

  // Approved: confirmation screen
  if (status === "approved") {
    return (
      <div className="card p-8 text-center">
        <CheckCircle2 size={40} className="text-success mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-1">You're verified</h1>
        <p className="text-muted text-sm mb-6">Your identity and equipment have been approved.</p>
        <div className="inline-flex items-center gap-2 rounded-full bg-success/10 text-success px-4 py-2 text-sm font-medium">
          <ShieldCheck size={16} />
          KYC approved · {kyc?.vehicle_type}
        </div>
      </div>
    );
  }

  // Under review: waiting screen
  if (status === "pending_review") {
    return (
      <div className="card p-8 text-center">
        <Clock size={40} className="text-amber mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-1">Under review</h1>
        <p className="text-muted text-sm mb-2">Your details are being checked by an admin.</p>
        <p className="text-xs text-muted mb-6">
          Submitted {kyc?.kyc_submitted_at ? new Date(kyc.kyc_submitted_at).toLocaleDateString() : ""}
        </p>
        <div className="rounded-lg bg-surface-2 p-4 text-left text-sm space-y-1">
          <p><span className="text-muted">Vehicle:</span> <span className="font-medium">{kyc?.vehicle_type}</span></p>
          <p><span className="text-muted">National ID:</span> <span className="font-medium">{kyc?.national_id_number}</span></p>
        </div>
        {kyc?.kyc_review_notes && (
          <p className="text-xs text-muted mt-6">Note: {kyc.kyc_review_notes}</p>
        )}
      </div>
    );
  }

  // Rejected or never submitted: show the form
  const rejected = status === "rejected";
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Rider verification</h1>
      <p className="text-sm text-muted mb-6">
        Submit your ID and vehicle details once to start receiving delivery pings.
      </p>

      {rejected && (
        <div className="flex items-center gap-2 rounded-lg bg-danger/10 text-danger text-sm px-4 py-3 mb-6">
          <XCircle size={16} />
          <span>
            Your previous submission was rejected
            {kyc?.kyc_review_notes ? `: ${kyc.kyc_review_notes}` : ""}. Please correct it below.
          </span>
        </div>
      )}

      <form onSubmit={submit} className="space-y-6">
        <div className="card p-5">
          <h2 className="font-bold mb-3">Vehicle</h2>
          <div className="grid grid-cols-3 gap-2">
            {VEHICLE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = vehicleType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setVehicleType(opt.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm font-medium transition-colors ${
                    active
                      ? "border-amber text-amber bg-amber/5"
                      : "border-border text-muted hover:border-amber/50"
                  }`}
                >
                  <Icon size={18} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-bold">Identity & equipment</h2>
          <Field label="National ID number" required>
            <input
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              placeholder="e.g. 12345678"
              className="input"
            />
          </Field>
          <Field label="Driving license number (motorcycles/vans)">
            <input
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="e.g. A1234567"
              className="input"
            />
          </Field>
          <Field label="Equipment photo URL">
            <input
              value={equipmentPhotoUrl}
              onChange={(e) => setEquipmentPhotoUrl(e.target.value)}
              placeholder="https://… photo of your vehicle and gear"
              className="input"
            />
          </Field>
          <Field label="Document URLs (JSON, one per line)">
            <textarea
              value={documentUrls.map((d) => `${d.type}|${d.url}`).join("\n")}
              onChange={(e) =>
                setDocumentUrls(
                  e.target.value
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line) => {
                      const i = line.indexOf("|");
                      return i > 0
                        ? { type: line.slice(0, i), url: line.slice(i + 1) }
                        : { type: "document", url: line };
                    })
                )
              }
              placeholder={"id_photo|https://…\ncrime_refund|https://…"}
              className="input h-24"
            />
          </Field>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-accent w-full flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {rejected ? "Resubmit for review" : "Submit for review"}
        </button>
        <p className="text-xs text-muted text-center">
          Review is usually completed within a day. You'll get pings once approved.
        </p>
      </form>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted mb-1.5">
        {label} {required && <span className="text-danger">*</span>}
      </span>
      {children}
    </label>
  );
}