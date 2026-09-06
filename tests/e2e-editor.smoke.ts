// E2E smoke test memakai Chrome/Chromium lokal + dev server yang sudah jalan.
// Jalankan:  npm run dev  (di terminal lain)
//            node --experimental-strip-types ./tests/e2e-editor.smoke.ts
// Skrip ini TIDAK masuk `npm test` — hanya verifikasi manual.
import puppeteer from "puppeteer-core";

const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
const KIND = process.env.E2E_KIND ?? "writing";

const executablePath = process.env.CHROME_PATH ?? "/opt/homebrew/bin/chromium";

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900 });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${String(e)}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

const fail = (msg: string): never => {
  console.error(`SMOKE FAIL: ${msg}`);
  if (errors.length) console.error(errors.join("\n"));
  process.exitCode = 1;
  throw new Error(msg);
};

await page.goto(`${BASE}/admin/${KIND}/new`, { waitUntil: "networkidle0" });
await page
  .waitForSelector(".cms-rich-editor", { timeout: 20000 })
  .catch(() => fail("editor tidak muncul"));

const has = async (sel: string) => (await page.$(sel)) !== null;
if (!(await has(".editor-toolbar"))) fail("toolbar tidak ada");
if (!(await has(".editor-statusbar"))) fail("status bar tidak ada");

// 1. Slash menu muncul saat mengetik "/" di blok kosong.
await page.click(".cms-rich-editor");
await page.keyboard.type("/tab");
await page
  .waitForSelector(".slash-menu", { timeout: 5000 })
  .catch(() => fail("slash menu tidak muncul setelah '/'"));
const slashItems = await page.$$(".slash-menu [role='option']");
console.log(`slash options for "tab": ${slashItems.length}`);
await page.keyboard.press("Escape");

// 2. Heading via slash command.
await page.keyboard.press("Enter");
await page.keyboard.type("/h2");
await page.waitForSelector(".slash-menu", { timeout: 5000 });
await page.keyboard.press("Enter");
await page.keyboard.type("Judul Smoke Test");
const h2 = await page.$eval(".cms-rich-editor h2", (el) => el.textContent);
if (h2 !== "Judul Smoke Test") fail(`h2 tidak terbentuk: ${h2}`);

// 3. Markdown shortcut: "- " menjadi bullet list.
await page.keyboard.press("Enter");
await page.keyboard.type("- item satu");
const li = await page.$eval(".cms-rich-editor li", (el) => el.textContent);
if (li !== "item satu") fail(`bullet shortcut gagal: ${li}`);

// 4. Task list via slash.
await page.keyboard.press("Enter");
await page.keyboard.type("/tugas");
await page.waitForSelector(".slash-menu", { timeout: 5000 });
await page.keyboard.press("Enter");
const task = await page.$(".cms-rich-editor ul[data-type='taskList']");
if (!task) fail("task list tidak terbentuk");

// 5. Tabel via slash.
await page.keyboard.press("Escape");
await page.keyboard.press("Enter");
await page.keyboard.type("/tabel");
await page.waitForSelector(".slash-menu", { timeout: 5000 });
await page.keyboard.press("Enter");
const table = await page.$(".cms-rich-editor table");
if (!table) fail("tabel tidak terbentuk");
if (!(await has(".editor-toolbar.table-bar"))) fail("table bar tidak muncul");

// 6. Bubble menu muncul saat seleksi teks.
await page.evaluate(() => {
  const h = document.querySelector(".cms-rich-editor h2");
  if (!h?.firstChild) throw new Error("h2 kosong");
  const range = document.createRange();
  range.selectNodeContents(h.firstChild);
  const sel = getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
});
await page
  .waitForSelector(".bubble-menu", { timeout: 5000 })
  .catch(() => fail("bubble menu tidak muncul saat seleksi"));

// 7. Word count terisi.
const status = await page.$eval(".editor-statusbar", (el) => el.textContent);
if (!/kata/.test(status ?? "")) fail(`status bar kosong: ${status}`);
console.log(`status: ${status?.trim()}`);

// 8. Mode markdown tetap sinkron.
await page.click(".editor-toolbar button:nth-child(2)");
const md = await page.$eval(".markdown-input", (el) =>
  (el as HTMLTextAreaElement).value.slice(0, 120),
);
if (!md.includes("Judul Smoke Test")) fail("markdown tidak sinkron");
console.log(`markdown awal: ${JSON.stringify(md)}`);

// 9. Mode fokus: overlay muncul, Escape mengembalikan tampilan normal.
await page.click(".editor-toolbar button:nth-child(1)");
// `::-p-text(...)` adalah selektor teks milik Puppeteer. Sintaks Playwright
// ("text=...") diurai sebagai selektor CSS dan langsung melempar.
await page.click("::-p-text(Mode fokus)");
await page
  .waitForSelector(".document-editor.focus-mode .focus-overlay-bar", {
    timeout: 5000,
  })
  .catch(() => fail("mode fokus tidak aktif"));
// Editor tidak boleh di-mount ulang saat masuk mode fokus: kalau riwayat undo
// hilang, tombol undo ikut mati.
const undoAlive = await page.$eval(
  ".editor-toolbar button[aria-label='Undo']",
  (el) => !(el as HTMLButtonElement).disabled,
);
if (!undoAlive) fail("riwayat undo hilang saat masuk mode fokus");
await page.keyboard.press("Escape");
await page
  .waitForSelector(".document-editor.focus-mode", {
    hidden: true,
    timeout: 5000,
  })
  .catch(() => fail("Escape tidak keluar dari mode fokus"));

if (errors.length) {
  console.error("JS errors:\n" + errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("SMOKE OK");
}
await browser.close();
