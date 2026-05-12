import { motion, useReducedMotion, useSpring } from "framer-motion";
import { useCallback, useRef, useState } from "react";

const bentoItemReducedVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

const bentoItemVariants = {
  hidden: (i) => ({
    opacity: 0.15,
    x: Math.sin(i * 1.05) * 72,
    y: 56 + i * 7,
    rotateZ: (i % 2 === 0 ? -7 : 7) + (i % 4) * 0.8,
    scale: 0.9,
  }),
  visible: () => ({
    opacity: 1,
    x: 0,
    y: 0,
    rotateZ: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 22,
      mass: 1.2,
    },
  }),
};

export default function BentoServiceCard({ service, gridClass, index }) {
  const cardRef = useRef(null);
  const [glow, setGlow] = useState({ x: 50, y: 50 });
  const reduceMotion = useReducedMotion();

  const rotateX = useSpring(0, { stiffness: 320, damping: 28, mass: 0.6 });
  const rotateY = useSpring(0, { stiffness: 320, damping: 28, mass: 0.6 });

  const onMove = useCallback(
    (e) => {
      if (reduceMotion) return;
      if (window.matchMedia("(hover: none)").matches) return;
      const el = cardRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / Math.max(r.width, 1) - 0.5;
      const py = (e.clientY - r.top) / Math.max(r.height, 1) - 0.5;
      rotateY.set(px * 11);
      rotateX.set(-py * 9);
      setGlow({
        x: ((e.clientX - r.left) / Math.max(r.width, 1)) * 100,
        y: ((e.clientY - r.top) / Math.max(r.height, 1)) * 100,
      });
    },
    [rotateX, rotateY, reduceMotion]
  );

  const onLeave = useCallback(() => {
    setGlow({ x: 50, y: 50 });
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  const { icon: ServiceIcon, title, text, detail, hero, heroTagline, heroExtended } =
    service;

  return (
    <motion.article
      ref={cardRef}
      custom={index}
      variants={reduceMotion ? bentoItemReducedVariants : bentoItemVariants}
      style={{
        "--spot-x": `${glow.x}%`,
        "--spot-y": `${glow.y}%`,
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`group relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-white/55 bg-white/60 p-4 shadow-[0_8px_40px_rgba(6,36,63,0.08)] backdrop-blur-2xl transition-[box-shadow,border-color] duration-300 sm:rounded-[1.35rem] sm:p-6 hover:border-[#06243f]/25 hover:shadow-[0_22px_48px_rgba(6,36,63,0.14)] dark:border-white/[0.1] dark:bg-white/[0.06] dark:shadow-[0_8px_40px_rgba(0,0,0,0.35)] dark:hover:border-[#8B5E3C]/35 dark:hover:shadow-[0_24px_60px_rgba(0,0,0,0.5)] ${gridClass} ${
        hero
          ? "sm:ring-1 sm:ring-[#06243f]/20 sm:ring-offset-2 sm:ring-offset-transparent dark:sm:ring-[#8B5E3C]/30 dark:sm:ring-offset-0 lg:p-9"
          : "lg:p-7"
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:hidden"
        style={{
          background:
            "radial-gradient(520px circle at var(--spot-x) var(--spot-y), rgba(6, 36, 63, 0.16), transparent 42%), radial-gradient(380px circle at var(--spot-x) var(--spot-y), rgba(139, 94, 60, 0.12), transparent 50%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:block"
        style={{
          background:
            "radial-gradient(520px circle at var(--spot-x) var(--spot-y), rgba(6, 36, 63, 0.35), transparent 45%), radial-gradient(400px circle at var(--spot-x) var(--spot-y), rgba(139, 94, 60, 0.18), transparent 52%)",
        }}
        aria-hidden
      />

      {hero && (
        <>
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-[#06243f]/40 via-[#0b3b63]/25 to-[#8B5E3C]/20 blur-3xl dark:from-[#06243f]/35 dark:via-[#0b3b63]/25 dark:to-[#8B5E3C]/15"
            aria-hidden
          />
          <div
            className="services-mesh-sheen pointer-events-none absolute inset-0 rounded-[1.35rem] opacity-45 dark:opacity-30"
            aria-hidden
            style={{
              background:
                "linear-gradient(118deg, rgba(6,36,63,0.28) 0%, rgba(11,59,99,0.18) 35%, rgba(139,94,60,0.2) 72%, rgba(244,215,178,0.12) 100%)",
            }}
          />
        </>
      )}

      <div className="relative z-[1] flex min-w-0 flex-1 flex-col break-words [transform:translateZ(12px)]">
        <div
          className={`inline-flex shrink-0 items-center justify-center rounded-xl border-2 border-[#06243f]/45 bg-white/90 text-[#06243f] shadow-sm dark:border-[#8B5E3C]/55 dark:bg-[#141416] dark:text-[#FAFAFA] ${
            hero ? "h-[4.25rem] w-[4.25rem] sm:h-[4.75rem] sm:w-[4.75rem]" : "h-14 w-14"
          }`}
        >
          <ServiceIcon
            className={hero ? "h-10 w-10 sm:h-11 sm:w-11" : "h-8 w-8"}
          />
        </div>

        <h3
          className={`mt-3 font-black leading-tight text-[#0f172a] dark:text-[#FAFAFA] sm:mt-4 ${
            hero
              ? "text-lg text-balance sm:text-xl md:text-2xl"
              : "text-base text-balance sm:text-lg md:text-xl"
          }`}
        >
          {title}
        </h3>
        {hero && heroTagline ? (
          <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-[#06243f] dark:text-[#c4a882]">
            {heroTagline}
          </p>
        ) : null}
        <p
          className={`mt-2 flex-1 leading-relaxed text-slate-600 dark:text-[#FAFAFA]/82 ${
            hero ? "text-base md:text-lg" : "text-sm md:text-base"
          }`}
        >
          {text}
        </p>
        {hero && heroExtended ? (
          <p className="mt-3 border-t border-[#06243f]/10 pt-3 text-sm leading-relaxed text-slate-600 text-pretty dark:border-white/10 dark:text-[#FAFAFA]/78 sm:mt-4 sm:pt-4 md:text-base">
            {heroExtended}
          </p>
        ) : null}
        <p className="mt-4 max-h-0 overflow-hidden text-sm leading-snug text-slate-500 opacity-0 transition-all duration-300 group-hover:max-h-24 group-hover:opacity-100 dark:text-[#FAFAFA]/65">
          {detail}
        </p>
      </div>
    </motion.article>
  );
}
