// Renders one <script type="application/ld+json"> from a plain object
// (typically produced by src/lib/structuredData.js's builders). JSON.stringify
// output is safe here: schema.org data is built from our own data files, not
// user input, so there's no injection surface to escape against.
export default function JsonLd({ data }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
