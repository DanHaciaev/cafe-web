const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "config.json");

const DEFAULT_CONFIG = {
  port: 47990,
  printerName: "TP805L",
  paperWidthUnits: 283,
  allowedOrigins: ["http://localhost:3000", "http://127.0.0.1:3000"],
};

function ensureConfigFile() {
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
  }
}

function loadConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
}

module.exports = { ensureConfigFile, loadConfig, CONFIG_PATH };
