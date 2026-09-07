// Bank card terminal (Verifone-family: VB/MICB/FCB — Victoriabank /
// Moldindconbank / Fincombank, wifi/IP).
//
// Architecture, confirmed against real hardware: THIS PC is the TCP SERVER.
// It listens on 0.0.0.0:<terminalPort> and the terminal, configured on ITS
// OWN menu with this PC's IP + that same port, connects TO it — never the
// other way around. No IP to configure on our side at all, only the port
// (differs per physical terminal).
//
// The purchase()/posSendRecv()/codeConvert() byte protocol below is a
// line-by-line port of the vendor's own VERIFONE_DRIVER_py3.py. The
// listener/socket per terminal (see `listeners` below) is kept persistent
// and reused across operations, matching how the real terminal actually
// behaves (its "connected" icon stays lit continuously, not per-transaction).
//
// Multiple terminals on one PC (a cafe may have terminals from different
// banks, cashier picks which one per sale to control commission) — each
// Verifone-family entry in cfg.posTerminals gets its OWN bound listener,
// keyed by that entry's own id, since each needs its own port anyway (can't
// bind the same port twice). MAIB (Arcus2/Ingenico) is a different transport
// entirely — see maib.js — charge() below dispatches to it by the
// terminal's own `driver` field.
const net = require("net");
const maib = require("./maib");

const IP_DRIVERS = new Set(["VB", "MICB", "FCB"]);
const OP_TIMEOUT_MS = 60_000;

// id -> { id, driver, port, server, socket, busy }
const listeners = new Map();

function stopListener(id) {
  const l = listeners.get(id);
  if (!l) return;
  if (l.socket) {
    try {
      l.socket.destroy();
    } catch {
      /* already gone */
    }
  }
  if (l.server) {
    try {
      l.server.close();
    } catch {
      /* already gone */
    }
  }
  listeners.delete(id);
}

function startListener(entry, log) {
  const port = Number(entry.terminalPort);
  const l = { id: entry.id, driver: entry.driver, port, server: null, socket: null, busy: false };
  const srv = net.createServer((conn) => {
    // A new terminal connection replaces whatever was there — matches the
    // real device's own behavior (one active session at a time).
    if (l.socket && l.socket !== conn) {
      try {
        l.socket.destroy();
      } catch {
        /* already gone */
      }
    }
    l.socket = conn;
    conn.setKeepAlive(true);
    log(`Терминал [${entry.driver}] подключён: ${conn.remoteAddress}:${conn.remotePort}`);
    conn.on("data", (chunk) =>
      log(`Терминал [${entry.driver}] -> данные (${chunk.length} байт): ${chunk.toString("hex")}`)
    );
    conn.on("close", () => {
      log(`Терминал [${entry.driver}]: соединение закрыто`);
      if (l.socket === conn) l.socket = null;
    });
    conn.on("error", (e) => log(`Терминал [${entry.driver}]: ошибка соединения: ${e.message}`));
  });
  srv.on("error", (e) => log(`Терминал [${entry.driver}]: не могу слушать порт ${port}: ${e.message}`));
  srv.listen(port, "0.0.0.0", () => log(`Терминал [${entry.driver}]: слушаю порт ${port}`));
  l.server = srv;
  listeners.set(entry.id, l);
}

// Called on startup and every time terminal config is saved — safe to call
// unconditionally with the current cfg; reconciles the running listeners
// against cfg.posTerminals (starts new ones, restarts changed ones, stops
// removed ones), leaving unaffected terminals' live connections untouched.
function syncListeners(cfg, log) {
  const desired = new Map(
    (cfg.posTerminals || []).filter((t) => IP_DRIVERS.has(t.driver) && t.terminalPort).map((t) => [t.id, t])
  );
  for (const id of listeners.keys()) {
    if (!desired.has(id)) {
      log(`Терминал: останавливаю прослушивание (${id}, убран из настроек)`);
      stopListener(id);
    }
  }
  for (const [id, entry] of desired) {
    const existing = listeners.get(id);
    if (existing && existing.port === Number(entry.terminalPort) && existing.driver === entry.driver) continue;
    if (existing) {
      log(`Терминал: перезапускаю прослушивание (${id}, порт изменён)`);
      stopListener(id);
    }
    startListener(entry, log);
  }
}

