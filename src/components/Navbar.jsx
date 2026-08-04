import { useState } from "react";
import { Menu, X, Moon, Sun } from "lucide-react";
import logo from "../assets/logo.png";
import { useTheme } from "../context/useTheme";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { dark, toggle } = useTheme();

  const links = [
    { href: "#home", label: "Home" },
    { href: "#about", label: "About Us" },
    { href: "#services", label: "Services" },
    { href: "#portfolio", label: "Portfolio" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 dark:bg-[#09090B]/95 dark:border-white/10 dark:text-[#FAFAFA]">
      <div className="mx-auto flex min-w-0 max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-5 sm:py-3.5">
        <a href="#home" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="flex h-14 w-36 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/15 dark:bg-[#09090B] sm:h-16 sm:w-44">
            <img
              src={logo}
              alt="Bluecore Software PLC"
              width={600}
              height={200}
              className="h-full w-full object-contain object-center"
            />
          </span>
        </a>

        <nav className="hidden min-w-0 items-center gap-5 text-base font-semibold text-slate-800 md:flex lg:gap-8 lg:text-lg dark:text-[#FAFAFA]">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-[#06243f] dark:hover:text-[#8B5E3C]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggle}
            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-[#06243f] hover:bg-slate-50 dark:border-white/15 dark:text-[#FAFAFA] dark:hover:bg-white/5"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={dark}
          >
            {dark ? (
              <Sun className="w-5 h-5" aria-hidden />
            ) : (
              <Moon className="w-5 h-5" aria-hidden />
            )}
          </button>

          <a
            href="#contact"
            className="hidden sm:inline-flex min-h-12 items-center justify-center bg-[#8B5E3C] text-white px-5 py-3 rounded-xl font-semibold hover:bg-[#A0694A]"
          >
            Let's Talk
          </a>

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="md:hidden w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-[#06243f] dark:border-white/15 dark:text-[#FAFAFA]"
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
            aria-controls="mobile-nav-menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <nav
          id="mobile-nav-menu"
          className="md:hidden px-4 sm:px-5 pb-4 border-t border-slate-200 bg-white dark:bg-[#09090B] dark:border-white/10"
        >
          <div className="flex flex-col gap-1 pt-3">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="py-2 text-sm font-semibold text-slate-700 hover:text-[#06243f] dark:text-[#FAFAFA] dark:hover:text-[#8B5E3C]"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setIsOpen(false)}
              className="mt-2 inline-flex justify-center bg-[#8B5E3C] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#A0694A]"
            >
              Let's Talk
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
