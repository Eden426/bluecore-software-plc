import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const DIST_DIR = fileURLToPath(new URL("../dist", import.meta.url));
const PORT = 4173;

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
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

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
