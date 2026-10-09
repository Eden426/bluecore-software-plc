import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { services } from "../src/data/services.js";
import { portfolio } from "../src/data/portfolio.js";
import { blog } from "../src/data/blog.js";

const DIST_DIR = fileURLToPath(new URL("../dist", import.meta.url));
const PORT = 4173;

// Every route that should show real content to a non-JS-executing crawler.
// Static routes are listed by hand; the three detail-page kinds are derived
// from the same plain data files (src/data/services.js, portfolio.js,
// blog.js) that drive their section/route on the live site, so adding an
// entry there automatically gets a prerendered page here too. (team.js is
// deliberately not imported here — it pulls in .webp/.svg asset imports a
// plain Node script can't resolve; it isn't needed since team members don't
// have their own routes.)
const ROUTES = [
  "/",
  "/privacy",
  "/terms",
  "/support",
  "/blog",
  ...services.map((service) => `/services/${service.slug}`),
  ...portfolio.map((item) => `/portfolio/${item.slug}`),
  ...blog.map((post) => `/blog/${post.slug}`),
];

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

// Mirrors vercel.json's own rewrite ("/((?!.*\.).*)" -> "/index.html"): any
// request path with no dot (i.e. not an asset request) that doesn't match a
// file on disk falls back to dist/index.html, same as production. Without
// this, every route beyond "/" 404s here even though it resolves fine on
// Vercel, because this server has no rewrite of its own to fall back on.
async function readWithSpaFallback(urlPath) {
  const filePath = join(DIST_DIR, decodeURIComponent(urlPath.split("?")[0]));
  try {
    return { data: await readFile(filePath), filePath };
  } catch {
    if (extname(filePath)) throw new Error(`Not found: ${urlPath}`);
    const fallbackPath = join(DIST_DIR, "index.html");
    return { data: await readFile(fallbackPath), filePath: fallbackPath };
  }
}

function startStaticServer() {
  const server = createServer(async (req, res) => {
    const urlPath = req.url === "/" ? "/index.html" : req.url;
    try {
      const { data, filePath } = await readWithSpaFallback(urlPath);
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

// dist/index.html itself is served by Vercel for "/" and, via the SPA
// rewrite in vercel.json, as the fallback for any path that isn't an exact
// static file — so it still has to be the general-purpose (client-routed)
// shell. Every other route gets its own dist/<route>/index.html, which
// Vercel's filesystem routing serves in preference to that rewrite,
// matching how vercel.json resolves a static file over a rewrite.
async function renderRoute(page, route) {
  await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: "networkidle0" });
  await page.waitForFunction(() => (document.querySelector("#root")?.childElementCount ?? 0) > 0, {
    timeout: 15000,
  });

  const html = await page.evaluate(() => `<!doctype html>\n${document.documentElement.outerHTML}`);
  const outPath = route === "/" ? join(DIST_DIR, "index.html") : join(DIST_DIR, route.slice(1), "index.html");
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, html);
}

async function main() {
  const server = await startStaticServer();
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    for (const route of ROUTES) {
      await renderRoute(page, route);
      console.log(`Prerendered ${route === "/" ? "dist/index.html" : `dist${route}/index.html`}`);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error("Prerender failed:", err);
  process.exit(1);
});
