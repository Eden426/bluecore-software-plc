import { motion } from "framer-motion";
import { services } from "../data/services";
import BentoServiceCard from "./BentoServiceCard";

function buildBentoOrder(list) {
  const hero = list.find((s) => s.hero);
  const rest = list.filter((s) => !s.hero);
  return hero ? [hero, ...rest] : [...list];
}

const BENTO_SPANS = [
  "min-w-0 md:col-span-2 lg:col-span-5 lg:row-span-2 min-h-[260px] md:min-h-[280px] lg:min-h-[300px]",
  "min-w-0 md:col-span-1 lg:col-span-4 min-h-[180px] md:min-h-[200px]",
  "min-w-0 md:col-span-1 lg:col-span-3 min-h-[180px] md:min-h-[200px]",
  "min-w-0 md:col-span-1 lg:col-span-4 min-h-[180px] md:min-h-[200px]",
  "min-w-0 md:col-span-1 lg:col-span-3 min-h-[180px] md:min-h-[200px]",
  "min-w-0 md:col-span-1 lg:col-span-3 min-h-[160px] md:min-h-[180px]",
  "min-w-0 md:col-span-1 lg:col-span-3 min-h-[160px] md:min-h-[180px]",
  "min-w-0 md:col-span-1 lg:col-span-3 min-h-[160px] md:min-h-[180px]",
  "min-w-0 md:col-span-1 lg:col-span-3 min-h-[160px] md:min-h-[180px]",
];

const bentoContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.075, delayChildren: 0.06 },
  },
};

export default function Services() {
  const ordered = buildBentoOrder(services);

  return (
    <section
      id="services"
      className="relative overflow-x-clip bg-[#F2F4F7] py-12 dark:bg-[#09090B] dark:text-[#FAFAFA] sm:py-16 lg:py-20"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-95 dark:opacity-100"
        aria-hidden
      >
        <div className="services-blob-a absolute -left-24 top-8 h-[240px] w-[240px] rounded-full bg-gradient-to-tr from-[#06243f]/28 via-[#0b3b63]/18 to-transparent blur-3xl sm:-left-32 sm:top-10 sm:h-[320px] sm:w-[320px] md:h-[380px] md:w-[380px] lg:h-[420px] lg:w-[420px] dark:from-[#06243f]/25 dark:via-[#0b3b63]/15" />
        <div className="services-blob-b absolute -right-16 top-1/4 h-[220px] w-[220px] rounded-full bg-gradient-to-bl from-[#8B5E3C]/22 via-[#c4a07a]/12 to-transparent blur-3xl sm:-right-24 sm:h-[300px] sm:w-[300px] md:h-[340px] md:w-[340px] lg:h-[380px] lg:w-[380px] dark:from-[#8B5E3C]/14 dark:via-[#5b3a29]/20" />
        <div className="services-blob-c absolute bottom-0 left-1/2 h-[220px] w-[min(100%,380px)] -translate-x-1/2 rounded-full bg-gradient-to-t from-[#0b3b63]/20 via-[#8B5E3C]/10 to-transparent blur-3xl sm:w-[480px] sm:max-w-[90vw] md:h-[300px] lg:h-[360px] dark:from-[#0b3b63]/18 dark:via-[#8B5E3C]/08" />
      </div>

      <div className="relative z-10 mx-auto min-w-0 max-w-7xl px-3 sm:px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-80px", amount: 0.2 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="max-w-3xl text-pretty"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-[#06243f] dark:text-[#c4a882] sm:text-sm">
            Our Services
          </p>

          <h2 className="mt-3 text-2xl font-black text-balance sm:mt-4 sm:text-3xl md:text-4xl lg:text-5xl dark:text-[#FAFAFA]">
            End-to-End Solutions to Drive Your Business Forward
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-[#FAFAFA]/80 sm:mt-5 sm:text-base sm:leading-8">
            We provide complete software services from idea and design to
            development, integration, launch, and long-term support.
          </p>
        </motion.div>

        <motion.div
          className="mt-8 grid min-w-0 grid-cols-1 gap-3 [perspective:1200px] sm:mt-10 sm:gap-4 md:mt-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-5"
          variants={bentoContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, margin: "-60px", amount: 0.18 }}
        >
          {ordered.map((service, index) => (
            <BentoServiceCard
              key={service.title}
              index={index}
              service={service}
              gridClass={BENTO_SPANS[index] ?? "lg:col-span-3"}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
