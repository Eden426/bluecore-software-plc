import JsonLd from "./JsonLd";
import { SITE_URL, buildBlogPosting, buildBreadcrumb, buildGraph } from "../lib/structuredData";

const dateFormatter = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

export default function BlogPost({ post }) {
  const breadcrumb = buildBreadcrumb([
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Blog", url: `${SITE_URL}/blog` },
    { name: post.title, url: `${SITE_URL}/blog/${post.slug}` },
  ]);

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <JsonLd data={buildGraph([buildBlogPosting(post), breadcrumb])} />

      <nav aria-label="Breadcrumb" className="text-sm text-slate-500 dark:text-white/60">
        <a href="/" className="underline decoration-transparent hover:decoration-current">Home</a>
        <span aria-hidden="true"> / </span>
        <a href="/blog" className="underline decoration-transparent hover:decoration-current">Blog</a>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{post.title}</span>
      </nav>

      <p className="mt-6 text-sm font-bold uppercase tracking-widest text-[#8B5E3C]">
        <time dateTime={post.date}>{dateFormatter.format(new Date(post.date))}</time>
      </p>
      <h1 className="mt-3 text-3xl font-black text-[#06243f] dark:text-white sm:text-5xl">{post.title}</h1>
      <p className="mt-4 text-lg leading-8 text-slate-700 dark:text-white/80">{post.description}</p>

      {post.tags?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex rounded-full border border-[#103759]/15 bg-[#EAF3FF] px-3 py-1 text-xs font-bold text-[#103759] dark:border-white/10 dark:bg-white/[0.07] dark:text-[#93C5FD]"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-10 space-y-8 border-t border-[#DCE5EF] pt-8 dark:border-white/10">
        {post.body.map((section) => (
          <div key={section.heading}>
            <h2 className="text-xl font-black text-[#06243f] dark:text-white">{section.heading}</h2>
            <div className="mt-3 space-y-4 text-base leading-8 text-slate-700 dark:text-white/80">
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <a
          href="/#contact"
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#8B5E3C] px-6 py-3 font-bold text-white transition-colors hover:bg-[#70492F]"
        >
          Talk to Bluecore
        </a>
        <a className="font-bold text-[#154187] underline dark:text-[#93C5FD]" href="/blog">
          Back to the blog
        </a>
      </div>
    </article>
  );
}
