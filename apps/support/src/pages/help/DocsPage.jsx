import { Link, useParams } from "react-router";
import { listPublicProducts, listPublishedArticles } from "../../lib/api.js";
import { groupByCategory } from "../../lib/kb.js";
import { usePageTitle } from "../../lib/usePageTitle.js";
import { useAsync } from "../../lib/useAsync.js";
import { ErrorBanner } from "../../components/ui.jsx";
import { ArticleLink, HelpPage, StillNeedHelp } from "./HelpLayout.jsx";

// /docs lists products; /docs/:productSlug lists that product's docs.
export default function DocsPage() {
  const { productSlug } = useParams();
  const { data: products, error } = useAsync(listPublicProducts);
  const product = products?.find((p) => p.slug === productSlug);
  usePageTitle(product ? `${product.name} docs` : "Product docs");
  const { data: docs } = useAsync(
    () => (product ? listPublishedArticles("doc", { productId: product.id }) : Promise.resolve([])),
    product?.id ?? null,
  );

  if (productSlug && products && !product) {
    return (
      <HelpPage title="Product not found">
        <Link to="/docs" className="text-[var(--bluecore-primary)] hover:underline">← All product docs</Link>
      </HelpPage>
    );
  }

  if (product) {
    return (
      <HelpPage title={`${product.name} documentation`} intro={product.description}>
        <Link to="/docs" className="mb-6 inline-block text-sm text-[var(--bluecore-primary)] hover:underline">← All products</Link>
        {docs?.length === 0 && <p className="text-[var(--bluecore-text-secondary)]">No published docs for this product yet.</p>}
        {groupByCategory(docs ?? []).map(([category, rows]) => (
          <section key={category} className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-[var(--bluecore-heading)]">{category}</h2>
            <div className="grid gap-3">
              {rows.map((d) => (
                <ArticleLink key={d.id} article={d} />
              ))}
            </div>
          </section>
        ))}
        <StillNeedHelp />
      </HelpPage>
    );
  }

  return (
    <HelpPage title="Product documentation" intro="Choose a product to see its guides and reference." wide>
      <ErrorBanner message={error} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(products ?? []).map((p) => (
          <Link
            key={p.id}
            to={`/docs/${p.slug}`}
            className="rounded-lg border border-[var(--bluecore-border)] p-5 hover:border-[var(--bluecore-border-strong)] hover:bg-slate-50"
          >
            <h2 className="font-semibold text-[var(--bluecore-heading)]">{p.name}</h2>
            {p.description && <p className="mt-1 text-sm text-[var(--bluecore-text-secondary)]">{p.description}</p>}
          </Link>
        ))}
      </div>
      <StillNeedHelp />
    </HelpPage>
  );
}
