import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { services } from "../src/data/services.js";
import { portfolio } from "../src/data/portfolio.js";
import { blog } from "../src/data/blog.js";

// Generated from the same plain data files that drive the site's routes
// (src/data/services.js, portfolio.js, blog.js) so the sitemap can't fall out
// of sync with what's actually live, the way a hand-maintained one did before
// (see the SEO/AI-discoverability gap analysis this addresses). Runs before
// `vite build` (see package.json) so Vite copies the regenerated file from
// public/ into dist/ like any other static asset.
const OUT_PATH = fileURLToPath(new URL("../public/sitemap.xml", import.meta.url));
const SITE_URL = "https://blue-core.tech";
const today = new Date().toISOString().slice(0, 10);

const urls = [
  { loc: "/", changefreq: "monthly", priority: "1.0" },
  { loc: "/privacy" },
  { loc: "/terms" },
  { loc: "/support" },
  { loc: "/blog", changefreq: "weekly" },
  ...services.map((service) => ({ loc: `/services/${service.slug}` })),
  ...portfolio.map((item) => ({ loc: `/portfolio/${item.slug}` })),
  ...blog.map((post) => ({ loc: `/blog/${post.slug}`, lastmod: post.date })),
];

const body = urls
  .map(({ loc, changefreq, priority, lastmod }) => {
    const fields = [
      `    <loc>${SITE_URL}${loc}</loc>`,
      `    <lastmod>${lastmod ?? today}</lastmod>`,
      changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
      priority ? `    <priority>${priority}</priority>` : null,
    ].filter(Boolean);
    return `  <url>\n${fields.join("\n")}\n  </url>`;
  })
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

await writeFile(OUT_PATH, xml);
console.log(`Generated public/sitemap.xml with ${urls.length} URLs.`);
