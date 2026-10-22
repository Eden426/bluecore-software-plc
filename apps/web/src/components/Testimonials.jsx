import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  // Deployment note: confirm permission and attribution accuracy before publication.
  {
    name: "Yohannes Tesfaye",
    company: "Addis Revenue Authority",
    role: "IT Director",
    review:
      "Bluecore transformed our entire tax processing workflow. What used to take weeks of manual paperwork now runs in hours. Their team understood our public-sector constraints and delivered something our staff actually loves using.",
    rating: 5,
    initial: "YT",
    accent: "#103759",
  },
  {
    name: "Selamawit Girma",
    company: "Ethio Logistics Group",
    role: "Operations Manager",
    review:
      "The system integration they built connected our 6 legacy tools into one dashboard. Visibility went from near-zero to real-time. We've reduced operational errors by over 40% since launch.",
    rating: 5,
    initial: "SG",
    accent: "#8B5E3C",
  },
  {
    name: "Dawit Bekele",
    company: "Horizon Healthcare PLC",
    role: "CEO",
    review:
      "We needed a custom platform that handled patient records, billing, and staff scheduling — securely and reliably. Bluecore delivered on time, within budget, and their post-launch support has been exceptional.",
    rating: 5,
    initial: "DB",
    accent: "#0B3B63",
  },
];

function StarRating({ count }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < count
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

const itemVariants = {
  hidden: { opacity: 0, y: 26 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 24,
      delay: i * 0.14,
    },
  }),
};

const descendingLines = [
  "w-full",
  "w-11/12",
  "w-10/12",
  "w-8/12",
  "w-6/12",
  "w-4/12",
];

export default function Testimonials() {
  return (
    <section
      id="testimonials"
      className="relative overflow-x-clip bg-white py-12 dark:bg-[#09090B] sm:py-16 lg:py-20"
    >
      {/* Soft brand atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 opacity-45 dark:opacity-30"
        aria-hidden
      >
        <div className="absolute -left-24 top-10 h-[320px] w-[320px] rounded-full bg-[#103759]/8 blur-3xl dark:bg-[#8B5E3C]/10" />
        <div className="absolute -right-20 bottom-8 h-[260px] w-[260px] rounded-full bg-[#8B5E3C]/6 blur-3xl sm:-right-28 sm:h-[320px] sm:w-[320px] dark:-right-28 dark:bottom-4 dark:h-[360px] dark:w-[360px] dark:bg-[#8B5E3C]/12" />
      </div>

      <div className="relative z-10 mx-auto min-w-0 max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-80px", amount: 0.2 }}
          transition={{ type: "spring", stiffness: 360, damping: 30 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#103759] sm:text-sm dark:text-[#8B5E3C]">
            Client Testimonials
          </p>

          <h2 className="mt-3 text-balance text-2xl font-black text-[#06243f] sm:mt-4 sm:text-3xl md:text-4xl lg:text-5xl dark:text-[#FAFAFA]">
            Real Feedback from Teams We Helped Move Forward
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#475569] dark:text-[#FAFAFA]/75 sm:text-base sm:leading-8">
            Our work is measured by the systems we build, the teams we support,
            and the operational problems we help solve.
          </p>
        </motion.div>

        {/* Open testimonial layout — no cards */}
        <div className="mt-10 grid min-w-0 gap-10 lg:mt-14 lg:grid-cols-[0.78fr_1.22fr] lg:gap-14">
          {/* Left statement with descending lines */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="relative"
          >
            <div className="border-l-4 border-[#8B5E3C] pl-5 sm:pl-7">
              <Quote className="mb-5 h-10 w-10 text-[#8B5E3C]/45" />

              <p className="text-xl font-black leading-tight text-[#06243f] dark:text-white sm:text-2xl md:text-3xl">
                Good software should not just look modern. It should remove
                friction, protect the work, and make people faster.
              </p>

              <p className="mt-5 text-sm leading-7 text-[#475569] dark:text-white/70 sm:text-base sm:leading-8">
                That is the standard behind every Bluecore project: practical
                systems, strong architecture, and long-term support.
              </p>
            </div>

            {/* Descending repeated lines under the statement */}
            <div className="mt-7 space-y-3 pl-5 sm:pl-7">
              {descendingLines.map((widthClass, index) => (
                <motion.span
                  key={widthClass}
                  initial={{ scaleX: 0, opacity: 0 }}
                  whileInView={{ scaleX: 1, opacity: 1 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{
                    duration: 0.55,
                    delay: index * 0.08,
                    ease: "easeOut",
                  }}
                  className={`block h-[3px] origin-left rounded-full bg-gradient-to-r from-[#8B5E3C]/75 via-[#103759]/45 to-transparent opacity-80 dark:bg-none dark:bg-[#8B5E3C] dark:opacity-100 ${widthClass}`}
                />
              ))}
            </div>
          </motion.div>

          {/* Right testimonials */}
          <div className="space-y-8">
            {testimonials.map((t, i) => (
              <motion.article
                key={t.name}
                custom={i}
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                className="group relative grid gap-4 border-t border-[#C8D5E3] pt-6 sm:grid-cols-[auto_1fr] sm:gap-5 dark:border-[#8B5E3C]/25"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-black text-white shadow-[0_14px_35px_rgba(139,94,60,0.18)]"
                  style={{ backgroundColor: t.accent }}
                  aria-hidden
                >
                  {t.initial}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <StarRating count={t.rating} />
                    <span className="h-1 w-1 rounded-full bg-[#8B5E3C]/60" />
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#103759] dark:text-[#8B5E3C]">
                      Client feedback
                    </p>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-[#334155] dark:text-[#FAFAFA]/78 sm:text-base sm:leading-8">
                    “{t.review}”
                  </p>

                  <div className="mt-4">
                    <p className="text-sm font-black text-[#06243f] dark:text-[#FAFAFA]">
                      {t.name}
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#64748B] dark:text-[#FAFAFA]/55 sm:text-sm">
                      {t.role} · {t.company}
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
