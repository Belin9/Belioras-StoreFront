/* Browser check: changing a role and removing access, end to end.
 *
 * The two controls that used to sit on the mock service. It reported success
 * either way, and the roster behind it was real, so the UI could look right and
 * the API still hold the old value — the exact failure this check is built to
 * catch, which is why every UI change here is confirmed against the API rather
 * than against the table it just edited.
 *
 * "Remove access" is a suspension, so the interesting part is what it does to
 * the person rather than to the row: the sessions they already hold have to die,
 * and a new sign-in has to be refused. Both are asserted with the member's own
 * access token, because "the table says Suspended" is not evidence of either.
 *
 * Requires the API on 5002, the client on 5174, and CHROME_PATH and
 * SEED_ADMIN_PASSWORD set. Every run creates one throwaway account, so the
 * roster grows by one each time.
 */
const puppeteer = require("puppeteer-core");
const BASE = "http://localhost:5174";
const API = "http://localhost:5002/api/v1";

// No default. This file is in the repository, so a password written here is a
// published credential for a super-admin — and this one is worse than most,
// because it is typed into a real browser rather than posted to a script that
// would at least log the attempt. Required, on every environment.
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@belioras.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";
if (!ADMIN_PASSWORD) {
  console.error("SEED_ADMIN_PASSWORD must be set (the admin this check signs in as).");
  process.exit(1);
}

// The fixture member's password. Not a credential to protect — the account is
// created and left for cleanup by this run — but a constant rather than a
// repeated literal, so the five uses below cannot drift apart.
const MEMBER_PASSWORD = "AccessTemp2026";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
function check(label, ok, extra = "") {
  if (ok) { pass++; console.log(`  PASS  ${label}`); }
  else { fail++; console.log(`  FAIL  ${label} ${extra}`); }
}

