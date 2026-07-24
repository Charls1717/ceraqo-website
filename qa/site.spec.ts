import { expect, test, type Page } from "@playwright/test";

/**
 * Journey QA over the production build: every chapter renders, the
 * scroll grammar works, the menu opens/navigates, the newsletter
 * validates, and no console errors leak — on desktop, mobile and
 * reduced-motion profiles. Screenshots land in qa/__screenshots__ as
 * the visual record.
 */

const shots = "qa/__screenshots__";

async function settle(page: Page, ms = 900) {
  await page.waitForTimeout(ms);
}

test("full scroll journey renders every chapter", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    // Media 404s would surface here too — treat any error as a failure.
    if (m.type() === "error") errors.push(m.text());
  });

  await page.goto("/");
  await settle(page, 1600);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("SURFACE");
  await page.screenshot({ path: `${shots}/${info.project.name}-01-hero.png` });

  const stops: Array<[string, string]> = [
    ["science", "02-science"],
    ["science-pillars", "03-pillars"],
    ["application", "04-application"],
    ["application-kit", "05-kit"],
    ["result", "06-result"],
    ["result-maintenance", "07-maintenance"],
    ["shop", "08-footer"],
  ];

  for (const [id, name] of stops) {
    await page.evaluate((anchor) => {
      document.getElementById(anchor)?.scrollIntoView({ behavior: "auto" });
    }, id);
    await settle(page);
    await page.screenshot({ path: `${shots}/${info.project.name}-${name}.png` });
  }

  // Verbatim claims present
  await expect(page.getByText("One kit protects up to two large vehicles", { exact: false })).toBeVisible();
  await expect(page.getByText("Made in Germany", { exact: false }).first()).toBeVisible();

  expect(errors, `console/page errors:\n${errors.join("\n")}`).toHaveLength(0);
});

test("fullscreen menu opens, navigates, closes", async ({ page }, info) => {
  await page.goto("/");
  await settle(page);

  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "Site menu" });
  await expect(menu).toBeVisible();
  await settle(page, 1100);
  await page.screenshot({ path: `${shots}/${info.project.name}-09-menu.png` });

  await menu.getByRole("button", { name: /chapter 02/i }).click();
  await expect(menu).toBeHidden();
  await settle(page, 2200);
  const y = await page.evaluate(() => window.scrollY);
  expect(y).toBeGreaterThan(500);

  // Escape path
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("dialog", { name: "Site menu" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Site menu" })).toBeHidden();
});

test("newsletter capture validates and confirms", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.getElementById("shop")?.scrollIntoView({ behavior: "auto" }));
  await settle(page);

  const input = page.getByLabel("Email address");
  // Short viewports leave the form below the fold in its pre-reveal
  // state — bring it on stage so its scroll entrance fires.
  await input.scrollIntoViewIfNeeded();
  await settle(page, 700);
  await input.fill("not-an-email");
  await page.getByRole("button", { name: /join/i }).click();
  // p[role=alert] specifically — Next.js renders its own route-announcer alert
  await expect(page.locator("p[role='alert']")).toContainText("valid email");

  await input.fill("qa@ceraqo.example");
  await page.getByRole("button", { name: /join/i }).click();
  await expect(page.getByRole("status")).toContainText("on the list");

  const stored = await page.evaluate(() => localStorage.getItem("ceraqo-waitlist"));
  expect(stored).toContain("qa@ceraqo.example");
});
