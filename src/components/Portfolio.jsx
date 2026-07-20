import { ArrowUpRight } from "lucide-react";

import { portfolio } from "../data/portfolio";
import business from "../assets/business.webp";
import mobile from "../assets/mobile.webp";
import computer from "../assets/computer.webp";

const portfolioImages = {
  "Web App": business,
  "Mobile App": mobile,
  Digitization: computer,
};

export default function Portfolio() {
  const slidingPortfolio = [...portfolio, ...portfolio];

  return (
    <section
      id="portfolio"
      aria-labelledby="portfolio-heading"
      className="overflow-hidden bg-white py-14 dark:bg-[#09090B] sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#103759] dark:text-[#93C5FD] sm:text-sm">
              Our Portfolio
            </p>

            <h2
              id="portfolio-heading"
              className="mt-3 text-balance text-3xl font-black leading-tight text-[#06243F] dark:text-[#FAFAFA] sm:mt-4 sm:text-4xl lg:text-5xl"
            >
              Practical Digital Solutions Built for Real Business Needs
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-[#475569] dark:text-[#FAFAFA]/75 sm:text-lg">
              Explore selected solution concepts that demonstrate how we
              approach business systems, mobile products, and digital
              transformation projects.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#contact"
              className="inline-flex min-h-12 w-fit shrink-0 items-center justify-center gap-2 rounded-xl border border-[#103759]/20 bg-[#EAF3FF] px-5 py-3 text-sm font-bold text-[#103759] transition-all duration-200 hover:border-[#103759]/40 hover:bg-[#103759] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1976D2] focus-visible:ring-offset-2 dark:border-white/15 dark:bg-white/[0.06] dark:text-[#93C5FD] dark:hover:border-[#8B5E3C]/50 dark:hover:bg-[#8B5E3C] dark:hover:text-white sm:text-base"
            >
              Start Your Project
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <div
        className="portfolio-marquee mt-10 overflow-hidden md:mt-12"
        role="region"
        aria-label="Bluecore portfolio projects"
      >
        <div className="portfolio-marquee-track flex w-max gap-5 pr-5 sm:gap-6 sm:pr-6">
          {slidingPortfolio.map((item, index) => {
            const image = portfolioImages[item.type] ?? business;
            const isDuplicate = index >= portfolio.length;

            return (
              <article
                key={`${item.type}-${item.title}-${index}`}
                aria-hidden={isDuplicate ? "true" : undefined}
                className="group flex w-[82vw] max-w-[360px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#DCE5EF] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.06)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-[#103759]/30 hover:shadow-[0_20px_48px_rgba(15,23,42,0.11)] sm:w-[340px] lg:w-[380px] dark:border-white/10 dark:bg-[#161616] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] dark:hover:border-[#8B5E3C]/35"
              >
                <div className="relative aspect-[16/8] overflow-hidden bg-[#EEF4FB] dark:bg-[#111827]">
                  <img
                    src={image}
                    alt={`${item.title} ${item.type} concept preview`}
                    loading="lazy"
                    decoding="async"
                    width="1774"
                    height="887"
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#06243F]/20 via-transparent to-transparent opacity-40 dark:from-black/40"
                    aria-hidden="true"
                  />
                </div>

                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full border border-[#103759]/15 bg-[#EAF3FF] px-3 py-1 text-xs font-bold text-[#103759] dark:border-white/10 dark:bg-white/[0.07] dark:text-[#93C5FD]">
                      {item.type}
                    </span>
                    <span className="inline-flex rounded-full bg-[#F4EEE8] px-3 py-1 text-xs font-semibold text-[#70492F] dark:bg-[#8B5E3C]/15 dark:text-[#D6B48D]">
                      Concept Project
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-black leading-snug text-[#06243F] dark:text-[#FAFAFA] sm:text-[1.35rem]">
                    {item.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-[#475569] dark:text-[#FAFAFA]/75 sm:text-base">
                    {item.text}
                  </p>

                  <a
                    href="#contact"
                    tabIndex={isDuplicate ? -1 : 0}
                    aria-label={`Discuss a project similar to ${item.title}`}
                    className="mt-4 inline-flex w-fit items-center gap-2 rounded-md text-sm font-bold text-[#103759] transition-colors duration-200 hover:text-[#0A3A84] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1976D2] focus-visible:ring-offset-2 dark:text-[#93C5FD] dark:hover:text-[#D6B48D]"
                  >
                    Discuss a Similar Project
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
