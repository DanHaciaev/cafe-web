// MAIB (Arcus2, Ingenico terminal) — bridges to the vendor's own
// POS_Driver/MAIB_driver_v21.py (Arcus2Lib), copied verbatim into
// maib-bridge/ alongside its direct dependencies and the real arccom.dll.
// No protocol logic lives here or in bridge.py — this is a thin stdin/
// stdout JSON-line pipe to their unmodified pos_operation(code) call.
//
// Why a whole separate PYTHON process: arccom.dll is a 32-bit-only DLL, but
// this print-agent runs as a 64-bit Node process — a 64-bit process can
// never load a 32-bit DLL, in any language, full stop. bridge.py has to run
// under a 32-bit Python interpreter as its own OS process; that's a hard
// Windows constraint, not a design choice. There is no COM port to
// configure here — the vendor's own Arcus2Lib.pos_operation() never takes
// one from calling code at all; the physical port pairing lives in the
// Arcus2 installation's own config on this PC, set up separately.
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const readline = require("readline");
const { configDir } = require("./config");

// pkg-packaged exe: __dirname points into pkg's virtual filesystem, not a
// real path on disk — python.exe can't read a script out of that, it needs
// a REAL file. maib-bridge/ has to be deployed as a real folder sitting
// next to the .exe, not baked inside it.
const BRIDGE_DIR = path.join(configDir(), "maib-bridge");
const BRIDGE_SCRIPT = path.join(BRIDGE_DIR, "bridge.py");

// arccom.dll does NOT take the COM port from Arcus2Lib's Python call at
// all — it reads its OWN cashreg.ini out of its working directory at
// startup (see the official Arcus2 admin guide). PORT gets substituted from
// the configured MAIB terminal's comPort field so an admin doesn't have to
// hand-edit this file to change it.
const CASHREG_INI_TEMPLATE = `#port section
PORT={{PORT}}
SPEED=115200
BYTE=8
PARITY=N
STOP=1

#time in miliseconds
TIMEOUT=10000
PPAD_IDLE_TO=120000

#Nu cere confirmarea datelor introduse pentru cancel last
DEF_OPDET_RESPONCE=YES

#Operations Description
OPERATION_INI_FILE=ops.ini

#response code converting
RC_CONVERT_FILE=rc_conv.ini

#files section
CHEQ_FILE=cheq.out
RESULT_FILE=rc.out

#auto cancel operation
CANCEL_CH_FILE=auto_can.out
CANCEL_RC_FILE=can_rc.out

#Switching ON/OFF ARCUS2 LOG
USEAPPLOG
USEPPADTRACE
#NO_PA_DSS

# Switching on/off cashregister dialogs - dialogs.dll activity and
# information messages on the PC
NODIALOGS

#response code converting
RC_CONVERT_FILE=rc_conv.ini

#response code resolver
RC_RESOLVE_FILE=rc_res.ini
DEFAULT_RC_STRING=Codul de raspuns nu a fost receptionat
INFO_MESSAGE=Procesarea tranzactiei...
USEORIGINALRC

USE_PRINTER=NONE
INPUT_FILE=chek.in
OUTPUT_FILE=chek.out
FIRST=1
LAST=1
###CP1251UTF-8
PPCHARSET=CP1251
OPCHARSET=CP1251
#PPCHARSET=UTF-8
PRINTERCHARSET=CP1251

CHEQ_SEPARATOR=__________

#logging CONTROL : LIFETIME, NUMBET OF FILES, DISK SPACE
NDAYS=30    //(in days)
NFILES=9800 //(in pieces)
NSIZE=500   //(in Mb)
`;

let proc = null;
let pending = null; // { resolve, reject } for the one in-flight request — one at a time, same as bridge.py's own single-threaded stdin loop
let lastPort = null;

// Writes/refreshes cashreg.ini from the currently configured MAIB
// terminal's comPort — cheap, called every time before the bridge might
// need (re)starting, so it's always in sync with the admin's saved config
// without needing a separate explicit "save" step.
function writeCashregIni(cfg, log) {
  const entry = (cfg.posTerminals || []).find((t) => t.driver === "MAIB");
  const port = (entry && entry.comPort) || "COM8";
  try {
    fs.mkdirSync(BRIDGE_DIR, { recursive: true });
    fs.writeFileSync(path.join(BRIDGE_DIR, "cashreg.ini"), CASHREG_INI_TEMPLATE.replace("{{PORT}}", port));
  } catch (e) {
    log(`MAIB: не могу записать cashreg.ini: ${e.message}`);
  }
  return port;
}

