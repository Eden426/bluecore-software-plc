// Navbar.jsx
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "../assets/logo.webp";
import blackLogo from "../assets/logo-dark.svg";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { label: "Home", href: "/#home" },
  { label: "About Us", href: "/#about" },
  { label: "Services", href: "/#services" },
  { label: "Team", href: "/#team" },
  { label: "Portfolio", href: "/#portfolio" },
  { label: "Testimonials", href: "/#testimonials" },
  { label: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const menuButtonRef = useRef(null);

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
      <nav aria-label="Main navigation" className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:h-20 sm:px-6 lg:px-8">
        {/* Logo */}
        <a
          href="/#home"
          aria-label="Bluecore Software PLC home"
          onClick={() => setIsOpen(false)}
          className="flex shrink-0 items-center rounded-md"
        >
          <img
            src={logo}
            alt="Bluecore Software PLC"
            width="600"
            height="200"
            decoding="async"
            className="block h-10 w-auto dark:hidden sm:h-12"
          />

          <img
            src={blackLogo}
            alt="Bluecore Software PLC"
            width="600"
            height="200"
            decoding="async"
            className="hidden h-10 w-auto dark:block sm:h-12"
          />
        </a>

        {/* Desktop links */}
        <div className="ml-auto hidden items-center gap-5 xl:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="navbar-text-link"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden shrink-0 items-center gap-3 xl:flex">
          <ThemeToggle />

          <a
            href="/#contact"
            className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg bg-[#103759] px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#0A3A84] active:bg-[#082F6B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1976D2] focus-visible:ring-offset-2 dark:bg-[#8B5E3C] dark:hover:bg-[#A0694A]"
          >
            Get Started
          </a>
        </div>

        {/* Mobile actions */}
        <div className="flex shrink-0 items-center gap-2 xl:hidden">
          <a
            href="/#contact"
            onClick={() => setIsOpen(false)}
            className="hidden h-11 items-center justify-center whitespace-nowrap rounded-lg bg-[#103759] px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#0A3A84] active:bg-[#082F6B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1976D2] focus-visible:ring-offset-2 sm:inline-flex dark:bg-[#8B5E3C] dark:hover:bg-[#A0694A]"
          >
            Get Started
          </a>

          <ThemeToggle />

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
        <div id="mobile-navigation" className="absolute inset-x-0 top-full max-h-[calc(100dvh-5rem)] overflow-y-auto border-b border-t border-[#DCE5EF] bg-white px-4 py-3 shadow-lg sm:px-6 lg:px-8 xl:hidden dark:border-white/10 dark:bg-[#09090B]">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="navbar-text-link navbar-text-link-mobile"
              >
                {link.label}
              </a>
            ))}
            <a href="/#contact" onClick={() => setIsOpen(false)} className="mt-2 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#103759] px-4 text-sm font-semibold text-white hover:bg-[#0A3A84] sm:hidden dark:bg-[#8B5E3C] dark:hover:bg-[#A0694A]">
              Get Started
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
