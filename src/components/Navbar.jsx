// Navbar.jsx
import { useEffect, useRef, useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import logo from "../assets/logo.webp";
import blackLogo from "../assets/black.webp";
import { useTheme } from "../context/useTheme";

const navLinks = [
  { label: "Home", href: "/#home" },
  { label: "About Us", href: "/#about" },
  { label: "Services", href: "/#services" },
  { label: "Portfolio", href: "/#portfolio" },
  { label: "Testimonials", href: "/#testimonials" },
  { label: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const menuButtonRef = useRef(null);
  const isDark = theme === "dark";

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#DCE5EF] bg-white/95 shadow-[0_4px_18px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-white/10 dark:bg-[#09090B]/80 dark:shadow-none">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <a
          href="/#home"
          className="flex items-center rounded-xl border border-transparent bg-white px-2 py-1.5 transition-colors duration-300 hover:border-[#DCE5EF] sm:px-3 sm:py-2 dark:rounded-2xl dark:border-white/15 dark:bg-white/[0.04] dark:shadow-sm dark:backdrop-blur-md dark:hover:border-[#8B5E3C]/60"
        >
          <img
            src={logo}
            alt="Bluecore Software PLC"
            width="600"
            height="200"
            decoding="async"
            className="block h-9 w-auto dark:hidden sm:h-16"
          />

          <img
            src={blackLogo}
            alt="Bluecore Software PLC"
            width="600"
            height="200"
            decoding="async"
            className="hidden h-9 w-auto dark:block sm:h-16"
          />
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 lg:flex xl:gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[17px] font-extrabold tracking-[0.01em] text-[#06243F] transition-colors duration-300 hover:text-[#103759] xl:text-lg dark:text-white/85 dark:hover:text-[#F4D7B2]"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-4 lg:flex">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#DCE5EF] bg-white text-[#06243F] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#103759]/35 hover:bg-[#EAF3FF] hover:text-[#103759] dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:text-[#F4D7B2]"
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            aria-pressed={isDark}
          >
            {isDark ? (
              <Sun aria-hidden="true" className="h-6 w-6" />
            ) : (
              <Moon aria-hidden="true" className="h-6 w-6" />
            )}
          </button>

          <a
            href="/#contact"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#103759] px-6 py-2.5 text-base font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0A3A84] active:bg-[#082F6B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1976D2] focus-visible:ring-offset-2 dark:bg-[#8B5E3C] dark:hover:bg-[#A0694A]"
          >
            Get Started
          </a>
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-2 lg:hidden">
          <a
            href="/#contact"
            onClick={() => setIsOpen(false)}
            className="hidden h-10 items-center justify-center rounded-xl bg-[#103759] px-3 text-xs font-bold text-white transition-all duration-300 hover:bg-[#0A3A84] active:bg-[#082F6B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1976D2] focus-visible:ring-offset-2 sm:inline-flex sm:h-11 sm:px-4 sm:text-sm dark:bg-[#8B5E3C] dark:hover:bg-[#A0694A]"
          >
            Get Started
          </a>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#DCE5EF] bg-white text-[#06243F] shadow-sm transition-all duration-300 hover:border-[#103759]/35 hover:bg-[#EAF3FF] hover:text-[#103759] sm:h-11 sm:w-11 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:text-[#F4D7B2]"
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            aria-pressed={isDark}
          >
            {isDark ? (
              <Sun aria-hidden="true" className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <Moon aria-hidden="true" className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </button>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#DCE5EF] bg-white text-[#06243F] hover:bg-[#EAF3FF] hover:text-[#103759] sm:h-11 sm:w-11 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
          >
            {isOpen ? (
              <X aria-hidden="true" className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <Menu aria-hidden="true" className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {isOpen && (
        <div id="mobile-navigation" className="border-t border-[#DCE5EF] bg-white/98 px-4 py-4 backdrop-blur-xl lg:hidden dark:border-white/10 dark:bg-[#09090B]/95">
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-3 py-3 text-lg font-extrabold text-[#06243F] transition-colors duration-300 hover:bg-[#EAF3FF] hover:text-[#103759] dark:text-white/85 dark:hover:bg-white/[0.06] dark:hover:text-[#F4D7B2]"
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
