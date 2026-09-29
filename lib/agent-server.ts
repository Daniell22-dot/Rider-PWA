import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const COOKIE_NAME = "ekshop_agent_token";

/** Header set on a 401 so the client knows the session died rather than the request being malformed. */
export const SESSION_EXPIRED_HEADER = "x-session-expired";

/**
 * Server-side proxy to the agent API.
 *
 * Every BFF route under app/api/agent and app/api/conversations goes through
 * here so that agent-token handling lives in exactly one place. Two things
 * this centralises:
 *
 *  1. Reading the httpOnly cookie and attaching it as a bearer token. The
 *     browser never sees the token.
 *
 *  2. Detecting that the backend rejected our token. The backend issues agent
 *     JWTs with no refresh and no revocation, so a 401 here means the shift
 *     outlived the 12-hour token. We clear the cookie and flag the response,
 *     otherwise the rider sits on a screen that can never load again with no
 *     route back to the login page.
 */
export async function agentFetch(
  path: string,
  init: RequestInit = {}
): Promise<NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { detail: "Not authenticated" },
      { status: 401, headers: { [SESSION_EXPIRED_HEADER]: "1" } }
    );
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
      cache: "no-store",
    });
  } catch {
    // The backend is unreachable. This is not a session problem, so we
    // deliberately leave the cookie alone and let the client retry.
    return NextResponse.json(
      { detail: "Could not reach dispatch. Check your connection." },
      { status: 503 }
    );
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    cookieStore.delete(COOKIE_NAME);
    return NextResponse.json(
      data,
      { status: 401, headers: { [SESSION_EXPIRED_HEADER]: "1" } }
    );
  }

  return NextResponse.json(data, { status: res.status });
}
