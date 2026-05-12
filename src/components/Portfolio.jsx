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
  return (
    <section
      id="portfolio"
      className="mx-auto min-w-0 max-w-7xl px-3 py-12 text-[#0f172a] sm:px-5 sm:py-16 lg:py-20 dark:text-[#FAFAFA]"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-[#8B5E3C] sm:text-sm">
            Our Portfolio
          </p>
          <h2 className="mt-3 text-2xl font-black text-balance sm:mt-4 sm:text-3xl md:text-4xl lg:text-5xl dark:text-[#FAFAFA]">
            Real Solutions. Real Impact.
          </h2>
        </div>

        <a
          href="#contact"
          className="inline-flex shrink-0 text-sm font-bold text-[#06243f] hover:underline sm:text-base dark:text-[#FAFAFA]"
        >
          Start Your Project →
        </a>
      </div>

      <div className="mt-8 overflow-hidden sm:mt-10 md:mt-12">
        <div className="portfolio-motion grid min-w-0 gap-4 sm:gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 auto-rows-fr">
          {portfolio.map((item) => (
            <article
              key={item.title}
              className="flex h-full flex-col rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-white dark:bg-[#161616] dark:border-white/10"
            >
              <div className="h-48 overflow-hidden bg-[#0F172A]">
                <img
                  src={portfolioImages[item.type]}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1 p-4 sm:p-6">
                <span className="text-xs font-bold text-[#06243f] bg-blue-50 px-3 py-1 rounded-full dark:text-[#93c5fd] dark:bg-white/10">
                  {item.type}
                </span>
                <h3 className="mt-4 text-xl font-black dark:text-[#FAFAFA]">
                  {item.title}
                </h3>
                <p className="mt-3 text-slate-600 dark:text-[#FAFAFA]/80 leading-7">
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
