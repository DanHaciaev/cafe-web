// Cafe Print Agent — runs on the till/operator PC (not the web server), so
// the browser tab open on the site (hosted on Vercel or anywhere else) can
// print silently to the TP805L physically attached HERE. The remote server
// has no access to this machine's hardware — this is what makes automatic
// kitchen-ticket printing possible without renting a real server.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { ensureConfigFile, loadConfig } = require("./config");
const { printKitchenTicket } = require("./printer");

ensureConfigFile();
const cfg = loadConfig();

const logFile = path.join(__dirname, "agent.log");
function log(line) {
  const msg = `[${new Date().toISOString()}] ${line}`;
  console.log(msg);
  try {
    fs.appendFileSync(logFile, msg + "\n");
  } catch {
    /* best-effort */
  }
}

process.on("uncaughtException", (e) => log(`FATAL (uncaught): ${(e && e.stack) || e}`));
process.on("unhandledRejection", (e) => log(`FATAL (unhandled rejection): ${(e && e.stack) || e}`));

function isAllowedOrigin(origin) {
  if (!origin) return false;
  return cfg.allowedOrigins.includes(origin);
}

// Access-Control-Allow-Private-Network is required because Chrome's Private
// Network Access policy adds an extra preflight whenever a page loaded from
// a PUBLIC address (your Vercel domain) fetches a PRIVATE address
// (127.0.0.1) — without this header the browser silently drops the request
// before it reaches this server. Never echoes `*` — this agent triggers real
// print jobs, so only origins explicitly listed in config.json are allowed.
function withCors(req, res) {
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error("Body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  withCors(req, res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://127.0.0.1:${cfg.port}`);

  // No origin check — this is how the website detects "is the agent
  // installed on this PC at all" before trusting anything else.
  if (req.method === "GET" && url.pathname === "/health") {
    send(res, 200, { ok: true, agent: "cafe-print-agent", version: "1.0.0" });
    return;
  }

  const origin = req.headers.origin;
  if (!isAllowedOrigin(origin)) {
    send(res, 403, { ok: false, error: "Origin not allowed" });
    return;
  }

  try {
    if (req.method === "POST" && url.pathname === "/print/kitchen") {
      const { url: printUrl } = await readJsonBody(req);
      if (!printUrl || typeof printUrl !== "string") {
        return send(res, 400, { ok: false, error: "url missing" });
      }
      await printKitchenTicket(printUrl, cfg);
      log(`OK kitchen ticket printed (origin=${origin}, url=${printUrl})`);
      return send(res, 200, { ok: true });
    }

    send(res, 404, { ok: false, error: "Not found" });
  } catch (e) {
    log(`ERROR print failed (origin=${origin}): ${(e && e.stack) || e}`);
    send(res, 500, { ok: false, error: String((e && e.message) || e) });
  }
});

server.on("error", (e) => {
  if (e && e.code === "EADDRINUSE") {
    log(
      `ERROR: port ${cfg.port} already in use — another copy of the agent is probably already running.`
    );
  } else {
    log(`ERROR server: ${(e && e.stack) || e}`);
  }
});

server.listen(cfg.port, "127.0.0.1", () => {
  log(`Cafe Print Agent — listening on http://127.0.0.1:${cfg.port}`);
  log(`Printer: ${cfg.printerName}`);
  log(`Allowed origins: ${cfg.allowedOrigins.join(", ")}`);
});