function stop() {
  if (proc) {
    try {
      proc.kill();
    } catch {
      /* already gone */
    }
  }
  proc = null;
  if (pending) {
    pending.reject(new Error("Мост MAIB остановлен"));
    pending = null;
  }
}

// Lazily starts (or reuses) the bridge process — restarts it if the
// configured COM port changed since it was last spawned, since arccom.dll
// only reads cashreg.ini once, at its own startup. `cfg.maibPython32Path`
// empty falls back to the `py` launcher's `-3-32` alias (works when Python
// was installed from python.org, not the Microsoft Store stub).
function ensureStarted(cfg, log) {
  const port = writeCashregIni(cfg, log);
  if (proc && !proc.killed && port === lastPort) return;
  if (proc) {
    log("MAIB: перезапускаю мост (порт изменён)");
    stop();
  }
  lastPort = port;
  const pyPath = cfg.maibPython32Path || "py";
  const args = cfg.maibPython32Path ? [BRIDGE_SCRIPT] : ["-3-32", BRIDGE_SCRIPT];
  log(`MAIB: запускаю мост (${pyPath} ${args.join(" ")}, порт=${port})`);
  const p = spawn(pyPath, args, { cwd: BRIDGE_DIR, windowsHide: true });
  p.on("error", (e) => log(`MAIB: ошибка запуска моста: ${e.message}`));
  p.on("exit", (code) => {
    log(`MAIB: мост остановлен (код ${code})`);
    if (pending) {
      pending.reject(new Error("Мост MAIB неожиданно остановился"));
      pending = null;
    }
    proc = null;
  });
  p.stderr.on("data", (chunk) => log(`MAIB: stderr: ${chunk.toString().trim()}`));
  const lineReader = readline.createInterface({ input: p.stdout });
  lineReader.on("line", (line) => {
    // The vendor's own Arcus2Lib prints its own debug noise straight to
    // stdout too (e.g. a bare `0` — the pos_obj handle), interleaved with
    // our actual JSON-line replies. A bare number is technically valid
    // JSON, so JSON.parse alone isn't enough of a filter — only a genuine
    // `{...}` object counts as a protocol message.
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      log(`MAIB: непонятная строка от моста: ${line}`);
      return;
    }
    if (msg === null || typeof msg !== "object") {
      log(`MAIB: непонятная строка от моста: ${line}`);
      return;
    }
    if (msg.ready) {
      log("MAIB: мост готов");
      return;
    }
    if (pending) {
      const p2 = pending;
      pending = null;
      p2.resolve(msg);
    }
  });
  proc = p;
}

// Sends one `{code}` request (vendor's own "opcode,params" string, e.g.
// "1,100,498" for a 100-unit purchase in currency 498) and waits for the
// matching JSON-line reply. One at a time — matches bridge.py's own
// single-threaded stdin loop, no concurrent requests.
function sendCode(cfg, log, code, timeoutMs = 65_000) {
  return new Promise((resolve, reject) => {
    ensureStarted(cfg, log);
    if (pending) {
      reject(new Error("На MAIB уже выполняется другая операция"));
      return;
    }
    const timer = setTimeout(() => {
      if (pending) {
        pending = null;
        reject(new Error("Мост MAIB не ответил вовремя"));
      }
    }, timeoutMs);
    pending = {
      resolve: (msg) => {
        clearTimeout(timer);
        resolve(msg);
      },
      reject: (e) => {
        clearTimeout(timer);
        reject(e);
      },
    };
    proc.stdin.write(JSON.stringify({ code }) + "\n");
  });
}

// Parses the vendor's own `RespCode=...\nTransactionID=...\n...` text block
// (identical shape to the Verifone parser in pos.js) into a plain field map.
function parseFields(text) {
  const fields = {};
  for (const line of String(text).split("\n")) {
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    fields[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return fields;
}

// Command 1 — sale. `amount` is currency units as a number; sent in the
// smallest unit (integer, ×100).
async function charge(cfg, log, amount) {
  const units = Math.round(amount * 100);
  const code = `1,${units},${cfg.posCurrency || "498"}`;
  const msg = await sendCode(cfg, log, code);
  if (!msg.ok) throw new Error(msg.error || "Неизвестная ошибка от моста MAIB");
  return parseFields(msg.result);
}

async function refund() {
  throw new Error("Возврат делается наличными через кассу, не через банковский терминал.");
}

module.exports = { charge, refund, stop };
