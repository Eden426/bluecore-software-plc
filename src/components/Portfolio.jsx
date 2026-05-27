import { portfolio } from "../data/portfolio";
import business from "../assets/business.png";
import mobile from "../assets/mobile.png";
import computer from "../assets/computer.png";

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
      className="mx-auto min-w-0 max-w-7xl overflow-hidden px-3 py-12 text-[#0f172a] sm:px-5 sm:py-16 lg:py-20 dark:text-[#FAFAFA]"
    >
      {/* Local animation style — keeps this component copy-paste ready */}
      <style>
        {`
          @keyframes portfolio-horizontal-slide {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }

          .portfolio-horizontal-track {
            animation: portfolio-horizontal-slide 62s linear infinite;
          }

          .portfolio-horizontal-track:hover {
            animation-play-state: paused;
          }

          @media (prefers-reduced-motion: reduce) {
            .portfolio-horizontal-track {
              animation: none;
            }
          }
        `}
      </style>

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-[#8B5E3C] sm:text-sm">
            Our Portfolio
          </p>

          <h2 className="mt-3 text-balance text-2xl font-black sm:mt-4 sm:text-3xl md:text-4xl lg:text-5xl dark:text-[#FAFAFA]">
            Real Solutions. Real Impact.
          </h2>
        </div>

        <a
          href="#contact"
          className="inline-flex shrink-0 text-sm font-bold text-[#154187] hover:underline sm:text-base dark:text-[#93C5FD]"
        >
          Start Your Project →
        </a>
      </div>

      {/* Horizontal slider */}
      <div className="relative mt-8 overflow-hidden sm:mt-10 md:mt-12">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#8B5E3C]/30 via-[#8B5E3C]/12 to-transparent dark:from-[#09090B] dark:via-[#09090B]/60 sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#8B5E3C]/30 via-[#8B5E3C]/12 to-transparent dark:from-[#09090B] dark:via-[#09090B]/60 sm:w-24" />

        <div className="portfolio-horizontal-track flex w-max gap-5 pr-5">
          {slidingPortfolio.map((item, index) => (
            <article
              key={`${item.title}-${index}`}
              className="flex h-full w-[280px] shrink-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:w-[340px] lg:w-[380px] dark:border-white/10 dark:bg-[#161616]"
            >
              <div className="h-48 overflow-hidden bg-[#0F172A] sm:h-52">
                <img
                  src={portfolioImages[item.type]}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>

              <div className="min-w-0 flex-1 p-4 sm:p-6">
                <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-bold text-[#154187] dark:bg-white/10 dark:text-[#93C5FD]">
                  {item.type}
                </span>

                <h3 className="mt-4 text-xl font-black dark:text-[#FAFAFA]">
                  {item.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-600 dark:text-[#FAFAFA]/80">
                  {item.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
