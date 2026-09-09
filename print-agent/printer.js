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
# This driver only understands its own pre-registered forms (72mm x 297/420/
# 3276mm, etc) — it ignores an arbitrary custom PaperSize.Height and silently
# falls back to whichever form is currently selected. Picking the *largest*
# matching form (the old behavior) meant every short ticket fed the full
# 3276mm roll length, and the undrawn trailing area printed solid black
# instead of white. Pick the smallest registered form that still fits the
# content instead.
$sizes = $pd.PrinterSettings.PaperSizes
$roll = $sizes | Where-Object { $_.Width -eq ${paperWidthUnits} -and $_.Height -ge $heightUnits } |
  Sort-Object Height | Select-Object -First 1
if (-not $roll) {
  # Content taller than any registered form (a very long ticket) — fall back
  # to the largest one available rather than clipping the receipt.
  $roll = $sizes | Where-Object { $_.Width -eq ${paperWidthUnits} } | Sort-Object Height -Descending | Select-Object -First 1
}
if (-not $roll) { $roll = $sizes | Sort-Object Height -Descending | Select-Object -First 1 }
if ($roll) { $pd.DefaultPageSettings.PaperSize = $roll }
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
    // The site's CSS switches to a dark page background under
    // prefers-color-scheme: dark, and headless Chrome inherits that from the
    // host OS theme. A printed receipt must always render light regardless
    // of what theme the till PC happens to be set to.
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
    await page.setViewport({ width: viewportWidth, height: 2000, deviceScaleFactor: 2 });
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30_000 });

    // Measuring document.body.scrollHeight is wrong here: the shared root
    // layout puts min-h-full/h-full on <html>/<body> (needed for the POS
    // screen elsewhere in the app), which stretches <body> to fill whatever
    // viewport height we just set instead of reporting the ticket's actual
    // content height. That measurement then feeds the *next* viewport
    // height too, so it never shrinks back down — the clip ends up ~2000px
    // tall no matter how short the ticket is, and the extra space beyond
    // the ticket (the page's own dark-mode background before the fix above)
    // prints as a large trailing block. Measuring the ticket's own #receipt
    // element sidesteps the whole issue.
    const totalHeight = await page.evaluate(`document.getElementById("receipt").scrollHeight`);
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
