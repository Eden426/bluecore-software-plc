export const KB_TYPES = {
  article: { label: "Knowledge base", singular: "Article", path: "/kb" },
  faq: { label: "FAQs", singular: "FAQ", path: "/faq" },
  doc: { label: "Product docs", singular: "Doc", path: "/docs" },
  update: { label: "Updates", singular: "Update", path: "/updates" },
};

// Group rows by their `category` field, keeping first-seen order.
export function groupByCategory(rows, fallback = "General") {
  const groups = new Map();
  for (const row of rows) {
    const key = row.category || fallback;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.entries()];
}

// search_kb() marks matches with << >>; split into plain/highlighted parts so
// they can be rendered without dangerouslySetInnerHTML.
export function splitHighlights(snippet) {
  return stripMarkdown(snippet ?? "").split(/(<<.*?>>)/g).filter(Boolean).map((part) =>
    part.startsWith("<<") && part.endsWith(">>") ? { text: part.slice(2, -2), match: true } : { text: part, match: false },
  );
}

export function formatDate(value) {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(value)) : "";
}

// Snippets come from the raw markdown body; drop the syntax so they read as prose.
export function stripMarkdown(text) {
  return text
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__|`)/g, "")
    .replace(/(^|\s)#{1,6}\s+/g, "$1")
    .replace(/(^|\s)[*_](\S)/g, "$1$2")
    .replace(/(\S)[*_](\s|$)/g, "$1$2");
}
