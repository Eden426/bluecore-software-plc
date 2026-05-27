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
      className="relative isolate w-full overflow-x-clip overflow-y-hidden bg-transparent text-[#06243f] dark:text-[#FAFAFA]"
    >
      {/* Natural floating background circles */}
      <div className="hero-circle hero-circle-1 pointer-events-none absolute" />
      <div className="hero-circle hero-circle-2 pointer-events-none absolute" />
      <div className="hero-circle hero-circle-3 pointer-events-none absolute" />
      <div className="hero-circle hero-circle-4 pointer-events-none absolute" />
      <div className="hero-circle hero-circle-5 pointer-events-none absolute" />

      <div className="relative z-[1] mx-auto grid min-w-0 max-w-[1480px] items-center gap-12 px-4 py-14 sm:px-6 sm:py-16 md:py-20 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16 lg:px-12 lg:py-24 xl:gap-24 xl:px-16 2xl:gap-28 2xl:px-20">
        {/* Left content */}
        <div className="order-1 flex min-w-0 items-center lg:-ml-4 lg:pl-0 xl:-ml-8 2xl:-ml-10">
          <div className="max-w-2xl border-l-4 border-[#8B5E3C] pl-4 sm:pl-6 md:pl-7">
            {/* Badges */}
            <div className="mb-6 flex flex-wrap gap-2 sm:mb-7 sm:gap-3">
              {heroBadges.map(({ Icon, label }) => (
                <span
                  key={label}
                  role="img"
                  aria-label={label}
                  className="inline-flex rounded-xl border border-[#0b3051]/15 bg-white/55 p-2.5 text-[#0b3051] ring-1 ring-white/70 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#8B5E3C]/60 hover:text-[#8B5E3C] sm:p-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                >
                  <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
                </span>
              ))}
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#8B5E3C] sm:text-sm">
              Smart Software. Solid Core.
            </p>

            <h1 className="mt-4 font-black leading-tight text-[#06243f] dark:text-white">
              <span className="block whitespace-nowrap text-[clamp(2.1rem,5vw,3.35rem)]">
                Intelligent Software.
              </span>
              <span className="mt-1 block text-[clamp(2.1rem,5vw,3.35rem)]">
                Built on
              </span>
              <span className="mt-1 block text-[clamp(2.1rem,5vw,3.35rem)] text-[#8B5E3C]">
                a Solid Core.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-700 sm:text-base sm:leading-8 md:text-lg dark:text-white/75">
              We build secure, reliable, and scalable software solutions that
              help businesses grow, adapt, and lead in a digital world.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="#contact"
                className="group relative inline-flex min-h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-[#163b5b] px-7 py-3 text-center text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#06243f] sm:w-auto"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative">Get Started</span>
              </a>

              <a
                href="#contact"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[#8B5E3C]/70 bg-white/50 px-7 py-3 text-center text-sm font-bold text-[#8B5E3C] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#8B5E3C] hover:bg-[#8B5E3C] hover:text-white sm:w-auto dark:bg-white/[0.05]"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>

        {/* Right image — brown #8b5e3c blend, moved right, no border/card */}
        <div className="order-2 flex min-w-0 items-center justify-center lg:justify-end xl:translate-x-14 2xl:translate-x-20">
          <div className="relative w-full max-w-[900px] xl:max-w-[980px] 2xl:max-w-[1040px]">
            {/* Brown ambient glow so the image harmonizes with the brand */}
            <div
              className="pointer-events-none absolute -inset-12 -z-10 rounded-[3.5rem] opacity-90 blur-3xl dark:opacity-60"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(139, 94, 60, 0.32), rgba(139, 94, 60, 0.16) 42%, rgba(6, 36, 63, 0.08) 64%, transparent 78%)",
              }}
              aria-hidden="true"
            />

            <div className="relative overflow-hidden rounded-[2.75rem]">
              {/* Brown color wash over the image */}
              <div className="pointer-events-none absolute inset-0 z-10 rounded-[2.75rem] bg-[#8B5E3C]/12 mix-blend-multiply dark:bg-[#8B5E3C]/18 dark:mix-blend-screen" />

              {/* Brown edge blending, no white fade */}
              <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 rounded-l-[2.75rem] bg-gradient-to-r from-[#8B5E3C]/28 via-[#8B5E3C]/12 to-transparent sm:w-24" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-12 rounded-r-[2.75rem] bg-gradient-to-l from-[#8B5E3C]/20 via-[#8B5E3C]/8 to-transparent sm:w-20" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-14 rounded-b-[2.75rem] bg-gradient-to-t from-[#8B5E3C]/24 via-[#8B5E3C]/10 to-transparent sm:h-20" />

              <img
                src={heroLogo}
                alt="Bluecore Software — digital transformation and technology"
                className="block h-[320px] w-full rounded-[2.75rem] object-cover object-center opacity-[0.97] shadow-[0_22px_70px_rgba(139,94,60,0.16)] sm:h-[380px] md:h-[450px] lg:h-[510px] xl:h-[530px] dark:opacity-[0.92] dark:shadow-[0_22px_70px_rgba(139,94,60,0.18)]"
                style={{
                  WebkitMaskImage:
                    "linear-gradient(90deg, transparent 0%, #000 7%, #000 93%, transparent 100%)",
                  maskImage:
                    "linear-gradient(90deg, transparent 0%, #000 7%, #000 93%, transparent 100%)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
