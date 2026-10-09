import { ArrowUpRight } from "lucide-react";
import { blog } from "../data/blog";
import JsonLd from "./JsonLd";
import { SITE_URL, buildBlogListGraph, buildBreadcrumb, buildGraph } from "../lib/structuredData";

const dateFormatter = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

export default function BlogIndex() {
  const posts = [...blog].sort((a, b) => (a.date < b.date ? 1 : -1));
  const breadcrumb = buildBreadcrumb([
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Blog", url: `${SITE_URL}/blog` },
  ]);

  return (
    <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
      <JsonLd data={buildGraph([buildBlogListGraph(posts), breadcrumb])} />

      <nav aria-label="Breadcrumb" className="text-sm text-slate-500 dark:text-white/60">
        <a href="/" className="underline decoration-transparent hover:decoration-current">Home</a>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Blog</span>
      </nav>

      <p className="mt-6 text-sm font-bold uppercase tracking-widest text-[#8B5E3C]">Bluecore Software PLC</p>
      <h1 className="mt-3 text-3xl font-black text-[#06243f] dark:text-white sm:text-5xl">Notes on Software, AI &amp; Digital Transformation</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-700 dark:text-white/80">
        Practical thinking from the Bluecore team on building software, adopting AI, and modernizing manual processes.
      </p>

      <div className="mt-10 space-y-8 border-t border-[#DCE5EF] pt-8 dark:border-white/10">
        {posts.map((post) => (
          <a
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group block rounded-2xl border border-[#DCE5EF] bg-white p-5 transition-colors hover:border-[#103759]/30 dark:border-white/10 dark:bg-[#161616] dark:hover:border-[#8B5E3C]/40 sm:p-6"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-[#103759] dark:text-[#93C5FD]">
              <time dateTime={post.date}>{dateFormatter.format(new Date(post.date))}</time>
            </p>
            <h2 className="mt-2 text-xl font-black text-[#06243f] dark:text-white sm:text-2xl">{post.title}</h2>
            <p className="mt-2 text-base leading-7 text-slate-700 dark:text-white/80">{post.description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#103759] dark:text-[#93C5FD]">
              Read the article
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            </span>
          </a>
        ))}
      </div>

      <a className="mt-10 inline-flex font-bold text-[#154187] underline dark:text-[#93C5FD]" href="/">
        Return to the website
      </a>
    </article>
  );
}
