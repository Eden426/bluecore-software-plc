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
    let firstFrame;
    let cancelled = false;
    Promise.resolve(overlay.fontReady).then(() => {
      if (cancelled) return;
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => {
          const elapsed = performance.now() - Number(overlay.dataset.startedAt || 0);
          fadeTimer = window.setTimeout(() => {
            overlay.dataset.state = "leaving";
            removeTimer = window.setTimeout(() => overlay.remove(), reducedMotion ? 0 : 240);
          }, reducedMotion ? 0 : Math.max(0, 2650 - elapsed));
        });
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);
  return null;
}
