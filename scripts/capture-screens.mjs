import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = path.join(root, "docs", "screenshots.html");
const outDir = path.join(root, "docs", "images");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1700, height: 920 } });
await page.goto("file:///" + html.replace(/\\/g, "/"));
await page.waitForTimeout(300);

for (const id of ["inbox", "bottle", "write", "settings"]) {
  const el = page.locator(`#${id}`);
  await el.screenshot({ path: path.join(outDir, `screen-${id}.png`) });
}
await browser.close();
console.log("screenshots written");
