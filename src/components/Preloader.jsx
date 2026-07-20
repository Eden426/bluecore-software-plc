import { useEffect, useState } from "react";

const letters = [
  { char: "B", color: "#01213F", tall: true },
  { char: "L", color: "#01213F", tall: false },
  { char: "U", color: "#01213F", tall: false },
  { char: "E", color: "#01213F", tall: false },
  { char: "C", color: "#875131", tall: true },
  { char: "O", color: "#875131", tall: false },
  { char: "R", color: "#875131", tall: false },
  { char: "E", color: "#875131", tall: false },
];

export default function Preloader() {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsLeaving(true);
    }, 3400);

    const removeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 4200);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-[#FFFFFF] transition-all duration-700 dark:bg-[#09090B] ${
        isLeaving ? "pointer-events-none scale-105 opacity-0" : "opacity-100"
      }`}
    >
      <style>{`
        @keyframes bluecoreRing {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) scale(0.9);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg) scale(1);
            opacity: 1;
          }
        }

        @keyframes bluecoreLetterStretch {
          0% {
            opacity: 0;
            transform: scaleY(var(--base-scale));
            filter: blur(8px);
          }
          25% {
            opacity: 1;
            transform: scaleY(var(--base-scale));
            filter: blur(0);
          }
          58% {
            transform: scaleY(var(--stretch-scale));
          }
          82% {
            transform: scaleY(var(--base-scale));
          }
          100% {
            opacity: 1;
            transform: scaleY(var(--base-scale));
            filter: blur(0);
          }
        }

        @keyframes bluecoreLine {
          0% {
            transform: scaleX(0);
            opacity: 0;
          }
          35% {
            opacity: 1;
          }
          100% {
            transform: scaleX(1);
            opacity: 1;
          }
        }

        @keyframes bluecoreFadeUp {
          0% {
            opacity: 0;
            transform: translateY(16px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="relative flex min-h-[430px] flex-col items-center justify-center px-6 text-center">
        {/* Circle */}
        <div
          className="pointer-events-none absolute left-1/2 top-[42%] h-64 w-64 rounded-full border-[5px] border-[#875131]/80 border-r-[#06243f] border-t-[#382517] dark:border-t-white/85 sm:h-80 sm:w-80"
          style={{ animation: "bluecoreRing 2.8s ease-in-out forwards" }}
        />

        {/* Brand text */}
        <h1
          className="relative z-10 mt-6 flex items-end justify-center text-7xl leading-none tracking-[-0.13em] sm:mt-8 sm:text-9xl md:text-[10rem] lg:text-[11rem]"
          style={{
            fontFamily: "'Times New Roman', Georgia, serif",
            fontWeight: 300,
            transform: "scaleX(1.22)",
          }}
          aria-label="BLUECORE"
        >
          {letters.map((letter, index) => (
            <span
              key={`${letter.char}-${index}`}
              className="inline-block origin-bottom"
              style={{
                color: letter.color,
                "--base-scale": letter.tall ? "1.42" : "1",
                "--stretch-scale": letter.tall ? "2.45" : "1.78",
                animation: "bluecoreLetterStretch 1.1s ease-out both",
                animationDelay: `${index * 0.13}s`,
              }}
            >
              {letter.char}
            </span>
          ))}
        </h1>

        {/* Line */}
        <div
          className="relative z-10 mt-12 h-[2px] w-64 origin-center rounded-full bg-[#875131] sm:w-96"
          style={{ animation: "bluecoreLine 1.4s ease-out 1.25s both" }}
        />

        {/* Slogan */}
        <p
          className="relative z-10 mt-8 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#06243f]/60 dark:text-white/60 sm:text-sm"
          style={{ animation: "bluecoreFadeUp 1s ease-out 1.55s both" }}
        >
          Smart Software. Solid Core.
        </p>
      </div>
    </div>
  );
}
