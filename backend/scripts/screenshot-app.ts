import { chromium, type BrowserContext, type Page } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const BASE_URL = process.env.CORTEX_SCREENSHOT_URL ?? "http://127.0.0.1:4173";
const OUT_DIR = path.resolve(process.cwd(), "artifacts/ui");
mkdirSync(OUT_DIR, { recursive: true });

const tokenSeries = [
  { day: "Lun", tokens: 18420 },
  { day: "Mar", tokens: 22110 },
  { day: "Mer", tokens: 16780 },
  { day: "Jeu", tokens: 29640 },
  { day: "Ven", tokens: 24880 },
  { day: "Sam", tokens: 11240 },
  { day: "Dim", tokens: 14360 },
];

async function installAppMocks(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(window, "EventSource", { value: undefined, configurable: true });
  });

  await page.route("**/api/auth/session", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ authenticated: true, user: "preview@cortex.local" }),
  }));

  await page.route("**/api/workspace", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      user: "preview@cortex.local",
      workspace: {
        id: "ws_preview",
        name: "Cortex Lab",
        connection: { type: "vps", host: "100.85.93.10", user: "root" },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    }),
  }));

  await page.route("**/api/missions", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
  await page.route("**/api/health", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ status: "ok", services: [] }),
  }));
  await page.route("**/api/tokens/weekly", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(tokenSeries),
  }));
}

async function settleApp(page: Page) {
  await page.getByRole("heading", { name: "Overview" }).waitFor({ state: "visible" });
  await page.waitForTimeout(650);
}

async function captureOverview(context: BrowserContext, name: string) {
  const page = await context.newPage();
  await installAppMocks(page);
  await page.goto(`${BASE_URL}/`);
  await settleApp(page);
  await page.screenshot({ path: path.join(OUT_DIR, name), fullPage: true });
  return page;
}

async function writeReviewPreview(sourceName: string, targetName: string, width: number) {
  await sharp(path.join(OUT_DIR, sourceName))
    .resize({ width, withoutEnlargement: true })
    .jpeg({ quality: 42, chromaSubsampling: "4:2:0" })
    .toFile(path.join(OUT_DIR, targetName));
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const overview = await captureOverview(desktop, "app-overview-desktop.png");
  await overview.getByRole("link", { name: "Accueil" }).click();
  await overview.waitForTimeout(320);
  await overview.screenshot({ path: path.join(OUT_DIR, "app-overview-desktop-wing.png"), fullPage: true });
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await captureOverview(mobile, "app-overview-mobile.png");
  await mobile.close();

  await browser.close();

  await Promise.all([
    writeReviewPreview("app-overview-desktop.png", "app-overview-desktop-review.jpg", 220),
    writeReviewPreview("app-overview-desktop-wing.png", "app-overview-desktop-wing-review.jpg", 220),
    writeReviewPreview("app-overview-mobile.png", "app-overview-mobile-review.jpg", 140),
  ]);

  console.log("App continuity captures written to", OUT_DIR);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
