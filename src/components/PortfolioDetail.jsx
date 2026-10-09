import { CheckCircle2 } from "lucide-react";
import JsonLd from "./JsonLd";
import {
  SITE_URL,
  buildBreadcrumb,
  buildGraph,
  buildPortfolioItemSchema,
} from "../lib/structuredData";

export default function PortfolioDetail({ item, image }) {
  const { title, type, text, overview = [], highlights = [] } = item;

  const breadcrumb = buildBreadcrumb([
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Portfolio", url: `${SITE_URL}/#portfolio` },
    { name: title, url: `${SITE_URL}/portfolio/${item.slug}` },
  ]);

  return (
    <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
      <JsonLd data={buildGraph([buildPortfolioItemSchema(item), breadcrumb])} />

      <nav aria-label="Breadcrumb" className="text-sm text-slate-500 dark:text-white/60">
        <a href="/" className="underline decoration-transparent hover:decoration-current">Home</a>
        <span aria-hidden="true"> / </span>
        <a href="/#portfolio" className="underline decoration-transparent hover:decoration-current">Portfolio</a>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{title}</span>
      </nav>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="inline-flex rounded-full border border-[#103759]/15 bg-[#EAF3FF] px-3 py-1 text-xs font-bold text-[#103759] dark:border-white/10 dark:bg-white/[0.07] dark:text-[#93C5FD]">
          {type}
        </span>
        <span className="inline-flex rounded-full bg-[#F4EEE8] px-3 py-1 text-xs font-semibold text-[#70492F] dark:bg-[#8B5E3C]/15 dark:text-[#D6B48D]">
          Concept Project
        </span>
      </div>

      <h1 className="mt-4 text-3xl font-black text-[#06243f] dark:text-white sm:text-5xl">{title}</h1>
      <p className="mt-6 text-lg leading-8 text-slate-700 dark:text-white/80">{text}</p>

      {image ? (
        <img
          src={image}
          alt={`${title} ${type} concept preview`}
          loading="lazy"
          decoding="async"
          width="1774"
          height="887"
          className="mt-8 aspect-[16/8] w-full rounded-2xl border border-[#DCE5EF] object-cover dark:border-white/10"
        />
      ) : null}

      <div className="mt-8 space-y-5 text-base leading-8 text-slate-700 dark:text-white/80">
        {overview.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>

      {highlights.length ? (
        <div className="mt-10">
          <h2 className="text-xl font-black text-[#06243f] dark:text-white">Highlights</h2>
          <ul className="mt-4 space-y-3">
            {highlights.map((line) => (
              <li key={line} className="flex items-start gap-3 text-base leading-7 text-slate-700 dark:text-white/80">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#103759] dark:text-[#93C5FD]" aria-hidden="true" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <a
          href="/#contact"
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#8B5E3C] px-6 py-3 font-bold text-white transition-colors hover:bg-[#70492F]"
        >
          Discuss a Similar Project
        </a>
        <a className="font-bold text-[#154187] underline dark:text-[#93C5FD]" href="/#portfolio">
          Back to all projects
        </a>
      </div>
    </article>
  );
}
