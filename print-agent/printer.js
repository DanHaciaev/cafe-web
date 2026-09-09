const { execFile } = require("child_process");
const { writeFile, unlink } = require("fs/promises");
const { existsSync } = require("fs");
const { tmpdir } = require("os");
const { join } = require("path");
const { promisify } = require("util");
const puppeteer = require("puppeteer-core");

const execFileAsync = promisify(execFile);

function getChromePath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  if (process.platform === "win32") {
    const candidates = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    ];
    return candidates.find((p) => p && existsSync(p)) || candidates[0];
  }
  const candidates = ["/usr/bin/chromium-browser", "/usr/bin/chromium", "/usr/bin/google-chrome"];
  return candidates.find((p) => existsSync(p)) || candidates[0];
}

let _browser = null;
async function getBrowser() {
  if (_browser) {
    try {
      await _browser.version();
      return _browser;
    } catch {
      _browser = null;
    }
  }
  _browser = await puppeteer.launch({
    executablePath: getChromePath(),
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  return _browser;
}

// Screenshots one PNG and sends it to the printer via a generated PowerShell
// script (System.Drawing.Printing.PrintDocument), scaled to the roll's own
// width. Kept as a one-off script per job so a failed print never leaves the
// spooler in a stuck state.
async function printImage(pngBuffer, printerName, paperWidthUnits) {
  const tmp = join(tmpdir(), `cafe-kitchen-${Date.now()}.png`);
  await writeFile(tmp, pngBuffer);
  try {
    if (process.platform !== "win32") {
      await execFileAsync("lp", ["-d", printerName, tmp], { timeout: 30_000 });
      return;
    }
    const escapedTmp = tmp.replace(/\\/g, "\\\\");
    const escapedPrinter = printerName.replace(/'/g, "''");
    const ps = `
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('${escapedTmp}')
$pd = New-Object System.Drawing.Printing.PrintDocument
$pd.PrinterSettings.PrinterName = '${escapedPrinter}'
$ratio = $img.Height / $img.Width
$heightUnits = [Math]::Max(100, [int](${paperWidthUnits} * $ratio))
# The driver's predefined "roll" paper size reports a huge default height for
# continuous feed — printing at that height feeds far past the receipt image,
# and the undrawn trailing area comes back solid black on this printer's
# driver instead of white. An exact custom size (image height, not the
# roll's nominal max) makes the page end exactly where the content ends.
try {
  $customSize = New-Object System.Drawing.Printing.PaperSize('CafeReceipt', ${paperWidthUnits}, $heightUnits)
  $pd.DefaultPageSettings.PaperSize = $customSize
} catch {
  $sizes = $pd.PrinterSettings.PaperSizes
  $roll = $sizes | Where-Object { $_.Width -eq ${paperWidthUnits} } | Sort-Object Height -Descending | Select-Object -First 1
  if (-not $roll) { $roll = $sizes | Sort-Object Height -Descending | Select-Object -First 1 }
  if ($roll) { $pd.DefaultPageSettings.PaperSize = $roll }
}
$pd.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(0,0,0,0)
$captured = $img
$pd.add_PrintPage({
  param($s,$ev)
  $ev.Graphics.Clear([System.Drawing.Color]::White)
  $ratio = $captured.Height / $captured.Width
  $w = $ev.PageBounds.Width
  $h = [int]($w * $ratio)
  $ev.Graphics.DrawImage($captured, $ev.PageBounds.X, $ev.PageBounds.Y, $w, $h)
  $ev.HasMorePages = $false
})
$pd.Print()
$img.Dispose()
$pd.Dispose()
`;
    await execFileAsync("powershell", ["-NoProfile", "-NonInteractive", "-Command", ps], {
      timeout: 30_000,
    });
  } finally {
    await unlink(tmp).catch(() => {});
  }
}

// Renders the given kitchen-ticket URL (the Next.js /print/order/[id] page)
// in headless Chrome and prints it as a single receipt image.
async function printKitchenTicket(url, cfg) {
  const viewportWidth = Math.round((cfg.paperWidthUnits / 100) * 96);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.emulateMediaType("print");
    await page.setViewport({ width: viewportWidth, height: 2000, deviceScaleFactor: 2 });
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30_000 });

    const totalHeight = await page.evaluate(`document.body.scrollHeight`);
    await page.setViewport({ width: viewportWidth, height: totalHeight + 20, deviceScaleFactor: 2 });

    const png = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: viewportWidth, height: totalHeight },
    });
    await printImage(Buffer.from(png), cfg.printerName, cfg.paperWidthUnits);
  } finally {
    await page.close();
  }
}

module.exports = { printKitchenTicket };
