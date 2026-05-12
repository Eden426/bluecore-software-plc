import heroLogo from "../assets/image.png";
import {
  IconAI,
  IconCloudOps,
  IconIntegration,
  IconShieldQA,
  IconWebApp,
} from "./icons/ServiceIcons";

const heroBadges = [
  { Icon: IconIntegration, label: "Integration" },
  { Icon: IconWebApp, label: "Web" },
  { Icon: IconAI, label: "AI" },
  { Icon: IconCloudOps, label: "Cloud" },
  { Icon: IconShieldQA, label: "Security" },
];

export default function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-x-clip overflow-y-hidden bg-[#0F172A] text-white dark:bg-[#09090B] dark:text-[#FAFAFA]"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#06243f]/25 via-transparent to-[#8B5E3C]/10 dark:from-[#06243f]/15 dark:to-transparent" />

      <div className="relative z-[1] mx-auto grid min-w-0 max-w-7xl items-center gap-6 px-3 py-8 sm:gap-8 sm:px-5 sm:py-10 md:py-12 lg:grid-cols-2 lg:gap-10 lg:py-14">
        <div className="order-1 min-w-0 pl-0 sm:pl-2 md:pl-6 lg:pl-10 lg:pr-2">
          <div className="max-w-xl border-l-4 border-[#8B5E3C] pl-4 sm:pl-6 md:pl-7">
            <div className="mb-6 flex flex-wrap gap-2 sm:mb-8 sm:gap-3">
              {heroBadges.map(({ Icon, label }) => (
                <span
                  key={label}
                  role="img"
                  aria-label={label}
                  className="inline-flex rounded-lg border-2 border-[#8B5E3C]/70 bg-[#06243f]/50 p-2 text-[#F4D7B2] shadow-md ring-1 ring-white/15 sm:rounded-xl sm:p-3 dark:border-[#8B5E3C]/80 dark:bg-[#141416] dark:text-[#FAFAFA] dark:ring-white/10"
                >
                  <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
                </span>
              ))}
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-[#8B5E3C] sm:text-sm">
              Smart Software. Solid Core.
            </p>

            <h1 className="mt-2 text-balance text-2xl font-black leading-tight sm:mt-3 sm:text-3xl md:mt-4 md:text-4xl lg:text-5xl">
              Intelligent Software.
              <br />
              Built on a <span className="text-[#8B5E3C]">Solid Core.</span>
            </h1>

            <p className="mt-4 text-sm leading-7 text-slate-300 dark:text-[#FAFAFA]/85 sm:mt-5 sm:text-base sm:leading-8 md:text-lg">
              We build secure, reliable, and scalable software solutions that
              help businesses grow, adapt, and lead in a digital world.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:flex-wrap sm:gap-4 md:mt-7">
              <a
                href="#services"
                className="inline-flex w-full min-h-11 items-center justify-center rounded-xl bg-[#8B5E3C] px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#A0694A] sm:w-auto sm:min-h-0 sm:px-6"
              >
                Explore Services
              </a>
              <a
                href="#portfolio"
                className="inline-flex w-full min-h-11 items-center justify-center rounded-xl border-2 border-white/35 bg-white/[0.06] px-5 py-3 text-center text-sm font-semibold transition-colors hover:border-white/55 hover:bg-white/10 dark:border-white/30 dark:hover:bg-white/[0.1] sm:w-auto sm:min-h-0 sm:px-6"
              >
                View Our Work
              </a>
            </div>
          </div>
        </div>

        <div className="order-2 flex min-w-0 justify-center lg:justify-end">
          <div className="relative w-full min-w-0 max-w-lg lg:max-w-none lg:pl-4">
            <div
              className="pointer-events-none absolute inset-0 z-[2] rounded-2xl bg-gradient-to-r from-[#0F172A] from-0% via-transparent via-55% to-transparent dark:from-[#09090B]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 z-[2] rounded-2xl bg-gradient-to-l from-[#0F172A] from-0% via-transparent via-40% to-transparent to-100% opacity-90 dark:from-[#09090B]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 z-[2] rounded-2xl bg-gradient-to-t from-[#0F172A] from-0% via-transparent via-50% to-transparent dark:from-[#09090B]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 z-[2] rounded-2xl opacity-85 dark:hidden"
              style={{
                background:
                  "radial-gradient(ellipse 100% 78% at 92% 88%, rgba(15, 23, 42, 0.75), transparent 52%)",
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 z-[2] hidden rounded-2xl opacity-90 dark:block"
              style={{
                background:
                  "radial-gradient(ellipse 100% 78% at 92% 88%, rgb(9 9 11), transparent 52%)",
              }}
              aria-hidden
            />

            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-l-3xl lg:rounded-r-none">
              <img
                src={heroLogo}
                alt="Hero Illustration"
                className="relative z-0 w-full max-h-[min(34vh,280px)] object-cover object-center opacity-[0.92] sm:max-h-[min(40vh,340px)] md:max-h-[min(44vh,400px)] lg:max-h-[min(48vh,440px)] lg:object-right"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
