// Builders for schema.org JSON-LD, generated from the same data files that
// drive the UI (src/data/services.js, portfolio.js, team.js, blog.js) so
// structured data can't silently drift out of sync with what the page
// actually shows. Consumed by <JsonLd> (src/components/JsonLd.jsx).

export const SITE_URL = "https://blue-core.tech";
export const ORG_ID = `${SITE_URL}/#organization`;

// Only real named individuals get Person markup — the two on-demand "pool"
// entries in team.js aren't people and shouldn't be represented as one.
const REAL_TEAM_ROLES = new Set([
  "Founder & Managing Director",
  "General Manager",
  "Lead Architect",
  "AI and Machine Learning Engineer",
]);

export function buildOrganization(team) {
  const employee = (team ?? [])
    .filter((member) => REAL_TEAM_ROLES.has(member.role))
    .map((member) => ({
      "@type": "Person",
      name: member.name,
      jobTitle: member.role,
      description: member.bio,
      worksFor: { "@id": ORG_ID },
    }));

  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: "Bluecore Software PLC",
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/favicon.png`,
    description:
      "Bluecore Software PLC builds secure, reliable, and scalable software solutions — system integration, web application development, AI solutions, custom software, cloud & DevOps, digitization support, and software design & consulting.",
    email: "team@blue-core.tech",
    telephone: "+251978939312",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Addis Ababa",
      addressCountry: "ET",
    },
    areaServed: "Worldwide",
    sameAs: [
      "https://facebook.com/bluecoresoftware",
      "https://t.me/bluecore_software_plc",
      "https://whatsapp.com/channel/0029Vb85HmjEFeXqcitfFW0K",
    ],
    ...(employee.length ? { employee } : {}),
  };
}

export function buildWebsite() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: "Bluecore Software PLC",
    publisher: { "@id": ORG_ID },
    inLanguage: "en",
  };
}

export function serviceUrl(slug) {
  return `${SITE_URL}/services/${slug}`;
}

export function portfolioUrl(slug) {
  return `${SITE_URL}/portfolio/${slug}`;
}

export function blogPostUrl(slug) {
  return `${SITE_URL}/blog/${slug}`;
}

export function buildServiceSchema(service) {
  return {
    "@type": "Service",
    "@id": `${serviceUrl(service.slug)}#service`,
    name: service.title,
    url: serviceUrl(service.slug),
    description: service.overview?.[0] ?? service.text,
    provider: { "@id": ORG_ID },
    areaServed: "Worldwide",
  };
}

export function buildServiceListGraph(services) {
  return services.map(buildServiceSchema);
}

export function buildPortfolioItemSchema(item) {
  return {
    "@type": "CreativeWork",
    "@id": `${portfolioUrl(item.slug)}#project`,
    name: item.title,
    url: portfolioUrl(item.slug),
    description: item.overview?.[0] ?? item.text,
    creator: { "@id": ORG_ID },
    about: item.type,
  };
}

export function buildPortfolioListGraph(portfolio) {
  return portfolio.map(buildPortfolioItemSchema);
}

export function buildBreadcrumb(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildBlogPosting(post) {
  return {
    "@type": "BlogPosting",
    "@id": `${blogPostUrl(post.slug)}#article`,
    headline: post.title,
    description: post.description,
    url: blogPostUrl(post.slug),
    datePublished: post.date,
    dateModified: post.date,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    mainEntityOfPage: blogPostUrl(post.slug),
    keywords: post.tags?.join(", "),
  };
}

export function buildBlogListGraph(posts) {
  return posts.map(buildBlogPosting);
}

export function buildGraph(nodes) {
  return { "@context": "https://schema.org", "@graph": nodes.filter(Boolean).flat() };
}
