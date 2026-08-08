import { chromium, type Browser, type Page } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const BASE_URL = process.env.CORTEX_SCREENSHOT_URL ?? "http://127.0.0.1:4173";
const OUT_DIR = path.resolve(process.cwd(), "artifacts/ui");
mkdirSync(OUT_DIR, { recursive: true });

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.locator(".auth-art__image").waitFor({ state: "visible" });
  await page.waitForTimeout(380);
}

async function assertMobileRenderingContract(page: Page) {
  const state = await page.evaluate(() => {
    const entry = document.querySelector<HTMLElement>(".auth-entry");
    const image = document.querySelector<HTMLElement>(".auth-art__image");
    const core = document.querySelector<HTMLElement>('.liquid-surface[data-liquid-variant="core"]');
    const action = document.querySelector<HTMLElement>(".auth-action");
    const dither = document.querySelector<HTMLElement>(".auth-dither-atmosphere");
    const title = document.querySelector<HTMLElement>(".auth-heading h1");
    if (!entry || !image || !core || !action || !dither || !title) return null;
    const entryStyle = getComputedStyle(entry);
    const imageStyle = getComputedStyle(image);
    const coreStyle = getComputedStyle(core);
    const actionStyle = getComputedStyle(action);
    const ditherStyle = getComputedStyle(dither);
    const titleStyle = getComputedStyle(title);
    return {
      overflowY: entryStyle.overflowY,
      imagePosition: imageStyle.position,
      imageFilter: imageStyle.filter,
      imageWillChange: imageStyle.willChange,
      coreBackdrop: coreStyle.backdropFilter,
      actionBackdrop: actionStyle.backdropFilter,
      ditherDisplay: ditherStyle.display,
      titleAnimation: titleStyle.animationName,
    };
  });

  if (!state) throw new Error("Mobile auth rendering contract could not inspect required elements");
  const violations: string[] = [];
  if (!["auto", "scroll"].includes(state.overflowY)) violations.push(`entry overflow-y=${state.overflowY}`);
  if (state.imagePosition !== "fixed") violations.push(`background position=${state.imagePosition}`);
  if (state.imageFilter !== "none") violations.push(`background filter=${state.imageFilter}`);
  if (state.imageWillChange !== "auto") violations.push(`background will-change=${state.imageWillChange}`);
  if (state.coreBackdrop !== "none") violations.push(`core backdrop-filter=${state.coreBackdrop}`);
  if (state.actionBackdrop !== "none") violations.push(`action backdrop-filter=${state.actionBackdrop}`);
  if (state.ditherDisplay !== "none") violations.push(`dither display=${state.ditherDisplay}`);
  if (!state.titleAnimation.includes("auth-title-reveal-mobile")) violations.push(`title animation=${state.titleAnimation}`);
  if (violations.length) throw new Error(`Mobile auth rendering contract failed: ${violations.join(", ")}`);
}

async function advanceAccount(page: Page) {
  await page.getByLabel("Email").fill("preview@cortex.local");
  await page.getByLabel("Password").fill("cortex-preview-password");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("textbox", { name: "Workspace", exact: true }).waitFor({ state: "visible" });
  await page.waitForTimeout(260);
}

async function advanceWorkspace(page: Page) {
  await page.getByRole("button", { name: "Establish workspace" }).click();
  await page.getByRole("button", { name: "Add connection" }).waitFor({ state: "visible" });
  await page.waitForTimeout(300);
}

async function chooseWorkspaceStep(page: Page) {
  const item = page.locator(".auth-step-menu__item").filter({ hasText: "Workspace" });
  await item.waitFor({ state: "visible" });
  await item.click();
}

async function captureLogin(browser: Browser, width: number, height: number, name: string) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/login`);
  await settle(page);
  await assertMobileRenderingContract(page);
  await page.screenshot({ path: path.join(OUT_DIR, name), fullPage: true });
  await context.close();
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
  await signup.waitForTimeout(220);
  await signup.screenshot({ path: path.join(OUT_DIR, "auth-step-menu-desktop.png"), fullPage: true });
  await chooseWorkspaceStep(signup);
  await signup.waitForTimeout(180);

  await advanceWorkspace(signup);
  await signup.screenshot({ path: path.join(OUT_DIR, "auth-runtime-desktop.png"), fullPage: true });
  await signup.getByRole("button", { name: "Add connection" }).click();
  await signup.getByRole("button", { name: /VPS \/ SSH/ }).waitFor({ state: "visible" });
  await signup.waitForTimeout(260);
  await signup.screenshot({ path: path.join(OUT_DIR, "auth-runtime-child-menu-desktop.png"), fullPage: true });
  await signup.getByRole("button", { name: /VPS \/ SSH/ }).click();
  await signup.getByLabel("Host / Tailscale IP").waitFor({ state: "visible" });
  await signup.waitForTimeout(260);
  await signup.screenshot({ path: path.join(OUT_DIR, "auth-runtime-vps-desktop.png"), fullPage: true });
  await desktop.close();

  // Three portrait classes: compact, baseline and large/tall.
  await captureLogin(browser, 375, 667, "auth-login-mobile-compact.png");
  await captureLogin(browser, 390, 844, "auth-login-mobile.png");
  await captureLogin(browser, 430, 932, "auth-login-mobile-large.png");

  // Landscape catches accidental height assumptions and clipped controls.
  await captureLogin(browser, 844, 390, "auth-login-mobile-landscape.png");

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const flowMobile = await mobile.newPage();
  await flowMobile.goto(`${BASE_URL}/signup`);
  await settle(flowMobile);
  await assertMobileRenderingContract(flowMobile);
  await flowMobile.screenshot({ path: path.join(OUT_DIR, "auth-signup-mobile.png"), fullPage: true });

  await advanceAccount(flowMobile);
  await flowMobile.screenshot({ path: path.join(OUT_DIR, "auth-workspace-mobile.png"), fullPage: true });
  await flowMobile.getByRole("button", { name: /Onboarding step/ }).click();
  await flowMobile.getByRole("button", { name: /Account/ }).waitFor({ state: "visible" });
  await flowMobile.waitForTimeout(180);
  await flowMobile.screenshot({ path: path.join(OUT_DIR, "auth-step-menu-mobile.png"), fullPage: true });
  await chooseWorkspaceStep(flowMobile);
  await flowMobile.waitForTimeout(150);

  await advanceWorkspace(flowMobile);
  await flowMobile.screenshot({ path: path.join(OUT_DIR, "auth-runtime-mobile.png"), fullPage: true });
  await flowMobile.getByRole("button", { name: "Add connection" }).click();
  await flowMobile.getByRole("button", { name: /VPS \/ SSH/ }).waitFor({ state: "visible" });
  await flowMobile.waitForTimeout(220);
  await flowMobile.screenshot({ path: path.join(OUT_DIR, "auth-runtime-child-menu-mobile.png"), fullPage: true });
  await flowMobile.getByRole("button", { name: /VPS \/ SSH/ }).click();
  await flowMobile.getByLabel("Host / Tailscale IP").waitFor({ state: "visible" });
  await flowMobile.waitForTimeout(220);
  await flowMobile.screenshot({ path: path.join(OUT_DIR, "auth-runtime-vps-mobile.png"), fullPage: true });
  await mobile.close();

  await browser.close();
  console.log("Auth captures written to", OUT_DIR);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