/** Calls the staff API directly, unwrapping the `{ data }` envelope. */
async function api(pathname, { method = "GET", body, token } = {}) {
  const res = await fetch(`${API}${pathname}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* an HTML error page is a failure, not a crash */ }
  return { status: res.status, data: json?.data ?? json, message: json?.error?.message };
}

const rosterMember = async (email, token) => {
  const { data } = await api("/admin/auth/staff", { token });
  return (data ?? []).find((u) => u.email === email);
};

(async () => {
  // --- Setup, over the API. The browser check below is about the controls, and
  // driving four dialogs to arrange a test fixture would be a slower way to
  // learn nothing.
  const admin = await api("/admin/auth/login", { method: "POST", body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  if (admin.status !== 200) {
    console.log(`  FAIL  admin sign-in for setup (${admin.status}: ${admin.message})`);
    process.exit(1);
  }
  const adminToken = admin.data.accessToken;
  const email = `access+${Date.now()}@example.com`;
  const created = await api("/admin/auth/staff", {
    method: "POST", token: adminToken,
    body: { name: "Priya Raman", email, role: "support", password: MEMBER_PASSWORD },
  });
  if (created.status !== 201) {
    console.log(`  FAIL  could not create the fixture (${created.status}: ${created.message})`);
    process.exit(1);
  }

  // A session for the member, taken before the suspension. This is the one that
  // has to stop working.
  const memberSession = await api("/admin/auth/login", { method: "POST", body: { email, password: MEMBER_PASSWORD } });
  const memberToken = memberSession.data?.accessToken;
  check("the new member can sign in before anything is taken away", memberSession.status === 200, `${memberSession.status}`);

  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message.slice(0, 120)));

  const text = () => page.evaluate(() => document.body.innerText);

  /** The table row for one member, so every assertion below is scoped to it. */
  const rowFor = (who) => page.evaluateHandle((needle) => {
    const row = [...document.querySelectorAll("tr")].find((r) => r.innerText.includes(needle));
    return row ?? null;
  }, who);
  const rowText = async (who) => (await (await rowFor(who)).evaluate((r) => r.innerText)).trim();

  /**
   * The open dialog's text, or "" if none is open.
   *
   * Two traps here, both of which this check fell into. A closed Modal stays in
   * the DOM — it is `aria-hidden` and `opacity-0`, not unmounted — so a plain
   * `querySelectorAll('[role="dialog"]')` returns every dialog this page has
   * ever opened, with their buttons still clickable by script. And
   * `document.body.innerText` includes all of them, so a regex can match text
   * belonging to a dialog that was dismissed long ago. `aria-hidden="false"` is
   * on the wrapper of the open one, so the open dialog is addressed through it.
   */
  const openDialog = () => page.evaluate(() => {
    const panel = document.querySelector('[aria-hidden="false"] [role="dialog"]');
    return panel ? panel.innerText : "";
  });

  /**
   * Clicks a button by its visible text, inside the open dialog only.
   *
   * Scoped on purpose. A row button and a dialog's confirm button routinely
   * carry the same label — "Remove access" is on both — so a page-wide search
   * clicks whichever came first in the document and reports a confirmation that
   * never happened. That is not hypothetical: an inverted condition in the
   * dialog got a green run here, and this is the check that would have caught
   * it.
   */
  const clickConfirm = async (label) => {
    const hit = await page.evaluate((l) => {
      const dialog = document.querySelector('[aria-hidden="false"] [role="dialog"]');
      const el = dialog && [...dialog.querySelectorAll("button")].find((b) => b.textContent.trim() === l);
      if (el) { el.click(); return true; }
      return false;
    }, label);
    if (!hit) throw new Error(`the open dialog has no button reading "${label}"`);
  };

  /**
   * The idle warning shares this page and will eventually open over the top of
   * whatever is being tested. Dismissed when it appears, so the dialog under
   * test is the only one the assertions can reach.
   */
  const dismissIdleWarning = async () => {
    await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "KEEP WORKING");
      b?.click();
    });
  };

  await page.goto(`${BASE}/atelier`, { waitUntil: "networkidle2" });
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.type('input[type="email"]', ADMIN_EMAIL);
  await page.type('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await sleep(3500);

  await page.goto(`${BASE}/dashboard/team`, { waitUntil: "networkidle2" });
  await sleep(2500);
  const found = await page.evaluate((e) => document.body.innerText.includes(e), email);
  check("the member is on the real roster", found);

  // --- 1. The role box is live, and what it does is real.
  const roleBox = await (await rowFor(email)).$("select");
  check("the role box is a usable control", Boolean(roleBox));

  await roleBox.select("finance");
  await sleep(800);
  await dismissIdleWarning();
  const roleAsk = await openDialog();
  check("changing a role asks first", /Make Priya Raman Finance\?/i.test(roleAsk), JSON.stringify(roleAsk.slice(0, 160)));
  check("and the dialog says what the role opens", /read-only|Money and reports/i.test(roleAsk), JSON.stringify(roleAsk.slice(0, 160)));
  await clickConfirm("Change role");
  await sleep(2500);

  const afterRole = await rowText(email);
  check("the row shows the new role", /Finance/i.test(afterRole), afterRole.replace(/\s+/g, " ").slice(0, 120));
  const onServer = await rosterMember(email, adminToken);
  check("and the API agrees — the old mock could not do this", onServer?.role === "finance", `server holds ${onServer?.role}`);

  // --- 2. Removing access suspends, and the toast says what actually happened.
  await (await rowFor(email)).evaluate((row) => {
    [...row.querySelectorAll("button")].find((b) => /remove access/i.test(b.textContent))?.click();
  });
  await sleep(800);
  await dismissIdleWarning();
  const suspendAsk = await openDialog();
  check("removing access asks first", /Remove Priya Raman's access\?/i.test(suspendAsk), JSON.stringify(suspendAsk.slice(0, 200)));
  check("and says the sessions end, not just the role", /signed out everywhere|cannot sign in again/i.test(suspendAsk), JSON.stringify(suspendAsk.slice(0, 200)));
  check("and the dialog is the destructive one", /Remove access/i.test(suspendAsk), JSON.stringify(suspendAsk.slice(0, 200)));
  await clickConfirm("Remove access");
  await sleep(2500);

  const suspendedRow = await rowText(email);
  check("the row is marked suspended", /Suspended/i.test(suspendedRow), suspendedRow.replace(/\s+/g, " ").slice(0, 140));
  const suspended = await rosterMember(email, adminToken);
  check("and the API holds a suspension", suspended?.status === "suspended", `server holds ${suspended?.status}`);
  check("which is dated, so it can be shown and audited", Boolean(suspended?.suspendedAt));
  check("the role is kept, not demoted", suspended?.role === "finance", `server holds ${suspended?.role}`);

  // --- 3. The part that matters: what it did to the member, not to the table.
  const staleSession = await api("/admin/auth/me", { token: memberToken });
  check("a session they already held is dead", staleSession.status === 401, `${staleSession.status}`);
  const refused = await api("/admin/auth/login", { method: "POST", body: { email, password: MEMBER_PASSWORD } });
  check("signing in again is refused", refused.status === 403, `${refused.status}`);
  check("with a reason, not a generic failure", /suspended/i.test(refused.message ?? ""), refused.message);

  const roleBoxAfter = await (await rowFor(email)).$("select");
  check("the role box is not offering changes for a suspended account", !roleBoxAfter);

  // The same refusal, seen by a person rather than by curl.
  const stranger = await browser.createBrowserContext();
  const strangerPage = await stranger.newPage();
  await strangerPage.setViewport({ width: 1200, height: 900 });
  strangerPage.on("pageerror", (e) => pageErrors.push(e.message.slice(0, 120)));
  await strangerPage.goto(`${BASE}/atelier`, { waitUntil: "networkidle2" });
  await strangerPage.waitForSelector('input[type="email"]', { timeout: 15000 });
  await strangerPage.type('input[type="email"]', email);
  await   strangerPage.type('input[type="password"]', MEMBER_PASSWORD);
  await strangerPage.click('button[type="submit"]');
  await sleep(3000);
  const atDoor = strangerPage.url().replace(BASE, "");
  check("a suspended member cannot get in through the door", !atDoor.startsWith("/dashboard"), atDoor);
  check("and is told why", /suspended/i.test(await strangerPage.evaluate(() => document.body.innerText)));
  await stranger.close();

  // --- 4. Undoing it, from the row it was done to.
  await (await rowFor(email)).evaluate((row) => {
    [...row.querySelectorAll("button")].find((b) => /restore access/i.test(b.textContent))?.click();
  });
  await sleep(800);
  await dismissIdleWarning();
  const restoreAsk = await openDialog();
  check("restoring is offered on the same row", /Give Priya Raman their access back\?/i.test(restoreAsk), JSON.stringify(restoreAsk.slice(0, 200)));
  check("and explains the password is untouched", /password is unchanged/i.test(restoreAsk), JSON.stringify(restoreAsk.slice(0, 200)));
  check("and is not the destructive one", /signed out everywhere/i.test(restoreAsk) === false, JSON.stringify(restoreAsk.slice(0, 200)));
  await clickConfirm("Restore access");
  await sleep(2500);

  const restoredRow = await rowText(email);
  check("the suspension is gone from the row", !/Suspended/i.test(restoredRow), restoredRow.replace(/\s+/g, " ").slice(0, 140));
  const restored = await rosterMember(email, adminToken);
  check("and gone from the API", restored?.status === "active", `server holds ${restored?.status}`);
  check("with no date left on it", restored?.suspendedAt === null, `${restored?.suspendedAt}`);

  const backIn = await api("/admin/auth/login", { method: "POST", body: { email, password: MEMBER_PASSWORD } });
  check("and they can sign in again", backIn.status === 200, `${backIn.status}`);
  // A fresh session, because the suspended one was revoked on purpose: this is
  // a re-login, not a resurrection of the old token.
  check("as a new session, not the revoked one", Boolean(backIn.data?.accessToken) && backIn.data.accessToken !== memberToken);

  const boxBack = await (await rowFor(email)).$("select");
  check("the role box is usable again", Boolean(boxBack));

  console.log(`\n  page errors: ${pageErrors.length ? JSON.stringify(pageErrors.slice(0, 3)) : "none"}`);
  console.log(`\n  ${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.log(`  FAIL  ${e.message}`);
  process.exit(1);
});
