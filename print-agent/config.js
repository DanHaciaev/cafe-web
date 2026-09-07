const fs = require("fs");
const path = require("path");

const DEFAULT_CONFIG = {
  port: 47991,
  printerName: "TP805L",
  paperWidthUnits: 283,
  allowedOrigins: ["http://localhost:3000", "http://127.0.0.1:3000"],
  // Bank card terminals physically attached to THIS PC — a plain array, not
  // a single driver/port pair, because one till can have more than one
  // terminal plugged in at once (different banks charge different
  // commission, cashier picks per sale). Each entry:
  // { id, driver: 'MAIB'|'VB'|'MICB'|'FCB', comPort, terminalPort }.
  // 'MAIB' talks through maib-bridge/ (see maib.js) via comPort. 'VB'/
  // 'MICB'/'FCB' talk over terminalPort (wifi/ethernet, Verifone-family —
  // this PC listens on that port, the terminal is pointed at this PC's
  // IP+port from ITS OWN menu). Two Verifone-family entries must use two
  // DIFFERENT ports.
  posTerminals: [],
  // ISO 4217 numeric currency code the terminal protocol expects — '498' = MDL.
  posCurrency: "498",
  // Path to a 32-bit Python interpreter — arccom.dll (MAIB/Arcus2) is a
  // 32-bit-only DLL, this print-agent runs as a 64-bit process. Empty =
  // try the `py -3-32` launcher alias, which works if the standard
  // python.org installer (not the Microsoft Store one) was used to install
  // a 32-bit Python on this PC.
  maibPython32Path: "",
};

// Packaged .exe (pkg): process.pkg is set and the real exe lives at
// process.execPath — __dirname inside a pkg snapshot points at a virtual
// filesystem baked into the binary, not a real path on disk, so config.json
// (and the log file) have to be located next to the actual .exe instead.
// Plain `node agent.js` (dev): __dirname is already the real folder.
function configDir() {
  return process.pkg ? path.dirname(process.execPath) : __dirname;
}

function configPath() {
  return path.join(configDir(), "config.json");
}

function ensureConfigFile() {
  const file = configPath();
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n");
  }
}

function loadConfig() {
  const raw = fs.readFileSync(configPath(), "utf-8");
  return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
}

// Merges `updates` into whatever's currently on disk (not just DEFAULT_CONFIG
// — other settings, e.g. printerName, must survive a terminals-only save)
// and writes the result back.
function saveConfig(updates) {
  let current = {};
  try {
    current = JSON.parse(fs.readFileSync(configPath(), "utf-8"));
  } catch {
    /* start from DEFAULT_CONFIG below if the existing file is unreadable */
  }
  const next = { ...DEFAULT_CONFIG, ...current, ...updates };
  fs.writeFileSync(configPath(), JSON.stringify(next, null, 2) + "\n");
  return next;
}

module.exports = { ensureConfigFile, loadConfig, saveConfig, configDir };
