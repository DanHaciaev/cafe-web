import { PRINT_AGENT_URL } from "./agentUrl";

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
