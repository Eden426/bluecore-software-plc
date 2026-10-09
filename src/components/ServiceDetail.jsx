import { CheckCircle2 } from "lucide-react";
import JsonLd from "./JsonLd";
import { serviceIcons } from "../data/serviceIcons";
import {
  SITE_URL,
  buildBreadcrumb,
  buildGraph,
  buildServiceSchema,
} from "../lib/structuredData";

export default function ServiceDetail({ service }) {
  const { title, text, overview = [], included = [] } = service;
  const ServiceIcon = serviceIcons[service.slug];

  const breadcrumb = buildBreadcrumb([
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Services", url: `${SITE_URL}/#services` },
    { name: title, url: `${SITE_URL}/services/${service.slug}` },
  ]);

  return (
    <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
      <JsonLd data={buildGraph([buildServiceSchema(service), breadcrumb])} />

      <nav aria-label="Breadcrumb" className="text-sm text-slate-500 dark:text-white/60">
        <a href="/" className="underline decoration-transparent hover:decoration-current">Home</a>
        <span aria-hidden="true"> / </span>
        <a href="/#services" className="underline decoration-transparent hover:decoration-current">Services</a>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{title}</span>
      </nav>

      <p className="mt-6 text-sm font-bold uppercase tracking-widest text-[#8B5E3C]">Our Services</p>
      <div className="mt-3 flex items-center gap-4">
        {ServiceIcon ? (
          <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#103759]/20 bg-[#EAF3FF] text-[#06243F] dark:border-2 dark:border-[#8B5E3C]/55 dark:bg-[#141416] dark:text-[#FAFAFA]">
            <ServiceIcon className="h-8 w-8" />
          </div>
        ) : null}
        <h1 className="text-3xl font-black text-[#06243f] dark:text-white sm:text-5xl">{title}</h1>
      </div>

      <p className="mt-6 text-lg leading-8 text-slate-700 dark:text-white/80">{text}</p>

      <div className="mt-8 space-y-5 text-base leading-8 text-slate-700 dark:text-white/80">
        {overview.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>

      {included.length ? (
        <div className="mt-10">
          <h2 className="text-xl font-black text-[#06243f] dark:text-white">What's included</h2>
          <ul className="mt-4 space-y-3">
            {included.map((line) => (
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
          Discuss This Service
        </a>
        <a className="font-bold text-[#154187] underline dark:text-[#93C5FD]" href="/#services">
          Back to all services
        </a>
      </div>
    </article>
  );
}
