// The local print-agent (see /print-agent in the repo root) only ever
// listens on 127.0.0.1 on the till PC — every call to it is made directly
// from the browser, never through the Next.js server, since the server
// itself (hosted on Vercel or anywhere else) has no path to that PC's
// hardware.
export const PRINT_AGENT_URL = "http://127.0.0.1:47991";
