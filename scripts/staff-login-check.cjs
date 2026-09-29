const puppeteer = require("puppeteer-core");

const BASE = process.env.BASE_URL ?? "http://localhost:5173";
const EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@belioras.com";
// No default, same as the server's seed script: a password written in a
// committed file is a published credential, and this one is typed into a live
// sign-in form. Required on every environment.
const PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";
// The other script reads this from the environment; it was hardcoded here, so
// the check only ran on one machine and broke silently on any other.
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

if (!PASSWORD) {
  console.error("SEED_ADMIN_PASSWORD must be set (the admin this check signs in as).");
  process.exit(1);
}

const log = (label, value) => console.log(`  ${label}: ${value}`);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  const api = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`[console] ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
  page.on("response", async (r) => {
    const u = new URL(r.url());
    if (u.pathname.startsWith("/api/")) api.push(`${r.status()} ${r.request().method()} ${u.pathname}`);
  });

  // Scoped to an /api/v1 URL on purpose: the refresh cookie carries
  // Path=/api/v1, and puppeteer's cookies() filters by the current page's path,
  // so reading it while on /dashboard reports an empty jar for a cookie the
  // browser is in fact holding and sending.
  const cookies = () =>
    page
      .cookies(`${BASE}/api/v1/admin/auth/me`)
      .then((cs) => cs.filter((c) => c.name.startsWith("belioras_refresh")).map((c) => `${c.name} httpOnly=${c.httpOnly} path=${c.path}`));
  const storage = () => page.evaluate(() => ({
    staffSession: window.localStorage.getItem("belioras:auth:staff"),
    anyToken: Object.keys(window.localStorage).filter((k) => /auth|token|session/i.test(k)),
  }));
  const at = (url) => page.evaluate(() => window.location.pathname + window.location.search);
  const body = () => page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 110));

  // Sign-in is rate limited (10 attempts per 15 minutes, per IP). Repeated runs
  // of this script — or a run while someone was testing the limiter by hand —
  // arrive at a 429, and the symptom downstream is a Puppeteer timeout waiting
  // for a form that will never appear. Say so up front instead.
  const preflight = await fetch(`${BASE}/api/v1/admin/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (preflight.status === 429) {
    const wait = Number(preflight.headers.get("ratelimit-reset") ?? 0);
    console.error(
      `\n  Sign-in is rate limited from this IP (10 per 15 minutes). ` +
        `Try again in about ${Math.ceil(wait / 60)} minute(s).\n`,
    );
    await browser.close();
    process.exit(2);
  }

  console.log("\n=== 1. /dashboard while signed out (expect bounce to /atelier) ===");
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle0" });
  log("landed on", await at());
  log("page", await body());

  console.log("\n=== 2. wrong password (expect uniform 401 message) ===");
  await page.type("#atelier-email", EMAIL);
  await page.type("#atelier-password", "DefinitelyWrong1");
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => document.querySelector('[role="alert"]')?.textContent, { timeout: 8000 });
  log("error shown", await page.evaluate(() => document.querySelector('[role="alert"]').textContent));
  log("still on", await at());

  console.log("\n=== 3. correct password (expect redirect into the dashboard) ===");
  await page.evaluate(() => {
    document.querySelector("#atelier-password").value = "";
  });
  await page.click("#atelier-password", { clickCount: 3 });
  await page.type("#atelier-password", PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.pathname.startsWith("/dashboard"), { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 1500));
  log("landed on", await at());
  log("page", await body());
  log("refresh cookie", (await cookies()).join(", ") || "(none)");
  log("localStorage", JSON.stringify(await storage()));

  console.log("\n=== 4. hard reload of /dashboard (session must survive via cookie) ===");
  api.length = 0;
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1500));
  log("landed on", await at());
  log("page", await body());
  log("api calls", api.join(" | ") || "(none)");
  log("localStorage", JSON.stringify(await storage()));

  console.log("\n=== 5. /atelier while signed in (expect redirect, not the form) ===");
  await page.goto(`${BASE}/atelier`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 800));
  log("landed on", await at());

  console.log("\n=== 6. sign out ===");
  api.length = 0;
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));
  const out = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button,a")].find((n) => /sign out|log out/i.test(n.textContent));
    if (btn) btn.click();
    return btn ? btn.textContent.trim() : null;
  });
  log("clicked", out ?? "(no sign-out control found)");
  await new Promise((r) => setTimeout(r, 1500));
  log("landed on", await at());
  log("api calls", api.join(" | ") || "(none)");
  log("refresh cookie", (await cookies()).join(", ") || "(none)");

  console.log("\n=== 7. /dashboard after sign out (expect bounce to /atelier) ===");
  api.length = 0;
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));
  log("landed on", await at());
  log("page", await body());

  console.log(`\n=== console/page errors: ${errors.length ? "\n  " + [...new Set(errors)].join("\n  ") : "(none)"} ===`);
  await browser.close();
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
