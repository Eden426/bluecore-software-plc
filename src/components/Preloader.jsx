import { useEffect } from "react";

// Keep the boot overlay outside #root so React never restarts its animation.
export default function Preloader() {
  useEffect(() => {
    const overlay = document.getElementById("site-preloader");
    if (!overlay) return undefined;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let secondFrame;
    let fadeTimer;
    let removeTimer;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        fadeTimer = window.setTimeout(() => {
          overlay.dataset.state = "leaving";
          removeTimer = window.setTimeout(() => overlay.remove(), reducedMotion ? 0 : 240);
        }, reducedMotion ? 0 : Math.max(0, 700 - performance.now()));
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);
  return null;
}
