import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DeliveryAgent } from "@/types/interface";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Server-side agent guard for the app/(agent) layouts.
 *
 * Deliberately does a plain fetch rather than reusing the BFF `agentFetch`
 * helper: that helper clears the cookie on a 401, and Next.js only permits
 * cookie mutation inside a Route Handler or Server Action. A layout is a
 * Server Component, so deleting here would throw.
 *
 * The distinction matters for UX: a missing cookie means the rider was never
 * signed in, a 401 from the backend means the 12-hour token expired mid-shift.
 * They get different redirects so the sign-in page can explain what happened.
 */
export async function requireAgent(): Promise<DeliveryAgent> {
  const cookieStore = await cookies();
  const token = cookieStore.get("ekshop_agent_token")?.value;

  if (!token) {
    redirect("/agent/login");
  }

  let ok = false;
  let agent: DeliveryAgent | null = null;

  try {
    const res = await fetch(`${BASE_URL}/delivery/agents/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (res.ok) {
      ok = true;
      agent = await res.json();
    } else if (res.status === 401) {
      // Token rejected. proxy.ts cannot clear cookies either, so the login
      // page clears it on arrival; here we just route the rider out.
      redirect("/agent/login?reason=expired");
    } else {
      redirect("/agent/login");
    }
  } catch {
    // Backend unreachable. We do not sign the rider out over a network blip,
    // but we cannot render a profile either, so send them to login.
    redirect("/agent/login?reason=unavailable");
  }

  if (!ok || !agent) {
    redirect("/agent/login");
  }

  return agent;
}