function verifoneStatus() {
  return [...listeners.values()].map((l) => ({
    id: l.id,
    driver: l.driver,
    port: l.port,
    listening: !!l.server,
    terminalConnected: !!l.socket,
  }));
}

// Combined status for EVERY configured terminal, Verifone-family or MAIB —
// Verifone has a real TCP listener to check (listening/terminalConnected
// reflect an actual socket); MAIB has no equivalent cheap "is it really
// there" signal (arccom.dll manages its own connection per operation) — a
// configured MAIB entry is reported as available so the terminal picker
// offers it and a real charge attempt surfaces any actual problem, instead
// of a permanent false "not connected".
function allTerminalsStatus(cfg) {
  const verifone = verifoneStatus();
  return (cfg.posTerminals || []).map((t) => {
    if (t.driver === "MAIB") return { id: t.id, driver: t.driver, listening: true, terminalConnected: true };
    return verifone.find((s) => s.id === t.id) || { id: t.id, driver: t.driver, listening: false, terminalConnected: false };
  });
}

// ---- Wire protocol (ported from VERIFONE_DRIVER_py3.py) -------------------

const CURRENCY_LIST = { 498: "MDL", 840: "USD", 978: "EUR", 643: "RUB", 509: "RUP" };

// Only the codes this module can actually produce locally (000/006/992) —
// bank decline reasons never reach this layer as a code: the terminal
// reports them as human-readable text inside the RCPT receipt slip instead.
const RESP_MSG = { "000": "Successfully", "006": "Failure", "992": "Operation canceled" };

// Substring between the first startTag and the next endTag after it, '' if
// either isn't found.
function extractStr(text, startTag, endTag) {
  const start = text.indexOf(startTag);
  if (start === -1) return "";
  const from = start + startTag.length;
  const end = text.indexOf(endTag, from);
  if (end === -1) return "";
  return text.slice(from, end);
}

// Receipt slip text after the 'RCPT:' tag.
function getChek(text) {
  const pos = text.indexOf("RCPT:");
  if (pos === -1) return "-1";
  const chek = text.slice(pos + 5);
  return chek.slice(chek.indexOf("=") + 1);
}

// \x1c55=... (type 1) / \x1c57=... (type 2) tagged field, terminated by the
// next \x1c.
function getDiscount(text, type = 1) {
  const tag = type === 1 ? "\x1c55=" : "\x1c57=";
  const tagPos = text.indexOf(tag);
  if (tagPos === -1) return "-1";
  const rest = text.slice(tagPos + tag.length);
  const end = rest.indexOf("\x1c");
  return end === -1 ? rest : rest.slice(0, end);
}

// One `recv()` == one Node 'data' event — good enough for the short control
// exchanges this protocol uses.
function readOnce(sock, timeoutMs = OP_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    let done = false;
    const cleanup = () => {
      clearTimeout(timer);
      sock.off("data", onData);
      sock.off("error", onError);
      sock.off("close", onClose);
    };
    const onData = (chunk) => {
      if (done) return;
      done = true;
      cleanup();
      resolve(chunk);
    };
    const onError = (e) => {
      if (done) return;
      done = true;
      cleanup();
      reject(e);
    };
    const onClose = () => {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error("Терминал закрыл соединение"));
    };
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error("Терминал не ответил вовремя"));
    }, timeoutMs);
    sock.on("data", onData);
    sock.on("error", onError);
    sock.on("close", onClose);
  });
}

