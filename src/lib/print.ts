// Talks to the local print-agent (see /print-agent in the repo root) — a
// small Node process an operator runs once on the till PC so kitchen tickets
// can print automatically to the TP805L, no matter where this Next.js app
// itself is hosted (Vercel, etc). The agent only ever listens on
// 127.0.0.1, so this call is made directly from the browser, not from a
// Next.js server action/route.
const PRINT_AGENT_URL = "http://127.0.0.1:47990";
const AGENT_PRINT_TIMEOUT_MS = 20_000;

export async function tryLocalAgentPrint(printUrl: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), AGENT_PRINT_TIMEOUT_MS);
    const res = await fetch(`${PRINT_AGENT_URL}/print/kitchen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: printUrl }),
      signal: ctrl.signal,
    }).finally(() => clearTimeout(timeout));
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.ok;
  } catch {
    // Agent not installed/running on this PC — expected on any machine
    // that hasn't had the one-time local install yet.
    return false;
  }
}
