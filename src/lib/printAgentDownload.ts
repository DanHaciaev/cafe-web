// Distributable install package for the local print-agent (installer script
// + config + the compiled .exe, no source code, no vendor bank-terminal
// DLLs) — too large to ship inside the Vercel deployment itself (see
// .vercelignore), and cafe-web itself is private, so a direct release link
// there would require GitHub auth to download. Hosted instead in a small
// dedicated PUBLIC repo (DanHaciaev/cafe-print-agent-releases) that never
// contains cafe-web's source or the maib-bridge/ vendor DLLs.
//
// Re-upload after rebuilding the agent:
//   gh release upload print-agent-latest <zip> --clobber \
//     --repo DanHaciaev/cafe-print-agent-releases
// The tag name (and so this URL) stays the same across updates.
export const PRINT_AGENT_DOWNLOAD_URL =
  "https://github.com/DanHaciaev/cafe-print-agent-releases/releases/download/print-agent-latest/cafe-print-agent.zip";
