import { motion } from "framer-motion";
import { team } from "../data/team";

const itemVariants = {
  hidden: { opacity: 0, y: 26 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 24, delay: i * 0.1 },
  }),
};

export default function Team() {
  return (
    <section
      id="team"
      className="relative overflow-x-clip bg-white py-12 dark:bg-[#09090B] sm:py-16 lg:py-20"
    >
      <div className="mx-auto min-w-0 max-w-7xl px-3 sm:px-5">
        <div className="max-w-3xl text-pretty">
          <p className="text-xs font-bold uppercase tracking-widest text-[#103759] dark:text-[#93C5FD] sm:text-sm">
            Our Team
          </p>

          <h2 className="mt-3 text-2xl font-black text-[#06243F] text-balance sm:mt-4 sm:text-3xl md:text-4xl lg:text-5xl dark:text-[#FAFAFA]">
            The People Behind the Work
          </h2>

          <p className="mt-4 text-sm leading-7 text-[#475569] dark:text-[#FAFAFA]/80 sm:mt-5 sm:text-base sm:leading-8">
            A small, accountable team that stays with a project from planning
            through long-term support.
          </p>
        </div>

        <div className="mt-8 grid min-w-0 grid-cols-1 gap-5 sm:mt-10 sm:grid-cols-2 md:mt-12 lg:grid-cols-4">
          {team.map((member, i) => {
            const avatar = member.photo ? (
              <img
                src={member.photo}
                alt={member.name}
                width="160"
                height="160"
                loading="lazy"
                decoding="async"
                className="h-28 w-28 shrink-0 rounded-full object-cover sm:h-32 sm:w-32"
              />
            ) : (
              <div
                className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full text-2xl font-black text-white shadow-[0_14px_35px_rgba(139,94,60,0.18)] sm:h-32 sm:w-32 sm:text-3xl"
                style={{ backgroundColor: member.accent }}
                aria-hidden
              >
                {member.initial}
              </div>
            );

            return (
              <motion.article
                key={member.name}
                custom={i}
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                className={`min-w-0 rounded-2xl border border-[#DCE5EF] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:rounded-3xl sm:p-6 dark:border-white/10 dark:bg-[#161616] ${
                  member.wide
                    ? "sm:col-span-2 sm:flex sm:items-center sm:gap-6 lg:col-span-2"
                    : ""
                }`}
              >
                {avatar}

                <div className={`min-w-0 mt-4 ${member.wide ? "sm:mt-0" : ""}`}>
                  <p className="text-base font-black text-[#06243f] dark:text-[#FAFAFA] sm:text-lg">
                    {member.name}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#8B5E3C] sm:text-sm">
                    {member.role}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#475569] dark:text-[#FAFAFA]/78">
                    {member.bio}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
