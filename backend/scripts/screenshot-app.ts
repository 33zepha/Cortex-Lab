import { chromium, type BrowserContext, type Page } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const BASE_URL = process.env.CORTEX_SCREENSHOT_URL ?? "http://127.0.0.1:4173";
const OUT_DIR = path.resolve(process.cwd(), "artifacts/ui");
mkdirSync(OUT_DIR, { recursive: true });

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
}

async function capture(
  context: BrowserContext,
  route: string,
  heading: string | RegExp,
  name: string,
) {
  const page = await context.newPage();
  await installAppMocks(page);
  await page.goto(`${BASE_URL}${route}${route.includes("?") ? "&" : "?"}simulate=operator`);
  await page.getByRole("heading", { name: heading }).first().waitFor({ state: "visible" });
  const modeBar = page.getByRole("complementary", { name: "Mode de données" });
  await modeBar.waitFor({ state: "visible" });
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelector<HTMLElement>(".mobile-content-scroll")?.scrollTo(0, 0);
  });
  await page.waitForTimeout(450);
  const modeBarBox = await modeBar.boundingBox();
  if (!modeBarBox || modeBarBox.y < 0) {
    throw new Error(`Simulator mode bar is outside the viewport for ${route}`);
  }
  await page.screenshot({ path: path.join(OUT_DIR, name) });
  await page.close();
}

async function writeReviewPreview(sourceName: string, targetName: string, width: number) {
  await sharp(path.join(OUT_DIR, sourceName))
    .resize({ width, withoutEnlargement: true })
    .jpeg({ quality: 44, chromaSubsampling: "4:2:0" })
    .toFile(path.join(OUT_DIR, targetName));
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await capture(desktop, "/", "Maintenant", "app-now-desktop.png");
  await capture(desktop, "/missions", "Missions", "app-missions-desktop.png");
  await capture(desktop, "/console", "Activité", "app-activity-desktop.png");
  await capture(desktop, "/missions/SIM-DECISION", /Déployer la nouvelle politique/, "app-mission-decision-desktop.png");
  await desktop.close();

  const compact = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await capture(compact, "/", "Maintenant", "app-now-mobile-375x667.png");
  await capture(compact, "/missions/SIM-FAILED", /Synchroniser les artifacts/, "app-mission-failed-mobile-375x667.png");
  await compact.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await capture(mobile, "/", "Maintenant", "app-now-mobile-390x844.png");
  await capture(mobile, "/missions", "Missions", "app-missions-mobile-390x844.png");
  await capture(mobile, "/console", "Activité", "app-activity-mobile-390x844.png");
  await capture(mobile, "/missions/SIM-DECISION", /Déployer la nouvelle politique/, "app-mission-decision-mobile-390x844.png");
  await mobile.close();

  const largeMobile = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await capture(largeMobile, "/", "Maintenant", "app-now-mobile-430x932.png");
  await capture(largeMobile, "/missions/SIM-RUNNING-3H", /Auditer Cortex/, "app-mission-running-mobile-430x932.png");
  await largeMobile.close();

  const landscape = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await capture(landscape, "/missions/SIM-PAUSED", /Mettre à jour la documentation/, "app-mission-paused-landscape-844x390.png");
  await landscape.close();

  await browser.close();

  await Promise.all([
    writeReviewPreview("app-now-desktop.png", "app-now-desktop-review.jpg", 260),
    writeReviewPreview("app-now-mobile-390x844.png", "app-now-mobile-review.jpg", 150),
    writeReviewPreview("app-mission-decision-mobile-390x844.png", "app-mission-decision-mobile-review.jpg", 150),
  ]);

  console.log("Operator UI captures written to", OUT_DIR);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
