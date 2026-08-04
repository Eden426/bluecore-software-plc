import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIST_DIR = fileURLToPath(new URL("../dist", import.meta.url));
const PORT = 4173;

// Vercel's and GitHub Actions' Linux build containers are missing the shared
// libraries (libnspr4, libnss3, ...) that plain `puppeteer`'s bundled Chromium
// needs, so on CI we launch @sparticuz/chromium instead — a Chromium build
// statically compiled for restricted serverless/CI Linux environments. Locally
// (e.g. macOS dev machines) that binary can't run at all, so we fall back to
// full `puppeteer`, which downloads a Chromium that works on the host OS.
async function launchBrowser() {
  if (process.env.CI || process.env.VERCEL) {
    const [{ default: chromium }, { default: puppeteer }] = await Promise.all([
      import("@sparticuz/chromium"),
      import("puppeteer-core"),
    ]);
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  }

  const { default: puppeteer } = await import("puppeteer");
  return puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".xml": "application/xml",
  ".txt": "text/plain",
};

function startStaticServer() {
  const server = createServer(async (req, res) => {
    const urlPath = req.url === "/" ? "/index.html" : req.url;
    const filePath = join(DIST_DIR, decodeURIComponent(urlPath.split("?")[0]));
    try {
      const data = await readFile(filePath);
      res.writeHead(200, {
        "Content-Type": MIME_TYPES[extname(filePath)] ?? "application/octet-stream",
      });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
  return new Promise((resolve) => {
    server.listen(PORT, () => resolve(server));
  });
}

async function main() {
  const server = await startStaticServer();
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle0" });
    await page.waitForSelector("#root section", { timeout: 15000 });

    const html = await page.evaluate(() => `<!doctype html>\n${document.documentElement.outerHTML}`);
    await writeFile(join(DIST_DIR, "index.html"), html);
    console.log("Prerendered dist/index.html with full page content.");
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error("Prerender failed:", err);
  process.exit(1);
});
