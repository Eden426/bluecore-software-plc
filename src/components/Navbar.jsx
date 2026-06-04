// Navbar.jsx
import { useEffect, useState } from "react";
import logo from "../assets/logo.png";
import blackLogo from "../assets/black.png";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About Us", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Always make the landing page start in dark mode
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
    setIsDark(true);
  }, []);

  const toggleDarkMode = () => {
    const nextMode = !isDark;
    setIsDark(nextMode);

    if (nextMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-[#09090B]/80">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <a
          href="#home"
          className="flex items-center rounded-2xl border border-[#0b3051]/20 bg-white/70 px-2 py-1.5 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-[#875131]/50 sm:px-3 sm:py-2 dark:border-white/15 dark:bg-white/[0.04] dark:hover:border-[#8B5E3C]/60"
        >
          <img
            src={logo}
            alt="Bluecore Software PLC"
            className="block h-11 w-auto dark:hidden sm:h-16"
          />

          <img
            src={blackLogo}
            alt="Bluecore Software PLC"
            className="hidden h-11 w-auto dark:block sm:h-16"
          />
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 lg:flex xl:gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-base font-bold tracking-[0.01em] text-[#06243f] transition-colors duration-300 hover:text-[#875131] xl:text-[17px] dark:text-white/85 dark:hover:text-[#F4D7B2]"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-4 lg:flex">
          <button
            type="button"
            onClick={toggleDarkMode}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#0b3051]/20 bg-white text-[#0b3051] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#875131]/60 hover:bg-[#0b3051]/5 hover:text-[#875131] dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:text-[#F4D7B2]"
            aria-label="Toggle dark mode"
          >
            <span className="text-[28px] leading-none">
              {isDark ? "☀" : "🌚"}
            </span>
          </button>

          <a
            href="#contact"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#875131] px-6 py-2.5 text-base font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#6f3f26] dark:bg-[#8B5E3C] dark:hover:bg-[#A0694A]"
          >
            Get Started
          </a>
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-2 lg:hidden">
          <a
            href="#contact"
            onClick={() => setIsOpen(false)}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#875131] px-3 text-xs font-bold text-white transition-all duration-300 hover:bg-[#6f3f26] sm:h-11 sm:px-4 sm:text-sm dark:bg-[#8B5E3C] dark:hover:bg-[#A0694A]"
          >
            Get Started
          </a>

          <button
            type="button"
            onClick={toggleDarkMode}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#0b3051]/20 bg-white text-[#0b3051] shadow-sm transition-all duration-300 hover:border-[#875131]/60 hover:bg-[#0b3051]/5 hover:text-[#875131] sm:h-11 sm:w-11 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:text-[#F4D7B2]"
            aria-label="Toggle dark mode"
          >
            <span className="text-[24px] leading-none sm:text-[26px]">
              {isDark ? "☀" : "☾"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[#06243f] sm:h-11 sm:w-11 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
          >
            <span className="text-2xl leading-none">{isOpen ? "×" : "☰"}</span>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {isOpen && (
        <div className="border-t border-slate-200/70 bg-white/95 px-4 py-4 backdrop-blur-xl lg:hidden dark:border-white/10 dark:bg-[#09090B]/95">
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-3 py-3 text-base font-bold text-[#06243f] transition-colors duration-300 hover:bg-[#0b3051]/5 hover:text-[#875131] dark:text-white/85 dark:hover:bg-white/[0.06] dark:hover:text-[#F4D7B2]"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
