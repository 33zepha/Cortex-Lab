import { chromium, type Page } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const BASE_URL = process.env.CORTEX_SCREENSHOT_URL ?? "http://127.0.0.1:4173";
const OUT_DIR = path.resolve(process.cwd(), "artifacts/ui");
mkdirSync(OUT_DIR, { recursive: true });

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.locator(".auth-art__image").waitFor({ state: "visible" });
  await page.waitForTimeout(420);
}

async function advanceSignupToRuntime(page: Page) {
  await page.getByLabel("Email").fill("preview@cortex.local");
  await page.getByLabel("Password").fill("cortex-preview-password");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Workspace").waitFor({ state: "visible" });
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Add connection" }).waitFor({ state: "visible" });
  await page.waitForTimeout(420);
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const loginDesktop = await desktop.newPage();
  await loginDesktop.goto(`${BASE_URL}/login`);
  await settle(loginDesktop);
  await loginDesktop.screenshot({ path: path.join(OUT_DIR, "auth-login-desktop.png"), fullPage: true });

  const signup = await desktop.newPage();
  await signup.goto(`${BASE_URL}/signup`);
  await settle(signup);
  await signup.screenshot({ path: path.join(OUT_DIR, "auth-signup-desktop.png"), fullPage: true });
  await advanceSignupToRuntime(signup);
  await signup.screenshot({ path: path.join(OUT_DIR, "auth-runtime-desktop.png"), fullPage: true });
  await signup.getByRole("button", { name: "Add connection" }).click();
  await signup.getByRole("button", { name: /VPS \/ SSH/ }).waitFor({ state: "visible" });
  await signup.waitForTimeout(420);
  await signup.screenshot({ path: path.join(OUT_DIR, "auth-runtime-child-menu-desktop.png"), fullPage: true });
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const loginMobile = await mobile.newPage();
  await loginMobile.goto(`${BASE_URL}/login`);
  await settle(loginMobile);
  await loginMobile.screenshot({ path: path.join(OUT_DIR, "auth-login-mobile.png"), fullPage: true });

  const runtimeMobile = await mobile.newPage();
  await runtimeMobile.goto(`${BASE_URL}/signup`);
  await settle(runtimeMobile);
  await advanceSignupToRuntime(runtimeMobile);
  await runtimeMobile.getByRole("button", { name: "Add connection" }).click();
  await runtimeMobile.getByRole("button", { name: /VPS \/ SSH/ }).waitFor({ state: "visible" });
  await runtimeMobile.waitForTimeout(420);
  await runtimeMobile.screenshot({ path: path.join(OUT_DIR, "auth-runtime-child-menu-mobile.png"), fullPage: true });
  await mobile.close();

  await browser.close();
  console.log("Auth captures written to", OUT_DIR);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
