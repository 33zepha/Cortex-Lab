import { chromium, type Page } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const BASE_URL = process.env.CORTEX_SCREENSHOT_URL ?? "http://127.0.0.1:4173";
const OUT_DIR = path.resolve(process.cwd(), "artifacts/ui");
mkdirSync(OUT_DIR, { recursive: true });

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.locator(".auth-art__image").waitFor({ state: "visible" });
  await page.waitForTimeout(520);
}

async function advanceAccount(page: Page) {
  await page.getByLabel("Email").fill("preview@cortex.local");
  await page.getByLabel("Password").fill("cortex-preview-password");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("textbox", { name: "Workspace", exact: true }).waitFor({ state: "visible" });
  await page.waitForTimeout(420);
}

async function advanceWorkspace(page: Page) {
  await page.getByRole("button", { name: "Establish workspace" }).click();
  await page.getByRole("button", { name: "Add connection" }).waitFor({ state: "visible" });
  await page.waitForTimeout(480);
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

  await advanceAccount(signup);
  await signup.screenshot({ path: path.join(OUT_DIR, "auth-workspace-desktop.png"), fullPage: true });
  await signup.getByRole("button", { name: /Onboarding step/ }).click();
  await signup.getByRole("button", { name: /Account/ }).waitFor({ state: "visible" });
  await signup.waitForTimeout(320);
  await signup.screenshot({ path: path.join(OUT_DIR, "auth-step-menu-desktop.png"), fullPage: true });
  await signup.getByRole("button", { name: /Workspace/ }).click();
  await signup.waitForTimeout(280);

  await advanceWorkspace(signup);
  await signup.screenshot({ path: path.join(OUT_DIR, "auth-runtime-desktop.png"), fullPage: true });
  await signup.getByRole("button", { name: "Add connection" }).click();
  await signup.getByRole("button", { name: /VPS \/ SSH/ }).waitFor({ state: "visible" });
  await signup.waitForTimeout(460);
  await signup.screenshot({ path: path.join(OUT_DIR, "auth-runtime-child-menu-desktop.png"), fullPage: true });
  await signup.getByRole("button", { name: /VPS \/ SSH/ }).click();
  await signup.getByLabel("Host / Tailscale IP").waitFor({ state: "visible" });
  await signup.waitForTimeout(460);
  await signup.screenshot({ path: path.join(OUT_DIR, "auth-runtime-vps-desktop.png"), fullPage: true });
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const loginMobile = await mobile.newPage();
  await loginMobile.goto(`${BASE_URL}/login`);
  await settle(loginMobile);
  await loginMobile.screenshot({ path: path.join(OUT_DIR, "auth-login-mobile.png"), fullPage: true });

  const runtimeMobile = await mobile.newPage();
  await runtimeMobile.goto(`${BASE_URL}/signup`);
  await settle(runtimeMobile);
  await advanceAccount(runtimeMobile);
  await advanceWorkspace(runtimeMobile);
  await runtimeMobile.screenshot({ path: path.join(OUT_DIR, "auth-runtime-mobile.png"), fullPage: true });
  await runtimeMobile.getByRole("button", { name: "Add connection" }).click();
  await runtimeMobile.getByRole("button", { name: /VPS \/ SSH/ }).waitFor({ state: "visible" });
  await runtimeMobile.waitForTimeout(460);
  await runtimeMobile.screenshot({ path: path.join(OUT_DIR, "auth-runtime-child-menu-mobile.png"), fullPage: true });
  await runtimeMobile.getByRole("button", { name: /VPS \/ SSH/ }).click();
  await runtimeMobile.getByLabel("Host / Tailscale IP").waitFor({ state: "visible" });
  await runtimeMobile.waitForTimeout(460);
  await runtimeMobile.screenshot({ path: path.join(OUT_DIR, "auth-runtime-vps-mobile.png"), fullPage: true });
  await mobile.close();

  await browser.close();
  console.log("Auth captures written to", OUT_DIR);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
