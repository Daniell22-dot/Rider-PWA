const SESSION_EXPIRED_HEADER = "x-session-expired";

let redirecting = false;

/**
 * Client-side fetch wrapper for the BFF.
 *
 * The backend issues agent JWTs that cannot be refreshed, so the only
 * recovery from an expired session is to send the rider back to the login
 * page. Every screen that fetches data goes through here so that a dead
 * session always produces a login screen rather than an error toast the
 * rider cannot act on.
 */
export async function agentFetchResponse(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const res = await fetch(input, { ...init, cache: "no-store" });

  if (res.status === 401 || res.headers.get(SESSION_EXPIRED_HEADER) === "1") {
    handleSessionExpired();
    throw new Error("Your session has expired. Please sign in again.");
  }

  return res;
}

/** As {@link agentFetchResponse}, but parses the body as JSON. */
export async function agentFetchJson<T>(
  input: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await agentFetchResponse(input, init);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const detail = (data as { detail?: string }).detail;
    throw new Error(detail ?? `Request failed (${res.status})`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

function handleSessionExpired() {
  if (redirecting) return;
  redirecting = true;
  const next =
    typeof window !== "undefined"
      ? window.location.pathname + window.location.search
      : "/agent";
  window.location.replace(
    `/agent/login?reason=expired&next=${encodeURIComponent(next)}`
  );
}
