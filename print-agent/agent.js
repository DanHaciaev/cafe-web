// Cafe Print Agent — runs on the till/operator PC (not the web server), so
// the browser tab open on the site (hosted on Vercel or anywhere else) can
// print silently to the TP805L physically attached HERE. The remote server
// has no access to this machine's hardware — this is what makes automatic
// kitchen-ticket printing possible without renting a real server.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { ensureConfigFile, loadConfig, saveConfig, configDir } = require("./config");
const { printKitchenTicket } = require("./printer");
const pos = require("./pos");

ensureConfigFile();
const cfg = loadConfig();

const logFile = path.join(configDir(), "agent.log");
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

    // Terminal config for the site's own admin page to read/write THIS PC's
    // local list of terminals from client-side JS. An admin opens that
    // page's URL on the specific till PC — there's no way around that
    // physically (this agent only ever listens on 127.0.0.1, the remote
    // site genuinely cannot reach into a till's local hardware). POST
    // replaces the WHOLE list (client sends everything back) — simpler than
    // a per-row add/edit/delete API for what's normally 1-2 entries.
    if (url.pathname === "/pos/config") {
      if (req.method === "GET") {
        return send(res, 200, {
          ok: true,
          terminals: cfg.posTerminals.map((t) => ({
            ...t,
            ...pos.allTerminalsStatus(cfg).find((s) => s.id === t.id),
          })),
        });
      }
      if (req.method === "POST") {
        const body = await readJsonBody(req);
        const terminals = Array.isArray(body.terminals) ? body.terminals : [];
        Object.assign(
          cfg,
          saveConfig({
            posTerminals: terminals.map((t, i) => ({
              id: t.id || `${t.driver}-${Date.now().toString(36)}-${i}`,
              driver: t.driver || "",
              comPort: (t.comPort || "").trim(),
              terminalPort: (t.terminalPort || "").trim(),
              label: (t.label || "").trim(),
            })),
          })
        );
        log(
          `OK /pos/config updated (origin=${origin}): ${
            cfg.posTerminals.map((t) => `${t.driver}:${t.driver === "MAIB" ? t.comPort : t.terminalPort}`).join(", ") ||
            "(no terminals)"
          }`
        );
        pos.syncListeners(cfg, log);
        return send(res, 200, {
          ok: true,
          terminals: cfg.posTerminals.map((t) => ({
            ...t,
            ...pos.allTerminalsStatus(cfg).find((s) => s.id === t.id),
          })),
        });
      }
    }

    if (url.pathname === "/pos/charge" || url.pathname === "/pos/status") {
      if (!cfg.posTerminals.length) {
        return send(res, 503, { ok: false, offline: true, error: "На этом компьютере не настроен ни один банковский терминал." });
      }
    }

    if (req.method === "POST" && url.pathname === "/pos/charge") {
      const { amount, terminalId } = await readJsonBody(req);
      if (!amount || typeof amount !== "number" || amount <= 0) {
        return send(res, 400, { ok: false, error: "Не указана сумма оплаты" });
      }
      if (!terminalId || typeof terminalId !== "string") {
        return send(res, 400, { ok: false, error: "Терминал не выбран" });
      }

      let fields;
      try {
        fields = await pos.charge(cfg, terminalId, amount, log);
      } catch (e) {
        log(`ERROR pos charge (origin=${origin}, terminal=${terminalId}): ${(e && e.message) || e}`);
        return send(res, 500, { ok: false, error: String((e && e.message) || e) });
      }
      const approved = fields.RespCode === "000";
      if (!approved) {
        log(
          `DECLINED pos charge (origin=${origin}, terminal=${terminalId}, amount=${amount}, RespCode=${fields.RespCode}): ${fields.RespMSG || ""}`
        );
        return send(res, 200, { ok: false, declined: true, error: fields.RespMSG || `Операция отклонена (${fields.RespCode})` });
      }
      log(`OK pos charge (origin=${origin}, terminal=${terminalId}, amount=${amount}, TransactionID=${fields.TransactionID || ""})`);
      return send(res, 200, { ok: true, transactionId: fields.TransactionID || "", receiptText: fields.RCPT || "" });
    }

    if (req.method === "GET" && url.pathname === "/pos/status") {
      return send(res, 200, { ok: true, terminals: pos.allTerminalsStatus(cfg) });
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

// Starts (or, on a later terminal-settings save, resyncs) the raw TCP
// listeners each configured Verifone-family terminal connects to. Runs
// unconditionally on boot; pos.syncListeners itself no-ops when no
// terminals are configured yet.
pos.syncListeners(cfg, log);
