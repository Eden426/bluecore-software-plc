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

      <div className="relative z-[1] mx-auto grid min-w-0 max-w-[1480px] grid-cols-[minmax(0,1.08fr)_minmax(120px,0.72fr)] items-center gap-5 px-3 py-10 sm:grid-cols-[0.95fr_1.05fr] sm:gap-6 sm:px-6 sm:py-16 md:gap-10 md:py-20 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16 lg:px-12 lg:py-24 xl:gap-24 xl:px-16 2xl:gap-28 2xl:px-20">
        {/* Left content */}
        <div className="order-1 flex min-w-0 items-center lg:-ml-4 lg:pl-0 xl:-ml-8 2xl:-ml-10">
          <div className="max-w-2xl border-l-2 border-[#875131] pl-2 sm:border-l-4 sm:pl-6 md:pl-7 dark:border-[#8B5E3C]">
            {/* Badges */}
            <div className="mb-3 flex flex-wrap gap-1.5 sm:mb-7 sm:gap-3">
              {heroBadges.map(({ Icon, label }) => (
                <span
                  key={label}
                  role="img"
                  aria-label={label}
                  className="inline-flex rounded-lg border border-[#02040a]/15 bg-white/55 p-1.5 text-[#02040a] ring-1 ring-white/70 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#875131]/70 hover:text-[#875131] sm:rounded-xl sm:p-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:border-[#8B5E3C]/60 dark:hover:text-[#8B5E3C]"
                >
                  <Icon className="h-4 w-4 sm:h-8 sm:w-8" />
                </span>
              ))}
            </div>

            <p className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#382517] sm:text-sm sm:tracking-[0.24em] dark:text-[#8B5E3C]">
              Smart Software. Solid Core.
            </p>

            <h1 className="mt-2 font-black leading-tight text-[#06243f] dark:text-white sm:mt-4">
              <span className="block text-[clamp(0.9rem,4vw,3.35rem)] sm:whitespace-nowrap sm:text-[clamp(2.1rem,5vw,3.35rem)]">
                Intelligent Software.
              </span>
              <span className="mt-1 block text-[clamp(0.9rem,4vw,3.35rem)] sm:text-[clamp(2.1rem,5vw,3.35rem)]">
                Built on
              </span>
              <span className="mt-1 block text-[clamp(0.9rem,4vw,3.35rem)] text-[#382517] sm:text-[clamp(2.1rem,5vw,3.35rem)] dark:text-[#8B5E3C]">
                a Solid Core.
              </span>
            </h1>

            <p className="mt-3 max-w-xl text-[9px] leading-4 text-slate-700 sm:mt-5 sm:text-base sm:leading-8 md:text-lg dark:text-white/75">
              We build secure, reliable, and scalable software solutions that
              help businesses grow, adapt, and lead in a digital world.
            </p>

            {/* CTA */}
            <div className="mt-4 flex pl-1 sm:mt-8 sm:pl-8 md:pl-12">
              <a
                href="#contact"
                className="inline-flex min-h-8 min-w-[95px] items-center justify-center rounded-lg bg-[#875131] px-4 py-2 text-center text-[10px] font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#875131] sm:min-h-12 sm:min-w-[220px] sm:rounded-xl sm:px-12 sm:py-3 sm:text-sm dark:bg-[#8B5E3C] dark:hover:bg-[#A0694A]"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>

        {/* Right image — proportional on phone and still beside text */}
        <div className="order-2 flex min-w-0 items-center justify-end xl:translate-x-14 2xl:translate-x-20">
          <div className="relative w-full max-w-[155px] sm:max-w-[520px] md:max-w-[720px] lg:max-w-[900px] xl:max-w-[980px] 2xl:max-w-[1040px]">
            {/* Brown ambient glow */}
            <div
              className="pointer-events-none absolute -inset-3 -z-10 rounded-[1.5rem] opacity-70 blur-xl sm:-inset-12 sm:rounded-[3.5rem] sm:opacity-90 sm:blur-3xl dark:opacity-60"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(56, 37, 23, 0.28), rgba(56, 37, 23, 0.14) 42%, rgba(6, 36, 63, 0.08) 64%, transparent 78%)",
              }}
              aria-hidden="true"
            />

            <div className="relative aspect-[3/4] overflow-hidden rounded-[1.35rem] sm:aspect-auto sm:h-[380px] sm:rounded-[2.75rem] md:h-[450px] lg:h-[510px] xl:h-[530px]">
              {/* Brown color wash over the image */}
              <div className="pointer-events-none absolute inset-0 z-10 rounded-[1.35rem] bg-[#8B5E3C]/12 mix-blend-multiply sm:rounded-[2.75rem] dark:bg-[#8B5E3C]/18 dark:mix-blend-screen" />

              {/* Brown edge blending */}
              <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-6 rounded-l-[1.35rem] bg-gradient-to-r from-[#875131]/28 via-[#875131]/12 to-transparent sm:w-24 sm:rounded-l-[2.75rem]" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-6 rounded-r-[1.35rem] bg-gradient-to-l from-[#875131]/20 via-[#875131]/8 to-transparent sm:w-20 sm:rounded-r-[2.75rem]" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-8 rounded-b-[1.35rem] bg-gradient-to-t from-[#875131]/24 via-[#875131]/10 to-transparent sm:h-20 sm:rounded-b-[2.75rem]" />

              <img
                src={heroLogo}
                alt="Bluecore Software — digital transformation and technology"
                className="h-full w-full rounded-[1.35rem] object-cover object-center opacity-[0.97] shadow-[0_18px_45px_rgba(56,37,23,0.16)] sm:rounded-[2.75rem] dark:opacity-[0.92] dark:shadow-[0_22px_70px_rgba(139,94,60,0.18)]"
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
