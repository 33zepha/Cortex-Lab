import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const BASE_URL = "http://localhost:4173";
const OUT_DIR = path.resolve(process.cwd(), "artifacts/ui");
mkdirSync(OUT_DIR, { recursive: true });

const CHROMIUM_PATH = "/opt/pw-browsers/chromium";

async function main() {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });

  // --- Desktop screenshots (1440px) ---
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  const overview = await desktop.newPage();
  await overview.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await overview.waitForTimeout(300);
  await overview.screenshot({ path: path.join(OUT_DIR, "overview-desktop.png") });

  const missions = await desktop.newPage();
  await missions.goto(`${BASE_URL}/missions`, { waitUntil: "networkidle" });
  await missions.waitForTimeout(300);
  await missions.screenshot({ path: path.join(OUT_DIR, "missions-desktop.png") });

  const missionDetailUrl = `${BASE_URL}/missions/01J8X3G2H4B6D8F0K2M4P6R8T0`;
  const detail = await desktop.newPage();
  await detail.goto(missionDetailUrl, { waitUntil: "networkidle" });
  await detail.waitForTimeout(300);
  await detail.screenshot({ path: path.join(OUT_DIR, "mission-detail-desktop.png"), fullPage: true });

  const system = await desktop.newPage();
  await system.goto(`${BASE_URL}/system`, { waitUntil: "networkidle" });
  await system.waitForTimeout(300);
  await system.screenshot({ path: path.join(OUT_DIR, "system-desktop.png") });

  // Command palette (desktop)
  const palettePage = await desktop.newPage();
  await palettePage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await palettePage.keyboard.press("Meta+k");
  await palettePage.waitForTimeout(250);
  // Fallback in case Meta+k didn't register in headless (try Control+k too)
  const paletteVisible = await palettePage.locator('[cmdk-input]').isVisible().catch(() => false);
  if (!paletteVisible) {
    await palettePage.keyboard.press("Control+k");
    await palettePage.waitForTimeout(250);
  }
  await palettePage.screenshot({ path: path.join(OUT_DIR, "command-palette.png") });

  await desktop.close();

  // --- Mobile screenshots (390px) ---
  // La nav mobile (position: fixed) est masquée avant capture fullPage : Chromium fixe sa
  // position sur la hauteur totale du composite, ce qui la fait chevaucher le contenu réel
  // au lieu de rester au bas de chaque écran comme dans un vrai défilement.
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });

  const mobileOverview = await mobile.newPage();
  await mobileOverview.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await mobileOverview.waitForTimeout(300);
  await mobileOverview.evaluate(() => {
    document.querySelectorAll("nav").forEach((n) => ((n as HTMLElement).style.display = "none"));
  });
  await mobileOverview.screenshot({ path: path.join(OUT_DIR, "overview-mobile.png"), fullPage: true });

  const mobileDetail = await mobile.newPage();
  await mobileDetail.goto(missionDetailUrl, { waitUntil: "networkidle" });
  await mobileDetail.waitForTimeout(300);
  await mobileDetail.evaluate(() => {
    document.querySelectorAll("nav").forEach((n) => ((n as HTMLElement).style.display = "none"));
  });
  await mobileDetail.screenshot({ path: path.join(OUT_DIR, "mission-detail-mobile.png"), fullPage: true });
  await mobile.close();

  // --- Collage d'états (loading / empty / failed / SSE disconnected) → states.png ---
  const states = await browser.newContext({ viewport: { width: 900, height: 760 } });

  // .locator("main") exclut la sidebar ; la nav mobile (position: fixed) est masquée
  // explicitement, car un élément fixed chevauche la capture même hors de son parent DOM.
  async function hideMobileNav(page: import("playwright").Page) {
    await page.evaluate(() => {
      document.querySelectorAll("nav").forEach((n) => ((n as HTMLElement).style.display = "none"));
    });
  }

  const loadingPage = await states.newPage();
  await loadingPage.goto(`${BASE_URL}/missions?state=loading`, { waitUntil: "networkidle" });
  await loadingPage.waitForTimeout(200);
  await hideMobileNav(loadingPage);
  const loadingBuf = await loadingPage.locator("main").screenshot();
  await loadingPage.close();

  const emptyPage = await states.newPage();
  await emptyPage.goto(`${BASE_URL}/missions?state=empty`, { waitUntil: "networkidle" });
  await emptyPage.waitForTimeout(200);
  await hideMobileNav(emptyPage);
  const emptyBuf = await emptyPage.locator("main").screenshot();
  await emptyPage.close();

  const failedPage = await states.newPage();
  await failedPage.goto(`${BASE_URL}/missions/01J8X1B2C4E6G8J0L2N4Q6S8U0`, { waitUntil: "networkidle" });
  await failedPage.waitForTimeout(200);
  await failedPage.locator('button[role="tab"]:has-text("Erreurs")').click();
  await failedPage.waitForTimeout(200);
  await hideMobileNav(failedPage);
  const failedBuf = await failedPage.locator("main").screenshot();
  await failedPage.close();

  const ssePage = await states.newPage();
  await ssePage.goto(`${BASE_URL}/system`, { waitUntil: "networkidle" });
  await ssePage.getByRole("button", { name: /Simuler une déconnexion/ }).click();
  await ssePage.waitForTimeout(200);
  await hideMobileNav(ssePage);
  const sseBuf = await ssePage.locator("main").screenshot();
  await ssePage.close();

  await states.close();

  const tileW = 900;
  const tileH = 760;
  const gap = 16;
  const collage = sharp({
    create: {
      width: tileW * 2 + gap * 3,
      height: tileH * 2 + gap * 3,
      channels: 3,
      background: "#f6f7f9",
    },
  });
  await collage
    .composite([
      { input: loadingBuf, left: gap, top: gap },
      { input: emptyBuf, left: gap * 2 + tileW, top: gap },
      { input: failedBuf, left: gap, top: gap * 2 + tileH },
      { input: sseBuf, left: gap * 2 + tileW, top: gap * 2 + tileH },
    ])
    .png()
    .toFile(path.join(OUT_DIR, "states.png"));

  // --- Breakpoints supplémentaires : Tablet (768) et Laptop (1280) ---
  const tablet = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const tabletPage = await tablet.newPage();
  await tabletPage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await tabletPage.waitForTimeout(250);
  await tabletPage.screenshot({ path: path.join(OUT_DIR, "overview-tablet.png"), fullPage: true });
  await tablet.close();

  const laptop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const laptopPage = await laptop.newPage();
  await laptopPage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await laptopPage.waitForTimeout(250);
  await laptopPage.screenshot({ path: path.join(OUT_DIR, "overview-laptop.png") });
  await laptop.close();

  await browser.close();
  console.log("Captures écrites dans", OUT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