// Port of Verifone.pos_send_recv(operation, param).
async function posSendRecv(sock, operation, param) {
  // Terminal proactively pushes its own "\x0200=<session>\x1c..." first.
  const chunk2 = await readOnce(sock);
  const text2 = chunk2.toString("utf8");
  const sessionNo = extractStr(text2, "00=", "\x1c");

  sock.write(Buffer.from([0x00, 0x01, 0x06]));

  const operationStr = `\x0200=${sessionNo}\x1c03=${param}`;
  const opBytes = Buffer.from(operationStr, "utf8");
  const sendOperation = Buffer.concat([Buffer.from([0x00, opBytes.length]), opBytes]);
  sock.write(sendOperation);

  const chunk3 = await readOnce(sock);
  const text3 = chunk3.toString("utf8");

  let respCode,
    transactionId = "",
    terminalId = "",
    rcpt = "-1",
    countdownAmt = -1,
    authAmt = -1;
  let rcpt2 = "";

  if (text3.includes("\x01\x06")) {
    const chunk4 = await readOnce(sock);
    let text4 = chunk4.toString("utf8");

    if (text4.includes("\x01\x04")) {
      respCode = "992";
    } else {
      const chunk5 = await readOnce(sock);
      const text5 = chunk5.toString("utf8");
      if (operation === "verify_conn" || operation === "print_cheq" || operation === "copy_report") {
        respCode = text4.includes("\x1c06=OK") ? "000" : "006";
      } else if (operation === "purchase") {
        rcpt2 = text5;
        respCode = text4.includes("\x1c06=00") ? "000" : "006";
      } else if (operation === "refund") {
        rcpt2 = text5;
        respCode = text4.includes("06=00") ? "000" : "006";
      } else if (operation === "xreport" || operation === "close_batch") {
        rcpt2 = text5;
        respCode = text4.includes("\x1c06=OK") ? "000" : "006";
      } else {
        rcpt2 = text5;
        respCode = text4.includes("\x1c06=00") ? "000" : "006";
      }
    }

    transactionId = extractStr(text4, "00=", "\x1c");
    terminalId = extractStr(text4, "\x1c50=", "\x1c");
    rcpt = getChek(text4) + rcpt2;
    countdownAmt = getDiscount(text4, 1);
    authAmt = getDiscount(text4, 2);
  } else {
    respCode = "006";
  }

  const respMsg = RESP_MSG[respCode] || respCode;
  return (
    `RespCode=${respCode}\nTransactionID=${transactionId}\nTerminalID=\n${terminalId}` +
    `\nCOUNTDOWNAMT=${countdownAmt}\nAUTHAMT=${authAmt}\nRespMSG=${respMsg}\nRCPT=${rcpt}`
  );
}

// Port of Verifone.code_convert()'s outer handshake — every operation starts
// with this same start/ack exchange before the operation-specific message.
// `terminalId` picks WHICH configured terminal to run this on — each has its
// own socket/busy-lock in `listeners`, so a charge on one terminal never
// blocks a charge on another.
async function runOperation(terminalId, operation, param) {
  const l = listeners.get(terminalId);
  if (!l) throw new Error("Терминал не найден или не настроен");
  if (!l.socket) throw new Error("Терминал не подключён");
  if (l.busy) throw new Error("На этом терминале уже выполняется другая операция");
  l.busy = true;
  try {
    l.socket.write(Buffer.from([0x00, 0x01, 0x14]));
    const ack = await readOnce(l.socket);
    if (!(ack.length === 3 && ack[0] === 0x00 && ack[1] === 0x01 && ack[2] === 0x06)) {
      throw new Error("Терминал не подтвердил начало операции");
    }
    return await posSendRecv(l.socket, operation, param);
  } finally {
    l.busy = false;
  }
}

function parseFields(text) {
  const fields = {};
  for (const line of text.split("\n")) {
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    fields[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return fields;
}

// Command 1 — sale. `amount` is currency units as a number (e.g. 150.5);
// sent to the terminal in the smallest unit (integer, no decimal point).
// `terminalId` selects which configured/connected terminal to charge on.
// MAIB entries (a different transport — see maib.js) are dispatched there
// instead of the Verifone runOperation path below.
async function charge(cfg, terminalId, amount, log) {
  const entry = (cfg.posTerminals || []).find((t) => t.id === terminalId);
  if (entry && entry.driver === "MAIB") return maib.charge(cfg, log || (() => {}), amount);
  const result = await runOperation(terminalId, "purchase", chargeParam(cfg, amount));
  return parseFields(result);
}

function chargeParam(cfg, amount) {
  const currency = CURRENCY_LIST[cfg.posCurrency || "498"] || "MDL";
  const units = Math.round(amount * 100);
  return `S\x1c53=${currency}\x1c05=${units}\x1c61=1`;
}

// Refunds go through the fiscal register / cash, never back through the
// card terminal — no card-terminal refund flow exists here.
async function refund() {
  throw new Error("Возврат делается наличными через кассу, не через банковский терминал.");
}

module.exports = { charge, refund, syncListeners, verifoneStatus, allTerminalsStatus };
