import { useEffect, useState } from "react";
import { Cookie, ShieldCheck, X } from "lucide-react";
import { getConsentState, setConsentState } from "../lib/analytics";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check existing consent preference
    const existing = getConsentState();
    if (!existing) {
      // Small timeout so banner smoothly appears after initial paint
      const timer = setTimeout(() => setIsVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleOpenBanner = () => {
      setIsVisible(true);
    };

    window.addEventListener("bluecore:open-cookie-banner", handleOpenBanner);
    return () => {
      window.removeEventListener("bluecore:open-cookie-banner", handleOpenBanner);
    };
  }, []);

  if (!isVisible) return null;

  const handleAccept = () => {
    setConsentState("accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    setConsentState("declined");
    setIsVisible(false);
  };

  return (
    <aside
      role="region"
      aria-label="Cookie and analytics notice"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xl backdrop-blur-md transition-all duration-300 dark:border-white/10 dark:bg-[#0F172A]/95 sm:bottom-6 sm:left-6 sm:right-auto sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#8B5E3C]/10 text-[#8B5E3C] dark:bg-[#8B5E3C]/20">
            <Cookie className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#06243f] dark:text-white sm:text-base">
              Cookie &amp; Analytics Notice
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-white/60">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
              <span>Compliant with data protection regulations</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDecline}
          aria-label="Close cookie banner"
          className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-white/75 sm:text-sm sm:leading-6">
        We use essential technologies to operate this site, plus privacy-respecting analytics
        (Vercel Web Analytics and Google Analytics 4) to understand how visitors engage with our software
        services. You can accept analytics cookies or choose essential functions only.
      </p>

      <div className="mt-2 text-xs">
        <a
          href="/privacy#cookies"
          className="font-medium text-[#154187] underline hover:text-[#06243f] dark:text-[#93C5FD] dark:hover:text-white"
        >
          Read our Cookie Policy &amp; Privacy Disclosures
        </a>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={handleAccept}
          className="rounded-xl bg-[#8B5E3C] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#A0694A] sm:text-sm"
        >
          Accept Analytics
        </button>
        <button
          type="button"
          onClick={handleDecline}
          className="rounded-xl border border-slate-300 bg-transparent px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/20 dark:text-white/90 dark:hover:bg-white/10 sm:text-sm"
        >
          Essential Only
        </button>
      </div>
    </aside>
  );
}
